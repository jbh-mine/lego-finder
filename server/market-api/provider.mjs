import { createHash } from 'node:crypto';
import { ApiError } from './config.mjs';
import { oauthHeader } from './oauth.mjs';

export const BASE = 'https://api.bricklink.com/api/store/v1';
const DAY = 86400000;
export function price(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (!/^\d+(?:\.\d{1,8})?$/.test(String(value))) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= Number.MAX_SAFE_INTEGER ? number : null;
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
}
export function validateGuide(payload, query) {
  if (!payload || typeof payload !== 'object' || payload.meta?.code !== 200) {
    const code = payload?.meta?.code;
    if (code === 404) throw new ApiError('NOT_FOUND', 'The provider has no matching SET.', 404, 900);
    if (code === 401 || code === 403) throw new ApiError('PROVIDER_AUTH', 'Provider credentials or registered server IP were rejected.');
    throw new ApiError('UPSTREAM_INVALID', 'The provider returned an unsuccessful API response.');
  }
  const data = payload.data;
  if (!data || data.item?.type !== 'SET' || data.item?.no !== query.setNum || data.new_or_used !== query.condition || data.currency_code !== 'KRW' || !Array.isArray(data.price_detail)) {
    throw new ApiError('UPSTREAM_SCOPE_MISMATCH', 'The provider response does not match the requested product, condition or currency.');
  }
  if (['min_price', 'max_price', 'avg_price', 'qty_avg_price'].some(field => price(data[field]) === null) ||
      ['unit_quantity', 'total_quantity'].some(field => !Number.isInteger(data[field]) || data[field] < 0)) {
    throw new ApiError('UPSTREAM_INVALID', 'The provider returned malformed Price Guide statistics.');
  }
  return data;
}
export function normalizeGuides(soldPayload, stockPayload, query, observedAt) {
  const sold = validateGuide(soldPayload, query), stock = validateGuide(stockPayload, query);
  const at = Date.parse(observedAt);
  const counts = new Map();
  const trades = sold.price_detail.flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const value = price(row.unit_price), date = validDate(row.date_ordered) ? Date.parse(row.date_ordered) : NaN;
    if (!Number.isInteger(row.quantity) || row.quantity <= 0 || value === null || value <= 0 || !Number.isFinite(date) || date > at) return [];
    if (query.country === 'KR' && row.seller_country_code !== 'KR') throw new ApiError('UPSTREAM_SCOPE_MISMATCH', 'The provider returned sales outside the requested seller country.');
    const fingerprint = createHash('sha256').update(canonical(row)).digest('hex');
    const ordinal = counts.get(fingerprint) || 0; counts.set(fingerprint, ordinal + 1);
    return [{ rowKey: fingerprint + ':' + ordinal, price: value, date: new Date(date).toISOString(), datePrecision: 'timestamp',
      quantity: row.quantity, sellerCountry: row.seller_country_code || null, buyerCountry: row.buyer_country_code || null }];
  }).sort((a, b) => b.date.localeCompare(a.date) || a.rowKey.localeCompare(b.rowKey));
  if (sold.price_detail.length && !trades.length) throw new ApiError('UPSTREAM_INVALID', 'The provider returned no valid dated sale details.');
  const recent = trades.filter(row => at - Date.parse(row.date) <= 30 * DAY);
  const values = recent.map(row => row.price).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const median = values.length ? values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2 : null;
  const asking = stock.price_detail.map(row => price(row?.unit_price)).filter(value => value !== null && value > 0);
  const aggregate = field => { const value = price(sold[field]); return value > 0 ? value : null; };
  const count = (guide, field) => Number.isInteger(guide[field]) && guide[field] >= 0 ? guide[field] : null;
  return { current: {
    value: median, basis: median === null ? null : 'recent-30d-median', sampleCount: recent.length,
    min: values.length ? values[0] : null, max: values.length ? values[values.length - 1] : null,
    latestPrice: trades[0]?.price ?? null, latestTradeAt: trades[0]?.date ?? null,
    sixMonthAverage: aggregate('avg_price'), sixMonthQuantityAverage: aggregate('qty_avg_price'),
    sixMonthLots: count(sold, 'unit_quantity'), sixMonthUnits: count(sold, 'total_quantity'),
    lowestAskingPrice: price(stock.min_price) > 0 ? price(stock.min_price) : asking.length ? Math.min(...asking) : null, askingLots: count(stock, 'unit_quantity'),
  }, trades, quality: { historyKind: 'daily-market-observations', tradeIdentity: 'anonymous-provider-rows', subconditionKnown: false,
    providerDetailCount: sold.price_detail.length, returnedTradeCount: trades.length, historyComplete: false } };
}

export function createProvider(config, { transport = fetch, now = Date.now } = {}) {
  return {
    async getGuide(query, kind) {
      const url = new URL(BASE + '/items/SET/' + encodeURIComponent(query.setNum) + '/price');
      url.searchParams.set('guide_type', kind); url.searchParams.set('new_or_used', query.condition); url.searchParams.set('currency_code', 'KRW');
      if (query.country === 'KR') url.searchParams.set('country_code', 'KR');
      const authorization = oauthHeader('GET', url, config.credentials, { now: now() });
      let response;
      try { response = await transport(url.href, { headers: { Authorization: authorization, Accept: 'application/json' }, signal: AbortSignal.timeout(config.timeoutMs), redirect: 'error' }); }
      catch (error) { throw new ApiError('UPSTREAM_UNAVAILABLE', 'The provider request failed or timed out.'); }
      if (response.status === 404) throw new ApiError('NOT_FOUND', 'The provider has no matching SET.', 404);
      if (response.status === 401 || response.status === 403) throw new ApiError('PROVIDER_AUTH', 'Provider credentials or registered server IP were rejected.');
      if (response.status === 429) throw new ApiError('UPSTREAM_RATE_LIMITED', 'The provider temporarily limited requests.');
      if (!response.ok) throw new ApiError('UPSTREAM_UNAVAILABLE', 'The provider returned an HTTP error.');
      let text, payload;
      try { text = await response.text(); if (text.length > 5_000_000) throw new Error(); payload = JSON.parse(text); }
      catch (error) { throw new ApiError('UPSTREAM_INVALID', 'The provider returned invalid JSON.'); }
      validateGuide(payload, query);
      return { payload, text };
    },
  };
}
