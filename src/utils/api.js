import axios from 'axios';
import { REBRICKABLE_PROXY } from '../config/proxyConfig';

const API_BASE = 'https://rebrickable.com/api/v3/lego';
const API_KEY = '7ee3e42b99c4d05555120e3fd43e6d11';

// Rebrickable enabled Cloudflare challenges, so direct browser access is blocked.
// We route through public CORS proxies and pass the API key as a query string
// (avoids CORS preflight that some proxies reject).
//
// If REBRICKABLE_PROXY (a deployed Cloudflare Worker) is configured, we prefer
// it as the FIRST entry in the chain. The Worker injects the API key on the
// server side, so when going through the Worker we strip the key from the URL
// to keep it out of browser-side caches and Cloudflare logs.
const CORS_PROXIES = [
  function (u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); },
  function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
  function (u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
];

function buildApiUrl(path, params) {
  var qs = Object.assign({}, params || {}, { key: API_KEY });
  var parts = [];
  Object.keys(qs).forEach(function (k) {
    if (qs[k] !== undefined && qs[k] !== null && qs[k] !== '') {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(qs[k]));
    }
  });
  var sep = path.indexOf('?') >= 0 ? '&' : '?';
  return API_BASE + path + sep + parts.join('&');
}

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

async function cachedRequest(path, params = {}) {
  const cacheKey = `${path}?${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const apiUrl = buildApiUrl(path, params);

  // Build the ordered fetch attempts. If a Worker proxy is configured,
  // prefer it (key is hidden, no CORS challenges, edge-cached). On failure
  // we still fall back to the public CORS proxy chain.
  const attempts = [];
  if (REBRICKABLE_PROXY) {
    var workerBase = REBRICKABLE_PROXY.replace(/\/$/, '');
    var sep = path.indexOf('?') >= 0 ? '&' : '?';
    var workerQs = [];
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        workerQs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      }
    });
    var workerUrl = workerBase + '/api' + path + (workerQs.length ? sep + workerQs.join('&') : '');
    attempts.push(workerUrl);
  }
  for (var pi = 0; pi < CORS_PROXIES.length; pi++) {
    attempts.push(CORS_PROXIES[pi](apiUrl));
  }

  // Try each attempt until one succeeds.
  let lastErr = null;
  for (let i = 0; i < attempts.length; i++) {
    const proxiedUrl = attempts[i];
    try {
      const response = await axios.get(proxiedUrl, { timeout: 15000 });
      // Some proxies return strings; coerce to object.
      let data = response.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { /* keep as-is */ }
      }
      if (data && typeof data === 'object') {
        cache.set(cacheKey, { data: data, timestamp: Date.now() });
        return data;
      }
      lastErr = new Error('Invalid response from proxy ' + i);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All CORS proxies failed');
}

export async function searchSets(query, page = 1, pageSize = 20) {
  return cachedRequest('/sets/', {
    search: query,
    page,
    page_size: pageSize,
    ordering: '-year',
  });
}

export async function getSetDetail(setNum) {
  return cachedRequest(`/sets/${setNum}/`);
}

export async function getSetParts(setNum, page = 1, pageSize = 50) {
  return cachedRequest(`/sets/${setNum}/parts/`, {
    page,
    page_size: pageSize,
  });
}

export async function getSetMinifigs(setNum) {
  return cachedRequest(`/sets/${setNum}/minifigs/`);
}

export async function getThemes(page = 1, pageSize = 200) {
  return cachedRequest('/themes/', {
    page,
    page_size: pageSize,
    ordering: 'name',
  });
}

export async function getSetsByTheme(themeId, page = 1, pageSize = 20) {
  return cachedRequest('/sets/', {
    theme_id: themeId,
    page,
    page_size: pageSize,
    ordering: '-year',
  });
}

export async function getSetsByYear(minYear, maxYear, page = 1, pageSize = 20) {
  return cachedRequest('/sets/', {
    min_year: minYear,
    max_year: maxYear,
    page,
    page_size: pageSize,
    ordering: '-year',
  });
}

export async function filterSets({ search, themeId, minYear, maxYear, page = 1, pageSize = 20, ordering = '-year' }) {
  const params = {
    page,
    page_size: pageSize,
    ordering: ordering,
  };
  if (search) params.search = search;
  if (themeId) params.theme_id = themeId;
  if (minYear) params.min_year = minYear;
  if (maxYear) params.max_year = maxYear;

  return cachedRequest('/sets/', params);
}

// Parts API
export async function searchParts(query, page = 1, pageSize = 20, partCatId = null) {
  const params = {
    search: query,
    page,
    page_size: pageSize,
    ordering: 'name',
  };
  if (partCatId) params.part_cat_id = partCatId;
  return cachedRequest('/parts/', params);
}

export async function getPartDetail(partNum) {
  return cachedRequest(`/parts/${partNum}/`);
}

export async function getPartColors(partNum) {
  return cachedRequest(`/parts/${partNum}/colors/`, { page_size: 200 });
}

export async function getPartCategories() {
  return cachedRequest('/part_categories/', { page_size: 200, ordering: 'name' });
}

export async function getColors() {
  return cachedRequest('/colors/', { page_size: 200, ordering: 'name' });
}
