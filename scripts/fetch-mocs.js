#!/usr/bin/env node
/**
 * fetch-mocs.js
 *
 * Pre-scrapes the default MOC listing views from rebrickable.com so the
 * MocsPage has reliable, instant data even when the runtime CORS proxy
 * chain is unavailable.
 *
 * Output: src/data/mocsStatic.json
 *
 * Pre-scraped views (each = 1 page, ~30 results):
 *   - hottest    (no sort param)
 *   - newest     (sort=-published)
 *   - mostLiked  (sort=-likes)
 *   - mostParts  (sort=-num_parts)
 *
 * Usage:
 *   node scripts/fetch-mocs.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, '../src/data/mocsStatic.json');
const RATE_LIMIT_MS = 1500;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const VIEWS = [
  { key: 'hottest',   sort: '' },
  { key: 'newest',    sort: '-published' },
  { key: 'mostLiked', sort: '-likes' },
  { key: 'mostParts', sort: '-num_parts' },
];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchUrl(url, redirects) {
  if (redirects === undefined) redirects = 5;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } }, (res) => {
      if ([301, 302, 303, 307, 308].indexOf(res.statusCode) !== -1 && res.headers.location && redirects > 0) {
        const next = res.headers.location.indexOf('http') === 0
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        res.resume();
        return fetchUrl(next, redirects - 1).then(resolve, reject);
      }
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function decodeHtml(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

// Mirror of src/utils/mocApi.js parseMocCards (kept in sync with that file).
function parseMocCards(html) {
  const cards = [];
  const openRe = /<div[^>]*class="[^"]*\bset-tn\b[^"]*"[^>]*>/g;
  const matches = [];
  let m;
  while ((m = openRe.exec(html)) !== null) matches.push(m.index);

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i];
    const end = (i + 1 < matches.length) ? matches[i + 1] : Math.min(start + 6000, html.length);
    const chunk = html.slice(start, end);

    const variantMatch = chunk.match(/data-variant="(\d+)"/);
    const variant = variantMatch ? variantMatch[1] : null;

    const hrefMatch = chunk.match(/href="(\/mocs\/MOC-[^"]+)"/);
    const href = hrefMatch ? hrefMatch[1] : null;
    let mocNum = null;
    if (href) {
      const nm = href.match(/MOC-(\d+)/);
      if (nm) mocNum = 'MOC-' + nm[1];
    }
    if (!mocNum) continue;

    let img = '';
    const dataSrcMatch = chunk.match(/<img[^>]+\bdata-src="([^"]+)"/i) ||
                         chunk.match(/<img[^>]+\bdata-original="([^"]+)"/i) ||
                         chunk.match(/<img[^>]+\bdata-lazy="([^"]+)"/i);
    if (dataSrcMatch) {
      img = dataSrcMatch[1];
    } else {
      const srcsetMatch = chunk.match(/<img[^>]+srcset="([^"\s]+)/i);
      if (srcsetMatch) img = srcsetMatch[1];
    }
    if (!img) {
      const srcRe = /<img[^>]+src="([^"]+)"/g;
      let sm;
      while ((sm = srcRe.exec(chunk)) !== null) {
        if (sm[1].indexOf('data:') !== 0 && sm[1].indexOf('blank.gif') === -1) {
          img = sm[1]; break;
        }
      }
    }
    if (!img) {
      const cdnMatch = chunk.match(/https?:\/\/cdn\.rebrickable\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i) ||
                       chunk.match(/\/\/cdn\.rebrickable\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i) ||
                       chunk.match(/\/media\/thumbs\/mocs\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i);
      if (cdnMatch) img = cdnMatch[0];
    }
    if (img && img.indexOf('//') === 0) img = 'https:' + img;
    if (img && img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = 'https://rebrickable.com' + img;
    if (img && img.indexOf('data:') === 0) img = '';

    const nameMatch = chunk.match(/data-set_name="([^"]*)"/) ||
                      chunk.match(/title="([^"]*)"/) ||
                      chunk.match(/<a[^>]+href="\/mocs\/[^"]+">\s*([^<]+)\s*</);
    const name = nameMatch ? decodeHtml(nameMatch[1]).trim() : mocNum;

    const designerMatch = chunk.match(/href="\/users\/([^/]+)\/mocs\/"[^>]*>([^<]+)</);
    const designer = designerMatch ? decodeHtml(designerMatch[2]).trim() : '';
    const designerSlug = designerMatch ? designerMatch[1] : '';

    const partsMatch = chunk.match(/data-num_parts="(\d+)"/);
    const parts = partsMatch ? parseInt(partsMatch[1], 10) : 0;

    const yearMatch = chunk.match(/data-year="(\d+)"/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    const likesMatch = chunk.match(/data-likes="(\d+)"/);
    const likes = likesMatch ? parseInt(likesMatch[1], 10) : 0;

    const themeMatch = chunk.match(/data-theme_name="([^"]*)"/);
    const theme = themeMatch ? decodeHtml(themeMatch[1]).trim() : '';

    cards.push({
      mocNum, variant, name, img,
      designer, designerSlug,
      parts, year, likes, theme, href,
    });
  }
  return cards;
}

function parseTotalCount(html) {
  const m = html.match(/(\d[\d,]*)\s*MOCs?/i);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  return 0;
}

function parseThemes(html) {
  const sel = html.match(/<select[^>]+name="top_theme"[^>]*>([\s\S]*?)<\/select>/);
  if (!sel) return [];
  const themes = [];
  const optRe = /<option[^>]+value="([^"]*)"[^>]*>([^<]+)<\/option>/g;
  let m;
  while ((m = optRe.exec(sel[1])) !== null) {
    if (!m[1]) continue;
    themes.push({ value: m[1], name: decodeHtml(m[2]).trim() });
  }
  return themes;
}

async function fetchView(view) {
  const params = ['get_drill_downs=1'];
  if (view.sort) params.push('sort=' + encodeURIComponent(view.sort));
  const url = 'https://rebrickable.com/mocs/?' + params.join('&');
  console.log(`[${view.key}] ${url}`);
  try {
    const res = await fetchUrl(url);
    if (res.statusCode !== 200) {
      console.log(`  -> HTTP ${res.statusCode}`);
      return null;
    }
    const results = parseMocCards(res.body);
    const total = parseTotalCount(res.body);
    const themes = parseThemes(res.body);
    console.log(`  -> ${results.length} cards, total=${total}, themes=${themes.length}`);
    return { results, total, themes };
  } catch (e) {
    console.error(`  -> Error: ${e.message}`);
    return null;
  }
}

async function main() {
  let existing = { meta: {}, views: {}, themes: [] };
  if (fs.existsSync(OUT_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch (e) {}
    if (!existing.views) existing.views = {};
  }

  let aggregateThemes = existing.themes || [];

  for (let i = 0; i < VIEWS.length; i++) {
    const view = VIEWS[i];
    const data = await fetchView(view);
    if (data && data.results.length > 0) {
      existing.views[view.key] = {
        results: data.results,
        total: data.total,
      };
      if (data.themes && data.themes.length > 0) {
        aggregateThemes = data.themes;
      }
    } else {
      console.log(`  -> keeping previous data for ${view.key}`);
    }
    if (i < VIEWS.length - 1) await delay(RATE_LIMIT_MS);
  }

  existing.themes = aggregateThemes;
  existing.meta = {
    lastUpdated: new Date().toISOString(),
    source: 'rebrickable.com/mocs',
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2) + '\n');
  console.log(`\nSaved to ${OUT_FILE}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
