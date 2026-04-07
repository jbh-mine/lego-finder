// Runtime fetcher for Rebrickable set gallery image IDs.
//
// Strategy: pre-built data files (bdpImages.json, legoImages.json) cover the
// most popular sets. For any set that isn't pre-fetched, this utility scrapes
// rebrickable.com via a public CORS proxy at runtime and caches the result in
// localStorage so the lookup is instant on subsequent visits.

var CACHE_KEY = 'lego_set_images_cache';
var CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
var CORS_PROXIES = [
  function(u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
  function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
];

var pending = {};

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
  return entry.ids || null;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractImageIds(html, setNum) {
  var re = new RegExp('/media/thumbs/sets/' + escapeRegExp(setNum) + '/(\\d+)\\.jpg/', 'g');
  var seen = {};
  var ids = [];
  var m;
  while ((m = re.exec(html)) !== null) {
    if (!seen[m[1]]) { seen[m[1]] = 1; ids.push(m[1]); }
  }
  return ids;
}

async function fetchVia(proxyBuilder, url) {
  var proxied = proxyBuilder(url);
  var res = await fetch(proxied, { method: 'GET' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

export async function fetchSetImages(setNum) {
  if (!setNum) return [];
  // Hit cache first
  var cached = getCachedSetImages(setNum);
  if (cached) return cached;
  // De-dupe in-flight requests
  if (pending[setNum]) return pending[setNum];

  pending[setNum] = (async function() {
    var url = 'https://rebrickable.com/sets/' + setNum + '/';
    var html = null;
    for (var i = 0; i < CORS_PROXIES.length; i++) {
      try {
        html = await fetchVia(CORS_PROXIES[i], url);
        if (html && html.length > 0) break;
      } catch (e) {
        // try next proxy
      }
    }
    if (!html) {
      delete pending[setNum];
      return [];
    }
    var ids = extractImageIds(html, setNum);
    // Cache (even empty results, for a shorter window)
    var cache = loadCache();
    cache[setNum] = { ids: ids, t: Date.now() };
    saveCache(cache);
    delete pending[setNum];
    return ids;
  })();

  return pending[setNum];
}
