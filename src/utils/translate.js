var CACHE_KEY = 'lego_name_translations';
var API_URL = 'https://api.mymemory.translated.net/get';
var pendingRequests = {};

function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch(e) { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch(e) {}
}

export function getCachedTranslation(name) {
  if (!name) return null;
  var cache = getCache();
  return cache[name] || null;
}

export async function translateName(name) {
  if (!name) return name;
  var cached = getCachedTranslation(name);
  if (cached) return cached;
  if (pendingRequests[name]) return pendingRequests[name];
  pendingRequests[name] = (async function() {
    try {
      var res = await fetch(API_URL + '?q=' + encodeURIComponent(name) + '&langpair=en|ko');
      var data = await res.json();
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        var translated = data.responseData.translatedText;
        if (translated.toLowerCase() !== name.toLowerCase()) {
          var cache = getCache();
          cache[name] = translated;
          saveCache(cache);
          return translated;
        }
      }
    } catch(e) {}
    return name;
  })();
  var result = await pendingRequests[name];
  delete pendingRequests[name];
  return result;
}
