-- TEST FIXTURES ONLY. Run this complete script, including its final ROLLBACK.
-- Run immediately after deployment, before enabling the collector. No real price feed is called.
BEGIN;
CREATE OR REPLACE FUNCTION pg_temp.expect(p_ok boolean,p_label text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN IF p_ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'LEGO verification failed: %',p_label; END IF; END $$;
CREATE OR REPLACE FUNCTION pg_temp.authorize() RETURNS void LANGUAGE sql AS $$
  UPDATE lego_market.settings SET collector_token_hash=repeat('a',64),provider_configured=true,worker_last_seen_at=clock_timestamp(),last_provider_start_at=null WHERE singleton;
$$;
CREATE OR REPLACE FUNCTION pg_temp.fixture(p_price numeric DEFAULT 200,p_country text DEFAULT 'US') RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object('current',jsonb_build_object('value',p_price,'basis','recent-30d-median','sampleCount',1,'min',p_price,'max',p_price,
    'latestPrice',p_price,'latestTradeAt',lego_market.iso(clock_timestamp()-interval '1 day'),'sixMonthAverage',350,'sixMonthQuantityAverage',125,
    'sixMonthLots',4,'sixMonthUnits',13,'lowestAskingPrice',90,'askingLots',2),
    'trades',jsonb_build_array(jsonb_build_object('rowKey','SYNTHETIC-ROLLBACK-FIXTURE','price',p_price,'date',lego_market.iso(clock_timestamp()-interval '1 day'),
      'datePrecision','timestamp','quantity',1,'sellerCountry',p_country,'buyerCountry','GB')),
    'quality',jsonb_build_object('historyKind','daily-market-observations','tradeIdentity','anonymous-provider-rows','subconditionKnown',false,
      'historyComplete',false,'providerDetailCount',1,'returnedTradeCount',1));
$$;
CREATE OR REPLACE FUNCTION pg_temp.create_lease(p_set text DEFAULT 'VERIFY-21322-1',p_condition text DEFAULT 'N',p_country text DEFAULT 'GLOBAL') RETURNS uuid
LANGUAGE plpgsql AS $$ DECLARE r jsonb; k text:=p_set||'|'||p_condition||'|'||p_country||'|KRW'; BEGIN
  PERFORM pg_temp.authorize();
  PERFORM public.lego_market_dispatch('get',jsonb_build_object('setNum',p_set,'condition',p_condition,'country',p_country));
  UPDATE lego_market.jobs SET eligible_at='-infinity'::timestamptz WHERE query_key=k;
  r:=public.lego_market_dispatch('claim','{}',repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,job,query,setNum}'=p_set,'fixture lease belongs to its synthetic scope');
  RETURN (r#>>'{body,job,leaseId}')::uuid;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.reserve_twice(p_lease uuid) RETURNS void LANGUAGE plpgsql AS $$ DECLARE r jsonb; BEGIN
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',p_lease),repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,reserved}'='true','first synthetic reservation');
  UPDATE lego_market.settings SET last_provider_start_at=clock_timestamp()-interval '2 seconds' WHERE singleton;
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',p_lease),repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,reserved}'='true','second synthetic reservation');
END $$;
CREATE OR REPLACE FUNCTION pg_temp.publish(p_lease uuid,p_value jsonb DEFAULT null,p_at timestamptz DEFAULT null) RETURNS jsonb LANGUAGE sql AS $$
  SELECT public.lego_market_dispatch('publish',jsonb_build_object('leaseId',p_lease,'observedAt',lego_market.iso(coalesce(p_at,clock_timestamp())),
    'normalized',coalesce(p_value,pg_temp.fixture())),repeat('a',64));
$$;

-- test: private schema, RPC permissions and RLS protect every new table
SAVEPOINT lego_verify;
DO $$ DECLARE role_name text; r record; result jsonb; denied boolean; BEGIN
  FOR r IN SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='lego_market' AND c.relkind='r' LOOP
    PERFORM pg_temp.expect(r.relrowsecurity,'RLS enabled: '||r.relname);
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      PERFORM pg_temp.expect(NOT has_table_privilege(role_name,'lego_market.'||r.relname,'select,insert,update,delete'),'no public table access: '||role_name||'/'||r.relname);
    END LOOP;
  END LOOP;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    PERFORM pg_temp.expect(NOT has_schema_privilege(role_name,'lego_market','usage'),'private schema usage');
    PERFORM pg_temp.expect(NOT has_function_privilege(role_name,'public.lego_market_dispatch(text,jsonb,text)','execute'),'private dispatch execute');
  END LOOP;
  denied:=false; SET LOCAL ROLE anon;
  BEGIN PERFORM public.lego_market_dispatch('health','{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  RESET ROLE; PERFORM pg_temp.expect(denied,'anonymous actual RPC blocked');
  SET LOCAL ROLE service_role; result:=public.lego_market_dispatch('health','{}'); RESET ROLE;
  PERFORM pg_temp.expect(result->>'httpStatus'='200','service role can invoke bridge');
  PERFORM pg_temp.expect(NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.lego_market_dispatch(text,jsonb,text)'::regprocedure),'dispatch is SECURITY INVOKER');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: missing keys are configuration errors rather than empty sales or synthetic prices
SAVEPOINT lego_verify;
DO $$ DECLARE r jsonb; BEGIN
  UPDATE lego_market.settings SET collector_token_hash=null,provider_configured=false,worker_last_seen_at=null;
  r:=public.lego_market_dispatch('health','{}');
  PERFORM pg_temp.expect(r#>>'{body,configured}'='false' AND r#>>'{body,storage}'='supabase','unconfigured health');
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY10294"}');
  PERFORM pg_temp.expect(r#>>'{body,error,code}'='NOT_CONFIGURED' AND r->>'httpStatus'='503','no credentials never means no sales');
  PERFORM pg_temp.expect(NOT ((r->'body')?'current'),'no invented current price');
  PERFORM pg_temp.expect(EXISTS(SELECT 1 FROM lego_market.jobs WHERE query_key='VERIFY10294-1|N|GLOBAL|KRW'),'any requested product queued');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: collector digest and heartbeat gate all protected actions
SAVEPOINT lego_verify;
DO $$ DECLARE r jsonb; BEGIN
  PERFORM pg_temp.authorize();
  r:=public.lego_market_dispatch('heartbeat','{"providerConfigured":true}',repeat('b',64));
  PERFORM pg_temp.expect(r->>'httpStatus'='401','wrong collector digest rejected');
  r:=public.lego_market_dispatch('claim','{}',null);
  PERFORM pg_temp.expect(r->>'httpStatus'='401','missing digest rejected');
  r:=public.lego_market_dispatch('heartbeat','{"providerConfigured":null}',repeat('a',64));
  PERFORM pg_temp.expect(r->>'httpStatus'='400','null presence flag rejected');
  r:=public.lego_market_dispatch('heartbeat','{"providerConfigured":true}',repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,ok}'='true','valid heartbeat');
  PERFORM pg_temp.expect(public.lego_market_dispatch('health','{}')#>>'{body,configured}'='true','online configured health');
  UPDATE lego_market.settings SET worker_last_seen_at=clock_timestamp()-interval '6 minutes';
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-10182"}');
  PERFORM pg_temp.expect(r#>>'{body,error,code}'='COLLECTOR_OFFLINE','offline collector distinguished');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: canonical set variants and condition-country scopes stay separate
SAVEPOINT lego_verify;
DO $$ DECLARE r jsonb; BEGIN
  PERFORM pg_temp.authorize();
  PERFORM public.lego_market_dispatch('get','{"setNum":"VERIFY10294","condition":"N","country":"GLOBAL"}');
  PERFORM public.lego_market_dispatch('get','{"setNum":"VERIFY10294-2","condition":"N","country":"GLOBAL"}');
  PERFORM public.lego_market_dispatch('get','{"setNum":"VERIFY10294","condition":"U","country":"GLOBAL"}');
  PERFORM public.lego_market_dispatch('get','{"setNum":"VERIFY10294","condition":"N","country":"KR"}');
  PERFORM pg_temp.expect((SELECT count(*)=4 FROM lego_market.scopes WHERE set_num LIKE 'VERIFY10294%'),'four independent scopes');
  r:=public.lego_market_dispatch('get','{"setNum":"../secret"}');
  PERFORM pg_temp.expect(r->>'httpStatus'='400','unsafe identifier rejected');
  r:=public.lego_market_dispatch('get','{"setNum":"21322","country":null}');
  PERFORM pg_temp.expect(r->>'httpStatus'='400','null scope rejected');
  r:=public.lego_market_dispatch('get',jsonb_build_object('setNum',repeat('A',40)));
  PERFORM pg_temp.expect(r->>'httpStatus'='400','variant append cannot exceed40');
  r:=public.lego_market_dispatch('get','{"setNum":"21322","url":"https://example.com"}');
  PERFORM pg_temp.expect(r->>'httpStatus'='400','no arbitrary fetch URLs');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: at most one active lease globally and every lease binds an exact scope
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease();
  PERFORM public.lego_market_dispatch('get','{"setNum":"VERIFY-10305-1"}');
  r:=public.lego_market_dispatch('claim','{}',repeat('a',64));
  PERFORM pg_temp.expect(r#>'{body,job}'='null'::jsonb,'second global lease blocked');
  PERFORM pg_temp.expect((SELECT count(*)=1 FROM lego_market.jobs WHERE leased_until>clock_timestamp()),'one live lease');
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',gen_random_uuid()),repeat('a',64));
  PERFORM pg_temp.expect(r->>'httpStatus'='409','foreign lease rejected');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: provider starts are spaced and only successful reservations consume quota
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease();
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',l),repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,reserved}'='true','first start reserved');
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',l),repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,error,code}'='PROVIDER_WAIT' AND (r#>>'{body,retryAfterMs}')::integer BETWEEN 1 AND 1000,'one-second spacing');
  PERFORM pg_temp.expect((SELECT calls=1 FROM lego_market.quota WHERE day=(clock_timestamp() AT TIME ZONE 'UTC')::date),'wait does not consume quota');
  UPDATE lego_market.settings SET last_provider_start_at=clock_timestamp()-interval '2 seconds';
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',l),repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,reserved}'='true','second start reserved');
  UPDATE lego_market.settings SET last_provider_start_at=clock_timestamp()-interval '2 seconds';
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',l),repeat('a',64));
  PERFORM pg_temp.expect(r->>'httpStatus'='400','no third provider call per lease');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: UTC daily provider budget is persisted before transport
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; d date:=(clock_timestamp() AT TIME ZONE 'UTC')::date; BEGIN
  l:=pg_temp.create_lease(); INSERT INTO lego_market.quota(day,calls) VALUES(d,1200) ON CONFLICT(day) DO UPDATE SET calls=1200;
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',l),repeat('a',64));
  PERFORM pg_temp.expect(r->>'httpStatus'='429' AND r#>>'{body,error,code}'='QUOTA_EXCEEDED','global daily budget');
  PERFORM pg_temp.expect((SELECT reservations=0 FROM lego_market.jobs WHERE lease_id=l),'quota failure is not transport');
  PERFORM pg_temp.expect((r#>>'{body,retryAfterSeconds}')::integer BETWEEN 1 AND 86400,'next UTC day retry');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: published price, six-hour cache and history preserve the API DTO
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); r:=pg_temp.publish(l);
  PERFORM pg_temp.expect(r#>>'{body,ok}'='true','valid publish');
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1"}');
  PERFORM pg_temp.expect(r#>>'{body,status}'='fresh' AND r#>>'{body,current,value}'='200','current median stored');
  PERFORM pg_temp.expect(r#>>'{body,query,currency}'='KRW' AND r#>>'{body,query,setNum}'='VERIFY-21322-1','exact scope DTO');
  PERFORM pg_temp.expect((r#>>'{body,expiresAt}')::timestamptz-(r#>>'{body,observedAt}')::timestamptz=interval '6 hours','six-hour TTL');
  PERFORM pg_temp.expect((r#>>'{body,observedAt}') ~ 'Z$' AND (r#>>'{body,refresh,nextRefreshAt}') ~ 'Z$','ISO Z timestamps for client validator');
  PERFORM pg_temp.expect(jsonb_array_length(r#>'{body,history}')=1 AND r#>>'{body,history,0,basis}'='recent-30d-median','derived daily history');
  PERFORM pg_temp.expect(NOT EXISTS(SELECT 1 FROM lego_market.jobs WHERE lease_id=l),'finished lease removed');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: repeated same-day refresh upserts one observation rather than new transactions
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); PERFORM pg_temp.publish(l);
  UPDATE lego_market.scopes SET last_attempt_at=clock_timestamp()-interval '11 minutes',next_refresh_at=clock_timestamp()-interval '1 second' WHERE set_num='VERIFY-21322-1';
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); r:=pg_temp.publish(l,pg_temp.fixture(250));
  PERFORM pg_temp.expect(r#>>'{body,ok}'='true','second publish');
  PERFORM pg_temp.expect((SELECT count(*)=1 AND max(price)=250 FROM lego_market.observations WHERE query_key='VERIFY-21322-1|N|GLOBAL|KRW'),'one point latest daily value');
  PERFORM pg_temp.expect(NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='lego_market' AND table_name='transactions'),'no permanent copied transaction ledger');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: valid no-sales never promotes asking prices or six-month averages
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; s jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); s:=pg_temp.fixture();
  s:=jsonb_set(s,'{current,value}','null'); s:=jsonb_set(s,'{current,basis}','null'); s:=jsonb_set(s,'{current,sampleCount}','0');
  s:=jsonb_set(s,'{current,min}','null'); s:=jsonb_set(s,'{current,max}','null');
  r:=pg_temp.publish(l,s); PERFORM pg_temp.expect(r#>>'{body,ok}'='true','valid no recent sales');
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1"}');
  PERFORM pg_temp.expect(r#>>'{body,status}'='no-sales' AND r#>'{body,current,value}'='null'::jsonb,'no invented current value');
  PERFORM pg_temp.expect(r#>>'{body,current,lowestAskingPrice}'='90' AND r#>>'{body,current,sixMonthAverage}'='350','references remain separate');
  PERFORM pg_temp.expect(jsonb_array_length(r#>'{body,history}')=0,'no null-price history point');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: malformed, null and cross-country snapshots fail closed
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; s jsonb; BEGIN
  l:=pg_temp.create_lease('VERIFY-21322-1','N','KR'); PERFORM pg_temp.reserve_twice(l);
  r:=pg_temp.publish(l); PERFORM pg_temp.expect(r#>>'{body,error,code}'='INVALID_SNAPSHOT','wrong seller country');
  r:=pg_temp.publish(l,'{}'); PERFORM pg_temp.expect(r->>'httpStatus'='400','missing normalized fields');
  s:=pg_temp.fixture(200,'KR'); s:=jsonb_set(s,'{current,basis}','null');
  r:=pg_temp.publish(l,s); PERFORM pg_temp.expect(r->>'httpStatus'='400','null basis rejected');
  s:=pg_temp.fixture(200,'KR'); s:=jsonb_set(s,'{quality,historyComplete}','null');
  r:=pg_temp.publish(l,s); PERFORM pg_temp.expect(r->>'httpStatus'='400','null quality rejected');
  s:=pg_temp.fixture(200,'KR'); s:=jsonb_set(s,'{trades,0}','null');
  r:=pg_temp.publish(l,s); PERFORM pg_temp.expect(r->>'httpStatus'='400','null trade row rejected');
  PERFORM pg_temp.expect(NOT EXISTS(SELECT 1 FROM lego_market.observations),'invalid observations not stored');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: observation age, future clocks and payload size are bounded
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l);
  r:=pg_temp.publish(l,null,clock_timestamp()+interval '61 seconds'); PERFORM pg_temp.expect(r->>'httpStatus'='400','future observation rejected');
  r:=pg_temp.publish(l,null,clock_timestamp()-interval '6 minutes'); PERFORM pg_temp.expect(r->>'httpStatus'='400','backdated observation rejected');
  r:=public.lego_market_dispatch('publish',jsonb_build_object('leaseId',l,'padding',repeat('x',1048576)),repeat('a',64));
  PERFORM pg_temp.expect(r->>'httpStatus'='413','oversized body rejected');
  PERFORM pg_temp.expect(NOT EXISTS(SELECT 1 FROM lego_market.observations),'no out-of-range history');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: expired lease cannot reserve or publish and can later be reclaimed
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; n uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease(); UPDATE lego_market.jobs SET leased_until=clock_timestamp()-interval '1 second' WHERE lease_id=l;
  r:=public.lego_market_dispatch('reserve',jsonb_build_object('leaseId',l),repeat('a',64)); PERFORM pg_temp.expect(r->>'httpStatus'='409','expired reservation');
  r:=pg_temp.publish(l); PERFORM pg_temp.expect(r->>'httpStatus'='409','expired publication');
  r:=public.lego_market_dispatch('claim','{}',repeat('a',64)); n:=(r#>>'{body,job,leaseId}')::uuid;
  PERFORM pg_temp.expect(n IS NOT NULL AND n<>l,'reclaimed lease gets new identity');
  PERFORM pg_temp.expect((SELECT reservations=0 FROM lego_market.jobs WHERE lease_id=n),'reclaimed reservation count reset');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: refresh failure keeps last-good timestamps but blocks premature retry
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; observed text; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); PERFORM pg_temp.publish(l);
  SELECT lego_market.iso(observed_at) INTO observed FROM lego_market.scopes WHERE set_num='VERIFY-21322-1';
  UPDATE lego_market.scopes SET last_attempt_at=clock_timestamp()-interval '11 minutes',next_refresh_at=clock_timestamp()-interval '1 second' WHERE set_num='VERIFY-21322-1';
  l:=pg_temp.create_lease(); r:=public.lego_market_dispatch('failure',jsonb_build_object('leaseId',l,'errorCode','PROVIDER_AUTH'),repeat('a',64));
  PERFORM pg_temp.expect(r#>>'{body,ok}'='true','failure acknowledged');
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1","refresh":true}');
  PERFORM pg_temp.expect(r#>>'{body,status}'='stale' AND r#>>'{body,observedAt}'=observed,'last-good value date preserved');
  PERFORM pg_temp.expect(r#>>'{body,current,value}'='200' AND r#>>'{body,refresh,errorCode}'='PROVIDER_AUTH','failure distinct from no sales');
  r:=public.lego_market_dispatch('claim','{}',repeat('a',64)); PERFORM pg_temp.expect(r#>'{body,job}'='null'::jsonb,'manual cannot bypass15minute backoff');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: no-cache provider not-found and quota errors retain safe HTTP distinctions
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM public.lego_market_dispatch('failure',jsonb_build_object('leaseId',l,'errorCode','NOT_FOUND'),repeat('a',64));
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1"}');
  PERFORM pg_temp.expect(r->>'httpStatus'='404' AND r#>>'{body,error,code}'='NOT_FOUND','404 not empty sales');
  UPDATE lego_market.scopes SET state='quota',error_code='QUOTA_EXCEEDED' WHERE set_num='VERIFY-21322-1';
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1"}');
  PERFORM pg_temp.expect(r->>'httpStatus'='429','quota error is429');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: raw snapshots disappear after24hours while derived daily observations remain
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); PERFORM pg_temp.publish(l);
  UPDATE lego_market.scopes SET observed_at=clock_timestamp()-interval '25 hours',expires_at=clock_timestamp()-interval '19 hours' WHERE set_num='VERIFY-21322-1';
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1"}');
  PERFORM pg_temp.expect(r->>'httpStatus'='503' AND NOT((r->'body')?'current'),'expired raw price not returned');
  PERFORM pg_temp.expect((SELECT snapshot IS NULL FROM lego_market.scopes WHERE set_num='VERIFY-21322-1'),'raw cache cleared');
  PERFORM pg_temp.expect((SELECT count(*)=1 FROM lego_market.observations),'own daily history retained');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: retention separates seven-day activity from730day statistics
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); PERFORM pg_temp.publish(l);
  UPDATE lego_market.scopes SET requested_at=clock_timestamp()-interval '8 days' WHERE set_num='VERIFY-21322-1';
  PERFORM lego_market.tick();
  PERFORM pg_temp.expect((SELECT NOT active FROM lego_market.scopes WHERE set_num='VERIFY-21322-1'),'inactive watch disabled');
  PERFORM pg_temp.expect((SELECT count(*)=1 FROM lego_market.observations),'inactive product history retained');
  UPDATE lego_market.observations SET date=(clock_timestamp() AT TIME ZONE 'UTC')::date-731;
  PERFORM lego_market.tick();
  PERFORM pg_temp.expect(NOT EXISTS(SELECT 1 FROM lego_market.observations),'old statistics removed');
  PERFORM pg_temp.expect(NOT EXISTS(SELECT 1 FROM lego_market.scopes WHERE set_num='VERIFY-21322-1'),'inactive metadata eventually removed');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: a valid sampleCount may exceed capped displayed trade rows
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; s jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); s:=pg_temp.fixture();
  s:=jsonb_set(s,'{current,sampleCount}','1001'); s:=jsonb_set(s,'{quality,providerDetailCount}','1001');
  r:=pg_temp.publish(l,s); PERFORM pg_temp.expect(r#>>'{body,ok}'='true','uncapped count survives display cap');
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1"}');
  PERFORM pg_temp.expect(r#>>'{body,current,sampleCount}'='1001' AND jsonb_array_length(r#>'{body,trades}')=1,'sampleCount independent from display length');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: manual refresh respects ten-minute cooldown even with fresh cache
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); PERFORM pg_temp.publish(l);
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1","refresh":true}');
  PERFORM pg_temp.expect(r#>>'{body,refresh,state}'='cooldown','manual cooldown shown');
  PERFORM pg_temp.expect(NOT EXISTS(SELECT 1 FROM lego_market.jobs),'no immediate provider repeat');
  UPDATE lego_market.scopes SET last_attempt_at=clock_timestamp()-interval '11 minutes' WHERE set_num='VERIFY-21322-1';
  r:=public.lego_market_dispatch('get','{"setNum":"VERIFY-21322-1","refresh":true}');
  PERFORM pg_temp.expect(EXISTS(SELECT 1 FROM lego_market.jobs),'manual refresh allowed after10minutes');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: active watches are bounded without a fixed product-number allowlist
SAVEPOINT lego_verify;
DO $$ DECLARE i integer; BEGIN
  FOR i IN 1..55 LOOP PERFORM public.lego_market_dispatch('get',jsonb_build_object('setNum','VERIFY-'||i||'-1')); END LOOP;
  PERFORM pg_temp.expect((SELECT count(*)=50 FROM lego_market.scopes WHERE active),'active watch cap50');
  PERFORM pg_temp.expect((SELECT count(*)=50 FROM lego_market.scopes),'empty evicted metadata pruned immediately');
  PERFORM pg_temp.expect((SELECT count(*)<=50 FROM lego_market.jobs),'inactive queued work pruned');
  PERFORM pg_temp.expect(EXISTS(SELECT 1 FROM lego_market.scopes WHERE set_num='VERIFY-55-1' AND active),'new products accepted');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

-- test: publication cannot move a cached observation backwards after clock skew
SAVEPOINT lego_verify;
DO $$ DECLARE l uuid; r jsonb; newer text; BEGIN
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l);
  r:=pg_temp.publish(l,null,clock_timestamp()+interval '30 seconds');
  PERFORM pg_temp.expect(r#>>'{body,ok}'='true','within-tolerance forward capture accepted');
  SELECT lego_market.iso(observed_at) INTO newer FROM lego_market.scopes WHERE set_num='VERIFY-21322-1';
  UPDATE lego_market.scopes SET last_attempt_at=clock_timestamp()-interval '11 minutes',next_refresh_at=clock_timestamp()-interval '1 second' WHERE set_num='VERIFY-21322-1';
  l:=pg_temp.create_lease(); PERFORM pg_temp.reserve_twice(l); r:=pg_temp.publish(l,pg_temp.fixture(250));
  PERFORM pg_temp.expect(r#>>'{body,error,code}'='INVALID_SNAPSHOT','older worker capture rejected');
  PERFORM pg_temp.expect((SELECT lego_market.iso(observed_at)=newer AND snapshot#>>'{current,value}'='200' FROM lego_market.scopes WHERE set_num='VERIFY-21322-1'),'cache never rewinds');
  PERFORM pg_temp.expect((SELECT max(price)=200 FROM lego_market.observations),'daily history also preserved');
END $$;
ROLLBACK TO SAVEPOINT lego_verify; RELEASE SAVEPOINT lego_verify;

SELECT 'LEGO SQL verification: 21 rollback cases passed; no fixture prices persisted' AS verification_result;
ROLLBACK;
