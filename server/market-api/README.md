# Market API

Standalone Node.js 24 service with no third-party runtime dependencies. `npm test`
runs only synthetic official-shape fixtures, never a production or demo feed.

Run one server process per registered fixed IP. BrickLink seller API credentials
and its registered outbound IP are required. Set all four `BRICKLINK_*` values and
a long random `ADMIN_TOKEN` in server environment variables. Never put them in
React environment variables, source control or URLs. Missing keys produce
`503 NOT_CONFIGURED`, not generated prices. TLS and the fixed-IP VPS are supplied
by the deployment, separately from GitHub Pages.

Each credential and `ADMIN_TOKEN` also accepts a corresponding `_FILE` variable
for Docker `/run/secrets` files. A direct variable takes precedence. Only trailing
line endings are removed; other secret bytes are preserved.

For local execution copy `.env.example` to an untracked `.env`, set a writable
`DB_PATH`, then run `node --env-file=.env server.mjs`. Use a persistent writable
volume mounted at `/data` in Docker. The database uses WAL; backups must include a
consistent SQLite backup rather than copying only the main file during writes.

- `GET /health`: configuration state, without secrets.
- `GET /v1/market/21322-1?condition=N&country=GLOBAL`: refreshes expired data and
  automatically watches this exact scope. `country=KR` filters seller country;
  `condition=U` is a separate used-product scope. Currency is always KRW.
- `refresh=1` respects a ten-minute minimum cooldown, failure backoff and quota.
- `POST /v1/admin/refresh`, `Authorization: Bearer ...`, JSON `{}`: enqueue up to
  fifty due watched scopes. JSON `{ "setNum": "21322-1", "condition": "N",
  "country": "GLOBAL" }` requests one scope with the same cooldown and budget.
- `node --env-file=.env refresh.mjs` supports external cron using loopback HTTP.
  The server also checks due watches every 15 minutes. Watches expire after seven
  days without a request; at most 500 recently requested scopes are retained.

The default cache TTL is six hours. Failed refreshes retain the previous successful
value and timestamp for at most 24 hours, with explicit failure status. Upstream
calls are serialized at least one second apart. A persistent UTC-day budget limits
calls to 4,500; calls for sold and stock each count separately. Public clients are
limited to 60 requests per minute per IP. CORS allows exact configured origins.
Only enable `TRUST_PROXY=1` behind one trusted reverse proxy on a private/loopback
network with no publicly exposed API port. The rightmost forwarded address is
trusted under that explicit configuration, including a Docker Caddy peer.

Current price is the **unweighted median of all valid anonymous sold detail rows
from the last 30 days**. Quantity does not give a row extra weight. Older rows,
six-month aggregate statistics, and stock asking prices remain separate. No recent
sales produces a null current price, not a zero, an MSRP or an asking-price fallback.
`date_ordered` is order creation time, not proof of completed payment or delivery.
Global KRW guide values are conversions, not a verified Korean domestic checkout
price; VAT, shipping and fees are not included. The API does not reveal enough
information to verify box/seal subcondition or the original currency/FX rate.
BrickLink documents latest exchange rates for stock and order-final-batch rates
for sold data; historical sold rows are not all repriced at today's FX rate.

Only the latest successful sold/stock source response and its anonymous rows are
cached, for up to 24 hours. Fingerprint-plus-occurrence row keys preserve duplicate
identical rows within that snapshot; they do **not** identify actual unique orders
across snapshots. There is no permanent copied transaction ledger. Own derived
daily median observations are upserted once per UTC day and scope and retained for
up to 730 days. Their timestamps and `daily-market-observations` type are returned
separately from provider rows; scope, conditions and currencies are never merged.

Official references:
- [BrickLink Price Guide](https://www.bricklink.com/v3/api.page?page=get-price-guide)
- [Price Guide representation](https://www.bricklink.com/v3/api.page?page=resource-representations-catalog)
- [OAuth authentication](https://www.bricklink.com/v3/api.page?page=auth)
- [API errors](https://www.bricklink.com/v3/api.page?page=error-handling)
- [Currency handling](https://www.bricklink.com/help.asp?helpID=436&q=prices)
- [Node SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)

Live authentication and the production API require the operator's registered
credentials and VPS; fixture tests do not claim that deployment has been completed.
