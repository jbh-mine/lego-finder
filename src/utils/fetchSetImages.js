// Real-time fetcher for Rebrickable set gallery image IDs.
//
// All set detail pages call fetchSetImages() to retrieve gallery image IDs
// live from rebrickable.com via a CORS proxy chain. Successful results are
// cached in localStorage for instant subsequent loads. Empty results are
// NOT cached (so transient proxy failures don't poison the cache).

var CACHE_KEY = 'lego_set_images_cache_v2';
var LEGACY_CACHE_KEY = 'lego_set_images_cache';
var CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
var CORS_PROXIES = [
  function(u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); },
  function(u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
  function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
  function(u) { return 'https://thingproxy.freeboard.io/fetch/' + u; },
  function(u) { return 'https://cors.eu.org/' + u; },
];
var FETCH_TIMEOUT_MS = 8000;

var pending = {};

// One-shot cleanup of legacy cache (which may have empty arrays poisoning lookups)
try {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(LEGACY_CACHE_KEY)) {
    localStorage.removeItem(LEGACY_CACHE_KEY);
  }
} catch (e) {}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch (e) { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
}

export function getCachedSetImages(setNum) {
  if (!setNum) return null;
  var cache = loadCache();
  var entry = cache[setNum];
  if (!entry) return null;
  // Honor TTL
  if (entry.t && (Date.now() - entry.t) > CACHE_TTL_MS) return null;
  // Never return empty arrays as a "cache hit" — force a re-fetch instead
  if (!entry.ids || entry.ids.length === 0) return null;
  return entry.ids;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractImageIds(html, setNum) {
  // Match both /media/thumbs/sets/{setNum}/{id}.jpg/ and absolute CDN URLs
  var re = new RegExp('/media/thumbs/sets/' + escapeRegExp(setNum) + '/(\\d+)\\.jpg/', 'g');
  var seen = {};
  var ids = [];
  var m;
  while ((m = re.exec(html)) !== null) {
    if (!seen[m[1]]) { seen[m[1]] = 1; ids.push(m[1]); }
  }
  return ids;
}

function fetchWithTimeout(input, ms) {
  if (typeof AbortController === 'undefined') return fetch(input);
  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, ms);
  return fetch(input, { method: 'GET', signal: ctrl.signal })
    .finally(function() { clearTimeout(timer); });
}

async function fetchVia(proxyBuilder, url) {
  var proxied = proxyBuilder(url);
  var res = await fetchWithTimeout(proxied, FETCH_TIMEOUT_MS);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

export async function fetchSetImages(setNum) {
  if (!setNum) return [];
  // Cache hit short-circuit (only non-empty results are cached)
  var cached = getCachedSetImages(setNum);
  if (cached && cached.length > 0) return cached;
  // De-dupe in-flight requests
  if (pending[setNum]) return pending[setNum];

  pending[setNum] = (async function() {
    var url = 'https://rebrickable.com/sets/' + setNum + '/';
    var ids = [];
    for (var i = 0; i < CORS_PROXIES.length; i++) {
      try {
        var html = await fetchVia(CORS_PROXIES[i], url);
        if (html && html.length > 0) {
          var found = extractImageIds(html, setNum);
          if (found.length > 0) {
            ids = found;
            break;
          }
        }
      } catch (e) {
        // try next proxy
      }
    }
    // Only cache non-empty results so transient failures don't poison the cache
    if (ids.length > 0) {
      var cache = loadCache();
      cache[setNum] = { ids: ids, t: Date.now() };
      saveCache(cache);
    }
    delete pending[setNum];
    return ids;
  })();

  return pending[setNum];
}
