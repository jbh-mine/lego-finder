// MOC browsing primarily uses the checked-in official Rebrickable blog-review
// catalog. Its dates describe blog introductions, not MOC publication dates.
// HTML scraping is retained only for installations without this catalog.
//
// The official review scope is served entirely from the saved catalog.
// Installations with an older directory snapshot can also use cached HTML
// search results and an optional Worker/public proxy fallback.
import mocsStatic from '../data/mocsStatic.json';
import { proxyHtmlUrl } from '../config/proxyConfig';

// v3 invalidates old entries that treated a failed scrape as zero matches.
var CACHE_KEY = 'lego_moc_cache_v3';
var CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
var DETAIL_CACHE_KEY = 'lego_moc_detail_cache';
var DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 1 day

// Public proxies are best-effort only. Keep the wait bounded when they are
// unavailable; a failed fetch must never masquerade as an empty search.
var CORS_PROXIES = [
  function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
  function(u) { return 'https://corsproxy.io/?url=' + encodeURIComponent(u); },
];
var FETCH_TIMEOUT_MS = 5000;
var PAGE_SIZE = 30;

export function getMocCatalogInfo() {
  return (mocsStatic && mocsStatic.meta) || {};
}

function isReviewCatalog() {
  return getMocCatalogInfo().scope === 'official-blog-reviews';
}

function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); }
  catch (e) { return {}; }
}
function saveCache(key, c) {
  try { localStorage.setItem(key, JSON.stringify(c)); } catch (e) {}
}

function fetchWithTimeout(url, ms) {
  return new Promise(function(resolve) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function() {
      if (ctrl) ctrl.abort();
      resolve(null);
    }, ms);
    Promise.resolve().then(function() {
      return fetch(url, { method: 'GET', signal: ctrl ? ctrl.signal : undefined });
    })
      .then(function(res) { return res.ok ? res.text() : null; })
      .then(resolve, function() { resolve(null); })
      .finally(function() { clearTimeout(timer); });
  });
}

// Validate that the HTML actually came from rebrickable and contains the
// markers we need. Some proxies (codetabs) return small "OK" pages or
// truncated bodies that look successful but contain no usable data.
function isValidRebrickableHtml(text) {
  if (!text || text.length < 10000) return false;
  // Look for markers that exist on every rebrickable listing/detail page
  return text.indexOf('rebrickable') >= 0 && (
    text.indexOf('set-tn') >= 0 ||
    text.indexOf('/mocs/MOC-') >= 0 ||
    text.indexOf('og:image') >= 0
  );
}

async function fetchHtml(url) {
  // If a Worker proxy is configured, try it first as a more reliable
  // HTML fetcher. We pass the URL as-is to the Worker which fetches it
  // server-side without CORS issues.
  var workerUrl = proxyHtmlUrl(url);
  if (workerUrl) {
    try {
      var wtext = await fetchWithTimeout(workerUrl, FETCH_TIMEOUT_MS);
      if (isValidRebrickableHtml(wtext)) return wtext;
    } catch (e) { /* fall through to public proxies */ }
  }
  var responses = await Promise.all(CORS_PROXIES.map(async function(proxy) {
    try {
      var text = await fetchWithTimeout(proxy(url), FETCH_TIMEOUT_MS);
      if (isValidRebrickableHtml(text)) return text;
    } catch (e) { /* A connection error is not a zero-result search. */ }
    return null;
  }));
  return responses.find(function(html) { return !!html; }) || null;
}

// Normalize a user-entered MOC query so that "256600", "moc 256600",
// "moc-256600", or "MOC-256600" all become "MOC-256600".
function normalizeMocQuery(q) {
  if (!q) return '';
  var trimmed = String(q).trim();
  if (!trimmed) return '';
  // If it's purely digits, treat it as a MOC number
  if (/^\d+$/.test(trimmed)) return 'MOC-' + trimmed;
  // If it matches "moc" + optional separator + digits
  var m = trimmed.match(/^moc[\s\-_]*(\d+)$/i);
  if (m) return 'MOC-' + m[1];
  return trimmed;
}

function decodeHtml(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, function(_, n) { return String.fromCharCode(parseInt(n, 10)); });
}

// Parse a single `.set-tn` block (a MOC card) from HTML
function parseMocCards(html) {
  var cards = [];
  // Each MOC card is a div with class set-tn
  // Use a simpler approach: find each set-tn opening and grab a chunk after it
  var openRe = /<div[^>]*class="[^"]*\bset-tn\b[^"]*"[^>]*>/g;
  var matches = [];
  var m;
  while ((m = openRe.exec(html)) !== null) {
    matches.push(m.index);
  }
  for (var i = 0; i < matches.length; i++) {
    var start = matches[i];
    var end = (i + 1 < matches.length) ? matches[i + 1] : Math.min(start + 6000, html.length);
    var chunk = html.slice(start, end);

    // Variant id from data-variant or from URL pattern
    var variantMatch = chunk.match(/data-variant="(\d+)"/);
    var variant = variantMatch ? variantMatch[1] : null;

    // Canonical MOC URL (e.g. /mocs/MOC-256600/Brick%20Horizon/the-ghost.../)
    var hrefMatch = chunk.match(/href="(\/mocs\/MOC-[^"]+)"/);
    var href = hrefMatch ? hrefMatch[1] : null;
    var mocNum = null;
    if (href) {
      var nm = href.match(/MOC-(\d+)/);
      if (nm) mocNum = 'MOC-' + nm[1];
    }
    if (!mocNum) continue;

    // Image. Rebrickable's MOC listing uses lazy loading, so the real image
    // URL lives in data-src / data-original / srcset, while the plain `src`
    // attribute is a tiny placeholder (data:image/gif;base64,... or similar).
    // Try in order: data-src, data-original, srcset (first URL),
    // src that points at cdn.rebrickable.com, then any /media/thumbs/mocs/
    // URL anywhere in the chunk as a final fallback.
    var img = '';
    var dataSrcMatch = chunk.match(/<img[^>]+\bdata-src="([^"]+)"/i) ||
                       chunk.match(/<img[^>]+\bdata-original="([^"]+)"/i) ||
                       chunk.match(/<img[^>]+\bdata-lazy="([^"]+)"/i);
    if (dataSrcMatch) {
      img = dataSrcMatch[1];
    } else {
      var srcsetMatch = chunk.match(/<img[^>]+srcset="([^"\s]+)/i);
      if (srcsetMatch) img = srcsetMatch[1];
    }
    if (!img) {
      // Pull every src=, prefer the first one that isn't a data: placeholder
      var srcRe = /<img[^>]+src="([^"]+)"/g;
      var sm;
      while ((sm = srcRe.exec(chunk)) !== null) {
        if (sm[1].indexOf('data:') !== 0 && sm[1].indexOf('blank.gif') === -1) {
          img = sm[1];
          break;
        }
      }
    }
    if (!img) {
      // Last resort: any rebrickable CDN URL inside the chunk
      var cdnMatch = chunk.match(/https?:\/\/cdn\.rebrickable\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i) ||
                     chunk.match(/\/\/cdn\.rebrickable\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i) ||
                     chunk.match(/\/media\/thumbs\/mocs\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i);
      if (cdnMatch) img = cdnMatch[0];
    }
    if (img && img.indexOf('//') === 0) img = 'https:' + img;
    if (img && img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = 'https://rebrickable.com' + img;
    if (img && img.indexOf('data:') === 0) img = ''; // never keep placeholders

    // Name
    var nameMatch = chunk.match(/data-set_name="([^"]*)"/) ||
                    chunk.match(/title="([^"]*)"/) ||
                    chunk.match(/<a[^>]+href="\/mocs\/[^"]+">\s*([^<]+)\s*</);
    var name = nameMatch ? decodeHtml(nameMatch[1]).trim() : mocNum;

    // Designer
    var designerMatch = chunk.match(/href="\/users\/([^/]+)\/mocs\/"[^>]*>([^<]+)</);
    var designer = designerMatch ? decodeHtml(designerMatch[2]).trim() : '';
    var designerSlug = designerMatch ? designerMatch[1] : '';

    // Parts count
    var partsMatch = chunk.match(/data-num_parts="(\d+)"/);
    var parts = partsMatch ? parseInt(partsMatch[1], 10) : 0;

    // Year
    var yearMatch = chunk.match(/data-year="(\d+)"/);
    var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    // Likes
    var likesMatch = chunk.match(/data-likes="(\d+)"/);
    var likes = likesMatch ? parseInt(likesMatch[1], 10) : 0;

    // Theme name (sometimes in a small text label)
    var themeMatch = chunk.match(/data-theme_name="([^"]*)"/);
    var theme = themeMatch ? decodeHtml(themeMatch[1]).trim() : '';

    cards.push({
      mocNum: mocNum,
      variant: variant,
      name: name,
      img: img,
      designer: designer,
      designerSlug: designerSlug,
      parts: parts,
      year: year,
      likes: likes,
      theme: theme,
      href: href, // canonical relative URL
    });
  }
  return cards;
}

// Extract total result count and pagination from listing HTML
function parseTotalCount(html) {
  // Current listings say "Showing 50 of 1,000 unique MOCs".
  var m = html.match(/(?:of\s+)?(\d[\d,]*)\s+(?:unique\s+)?MOCs?\b/i);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  return 0;
}

function parseThemes(html) {
  // <select name="top_theme">...<option value="X">Name</option>...</select>
  var sel = html.match(/<select[^>]+name="(?:top_theme|theme)"[^>]*>([\s\S]*?)<\/select>/);
  if (!sel) return [];
  var themes = [];
  var optRe = /<option[^>]+value="([^"]*)"[^>]*>([^<]+)<\/option>/g;
  var m;
  while ((m = optRe.exec(sel[1])) !== null) {
    if (!m[1]) continue;
    themes.push({ value: m[1], name: decodeHtml(m[2]).trim() });
  }
  return themes;
}

// Map a sort value (as used by the form) to a static-snapshot view key.
// A `null` return means "no static snapshot for this combination".
function staticViewKeyFor(opts) {
  // Static snapshots only cover: no q, no theme, no parts/year filters, page 1.
  if (opts.q || opts.theme || opts.minYear || opts.maxYear ||
      opts.minParts || opts.maxParts) return null;
  if (opts.page && opts.page > 1) return null;
  switch (opts.sort || '') {
    case '':           return 'hottest';
    case '-published': return 'newest';
    case '-likes':     return 'mostLiked';
    case '-num_parts': return 'mostParts';
    default:           return null;
  }
}

function getStaticView(key) {
  if (!key || !mocsStatic || !mocsStatic.views) return null;
  var v = mocsStatic.views[key];
  if (!v || !v.results || v.results.length === 0) return null;
  return {
    results: v.results,
    total: v.results.length,
    themes: mocsStatic.themes || [],
    source: 'snapshot',
    hasMore: false,
  };
}

// A snapshot is a finite saved catalog, not the whole Rebrickable database.
// Search/filter/page within it and label that scope explicitly in the UI.
function searchSnapshot(opts) {
  if (!mocsStatic || !mocsStatic.views) return null;
  var views = mocsStatic.views;
  var preferred = staticViewKeyFor({ sort: opts.sort });
  var keys = Object.keys(views);
  if (preferred) keys = [preferred].concat(keys.filter(function(key) { return key !== preferred; }));
  var seen = {};
  var catalog = [];
  keys.forEach(function(key) {
    ((views[key] && views[key].results) || []).forEach(function(moc) {
      if (moc && moc.mocNum && !seen[moc.mocNum]) {
        seen[moc.mocNum] = true;
        catalog.push(moc);
      }
    });
  });
  if (!catalog.length) return null;
  if (isReviewCatalog() && opts.sort && !['-reviewed', '-published'].includes(opts.sort)) {
    throw new Error('MOC_SORT_UNAVAILABLE');
  }
  var q = normalizeMocQuery(opts.q).toLowerCase();
  var selectedTheme = (mocsStatic.themes || []).find(function(theme) {
    return String(theme.value) === String(opts.theme);
  });
  catalog = catalog.filter(function(moc) {
    var text = [moc.mocNum, moc.name, moc.designer, moc.theme, moc.description].join(' ').toLowerCase();
    var queryMatches = !q || (/^moc-\d+$/.test(q) ? moc.mocNum.toLowerCase() === q : text.indexOf(q) !== -1);
    var themeMatches = !opts.theme || String(moc.themeId || '') === String(opts.theme) ||
      (selectedTheme && (moc.theme || '').toLowerCase().split(' > ')[0] === selectedTheme.name.toLowerCase());
    var knownYear = (!opts.minYear && !opts.maxYear) || (typeof moc.year === 'number' && moc.year > 0);
    var knownParts = (!opts.minParts && !opts.maxParts) || (typeof moc.parts === 'number' && moc.parts > 0);
    return queryMatches && themeMatches && knownYear && knownParts &&
      (!opts.minYear || moc.year >= Number(opts.minYear)) &&
      (!opts.maxYear || moc.year <= Number(opts.maxYear)) &&
      (!opts.minParts || moc.parts >= Number(opts.minParts)) &&
      (!opts.maxParts || moc.parts <= Number(opts.maxParts));
  });
  if (opts.sort === '-likes') catalog.sort(function(a, b) { return (b.likes || 0) - (a.likes || 0); });
  if (opts.sort === '-num_parts') catalog.sort(function(a, b) { return (b.parts || 0) - (a.parts || 0); });
  if (isReviewCatalog()) catalog.sort(function(a, b) {
    return String(b.reviewedAt || '').localeCompare(String(a.reviewedAt || ''));
  });
  var offset = (Math.max(1, Number(opts.page) || 1) - 1) * PAGE_SIZE;
  return {
    results: catalog.slice(offset, offset + PAGE_SIZE),
    total: catalog.length,
    themes: mocsStatic.themes || [],
    source: 'snapshot',
    catalog: getMocCatalogInfo(),
    hasMore: offset + PAGE_SIZE < catalog.length,
  };
}

export function getMocSearchUrl(opts) {
  opts = opts || {};
  var params = new URLSearchParams();
  var q = normalizeMocQuery(opts.q);
  if (q) params.set('q', q);
  if (opts.theme) params.set('theme', opts.theme);
  // Rebrickable's full MOC directory has no blog-review-date sort.
  if (opts.sort && opts.sort !== '-reviewed') params.set('sort', opts.sort);
  if (opts.minYear) params.set('min_year', opts.minYear);
  if (opts.maxYear) params.set('max_year', opts.maxYear);
  if (opts.minParts) params.set('min_parts', opts.minParts);
  if (opts.maxParts) params.set('max_parts', opts.maxParts);
  if (opts.page && opts.page > 1) params.set('page', opts.page);
  return 'https://rebrickable.com/mocs/' + (params.toString() ? '?' + params.toString() : '');
}

export async function searchMocs(opts) {
  opts = opts || {};
  // Keep the advertised scope consistent and avoid stale live/empty caches
  // obscuring the finite official-review catalog.
  if (isReviewCatalog()) {
    var reviewed = searchSnapshot(opts);
    if (reviewed) return reviewed;
    throw new Error('MOC_SOURCE_UNAVAILABLE');
  }
  var url = getMocSearchUrl(opts);
  var qs = url;

  // Layer 2: localStorage cache check (fresh window).
  var cache = loadCache(CACHE_KEY);
  var entry = cache[qs];
  if (entry && entry.t && (Date.now() - entry.t) < CACHE_TTL_MS) {
    return entry.data;
  }

  // Layer 1: pre-scraped static snapshot for default views.
  // Serve immediately so the page never appears empty for these views.
  var staticKey = staticViewKeyFor(opts);
  var staticData = getStaticView(staticKey);
  if (staticData) {
    // Cache it as a "fresh" entry so subsequent calls (re-renders) don't
    // re-enter the runtime fetch path until cache expires.
    cache[qs] = { t: Date.now(), data: staticData };
    saveCache(CACHE_KEY, cache);
    return staticData;
  }

  var snapshot = searchSnapshot(opts);
  if (snapshot && !proxyHtmlUrl(url)) return snapshot;

  // Layer 3: runtime fetch via CORS-proxy chain.
  var html = await fetchHtml(url);
  if (!html) {
    // Stale-while-revalidate: if the runtime fetch failed but we have a
    // (now-expired) cached entry, serve it instead of returning empty.
    if (entry && entry.data) return entry.data;
    if (snapshot) return snapshot;
    throw new Error('MOC_SOURCE_UNAVAILABLE');
  }
  var results = parseMocCards(html);
  var total = parseTotalCount(html);
  var themes = parseThemes(html);
  // HTML can be a challenge/login page or an unsupported layout even with
  // HTTP 200. Only an explicit zero count is evidence of an empty search.
  if (!results.length && !/\b0\s+(?:unique\s+)?MOCs?\b/i.test(html)) {
    if (entry && entry.data) return entry.data;
    if (snapshot) return snapshot;
    throw new Error('MOC_SOURCE_UNAVAILABLE');
  }
  var data = {
    results: results,
    total: total || results.length,
    themes: themes.length ? themes : ((mocsStatic && mocsStatic.themes) || []),
    source: 'live',
    hasMore: /rel=["']next["']/i.test(html) || (results.length >= PAGE_SIZE && total > (Number(opts.page) || 1) * results.length),
  };

  cache[qs] = { t: Date.now(), data: data };
  saveCache(CACHE_KEY, cache);
  return data;
}

export async function getMocDetail(mocNum) {
  if (!mocNum) return null;
  mocNum = normalizeMocQuery(mocNum);
  if (!/^MOC-\d+$/.test(mocNum)) return null;
  var snapshot = searchSnapshot({ q: mocNum });
  var savedMoc = snapshot && snapshot.results.find(function(moc) { return moc.mocNum === mocNum; });
  if (savedMoc) {
    return Object.assign({}, savedMoc, {
      image: savedMoc.img,
      canonicalUrl: 'https://rebrickable.com' + (savedMoc.href || '/mocs/' + mocNum + '/'),
      source: 'snapshot',
      catalog: getMocCatalogInfo(),
    });
  }
  if (isReviewCatalog()) return null;
  // Cache check
  var cache = loadCache(DETAIL_CACHE_KEY);
  var entry = cache[mocNum];
  if (entry && entry.t && (Date.now() - entry.t) < DETAIL_CACHE_TTL_MS) {
    return entry.data;
  }

  var url = 'https://rebrickable.com/mocs/' + mocNum + '/';
  var html = await fetchHtml(url);
  if (!html) {
    // Stale-while-revalidate: serve previously cached detail (even if expired).
    if (entry && entry.data) return entry.data;
    return null;
  }

  // og:title, og:image, og:url, og:description
  function ogValue(prop) {
    var re = new RegExp('<meta[^>]+property="og:' + prop + '"[^>]+content="([^"]*)"');
    var m = html.match(re);
    if (!m) {
      re = new RegExp('<meta[^>]+content="([^"]*)"[^>]+property="og:' + prop + '"');
      m = html.match(re);
    }
    return m ? decodeHtml(m[1]) : '';
  }

  var title = ogValue('title') || mocNum;
  var image = ogValue('image');
  var canonicalUrl = ogValue('url');
  var description = ogValue('description');
  if (html.indexOf(mocNum) === -1) return null;
  if (!title || (title === mocNum && !image && !canonicalUrl)) return null;

  // Try to get h1 as primary name
  var h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  var h1Text = h1 ? decodeHtml(h1[1].replace(/<[^>]+>/g, '')).trim() : '';

  // Designer link: /users/{slug}/mocs/
  var designerMatch = html.match(/href="\/users\/([^/]+)\/mocs\/"[^>]*>([^<]+)</);
  var designer = designerMatch ? decodeHtml(designerMatch[2]).trim() : '';
  var designerSlug = designerMatch ? designerMatch[1] : '';

  // Parts count: try multiple patterns
  var partsMatch = html.match(/(\d[\d,]*)\s*Parts?\b/i);
  var parts = partsMatch ? parseInt(partsMatch[1].replace(/,/g, ''), 10) : 0;

  // Year
  var yearMatch = html.match(/Year[^<>]*<[^>]*>\s*(\d{4})/i) ||
                  html.match(/\b(20\d{2}|19\d{2})\b\s*(?:LEGO|Year)/i);
  var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

  var data = {
    mocNum: mocNum,
    name: h1Text || title,
    title: title,
    image: image,
    canonicalUrl: canonicalUrl,
    description: description,
    designer: designer,
    designerSlug: designerSlug,
    parts: parts,
    year: year,
  };

  cache[mocNum] = { t: Date.now(), data: data };
  saveCache(DETAIL_CACHE_KEY, cache);
  return data;
}
