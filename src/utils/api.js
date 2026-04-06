import axios from 'axios';

const API_BASE = 'https://rebrickable.com/api/v3/lego';
const API_KEY = '7ee3e42b99c4d05555120e3fd43e6d11';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `key ${API_KEY}`,
  },
});

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

async function cachedRequest(url, params = {}) {
  const cacheKey = `${url}?${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await api.get(url, { params });
  cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response.data;
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

export async function filterSets({ search, themeId, minYear, maxYear, page = 1, pageSize = 20 }) {
  const params = {
    page,
    page_size: pageSize,
    ordering: '-year',
  };
  if (search) params.search = search;
  if (themeId) params.theme_id = themeId;
  if (minYear) params.min_year = minYear;
  if (maxYear) params.max_year = maxYear;

  return cachedRequest('/sets/', params);
}
