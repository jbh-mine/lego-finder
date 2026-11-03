# LEGO Supabase bridge contract

Existing project: `lkiyqjjihattcoykgpnn` (`kuji-monorepo`). All new storage uses private schema `lego_market`; existing Kuji/auth data is outside this change. No upstream credentials in browser or database.

An Edge Function `lego-market-api` fronts `public.lego_market_dispatch(p_action text,p_payload jsonb,p_worker_digest text default null)`. Only `service_role` may execute this RPC; anon/authenticated/PUBLIC cannot. Prefer SECURITY INVOKER with grants limited to the new private schema. All new tables have RLS, no public policies. Edge uses built-in server credentials internally, never returns them.

Registered-IP worker supplies `Authorization: Bearer <collector token>`. Edge SHA-256 hashes token; RPC compares the digest with a private configured hash, never stores plaintext token. Credentials for BrickLink stay on the worker. SQL refuses worker actions without matching hash. No direct BrickLink calls from Edge because its egress IP is not static.

RPC returns `{httpStatus: number, body: object}` for every action. Edge forwards status/body. Public error body `{schemaVersion:1,error:{code,message},retryAfterSeconds}`. No credentials, raw internal errors or arbitrary SQL/URL inputs.

## HTTP → RPC

- `GET /health` → `health`, `{}`. Existing frontend health contract `{ok:true,schemaVersion:1,provider:'bricklink',configured:boolean}` plus `storage:'supabase'`, collector online/configured/lastSeenAt flags. `configured` requires a heartbeat within 5 minutes AND worker credential-presence flag.
- `GET /v1/market/:id?condition=N|U&country=GLOBAL|KR&currency=KRW&refresh=1` → `get`, `{setNum,condition,country,refresh:boolean}`. Missing numeric variant appends `-1`, existing variants preserved. Safe alnum/hyphen max40. Validate repeated/unknown query arguments. Registers any product, max50 recently used active scopes; inactive after7days. Enqueue due work but never claim fetched prices when pending.
- `POST /v1/collector/heartbeat` → `heartbeat`, `{providerConfigured:boolean}` (authorized).
- `POST /v1/collector/claim` → `claim`, `{}` (authorized). Body `{job:null}` or `{job:{leaseId,query:{setNum,provider:'bricklink',condition,country,currency:'KRW'}}}`. At most one active lease globally, 120-second lease. Skip locked; pending retry timestamps honored.
- `POST /v1/collector/reserve` → `reserve`, `{leaseId}` (authorized). Before EACH actual upstream request. Persist UTC quota1200/day; minimum1second between reserved starts. Success `{reserved:true}`. Wait response429 `PROVIDER_WAIT` with `retryAfterMs`; exhausted429 `QUOTA_EXCEEDED` with retryAfterSeconds.
- `POST /v1/collector/publish` → `publish`, `{leaseId,observedAt,normalized:{current,trades,quality}}` (authorized). Uses existing normalizeGuides output, current median computed over ALL valid30d rows. Worker may cap displayed trades to500 AFTER computation; update quality.returnedTradeCount. Payload <=1MiB. Validate scope/time/fields; reject mismatched/expired lease and observations >60sec future or >5min old. DB-generated expiresAt=observedAt+6h. Store normalized snapshot only (no duplicate full sold/stock text).
- `POST /v1/collector/failure` → `failure`, `{leaseId,errorCode}` (authorized). Safe error allowlist, retains last-good time/data and 15-minute minimum backoff (quota untilnextUTCday). No raw provider error message.

Worker success body for publish/failure/heartbeat `{ok:true}`. Unexpected errors fail closed. Claim/publish of expired lease returns409 `LEASE_EXPIRED`.

## Market response

Same DTO as `docs/MARKET_API_CONTRACT.md`: fresh/stale/no-sales, query, sourceUrl official exact set, observedAt/expiresAt, current, trades, history, quality, refresh, retention. History is own UTC day observations (one upsert/day/scope,730days). Never accumulate anonymous provider rows as independent transactions. No latest-price fallback to asking/MSRP/6month average. Cache >24h cannot return current/raw rows. No cache: NOT_CONFIGURED if keys absent, COLLECTOR_OFFLINE if last heartbeat expired, otherwise COLLECTION_PENDING (503/retry30s). Persisted errors distinguish NOT_FOUND404/quota429/provider503. Cached response retains original time, stale afterexpiry or failure. refresh=1 cannot bypass10min attemptcooldown/backoff.

Private `lego_market.tick()` performs retention cleanup and enqueues expired active scopes. pg_cron job `lego-market-refresh-v1`, every15min, directly calls that SQL function. No HTTP/service_role tokens in cron. No provider calls from DB.

DB capacity/query inputs must be bounded; no caller-supplied SQL or fetch URLs. Existing Kuji table/function grants and cron jobs remain untouched. Production SQL verification uses rollback fixtures; mock prices never committed as operational data.
