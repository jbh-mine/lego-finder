-- LEGO market bridge only. Existing Kuji tables, authentication and grants are untouched.
-- Apply once to the hosted project after review; test fixtures are a separate rollback file.
create schema if not exists lego_market;
revoke all on schema lego_market from public, anon, authenticated;
grant usage on schema lego_market to service_role;

create table lego_market.settings (
  singleton boolean primary key default true check (singleton),
  collector_token_hash text check (collector_token_hash ~ '^[0-9a-f]{64}$'),
  provider_configured boolean not null default false,
  worker_last_seen_at timestamptz,
  last_provider_start_at timestamptz
);
insert into lego_market.settings(singleton) values (true);

create table lego_market.scopes (
  query_key text primary key,
  set_num text not null check (length(set_num) <= 40 and set_num ~ '^[A-Za-z0-9][A-Za-z0-9-]*-[0-9]+$'),
  condition text not null check (condition in ('N','U')),
  country text not null check (country in ('GLOBAL','KR')),
  requested_at timestamptz not null,
  active boolean not null default true,
  snapshot jsonb,
  observed_at timestamptz,
  expires_at timestamptz,
  last_attempt_at timestamptz,
  next_refresh_at timestamptz not null default now(),
  state text not null default 'ok' check (state in ('ok','failed','quota')),
  error_code text,
  unique(set_num,condition,country)
);
create index scopes_due on lego_market.scopes(next_refresh_at) where active;

create table lego_market.jobs (
  query_key text primary key references lego_market.scopes(query_key) on delete cascade,
  eligible_at timestamptz not null default now(),
  lease_id uuid unique,
  leased_until timestamptz,
  reservations integer not null default 0 check (reservations between 0 and 2)
);

create table lego_market.observations (
  query_key text not null references lego_market.scopes(query_key) on delete cascade,
  date date not null,
  observed_at timestamptz not null,
  price numeric not null check (price > 0 and price <= 9007199254740991),
  sample_count integer not null check (sample_count > 0),
  primary key(query_key,date)
);
create index observations_retention on lego_market.observations(date);

create table lego_market.quota (
  day date primary key,
  calls integer not null default 0 check(calls between 0 and 1200)
);

alter table lego_market.settings enable row level security;
alter table lego_market.scopes enable row level security;
alter table lego_market.jobs enable row level security;
alter table lego_market.observations enable row level security;
alter table lego_market.quota enable row level security;
revoke all on all tables in schema lego_market from public,anon,authenticated;
grant select,insert,update,delete on all tables in schema lego_market to service_role;

create function lego_market.iso(p_value timestamptz) returns text
language sql immutable set search_path = '' as $$
  select to_char(p_value at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;

create function lego_market.result(p_status integer,p_body jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('httpStatus',p_status,'body',p_body)
$$;

create function lego_market.error(p_code text,p_status integer default 503,p_retry integer default 30) returns jsonb
language sql immutable set search_path = '' as $$
  select lego_market.result(p_status,jsonb_build_object('schemaVersion',1,
    'error',jsonb_build_object('code',p_code,'message',case p_code
      when 'NOT_CONFIGURED' then 'The registered-IP collector credentials are not configured.'
      when 'COLLECTOR_OFFLINE' then 'The registered-IP collector is currently offline.'
      when 'COLLECTION_PENDING' then 'The requested market snapshot is queued for collection.'
      when 'UNAUTHORIZED' then 'Collector authentication is required.'
      when 'LEASE_EXPIRED' then 'This collection lease is no longer valid.'
      when 'QUOTA_EXCEEDED' then 'The UTC daily provider budget is exhausted.'
      when 'PROVIDER_WAIT' then 'Wait before starting the next provider request.'
      when 'NOT_FOUND' then 'The provider has no matching SET.'
      when 'PROVIDER_AUTH' then 'The provider rejected its credentials or registered IP.'
      when 'INVALID_REQUEST' then 'The request does not match the market API contract.'
      when 'INVALID_SNAPSHOT' then 'The submitted market snapshot failed validation.'
      when 'PAYLOAD_TOO_LARGE' then 'The market snapshot exceeds the size limit.'
      when 'INTERNAL_ERROR' then 'The market bridge could not complete the request.'
      else 'Market collection could not be completed.' end),
    'retryAfterSeconds',greatest(0,p_retry)))
$$;

-- Validate only provider-derived market fields, never arbitrary data supplied by a client.
create function lego_market.valid_snapshot(p_value jsonb,p_condition text,p_country text,p_observed timestamptz)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  c jsonb := p_value->'current';
  q jsonb := p_value->'quality';
  r jsonb;
  k text;
  n numeric;
  v_date timestamptz;
  sample_count integer;
  detail_count integer;
begin
  if jsonb_typeof(p_value) is distinct from 'object' or jsonb_typeof(c) is distinct from 'object' or jsonb_typeof(q) is distinct from 'object'
      or jsonb_typeof(p_value->'trades') is distinct from 'array' then return false; end if;
  if exists(select 1 from jsonb_object_keys(p_value) x where x not in ('current','trades','quality')) then return false; end if;
  if exists(select 1 from jsonb_object_keys(c) x where x not in ('value','basis','sampleCount','min','max','latestPrice','latestTradeAt',
      'sixMonthAverage','sixMonthQuantityAverage','sixMonthLots','sixMonthUnits','lowestAskingPrice','askingLots')) then return false; end if;
  if not (c ?& array['value','basis','sampleCount','min','max','latestPrice','latestTradeAt','sixMonthAverage',
      'sixMonthQuantityAverage','sixMonthLots','sixMonthUnits','lowestAskingPrice','askingLots']) then return false; end if;
  if jsonb_typeof(c->'sampleCount') <> 'number' or (c->>'sampleCount') !~ '^[0-9]+$' then return false; end if;
  sample_count := (c->>'sampleCount')::integer;
  if c->'value' = 'null'::jsonb then
    if sample_count <> 0 or c->'basis' <> 'null'::jsonb or c->'min' <> 'null'::jsonb or c->'max' <> 'null'::jsonb then return false; end if;
  else
    if jsonb_typeof(c->'value') <> 'number' or (c->>'basis') is distinct from 'recent-30d-median' or sample_count < 1
      or jsonb_typeof(c->'min') <> 'number' or jsonb_typeof(c->'max') <> 'number'
      or (c->>'min')::numeric <= 0 or (c->>'min')::numeric > (c->>'value')::numeric
      or (c->>'max')::numeric < (c->>'value')::numeric then return false; end if;
  end if;
  foreach k in array array['value','min','max','latestPrice','sixMonthAverage','sixMonthQuantityAverage','lowestAskingPrice'] loop
    if c->k <> 'null'::jsonb then
      if jsonb_typeof(c->k) <> 'number' then return false; end if;
      n := (c->>k)::numeric;
      if n <= 0 or n > 9007199254740991 then return false; end if;
    end if;
  end loop;
  foreach k in array array['sixMonthLots','sixMonthUnits','askingLots'] loop
    if c->k <> 'null'::jsonb then
      if jsonb_typeof(c->k) <> 'number' or (c->>k) !~ '^[0-9]+$' or (c->>k)::numeric > 2147483647 then return false; end if;
    end if;
  end loop;
  if c->'latestTradeAt' <> 'null'::jsonb then
    if jsonb_typeof(c->'latestTradeAt') <> 'string' or (c->>'latestTradeAt') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z$' then return false; end if;
    if (c->>'latestTradeAt')::timestamptz > p_observed or c->'latestPrice' = 'null'::jsonb then return false; end if;
  elsif c->'latestPrice' <> 'null'::jsonb then return false;
  end if;
  if (q->>'historyKind') is distinct from 'daily-market-observations' or (q->>'tradeIdentity') is distinct from 'anonymous-provider-rows'
    or q->'subconditionKnown' is distinct from 'false'::jsonb or q->'historyComplete' is distinct from 'false'::jsonb
    or jsonb_typeof(q->'providerDetailCount') <> 'number' or (q->>'providerDetailCount') !~ '^[0-9]+$'
    or jsonb_typeof(q->'returnedTradeCount') <> 'number' or (q->>'returnedTradeCount') !~ '^[0-9]+$' then return false; end if;
  if not (q ?& array['historyKind','tradeIdentity','subconditionKnown','historyComplete','providerDetailCount','returnedTradeCount'])
    or exists(select 1 from jsonb_object_keys(q) x where x not in ('historyKind','tradeIdentity','subconditionKnown','historyComplete','providerDetailCount','returnedTradeCount')) then return false; end if;
  detail_count := (q->>'providerDetailCount')::integer;
  if detail_count > 1000000 or sample_count > detail_count or jsonb_array_length(p_value->'trades') > 500
    or (q->>'returnedTradeCount')::integer <> jsonb_array_length(p_value->'trades')
    or jsonb_array_length(p_value->'trades') > detail_count then return false; end if;
  for r in select value from jsonb_array_elements(p_value->'trades') loop
    if jsonb_typeof(r) <> 'object' or not (r ?& array['rowKey','price','date','datePrecision','quantity','sellerCountry','buyerCountry'])
      or exists(select 1 from jsonb_object_keys(r) x where x not in ('rowKey','price','date','datePrecision','quantity','sellerCountry','buyerCountry'))
      or jsonb_typeof(r->'rowKey') <> 'string' or length(r->>'rowKey') not between 1 and 100
      or jsonb_typeof(r->'price') <> 'number' or (r->>'price')::numeric <= 0 or (r->>'price')::numeric > 9007199254740991
      or jsonb_typeof(r->'quantity') <> 'number' or (r->>'quantity') !~ '^[1-9][0-9]*$' or (r->>'quantity')::numeric > 2147483647
      or (r->>'datePrecision') is distinct from 'timestamp' or jsonb_typeof(r->'date') <> 'string'
      or (r->>'date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z$' then return false; end if;
    v_date := (r->>'date')::timestamptz;
    if v_date > p_observed then return false; end if;
    if r->'sellerCountry' <> 'null'::jsonb and (jsonb_typeof(r->'sellerCountry') <> 'string' or (r->>'sellerCountry') !~ '^[A-Z]{2}$') then return false; end if;
    if r->'buyerCountry' <> 'null'::jsonb and (jsonb_typeof(r->'buyerCountry') <> 'string' or (r->>'buyerCountry') !~ '^[A-Z]{2}$') then return false; end if;
    if p_country = 'KR' and (r->>'sellerCountry' is distinct from 'KR') then return false; end if;
  end loop;
  return true;
exception when others then return false;
end
$$;

create function lego_market.tick() returns jsonb
language plpgsql set search_path = '' as $$
declare v_now timestamptz := clock_timestamp(); v_added integer;
begin
  perform 1 from lego_market.settings where singleton for update;
  v_now:=clock_timestamp();
  update lego_market.scopes set snapshot=null where observed_at <= v_now-interval '24 hours' and snapshot is not null;
  delete from lego_market.observations where date < ((v_now at time zone 'UTC')::date-730);
  update lego_market.scopes set active=false where requested_at < v_now-interval '7 days';
  delete from lego_market.jobs j using lego_market.scopes s
    where j.query_key=s.query_key and not s.active and (j.leased_until is null or j.leased_until <= v_now);
  insert into lego_market.jobs(query_key,eligible_at)
    select s.query_key,greatest(s.next_refresh_at,coalesce(s.last_attempt_at+interval '10 minutes','-infinity'::timestamptz))
    from lego_market.scopes s where s.active and s.next_refresh_at <= v_now
      and (s.last_attempt_at is null or s.last_attempt_at <= v_now-interval '10 minutes')
    on conflict(query_key) do nothing;
  get diagnostics v_added = row_count;
  delete from lego_market.quota where day < ((v_now at time zone 'UTC')::date-7);
  -- Public search cannot accumulate unbounded empty, evicted scope metadata.
  -- Retain scopes with real derived observations, regardless of activity.
  delete from lego_market.scopes s where not s.active
    and not exists(select 1 from lego_market.observations o where o.query_key=s.query_key)
    and not exists(select 1 from lego_market.jobs j where j.query_key=s.query_key and j.leased_until>v_now);
  return jsonb_build_object('scheduled',v_added);
end
$$;

create function public.lego_market_dispatch(p_action text,p_payload jsonb default '{}'::jsonb,p_worker_digest text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_cfg lego_market.settings%rowtype;
  v_scope lego_market.scopes%rowtype;
  v_job lego_market.jobs%rowtype;
  v_key text; v_set text; v_condition text; v_country text;
  v_refresh boolean := false; v_cooling boolean := false; v_online boolean;
  v_lease uuid; v_observed timestamptz; v_normalized jsonb; v_error text;
  v_body jsonb; v_history jsonb; v_calls integer; v_retry integer; v_wait integer;
  v_day date := (clock_timestamp() at time zone 'UTC')::date;
begin
  if p_action not in ('health','get','heartbeat','claim','reserve','publish','failure')
    or p_action is null or jsonb_typeof(p_payload) <> 'object' or p_payload is null then
    return lego_market.error('INVALID_REQUEST',400,0);
  end if;
  if octet_length(p_payload::text)>1048576 then return lego_market.error('PAYLOAD_TOO_LARGE',413,0); end if;
  select * into v_cfg from lego_market.settings where singleton for update;
  -- A contended row lock may cross a lease deadline or UTC midnight.
  -- All expiration/quota decisions use the time after acquiring that lock.
  v_now:=clock_timestamp();
  v_day:=(v_now at time zone 'UTC')::date;
  v_online := v_cfg.worker_last_seen_at is not null and v_cfg.worker_last_seen_at > v_now-interval '5 minutes';
  if p_action not in ('health','get') then
    if v_cfg.collector_token_hash is null or p_worker_digest is null or p_worker_digest !~ '^[0-9a-f]{64}$'
      or p_worker_digest <> v_cfg.collector_token_hash then return lego_market.error('UNAUTHORIZED',401,0); end if;
  end if;
  if p_action='health' then
    if p_payload <> '{}'::jsonb then return lego_market.error('INVALID_REQUEST',400,0); end if;
    return lego_market.result(200,jsonb_build_object('ok',true,'schemaVersion',1,'provider','bricklink',
      'configured',v_online and v_cfg.provider_configured,'storage','supabase',
      'collector',jsonb_build_object('online',v_online,'configured',v_cfg.provider_configured,
        'lastSeenAt',lego_market.iso(v_cfg.worker_last_seen_at))));
  end if;
  if p_action='heartbeat' then
    if jsonb_typeof(p_payload->'providerConfigured') <> 'boolean'
      or not (p_payload ? 'providerConfigured')
      or exists(select 1 from jsonb_object_keys(p_payload) x where x<>'providerConfigured') then
      return lego_market.error('INVALID_REQUEST',400,0); end if;
    update lego_market.settings set worker_last_seen_at=v_now,provider_configured=(p_payload->>'providerConfigured')::boolean where singleton;
    return lego_market.result(200,jsonb_build_object('ok',true));
  end if;
  if p_action='get' then
    if exists(select 1 from jsonb_object_keys(p_payload) x where x not in ('setNum','condition','country','refresh'))
      or jsonb_typeof(p_payload->'setNum') <> 'string' or not(p_payload?'setNum') then return lego_market.error('INVALID_REQUEST',400,0); end if;
    v_set:=p_payload->>'setNum'; v_condition:=coalesce(p_payload->>'condition','N'); v_country:=coalesce(p_payload->>'country','GLOBAL');
    if (p_payload?'condition' and jsonb_typeof(p_payload->'condition')<>'string')
      or (p_payload?'country' and jsonb_typeof(p_payload->'country')<>'string') then return lego_market.error('INVALID_REQUEST',400,0); end if;
    if v_set !~ '^[A-Za-z0-9][A-Za-z0-9-]{0,39}$' or v_condition not in ('N','U') or v_country not in ('GLOBAL','KR') then
      return lego_market.error('INVALID_REQUEST',400,0); end if;
    if v_set !~ '-[0-9]+$' then v_set:=v_set||'-1'; end if;
    if length(v_set)>40 then return lego_market.error('INVALID_REQUEST',400,0); end if;
    if p_payload?'refresh' then
      if jsonb_typeof(p_payload->'refresh') <> 'boolean' then return lego_market.error('INVALID_REQUEST',400,0); end if;
      v_refresh:=(p_payload->>'refresh')::boolean;
    end if;
    v_key:=v_set||'|'||v_condition||'|'||v_country||'|KRW';
    insert into lego_market.scopes(query_key,set_num,condition,country,requested_at,next_refresh_at)
      values(v_key,v_set,v_condition,v_country,v_now,v_now)
      on conflict(query_key) do update set requested_at=excluded.requested_at,active=true;
    update lego_market.scopes set active=false where query_key in (
      select query_key from lego_market.scopes where active order by requested_at desc,query_key desc offset 50);
    select * into v_scope from lego_market.scopes where query_key=v_key;
    v_cooling:=v_scope.last_attempt_at is not null and v_scope.last_attempt_at>v_now-interval '10 minutes';
    if v_refresh and not v_cooling and (v_scope.state='ok' or v_scope.next_refresh_at<=v_now) then
      update lego_market.scopes set next_refresh_at=v_now where query_key=v_key;
    end if;
    perform lego_market.tick();
    select * into v_scope from lego_market.scopes where query_key=v_key;
    if v_scope.snapshot is not null and v_scope.observed_at>v_now-interval '24 hours' then
      select coalesce(jsonb_agg(jsonb_build_object('date',to_char(o.date,'YYYY-MM-DD'),'observedAt',lego_market.iso(o.observed_at),
        'price',o.price,'basis','recent-30d-median','sampleCount',o.sample_count,'currency','KRW',
        'condition',v_condition,'country',v_country,'source','BrickLink') order by o.date),'[]'::jsonb)
        into v_history from lego_market.observations o where o.query_key=v_key;
      v_body:=jsonb_build_object('schemaVersion',1,
        'status',case when v_scope.expires_at<=v_now or v_scope.state<>'ok' then 'stale'
          when v_scope.snapshot#>'{current,value}'='null'::jsonb then 'no-sales' else 'fresh' end,
        'query',jsonb_build_object('setNum',v_set,'provider','bricklink','condition',v_condition,'country',v_country,'currency','KRW'),
        'observedAt',lego_market.iso(v_scope.observed_at),'expiresAt',lego_market.iso(v_scope.expires_at),
        'sourceUrl','https://www.bricklink.com/v2/catalog/catalogitem.page?S='||v_set,
        'retryAfterSeconds',greatest(0,ceil(extract(epoch from v_scope.next_refresh_at-v_now))::integer),
        'current',v_scope.snapshot->'current','trades',v_scope.snapshot->'trades','quality',v_scope.snapshot->'quality','history',v_history,
        'refresh',jsonb_build_object('state',case when v_refresh and v_cooling then 'cooldown' else v_scope.state end,
          'errorCode',v_scope.error_code,'nextRefreshAt',lego_market.iso(v_scope.next_refresh_at)),
        'retention',jsonb_build_object('rawHours',24,'observationDays',730));
      return lego_market.result(200,v_body);
    end if;
    if not v_cfg.provider_configured then return lego_market.error('NOT_CONFIGURED',503,30); end if;
    if not v_online then return lego_market.error('COLLECTOR_OFFLINE',503,30); end if;
    if v_scope.error_code is not null and v_scope.next_refresh_at>v_now then
      v_retry:=greatest(1,ceil(extract(epoch from v_scope.next_refresh_at-v_now))::integer);
      return lego_market.error(v_scope.error_code,case v_scope.error_code when 'NOT_FOUND' then 404 when 'QUOTA_EXCEEDED' then 429 else 503 end,v_retry);
    end if;
    return lego_market.error('COLLECTION_PENDING',503,30);
  end if;
  if p_action='claim' then
    if p_payload <> '{}'::jsonb then return lego_market.error('INVALID_REQUEST',400,0); end if;
    perform lego_market.tick();
    if not v_cfg.provider_configured or not v_online or exists(select 1 from lego_market.jobs where leased_until>v_now) then
      return lego_market.result(200,jsonb_build_object('job',null)); end if;
    select * into v_job from lego_market.jobs where eligible_at<=v_now and (leased_until is null or leased_until<=v_now)
      order by eligible_at,query_key limit 1 for update skip locked;
    if not found then return lego_market.result(200,jsonb_build_object('job',null)); end if;
    v_lease:=gen_random_uuid();
    update lego_market.jobs set lease_id=v_lease,leased_until=v_now+interval '120 seconds',reservations=0 where query_key=v_job.query_key;
    update lego_market.scopes set last_attempt_at=v_now where query_key=v_job.query_key returning * into v_scope;
    return lego_market.result(200,jsonb_build_object('job',jsonb_build_object('leaseId',v_lease,'query',jsonb_build_object(
      'setNum',v_scope.set_num,'provider','bricklink','condition',v_scope.condition,'country',v_scope.country,'currency','KRW'))));
  end if;
  if not(p_payload?'leaseId') or jsonb_typeof(p_payload->'leaseId')<>'string'
    or (p_payload->>'leaseId') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return lego_market.error('INVALID_REQUEST',400,0); end if;
  v_lease:=(p_payload->>'leaseId')::uuid;
  select * into v_job from lego_market.jobs where lease_id=v_lease and leased_until>v_now for update;
  if not found then return lego_market.error('LEASE_EXPIRED',409,0); end if;
  select * into v_scope from lego_market.scopes where query_key=v_job.query_key;
  if p_action='reserve' then
    if exists(select 1 from jsonb_object_keys(p_payload) x where x<>'leaseId') then return lego_market.error('INVALID_REQUEST',400,0); end if;
    if v_job.reservations>=2 then return lego_market.error('INVALID_REQUEST',400,0); end if;
    insert into lego_market.quota(day,calls) values(v_day,0) on conflict(day) do nothing;
    select calls into v_calls from lego_market.quota where day=v_day for update;
    if v_calls>=1200 then
      v_retry:=greatest(1,ceil(extract(epoch from (((v_day+1)::timestamp at time zone 'UTC')-v_now)))::integer);
      return lego_market.error('QUOTA_EXCEEDED',429,v_retry);
    end if;
    if v_cfg.last_provider_start_at is not null and v_cfg.last_provider_start_at>v_now-interval '1 second' then
      v_wait:=greatest(1,ceil(extract(epoch from (v_cfg.last_provider_start_at+interval '1 second'-v_now))*1000)::integer);
      v_body:=(lego_market.error('PROVIDER_WAIT',429,1)->'body')||jsonb_build_object('retryAfterMs',v_wait);
      return lego_market.result(429,v_body);
    end if;
    update lego_market.quota set calls=calls+1 where day=v_day;
    update lego_market.settings set last_provider_start_at=v_now where singleton;
    update lego_market.jobs set reservations=reservations+1 where query_key=v_job.query_key;
    return lego_market.result(200,jsonb_build_object('reserved',true));
  end if;
  if p_action='publish' then
    if exists(select 1 from jsonb_object_keys(p_payload) x where x not in ('leaseId','observedAt','normalized'))
      or jsonb_typeof(p_payload->'observedAt')<>'string' or not(p_payload?'observedAt')
      or (p_payload->>'observedAt') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z$'
      or v_job.reservations<>2 then return lego_market.error('INVALID_SNAPSHOT',400,0); end if;
    begin v_observed:=(p_payload->>'observedAt')::timestamptz;
    exception when others then return lego_market.error('INVALID_SNAPSHOT',400,0); end;
    v_normalized:=p_payload->'normalized';
    if v_observed>v_now+interval '60 seconds' or v_observed<v_now-interval '5 minutes'
      or (v_scope.observed_at is not null and v_observed<v_scope.observed_at)
      or not lego_market.valid_snapshot(v_normalized,v_scope.condition,v_scope.country,v_observed) then
      return lego_market.error('INVALID_SNAPSHOT',400,0); end if;
    update lego_market.scopes set snapshot=v_normalized,observed_at=v_observed,expires_at=v_observed+interval '6 hours',
      next_refresh_at=v_observed+interval '6 hours',state='ok',error_code=null where query_key=v_job.query_key;
    if v_normalized#>'{current,value}'<>'null'::jsonb then
      insert into lego_market.observations(query_key,date,observed_at,price,sample_count)
      values(v_job.query_key,(v_observed at time zone 'UTC')::date,v_observed,(v_normalized#>>'{current,value}')::numeric,(v_normalized#>>'{current,sampleCount}')::integer)
      on conflict(query_key,date) do update set observed_at=excluded.observed_at,price=excluded.price,sample_count=excluded.sample_count
      where excluded.observed_at>=lego_market.observations.observed_at;
    end if;
    delete from lego_market.jobs where query_key=v_job.query_key;
    return lego_market.result(200,jsonb_build_object('ok',true));
  end if;
  if p_action='failure' then
    if exists(select 1 from jsonb_object_keys(p_payload) x where x not in ('leaseId','errorCode'))
      or not(p_payload?'errorCode') or jsonb_typeof(p_payload->'errorCode')<>'string' then return lego_market.error('INVALID_REQUEST',400,0); end if;
    v_error:=p_payload->>'errorCode';
    if v_error not in ('NOT_FOUND','PROVIDER_AUTH','UPSTREAM_UNAVAILABLE','UPSTREAM_RATE_LIMITED','UPSTREAM_INVALID',
      'UPSTREAM_SCOPE_MISMATCH','QUOTA_EXCEEDED','PAYLOAD_TOO_LARGE','UPSTREAM_FAILED') then return lego_market.error('INVALID_REQUEST',400,0); end if;
    update lego_market.scopes set state=case when v_error='QUOTA_EXCEEDED' then 'quota' else 'failed' end,
      error_code=v_error,next_refresh_at=case when v_error='QUOTA_EXCEEDED' then greatest(v_now+interval '15 minutes',(v_day+1)::timestamp at time zone 'UTC') else v_now+interval '15 minutes' end
      where query_key=v_job.query_key returning * into v_scope;
    update lego_market.jobs set lease_id=null,leased_until=null,reservations=0,eligible_at=v_scope.next_refresh_at where query_key=v_job.query_key;
    return lego_market.result(200,jsonb_build_object('ok',true));
  end if;
  return lego_market.error('INVALID_REQUEST',400,0);
exception when invalid_text_representation or numeric_value_out_of_range then return lego_market.error('INVALID_REQUEST',400,0);
when others then return lego_market.error('INTERNAL_ERROR',500,30);
end
$$;

revoke all on all functions in schema lego_market from public,anon,authenticated;
grant execute on all functions in schema lego_market to service_role;
revoke all on function public.lego_market_dispatch(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.lego_market_dispatch(text,jsonb,text) to service_role;

comment on schema lego_market is 'LEGO-only private price snapshots, collection leases and derived daily observations. No Kuji/auth data.';
comment on function public.lego_market_dispatch(text,jsonb,text) is 'Service-role-only market bridge; write actions additionally authenticate a dedicated collector digest.';
