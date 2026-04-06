import priceData from '../data/prices.json';

var EXCHANGE_RATE_CACHE_KEY = 'lego_exchange_rate';
var EXCHANGE_RATE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Get cached KRW price from pre-built database
function getKrwPrice(setNum) {
  var num = setNum.replace(/-\d+$/, '');
  var entry = priceData.prices[num];
  if (!entry) return null;
  if (entry.discontinued) return { price: 0, discontinued: true, name: entry.name };
  if (entry.price > 0) return { price: entry.price, discontinued: false, name: entry.name };
  return null;
}

// Format number as KRW
function formatKRW(price) {
  if (!price || price <= 0) return null;
  return String.fromCharCode(8361) + price.toLocaleString('ko-KR');
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

export { getKrwPrice, formatKRW, getExchangeRate, convertUsdToKrw, getLegoKrProductUrl };
