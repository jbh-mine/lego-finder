# Rebrickable Proxy Worker

This Cloudflare Worker hides the Rebrickable API key on the server side and gives the
lego-finder front-end a single, reliable endpoint for both the official JSON API and
the HTML pages used for gallery / MOC scraping.

It is **completely optional**. The front-end falls back to the existing public CORS
proxy chain if no Worker URL is configured, so deploying it is purely an upgrade.

## Why deploy it?

- The Rebrickable API key never reaches the browser (it lives in a Worker secret).
- API requests become much more reliable than the public CORS proxy chain
  (set details, parts list, minifigs, MOCs).
- Set detail pages can finally fetch the multi-image gallery for ALL sets
  (e.g. Harry Potter 76446-1) because the Worker can scrape the rebrickable.com HTML
  page server-side without CORS or Cloudflare-challenge issues.
- Cloudflare's free tier is **100,000 requests/day**, which is several orders of
  magnitude beyond what this app needs.

## One-time deployment (≈ 5 minutes)

1. Get a free Rebrickable API key from <https://rebrickable.com/api/>.
2. Install Wrangler if you don't have it: `npm i -g wrangler`.
3. From the `worker/` directory:

   ```bash
   cd worker
   wrangler login
   wrangler deploy
   wrangler secret put REBRICKABLE_API_KEY
   # Paste your API key when prompted.
   ```

4. Wrangler will print the public URL of your Worker, e.g.
   `https://lego-finder-rebrickable-proxy.<your-account>.workers.dev`.
5. Verify it's live:

   ```bash
   curl https://lego-finder-rebrickable-proxy.<your-account>.workers.dev/health
   curl https://lego-finder-rebrickable-proxy.<your-account>.workers.dev/api/sets/76446-1/
   ```

## Wiring the front-end to use it

Open `src/config/proxyConfig.js` and set:

```js
export var REBRICKABLE_PROXY = 'https://lego-finder-rebrickable-proxy.<your-account>.workers.dev';
```

Commit, push, and the GitHub Pages build will use the Worker for:

- The official JSON API (`api.js`) — set details, parts, minifigs, themes, etc.
- The HTML scrapers (`mocApi.js`, `fetchSetImages.js`) — MOC search, set image
  galleries.

If `REBRICKABLE_PROXY` is left blank, the existing public CORS proxy chain is used.
**No existing screen or feature changes** — the Worker is purely additive.

## Endpoints exposed by the Worker

| Path                  | Method | Purpose                                                                |
| --------------------- | ------ | ---------------------------------------------------------------------- |
| `/health`             | GET    | Returns `lego-finder rebrickable proxy ok`. Use to verify deployment.  |
| `/api/sets/76446-1/`  | GET    | Forwards to `https://rebrickable.com/api/v3/lego/sets/76446-1/`.       |
| `/api/...`            | GET    | Any other Rebrickable v3 API path with the API key injected.           |
| `/html?url=<url>`     | GET    | Fetches the given rebrickable.com HTML page. Other hosts are rejected. |

API responses are cached for 10 minutes and HTML pages for 1 hour at the edge.

## Security notes

- The Worker only forwards GET requests.
- The `/html` endpoint validates that the requested URL hostname is `rebrickable.com`.
- The `REBRICKABLE_API_KEY` is stored as an encrypted Worker secret and is never
  exposed via any response.
- CORS is set to `*` because the GitHub Pages origin is static and the Worker only
  forwards public-data GETs.
