const https = require('https');
const fs = require('fs');
const path = require('path');

const PRICES_FILE = path.join(__dirname, '../src/data/prices.json');
const HISTORY_DIR = path.join(__dirname, '../src/data/prices-history');
const INDEX_FILE = path.join(__dirname, '../src/data/priceHistoryIndex.json');
const RATE_LIMIT_MS = 1000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, maxRedirects: 5 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    }).on('error', reject);
  });
}

function extractJsonLd(html) {
  const match = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    const json = JSON.parse(match[1]);
    if (json.offers && json.offers.price && json.offers.priceCurrency === 'KRW') {
      return { price: parseInt(json.offers.price), currency: 'KRW' };
    }
  } catch(e) {}
  return null;
}

async function fetchPrice(setNum) {
  try {
    const searchUrl = `https://www.lego.com/ko-kr/search?q=${setNum}`;
    const result = await fetchUrl(searchUrl);
    const priceData = extractJsonLd(result.body);
    if (priceData) {
      return priceData.price;
    }
    return null;
  } catch(e) {
    console.error(`Error fetching price for ${setNum}:`, e.message);
    return null;
  }
}

// Write a daily snapshot of the current prices.json to prices-history/<date>.json
// and rebuild priceHistoryIndex.json from ALL snapshots in the directory.
// Wrapped to be non-fatal so the existing pipeline never breaks.
function writeSnapshotAndIndex(data) {
  try {
    if (!fs.existsSync(HISTORY_DIR)) {
      fs.mkdirSync(HISTORY_DIR, { recursive: true });
    }
    const today = new Date().toISOString().split('T')[0];
    const snapshot = { date: today, source: 'lego.com/ko-kr', prices: {} };
    const prices = data.prices || {};
    Object.keys(prices).forEach(function(k) {
      const e = prices[k];
      if (e && typeof e.price === 'number' && e.price > 0) {
        snapshot.prices[k] = e.price;
      }
    });
    fs.writeFileSync(
      path.join(HISTORY_DIR, today + '.json'),
      JSON.stringify(snapshot, null, 2) + '\n'
    );

    // Rebuild aggregated index from every snapshot file.
    const files = fs.readdirSync(HISTORY_DIR)
      .filter(function(f) { return /^\d{4}-\d{2}-\d{2}\.json$/.test(f); })
      .sort();

    const seriesMap = {};
    files.forEach(function(f) {
      try {
        const snap = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), 'utf8'));
        const d = snap.date || f.replace(/\.json$/, '');
        const sp = snap.prices || {};
        Object.keys(sp).forEach(function(k) {
          const p = sp[k];
          if (typeof p !== 'number' || p <= 0) return;
          if (!seriesMap[k]) seriesMap[k] = [];
          seriesMap[k].push({ d: d, p: p });
        });
      } catch (e) {
        console.warn('Skipping invalid snapshot ' + f + ': ' + e.message);
      }
    });

    // Compact: keep first/last anchors but drop interior consecutive duplicate prices.
    const compactSeries = {};
    Object.keys(seriesMap).forEach(function(k) {
      const arr = seriesMap[k].sort(function(a, b) { return a.d < b.d ? -1 : 1; });
      if (arr.length <= 2) { compactSeries[k] = arr; return; }
      const out = [arr[0]];
      for (let i = 1; i < arr.length - 1; i++) {
        if (arr[i].p !== arr[i - 1].p || arr[i].p !== arr[i + 1].p) {
          out.push(arr[i]);
        }
      }
      out.push(arr[arr.length - 1]);
      compactSeries[k] = out;
    });

    const index = {
      generated: new Date().toISOString().split('T')[0],
      snapshotCount: files.length,
      series: compactSeries
    };
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2) + '\n');
    console.log('Wrote snapshot ' + today + '.json and rebuilt priceHistoryIndex.json (' + files.length + ' snapshots).');
  } catch (e) {
    console.warn('writeSnapshotAndIndex failed (non-fatal): ' + e.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let setsToFetch = args;
  let refreshAll = false;
  let snapshotOnly = false;

  if (args.length === 1 && args[0] === '--refresh') {
    refreshAll = true;
    const existing = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
    setsToFetch = Object.keys(existing.prices);
  } else if (args.length === 1 && args[0] === '--snapshot-only') {
    snapshotOnly = true;
  } else if (setsToFetch.length === 0) {
    console.log('Usage: node fetch-prices.js <setNum1> <setNum2> ... | --refresh | --snapshot-only');
    process.exit(0);
  }

  let data = { meta: { lastUpdated: new Date().toISOString().split('T')[0], currency: 'KRW', source: 'lego.com/ko-kr' }, prices: {} };

  if (fs.existsSync(PRICES_FILE)) {
    data = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
  }

  if (snapshotOnly) {
    writeSnapshotAndIndex(data);
    return;
  }

  for (let i = 0; i < setsToFetch.length; i++) {
    const setNum = setsToFetch[i];
    if (!setNum) continue;

    console.log(`[${i + 1}/${setsToFetch.length}] Fetching price for ${setNum}...`);
    const price = await fetchPrice(setNum);

    if (price) {
      console.log(`  -> KRW ${price.toLocaleString()}`);
      if (!data.prices[setNum]) data.prices[setNum] = {};
      data.prices[setNum].price = price;
    } else {
      console.log(`  -> Not found or no price data`);
      if (!data.prices[setNum]) data.prices[setNum] = { price: 0 };
    }

    if (i < setsToFetch.length - 1) {
      await delay(RATE_LIMIT_MS);
    }
  }

  data.meta.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(PRICES_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nPrices saved to ${PRICES_FILE}`);

  // Write daily snapshot + rebuild aggregated index (non-fatal).
  writeSnapshotAndIndex(data);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
