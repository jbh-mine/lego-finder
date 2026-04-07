// Optional Cloudflare Worker proxy for Rebrickable.
//
// When set, the front-end will:
//   - Use `${REBRICKABLE_PROXY}/api/...` for the official Rebrickable JSON API
//     (set details, parts, minifigs, themes, etc.) — the API key is hidden
//     server-side inside the Worker, so it never reaches the browser.
//   - Use `${REBRICKABLE_PROXY}/html?url=...` as the FIRST entry in the HTML
//     scraping chain (MOC search, set image galleries) for much higher
//     reliability than the public CORS proxy chain.
//
// When left empty (the default), all existing behavior is preserved:
//   - api.js continues to call the Rebrickable API via the public CORS proxy
//     chain (codetabs / allorigins / corsproxy.io).
//   - mocApi.js and fetchSetImages.js continue to use the existing CORS proxy
//     chain for HTML scraping.
//
// To enable the Worker, deploy `worker/rebrickable-proxy.js` (see
// `worker/README.md` for ~5-minute deployment instructions) and replace the
// empty string below with your Worker's URL, e.g.:
//
//   export var REBRICKABLE_PROXY = 'https://lego-finder-rebrickable-proxy.example.workers.dev';
//
// At build-time, the value of REACT_APP_REBRICKABLE_PROXY (set in CI / .env.local)
// takes precedence so you can also configure it via env var without editing this file.

var ENV_PROXY = (typeof process !== 'undefined' &&
                 process.env &&
                 process.env.REACT_APP_REBRICKABLE_PROXY) || '';

export var REBRICKABLE_PROXY = ENV_PROXY || '';

export function hasProxy() {
  return !!REBRICKABLE_PROXY;
}

// Build a URL on the proxy. Strips trailing slash so callers don't have to
// worry about double slashes.
export function proxyUrl(path) {
  if (!REBRICKABLE_PROXY) return null;
  var base = REBRICKABLE_PROXY.replace(/\/$/, '');
  if (path && path.charAt(0) !== '/') path = '/' + path;
  return base + (path || '');
}

// Build a /html?url=... endpoint on the Worker.
export function proxyHtmlUrl(rebrickableUrl) {
  if (!REBRICKABLE_PROXY) return null;
  var base = REBRICKABLE_PROXY.replace(/\/$/, '');
  return base + '/html?url=' + encodeURIComponent(rebrickableUrl);
}
