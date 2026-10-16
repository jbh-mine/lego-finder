import { searchSets, filterSets } from './api';
import { translateSearchQuery, getIpSearchTerms } from './searchDict';

// Collect complete matches before applying client-side filters or sorting.
// Fetching only the first page used to hide older sets and report false zeroes.
export async function collectSetSearch(rawQuery, themeMap, api = { searchSets, filterSets }) {
  const raw = rawQuery.trim();
  if (!raw) return { results: [], count: 0, primaryTheme: null };
  const translated = translateSearchQuery(raw);
  const numeric = /^\d[\d-]*$/.test(translated);
  const terms = numeric ? [translated] : [...new Set([
    translated, ...(getIpSearchTerms(raw) || getIpSearchTerms(translated) || []),
  ].filter(Boolean))];
  const q = translated.toLowerCase();
  const themes = numeric ? [] : Object.keys(themeMap).filter(id => {
    const name = themeMap[id].toLowerCase();
    return name === q || (q.length >= 2 && name.includes(q));
  });
  const requests = [
    ...terms.map(term => api.searchSets(term, 1, 100000)),
    ...themes.map(themeId => api.filterSets({ themeId, page: 1, pageSize: 100000 })),
  ];
  // A failed data source is an error, never a successful empty result.
  const responses = await Promise.all(requests);
  const unique = new Map();
  responses.forEach(response => response.results.forEach(set => unique.set(set.set_num, set)));
  const results = [...unique.values()].sort((a, b) => b.year - a.year || a.set_num.localeCompare(b.set_num));
  return { results, count: results.length, primaryTheme: themes.length ? Number(themes[0]) : null };
}
