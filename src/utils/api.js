import axios from 'axios';
import { REBRICKABLE_PROXY } from '../config/proxyConfig';
import { staticCatalogRequest } from './staticCatalog';

const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

async function cachedRequest(path, params = {}) {
  const key = path + '?' + JSON.stringify(params);
  const existing = cache.get(key);
  if (existing && Date.now() - existing.timestamp < CACHE_DURATION) return existing.promise;

  const promise = (async () => {
    // An explicitly configured private Worker can supply fresh API data.
    // The default Pages deployment reads its own official CSV snapshot instead
    // of exposing an API key to unreliable public CORS proxies.
    if (REBRICKABLE_PROXY) {
      try {
        const response = await axios.get(REBRICKABLE_PROXY.replace(/\/$/, '') + '/api' + path, {
          params, timeout: 8000,
        });
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const isList = path.split('/').filter(Boolean).length === 1 ||
          /\/(?:parts|minifigs|colors)\/$/.test(path);
        if (!data || typeof data !== 'object' || (isList && !Array.isArray(data.results))) {
          throw new Error('Invalid catalog response from configured Worker');
        }
        return data;
      } catch (error) {
        // A temporary Worker outage must not disable the published catalog.
      }
    }
    return staticCatalogRequest(path, params);
  })().catch(error => { cache.delete(key); throw error; });
  cache.set(key, { timestamp: Date.now(), promise });
  return promise;
}

export function searchSets(query, page = 1, pageSize = 20) {
  return cachedRequest('/sets/', { search: query, page, page_size: pageSize, ordering: '-year' });
}

export function getSetDetail(setNum) {
  return cachedRequest('/sets/' + encodeURIComponent(setNum) + '/');
}

export function getSetParts(setNum, page = 1, pageSize = 50) {
  return cachedRequest('/sets/' + encodeURIComponent(setNum) + '/parts/', { page, page_size: pageSize });
}

export function getSetMinifigs(setNum) {
  return cachedRequest('/sets/' + encodeURIComponent(setNum) + '/minifigs/');
}

export function getThemes(page = 1, pageSize = 200) {
  return cachedRequest('/themes/', { page, page_size: pageSize, ordering: 'name' });
}

export function getSetsByTheme(themeId, page = 1, pageSize = 20) {
  return filterSets({ themeId, page, pageSize });
}

export function getSetsByYear(minYear, maxYear, page = 1, pageSize = 20) {
  return filterSets({ minYear, maxYear, page, pageSize });
}

export function filterSets({ search, themeId, minYear, maxYear, page = 1, pageSize = 20, ordering = '-year' }) {
  const params = { page, page_size: pageSize, ordering };
  if (search) params.search = search;
  if (themeId) params.theme_id = themeId;
  if (minYear) params.min_year = minYear;
  if (maxYear) params.max_year = maxYear;
  return cachedRequest('/sets/', params);
}

export function searchParts(query, page = 1, pageSize = 20, partCatId = null) {
  const params = { search: query, page, page_size: pageSize, ordering: 'name' };
  if (partCatId) params.part_cat_id = partCatId;
  return cachedRequest('/parts/', params);
}

export function getPartDetail(partNum) {
  return cachedRequest('/parts/' + encodeURIComponent(partNum) + '/');
}

export function getPartColors(partNum) {
  return cachedRequest('/parts/' + encodeURIComponent(partNum) + '/colors/', { page_size: 1000 });
}

export function getPartCategories() {
  return cachedRequest('/part_categories/', { page_size: 1000, ordering: 'name' });
}

export function getColors() {
  return cachedRequest('/colors/', { page_size: 1000, ordering: 'name' });
}
