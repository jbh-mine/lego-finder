import { translateMocSearchQuery } from './searchDict';

export const MOC_SEARCH_SITE = 'rebrickable.com/mocs/MOC-';

export function normalizeMocWebQuery(rawQuery) {
  const raw = String(rawQuery || '').trim();
  if (!raw) return '';
  const number = raw.match(/^(?:moc[\s_-]*)?(\d+)$/i);
  return number ? 'MOC-' + number[1] : translateMocSearchQuery(raw).trim();
}

export function buildMocWebQuery(rawQuery) {
  // The scope belongs to the application, including when this is called
  // again by Google's starting callback during pagination.
  const withoutSites = String(rawQuery || '').replace(/(?:^|\s)-?site:\S+/gi, ' ').trim();
  const query = normalizeMocWebQuery(withoutSites);
  return 'site:' + MOC_SEARCH_SITE + (query ? ' ' + query : '');
}

export function getMocWebSearchUrl(rawQuery) {
  return 'https://www.google.com/search?' + new URLSearchParams({ q: buildMocWebQuery(rawQuery) }).toString();
}

export function isMocSearchEngineId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9_-]{8,}(?::[A-Za-z0-9_-]+)?$/.test(id) &&
    !/^(?:your[_-]?|placeholder|example|test[_-]?|undefined|null)/i.test(id);
}
