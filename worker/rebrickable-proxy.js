/**
 * Cloudflare Worker — Rebrickable proxy
 *
 * Single Worker that exposes two safe endpoints to the lego-finder front-end:
 *
 *   1) GET /api/...           → proxied to https://rebrickable.com/api/v3/lego/...
 *      with `Authorization: key <REBRICKABLE_API_KEY>` injected on the server side.
 *      The API key is read from a Worker secret and is NEVER exposed to the browser.
 *
 *   2) GET /html?url=<rebrickable URL>  → fetches an arbitrary rebrickable.com page
 *      and returns the HTML body. Used by the gallery / MOC scrapers.
 *      Only rebrickable.com URLs are allowed.
 *
 * CORS:
 *   The Worker returns `Access-Control-Allow-Origin: *` so that the GitHub Pages
 *   front-end (and local dev) can call it directly without CORS errors.
 *
 * Caching:
 *   API responses are cached for 10 minutes, HTML pages for 1 hour, via the
 *   built-in Cloudflare cache. This dramatically reduces request volume against
 *   Rebrickable and stays well within the free 1000 requests/month limit.
 *
 * Deployment: see ../README.md (worker/README.md).
 */

const ALLOWED_HOST = 'rebrickable.com';
const REBRICKABLE_API_BASE = 'https://rebrickable.com/api/v3/lego';
const API_CACHE_TTL = 600;   // 10 minutes
const HTML_CACHE_TTL = 3600; // 1 hour
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function corsHeaders(extra) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (extra) {
    for (const k in extra) h[k] = extra[k];
  }
  return h;
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: corsHeaders({ 'Content-Type': 'application/json' }),
  });
}

function isRebrickableUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    return u.hostname === ALLOWED_HOST || u.hostname.endsWith('.' + ALLOWED_HOST);
  } catch (e) {
    return false;
  }
}

async function handleApi(request, env, url) {
  // Strip leading "/api" so the rest of the path maps directly to the
  // Rebrickable API path. e.g. /api/sets/76446-1/ → /sets/76446-1/
  let subPath = url.pathname.replace(/^\/api/, '');
  if (!subPath.startsWith('/')) subPath = '/' + subPath;

  const upstream = REBRICKABLE_API_BASE + subPath + (url.search || '');
  const apiKey = env.REBRICKABLE_API_KEY;
  if (!apiKey) {
    return jsonError(500, 'REBRICKABLE_API_KEY secret is not configured on the Worker');
  }

  const cacheKey = new Request(upstream, { method: 'GET' });
  const cache = caches.default;
  let resp = await cache.match(cacheKey);
  if (!resp) {
    resp = await fetch(upstream, {
      method: 'GET',
      headers: {
        'Authorization': 'key ' + apiKey,
        'Accept': 'application/json',
        'User-Agent': BROWSER_UA,
      },
    });
    if (resp.ok) {
      const cached = new Response(resp.clone().body, resp);
      cached.headers.set('Cache-Control', 'public, max-age=' + API_CACHE_TTL);
      await cache.put(cacheKey, cached.clone());
      resp = cached;
    }
  }

  // Wrap with CORS headers
  const out = new Response(resp.body, resp);
  const headers = corsHeaders({ 'Content-Type': resp.headers.get('Content-Type') || 'application/json' });
  for (const k in headers) out.headers.set(k, headers[k]);
  return out;
}

async function handleHtml(request, env, url) {
  const target = url.searchParams.get('url');
  if (!target) return jsonError(400, 'Missing ?url= parameter');
  if (!isRebrickableUrl(target)) {
    return jsonError(400, 'Only rebrickable.com URLs are allowed');
  }

  const cacheKey = new Request('https://proxy-cache/html?u=' + encodeURIComponent(target), { method: 'GET' });
  const cache = caches.default;
  let resp = await cache.match(cacheKey);
  if (!resp) {
    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': BROWSER_UA,
      },
      redirect: 'follow',
    });
    if (!upstream.ok) {
      return jsonError(upstream.status, 'Upstream returned HTTP ' + upstream.status);
    }
    const body = await upstream.text();
    resp = new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=' + HTML_CACHE_TTL,
      },
    });
    await cache.put(cacheKey, resp.clone());
  }

  const out = new Response(resp.body, resp);
  const headers = corsHeaders({ 'Content-Type': 'text/html; charset=utf-8' });
  for (const k in headers) out.headers.set(k, headers[k]);
  return out;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'GET') {
      return jsonError(405, 'Method not allowed');
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('lego-finder rebrickable proxy ok', {
        status: 200,
        headers: corsHeaders({ 'Content-Type': 'text/plain' }),
      });
    }

    if (url.pathname.startsWith('/api')) {
      return handleApi(request, env, url);
    }
    if (url.pathname.startsWith('/html')) {
      return handleHtml(request, env, url);
    }

    return jsonError(404, 'Not found');
  },
};
