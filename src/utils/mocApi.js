// Rebrickable MOC scraper. There is no public MOC API, so we scrape
// rebrickable.com/mocs/ HTML via a chain of CORS proxies and parse the
// `.set-tn` cards. Results are cached in localStorage for a short window.

var CACHE_KEY = 'lego_moc_cache';
var CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
var DETAIL_CACHE_KEY = 'lego_moc_detail_cache';
var DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 1 day

var CORS_PROXIES = [
  function(u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); },
  function(u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
  function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
  function(u) { return 'https://thingproxy.freeboard.io/fetch/' + u; },
  function(u) { return 'https://cors.eu.org/' + u; },
];
var FETCH_TIMEOUT_MS = 12000;

function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); }
  catch (e) { return {}; }
}
function saveCache(key, c) {
  try { localStorage.setItem(key, JSON.stringify(c)); } catch (e) {}
}

function fetchWithTimeout(url, ms) {
  if (typeof AbortController === 'undefined') return fetch(url);
  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, ms);
  return fetch(url, { method: 'GET', signal: ctrl.signal })
    .finally(function() { clearTimeout(timer); });
}

async function fetchHtml(url) {
  for (var i = 0; i < CORS_PROXIES.length; i++) {
    try {
      var res = await fetchWithTimeout(CORS_PROXIES[i](url), FETCH_TIMEOUT_MS);
      if (!res.ok) continue;
      var text = await res.text();
      if (text && text.length > 0) return text;
    } catch (e) { /* try next */ }
  }
  return null;
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

// Parse `.set-tn` blocks (MOC cards) from HTML
function parseMocCards(html) {
  var cards = [];
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

    var variantMatch = chunk.match(/data-variant="(\d+)"/);
    var variant = variantMatch ? variantMatch[1] : null;

    var hrefMatch = chunk.match(/href="(\/mocs\/MOC-[^"]+)"/);
    var href = hrefMatch ? hrefMatch[1] : null;
    var mocNum = null;
    if (href) {
      var nm = href.match(/MOC-(\d+)/);
      if (nm) mocNum = 'MOC-' + nm[1];
    }
    if (!mocNum) continue;

    var imgMatch = chunk.match(/<img[^>]+src="([^"]+)"/);
    var img = imgMatch ? imgMatch[1] : '';
    if (img && img.indexOf('//') === 0) img = 'https:' + img;

    var nameMatch = chunk.match(/data-set_name="([^"]*)"/) ||
                    chunk.match(/title="([^"]*)"/) ||
                    chunk.match(/<a[^>]+href="\/mocs\/[^"]+">\s*([^<]+)\s*</);
    var name = nameMatch ? decodeHtml(nameMatch[1]).trim() : mocNum;

    var designerMatch = chunk.match(/href="\/users\/([^/]+)\/mocs\/"[^>]*>([^<]+)</);
    var designer = designerMatch ? decodeHtml(designerMatch[2]).trim() : '';
    var designerSlug = designerMatch ? designerMatch[1] : '';

    var partsMatch = chunk.match(/data-num_parts="(\d+)"/);
    var parts = partsMatch ? parseInt(partsMatch[1], 10) : 0;

    var yearMatch = chunk.match(/data-year="(\d+)"/);
    var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    var likesMatch = chunk.match(/data-likes="(\d+)"/);
    var likes = likesMatch ? parseInt(likesMatch[1], 10) : 0;

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
      href: href,
    });
  }
  return cards;
}

function parseTotalCount(html) {
  var m = html.match(/(\d[\d,]*)\s*MOCs?/i);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  return 0;
}

function parseThemes(html) {
  var sel = html.match(/<select[^>]+name="top_theme"[^>]*>([\s\S]*?)<\/select>/);
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

export async function searchMocs(opts) {
  opts = opts || {};
  var params = [];
  if (opts.q) params.push('q=' + encodeURIComponent(opts.q));
  if (opts.theme) params.push('top_theme=' + encodeURIComponent(opts.theme));
  if (opts.sort) params.push('sort=' + encodeURIComponent(opts.sort));
  if (opts.minYear) params.push('min_year=' + opts.minYear);
  if (opts.maxYear) params.push('max_year=' + opts.maxYear);
  if (opts.minParts) params.push('min_parts=' + opts.minParts);
  if (opts.maxParts) params.push('max_parts=' + opts.maxParts);
  if (opts.page && opts.page > 1) params.push('page=' + opts.page);
  params.push('get_drill_downs=1');

  var qs = params.join('&');
  var url = 'https://rebrickable.com/mocs/?' + qs;

  var cache = loadCache(CACHE_KEY);
  var entry = cache[qs];
  if (entry && entry.t && (Date.now() - entry.t) < CACHE_TTL_MS) {
    return entry.data;
  }

  var html = await fetchHtml(url);
  if (!html) {
    return { results: [], total: 0, themes: [] };
  }
  var results = parseMocCards(html);
  var total = parseTotalCount(html);
  var themes = parseThemes(html);
  var data = { results: results, total: total, themes: themes };

  cache[qs] = { t: Date.now(), data: data };
  saveCache(CACHE_KEY, cache);
  return data;
}

export async function getMocDetail(mocNum) {
  if (!mocNum) return null;
  var cache = loadCache(DETAIL_CACHE_KEY);
  var entry = cache[mocNum];
  if (entry && entry.t && (Date.now() - entry.t) < DETAIL_CACHE_TTL_MS) {
    return entry.data;
  }

  var url = 'https://rebrickable.com/mocs/' + mocNum + '/';
  var html = await fetchHtml(url);
  if (!html) return null;

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

  var h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  var h1Text = h1 ? decodeHtml(h1[1].replace(/<[^>]+>/g, '')).trim() : '';

  var designerMatch = html.match(/href="\/users\/([^/]+)\/mocs\/"[^>]*>([^<]+)</);
  var designer = designerMatch ? decodeHtml(designerMatch[2]).trim() : '';
  var designerSlug = designerMatch ? designerMatch[1] : '';

  var partsMatch = html.match(/(\d[\d,]*)\s*Parts?\b/i);
  var parts = partsMatch ? parseInt(partsMatch[1].replace(/,/g, ''), 10) : 0;

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
