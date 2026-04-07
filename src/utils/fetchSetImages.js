// Hybrid fetcher for Rebrickable set gallery image IDs.
//
// Strategy:
//   1. Build-time static JSON (legoImages.json + bdpImages.json) — always reliable.
//      Updated by `npm run fetch-images` and the GitHub Action `update-images.yml`.
//   2. localStorage cache (lego_set_images_cache_v2) — for sets fetched at runtime.
//   3. Runtime fetch via public CORS proxy chain — best-effort live update for sets
//      not yet in the static JSON. (Most public proxies are unreliable from
//      GitHub Pages, so the static JSON is the primary trustworthy source.)

import legoImagesData from '../data/legoImages.json';
import bdpImagesData from '../data/bdpImages.json';
import { proxyHtmlUrl } from '../config/proxyConfig';

var STATIC_SETS = Object.assign({}, (bdpImagesData && bdpImagesData.sets) || {}, (legoImagesData && legoImagesData.sets) || {});

export function getStaticImageIds(setNum) {
  if (!setNum) return null;
  var ids = STATIC_SETS[setNum];
  if (ids && ids.length > 0) return ids.slice();
  return null;
}

var CACHE_KEY = 'lego_set_images_cache_v2';
var LEGACY_CACHE_KEY = 'lego_set_images_cache';
var CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
// allorigins serves the full HTML reliably for rebrickable; codetabs truncates
// long pages (~5KB cap) and is therefore unusable as primary. Reorder so the
// reliable proxy is tried first, fallbacks after.
var CORS_PROXIES = [
  function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
  function(u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
  function(u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); },
  function(u) { return 'https://thingproxy.freeboard.io/fetch/' + u; },
  function(u) { return 'https://cors.eu.org/' + u; },
];
var FETCH_TIMEOUT_MS = 25000;

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
  if (entry && entry.ids && entry.ids.length > 0 && (!entry.t || (Date.now() - entry.t) <= CACHE_TTL_MS)) {
    return entry.ids;
  }
  // Fallback to static build-time JSON (always available, no proxy needed)
  return getStaticImageIds(setNum);
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

// Make sure the body really came from rebrickable and isn't a truncated
// "OK" stub from a misbehaving proxy or a Cloudflare challenge page.
function isValidRebrickableSetHtml(text) {
  if (!text || text.length < 10000) return false;
  return text.indexOf('rebrickable') >= 0 && (
    text.indexOf('/media/thumbs/sets/') >= 0 ||
    text.indexOf('og:image') >= 0
  );
}

async function fetchFromProxies(setNum) {
  var url = 'https://rebrickable.com/sets/' + setNum + '/';

  // If a Worker proxy is configured, try it first. The Worker fetches the
  // rebrickable.com page server-side and returns the HTML directly, avoiding
  // public CORS proxy unreliability and Cloudflare challenges. This is what
  // makes detail-page galleries (e.g. Harry Potter sets) finally show up.
  var workerUrl = proxyHtmlUrl(url);
  if (workerUrl) {
    try {
      var wres = await fetchWithTimeout(workerUrl, FETCH_TIMEOUT_MS);
      if (wres.ok) {
        var whtml = await wres.text();
        if (isValidRebrickableSetHtml(whtml)) {
          var wfound = extractImageIds(whtml, setNum);
          if (wfound.length > 0) return wfound;
        }
      }
    } catch (e) { /* fall through to public proxies */ }
  }

  for (var i = 0; i < CORS_PROXIES.length; i++) {
    try {
      var html = await fetchVia(CORS_PROXIES[i], url);
      if (!isValidRebrickableSetHtml(html)) continue;
      var found = extractImageIds(html, setNum);
      if (found.length > 0) return found;
    } catch (e) { /* try next */ }
  }
  return [];
}

function backgroundRefresh(setNum) {
  if (pending[setNum]) return;
  pending[setNum] = (async function() {
    var ids = await fetchFromProxies(setNum);
    if (ids.length > 0) {
      var cache = loadCache();
      cache[setNum] = { ids: ids, t: Date.now() };
      saveCache(cache);
    }
    delete pending[setNum];
    return ids;
  })();
}

export async function fetchSetImages(setNum) {
  if (!setNum) return [];
  // Cache hit short-circuit (cache layer also covers the static JSON fallback)
  var cached = getCachedSetImages(setNum);
  if (cached && cached.length > 0) {
    // Still try a runtime refresh in the background if no localStorage entry yet
    var lc = loadCache();
    if (!lc[setNum]) {
      // best-effort, fire and forget — don't await
      setTimeout(function() { backgroundRefresh(setNum); }, 0);
    }
    return cached;
  }
  // De-dupe in-flight requests
  if (pending[setNum]) return pending[setNum];

  pending[setNum] = (async function() {
    var ids = await fetchFromProxies(setNum);
    if (ids.length > 0) {
      var cache = loadCache();
      cache[setNum] = { ids: ids, t: Date.now() };
      saveCache(cache);
    } else {
      // Final fallback: static JSON if proxies all failed
      var staticIds = getStaticImageIds(setNum);
      if (staticIds && staticIds.length > 0) ids = staticIds;
    }
    delete pending[setNum];
    return ids;
  })();

  return pending[setNum];
}
