#!/usr/bin/env node
/**
 * fetch-images.js
 *
 * Scrape rebrickable.com set pages to collect gallery image IDs for
 * non-BDP (regular) LEGO sets. Output is written to src/data/legoImages.json
 * and loaded at build time by SetDetailPage for multi-image galleries.
 *
 * Usage:
 *   node scripts/fetch-images.js 10294-1 42151-1 75192-1
 *   node scripts/fetch-images.js --refresh        # re-fetch every set currently in legoImages.json
 *   node scripts/fetch-images.js --from-prices    # fetch every set number listed in prices.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, '../src/data/legoImages.json');
const PRICES_FILE = path.join(__dirname, '../src/data/prices.json');
const RATE_LIMIT_MS = 1200;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

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
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, finalUrl: url }));
    }).on('error', reject);
  });
}

/**
 * Rebrickable set page contains <img src="https://cdn.rebrickable.com/media/thumbs/sets/<setNum>/<imageId>.jpg/<size>.jpg">
 * We match all unique image IDs for the given setNum.
 */
function extractRebrickableImageIds(html, setNum) {
  const re = new RegExp('/media/thumbs/sets/' + setNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/(\\d+)\\.jpg/', 'g');
  const ids = [];
  const seen = {};
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!seen[m[1]]) { seen[m[1]] = 1; ids.push(m[1]); }
  }
  return ids;
}

async function fetchImagesForSet(setNum) {
  try {
    const url = `https://rebrickable.com/sets/${setNum}/`;
    const res = await fetchUrl(url);
    if (res.statusCode !== 200) {
      console.log(`  -> HTTP ${res.statusCode}`);
      return [];
    }
    const ids = extractRebrickableImageIds(res.body, setNum);
    return ids;
  } catch (e) {
    console.error(`  -> Error: ${e.message}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);

  let data = { meta: { lastUpdated: '', source: 'rebrickable.com' }, sets: {} };
  if (fs.existsSync(OUT_FILE)) {
    try { data = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch (e) {}
    if (!data.sets) data.sets = {};
    if (!data.meta) data.meta = {};
  }

  let setsToFetch = [];
  if (args.length === 1 && args[0] === '--refresh') {
    setsToFetch = Object.keys(data.sets);
  } else if (args.length === 1 && args[0] === '--from-prices') {
    if (fs.existsSync(PRICES_FILE)) {
      const prices = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
      setsToFetch = Object.keys(prices.prices || {});
    }
  } else if (args.length > 0) {
    setsToFetch = args;
  } else {
    console.log('Usage:');
    console.log('  node scripts/fetch-images.js <setNum> [<setNum> ...]');
    console.log('  node scripts/fetch-images.js --refresh');
    console.log('  node scripts/fetch-images.js --from-prices');
    process.exit(0);
  }

  // Normalize: ensure setNum has -<version>
  setsToFetch = setsToFetch.map(s => (s.indexOf('-') === -1 ? s + '-1' : s));

  for (let i = 0; i < setsToFetch.length; i++) {
    const setNum = setsToFetch[i];
    console.log(`[${i + 1}/${setsToFetch.length}] ${setNum}`);
    const ids = await fetchImagesForSet(setNum);
    if (ids.length > 0) {
      console.log(`  -> ${ids.length} image(s): ${ids.join(', ')}`);
      data.sets[setNum] = ids;
    } else {
      console.log('  -> no images found');
      if (!data.sets[setNum]) data.sets[setNum] = [];
    }
    if (i < setsToFetch.length - 1) await delay(RATE_LIMIT_MS);
  }

  data.meta.lastUpdated = new Date().toISOString().split('T')[0];
  data.meta.source = 'rebrickable.com';
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nSaved to ${OUT_FILE}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
