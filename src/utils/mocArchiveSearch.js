import { normalizeMocWebQuery } from './mocWebQuery';

export function getMocArchiveSearchUrl(query) {
  var value = normalizeMocWebQuery(query);
  var params = new URLSearchParams();
  if (value) params.set('search', value);
  return 'https://www.moctracker.com/mocs' + (params.toString() ? '?' + params.toString() : '');
}
