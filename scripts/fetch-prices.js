const https = require('https');
const fs = require('fs');
const path = require('path');

const PRICES_FILE = path.join(__dirname, '../src/data/prices.json');
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

async function main() {
  const args = process.argv.slice(2);
  let setsToFetch = args;
  let refreshAll = false;

  if (args.length === 1 && args[0] === '--refresh') {
    refreshAll = true;
    const existing = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
    setsToFetch = Object.keys(existing.prices);
  } else if (setsToFetch.length === 0) {
    console.log('Usage: node fetch-prices.js <setNum1> <setNum2> ... OR node fetch-prices.js --refresh');
    process.exit(0);
  }

  let data = { meta: { lastUpdated: new Date().toISOString().split('T')[0], currency: 'KRW', source: 'lego.com/ko-kr' }, prices: {} };
  
  if (fs.existsSync(PRICES_FILE)) {
    data = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
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
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
