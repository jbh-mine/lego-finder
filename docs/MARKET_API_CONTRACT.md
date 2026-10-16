# Market API v1

Base URL is the operator's HTTPS endpoint. Credentials stay on the server. Currency is KRW. Responses use `schemaVersion: 1`; errors never expose upstream signed requests or credentials.

## GET /health

```json
{"ok":true,"schemaVersion":1,"configured":false,"provider":"bricklink"}
```

`configured` checks credential presence, not successful upstream authentication.

## GET /v1/market/:setNum

Query: `condition=N|U` (default N), `country=GLOBAL|KR` (default GLOBAL), optional `currency=KRW`, optional `refresh=1`. Set identifiers allow alphanumeric characters and hyphens, up to 40 characters. A missing numeric variant becomes `-1`; existing variants are preserved. Unknown parameters and unsupported scopes return 400. There is no seven-product allowlist.

```text
schemaVersion: 1
status: fresh | stale | no-sales
query: { setNum, provider: bricklink, condition, country, currency: KRW }
observedAt, expiresAt: ISO timestamps of original successful observation/TTL
retryAfterSeconds: integer
sourceUrl: official BrickLink catalog URL
current:
  value: positive number | null
  basis: recent-30d-median | null
  sampleCount, min, max, latestPrice, latestTradeAt
  sixMonthAverage, sixMonthQuantityAverage, sixMonthLots, sixMonthUnits
  lowestAskingPrice, askingLots
trades[]:
  rowKey, price, date, datePrecision: timestamp,
  quantity, sellerCountry, buyerCountry
history[]:
  date: YYYY-MM-DD, observedAt, price, basis: recent-30d-median,
  sampleCount, currency: KRW, condition, country, source: BrickLink
quality:
  historyKind: daily-market-observations
  tradeIdentity: anonymous-provider-rows
  subconditionKnown: false
  providerDetailCount, returnedTradeCount
  historyComplete: false
refresh: { state: ok | failed | cooldown | quota, errorCode, nextRefreshAt }
retention: { rawHours: 24, observationDays: 730 }
```

`no-sales` means a valid provider response has no usable recent-30-day sold rows, not authentication failure. Six-month references and asking prices may still be present. `stale` retains the original observation time when a refresh fails; raw responses older than 24 hours cannot serve current prices. Derived daily observations are retained separately. `rowKey` identifies an anonymous row within a snapshot, not a unique provider transaction across requests.

`GET` registers interest in the selected scope and refreshes due entries. `refresh=1` is subject to a ten-minute provider refresh cooldown. The scheduler refreshes scopes used within seven days (maximum 500 active scopes), with persisted UTC daily upstream budget and serialized provider calls. Browser refreshes do not insert duplicate daily history.

## Errors

```json
{"error":{"code":"NOT_CONFIGURED","message":"..."},"retryAfterSeconds":900}
```

400 invalid query; 403 disallowed browser origin; 404 provider product not found; 429 rate limit or provider budget without usable cache; 503 credentials missing/upstream failure without usable cache. Upstream JSON `meta.code` is checked even when HTTP is 200. A refresh failure with usable cached data returns 200 `status:stale` and `refresh.errorCode` so the UI can keep the original source time visible.

The exact configured origin allowlist defaults to `https://jbh-mine.github.io`. Requests without an Origin header are allowed for server/CLI diagnostics. The public read endpoint has per-IP rate limiting; it does not accept provider keys.

## Administrative refresh

`POST /v1/admin/refresh` requires `Authorization: Bearer <ADMIN_TOKEN>`. It is server administration only and must not be called from the public browser. See [server implementation guide](../server/market-api/README.md) for accepted body and operational limits.
