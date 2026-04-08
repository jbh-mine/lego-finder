import priceData from '../data/prices.json';

var EXCHANGE_RATE_CACHE_KEY = 'lego_exchange_rate';
var EXCHANGE_RATE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Get cached KRW price from pre-built database (sync - KRW only)
function getKrwPrice(setNum) {
  var num = setNum.replace(/-\d+$/, '');
  var entry = priceData.prices[num];
  if (!entry) return null;
  if (entry.discontinued) return { price: 0, discontinued: true, name: entry.name };
  if (entry.price > 0) {
    return {
      price: entry.price,
      discontinued: false,
      name: entry.name,
      priceFromUsd: !!entry.priceFromUsd,
      fromUsd: entry.usd || null,
      year: entry.year || null,
    };
  }
  return null;
}

// Get price async (handles both KRW and USD conversion for BDP products)
async function getKrwPriceAsync(setNum) {
  var num = setNum.replace(/-\d+$/, '');
  var entry = priceData.prices[num];
  if (!entry) return null;
  if (entry.discontinued) return { price: 0, discontinued: true, name: entry.name };
  if (entry.price > 0) {
    return {
      price: entry.price,
      discontinued: false,
      name: entry.name,
      priceFromUsd: !!entry.priceFromUsd,
      fromUsd: entry.usd || null,
      year: entry.year || null,
      source: entry.source || null,
    };
  }
  if (entry.usd > 0) {
    var rate = await getExchangeRate();
    var krw = Math.round(entry.usd * rate);
    return { price: krw, discontinued: false, name: entry.name, fromUsd: entry.usd, source: entry.source || 'usd' };
  }
  return null;
}

// Format number as KRW
function formatKRW(price) {
  if (!price || price <= 0) return null;
  return String.fromCharCode(8361) + price.toLocaleString('ko-KR');
}

// Format USD
function formatUSD(price) {
  if (!price || price <= 0) return null;
  return '$' + price.toFixed(2);
}

// Fetch USD to KRW exchange rate
async function getExchangeRate() {
  try {
    var cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cached) {
      var data = JSON.parse(cached);
      if (Date.now() - data.timestamp < EXCHANGE_RATE_TTL) {
        return data.rate;
      }
    }
  } catch(e) {}

  try {
    var res = await fetch('https://open.er-api.com/v6/latest/USD');
    var json = await res.json();
    var rate = json.rates.KRW;
    try {
      localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({ rate: rate, timestamp: Date.now() }));
    } catch(e) {}
    return rate;
  } catch(e) {
    return 1450; // fallback rate
  }
}

// Convert USD to KRW
async function convertUsdToKrw(usdAmount) {
  var rate = await getExchangeRate();
  return Math.round(usdAmount * rate);
}

// Get LEGO Korea product page URL
function getLegoKrProductUrl(setNum) {
  var num = setNum.replace(/-\d+$/, '');
  return 'https://www.lego.com/ko-kr/search?q=' + num;
}

export { getKrwPrice, getKrwPriceAsync, formatKRW, formatUSD, getExchangeRate, convertUsdToKrw, getLegoKrProductUrl };
