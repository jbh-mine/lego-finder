export const MARKET_SERVER_KEY = 'lego_market_server_url_v1';
export const MARKET_REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
export const MARKET_POLL_MIN_MS = 60 * 1000;

export class MarketApiError extends Error {
  constructor(code, status = 0, retryAfterSeconds = 0) {
    super(code); this.name = 'MarketApiError'; this.code = code; this.status = status;
    this.retryAfterSeconds = Math.max(0, Number(retryAfterSeconds) || 0);
  }
}

export function normalizeMarketServer(value) {
  if (!String(value || '').trim()) return '';
  try {
    const url = new URL(String(value).trim());
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) || url.username || url.password || url.search || url.hash ||
        /(?:secret|token|api[_-]?key|password|bearer)/i.test(decodeURIComponent(url.pathname))) throw new Error();
    return url.href.replace(/\/+$/, '');
  } catch (error) { throw new MarketApiError('INVALID_SERVER_URL'); }
}

export function savedMarketServer() {
  try { const stored = localStorage.getItem(MARKET_SERVER_KEY); return normalizeMarketServer(stored === null ? process.env.REACT_APP_MARKET_API_URL || '' : stored); }
  catch (error) { return ''; }
}
export function saveMarketServer(value) {
  const server = normalizeMarketServer(value);
  try { localStorage.setItem(MARKET_SERVER_KEY, server); } catch (error) {}
  return server;
}
export function canonicalMarketSet(value) {
  const input = String(value || '').trim();
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/i.test(input)) throw new MarketApiError('INVALID_SET_NUMBER');
  const canonical = /-\d+$/.test(input) ? input : input + '-1';
  if (canonical.length > 40) throw new MarketApiError('INVALID_SET_NUMBER');
  return canonical;
}

function timestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
}
function number(value) { return typeof value === 'number' && Number.isFinite(value); }
function historyRow(row, query, now) {
  if (!row || typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(Date.parse(row.date))) return false;
  return new Date(row.date).toISOString().slice(0, 10) === row.date && timestamp(row.observedAt) &&
    row.observedAt.slice(0, 10) === row.date && Date.parse(row.observedAt) <= now + 60000 &&
    number(row.price) && row.price > 0 && row.basis === 'recent-30d-median' && row.source === 'BrickLink' &&
    row.currency === 'KRW' && row.condition === query.condition && row.country === query.country &&
    Number.isInteger(row.sampleCount) && row.sampleCount > 0;
}

export function validateMarketResponse(data, expected, now = Date.now()) {
  const query = data && data.query;
  if (!data || data.schemaVersion !== 1 || !query || query.setNum !== canonicalMarketSet(expected.setNum) ||
      query.provider !== 'bricklink' || query.condition !== expected.condition || query.country !== expected.country || query.currency !== 'KRW' ||
      !['fresh', 'stale', 'no-sales'].includes(data.status) || !timestamp(data.observedAt) || !timestamp(data.expiresAt) ||
      Date.parse(data.observedAt) > now + 60000 || Date.parse(data.expiresAt) < Date.parse(data.observedAt) ||
      !data.current || !(data.current.value === null || (number(data.current.value) && data.current.value > 0)) ||
      (data.current.value !== null && data.current.basis !== 'recent-30d-median') ||
      (data.status === 'fresh' && (data.current.value === null || data.current.sampleCount < 1)) ||
      (data.status === 'no-sales' && (data.current.value !== null || data.current.sampleCount !== 0 || data.current.basis !== null)) ||
      !Array.isArray(data.trades) || !Array.isArray(data.history) || !data.quality || !data.refresh ||
      data.quality.historyKind !== 'daily-market-observations' || !['ok', 'failed', 'cooldown', 'quota'].includes(data.refresh.state) ||
      !Number.isInteger(data.current.sampleCount) || data.current.sampleCount < 0 ||
      ['min', 'max', 'latestPrice', 'sixMonthAverage', 'sixMonthQuantityAverage', 'sixMonthLots', 'sixMonthUnits', 'lowestAskingPrice', 'askingLots']
        .some(field => data.current[field] != null && (!number(data.current[field]) || data.current[field] < 0)) ||
      (data.current.latestTradeAt != null && !timestamp(data.current.latestTradeAt)) ||
      data.history.some(row => !historyRow(row, query, now)) ||
      data.trades.some(row => !row || !number(row.price) || row.price <= 0 || !timestamp(row.date) ||
        row.datePrecision !== 'timestamp' || typeof row.rowKey !== 'string' || !Number.isInteger(row.quantity) || row.quantity <= 0 ||
        (query.country === 'KR' && row.sellerCountry !== 'KR'))) {
    throw new MarketApiError('INVALID_RESPONSE');
  }
  try {
    const source = new URL(data.sourceUrl);
    if (source.protocol !== 'https:' || !['bricklink.com', 'www.bricklink.com'].includes(source.hostname) || source.username || source.password) throw new Error();
  } catch (error) { throw new MarketApiError('INVALID_RESPONSE'); }
  return { ...data, status: Date.parse(data.expiresAt) <= now || ['failed', 'quota'].includes(data.refresh.state) ? 'stale' : data.status };
}

async function requestJson(server, endpoint, options = {}) {
  const base = normalizeMarketServer(server);
  if (!base) throw new MarketApiError('NOT_CONFIGURED', 503);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal && options.signal.aborted) controller.abort();
  else if (options.signal) options.signal.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs || 20000);
  try {
    const response = await (options.fetchImpl || fetch)(base + endpoint, {
      method: 'GET', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal,
    });
    let data;
    try { data = await response.json(); } catch (error) { throw new MarketApiError('INVALID_RESPONSE', response.status); }
    if (!response.ok) throw new MarketApiError(data.error && data.error.code || 'UPSTREAM_FAILED', response.status,
      data.retryAfterSeconds || (response.headers && response.headers.get('Retry-After')));
    return data;
  } catch (error) {
    if (error instanceof MarketApiError) throw error;
    if (options.signal && options.signal.aborted) { const cancelled = new Error('Cancelled'); cancelled.name = 'AbortError'; throw cancelled; }
    throw new MarketApiError(timedOut ? 'TIMEOUT' : 'CONNECTION_FAILED');
  } finally {
    clearTimeout(timer);
    if (options.signal) options.signal.removeEventListener('abort', abort);
  }
}

export async function testMarketServer(server, options = {}) {
  const data = await requestJson(server, '/health', options);
  if (!data || data.ok !== true || data.schemaVersion !== 1 || data.provider !== 'bricklink' || typeof data.configured !== 'boolean') throw new MarketApiError('INVALID_RESPONSE');
  return data;
}
export async function fetchMarket(server, setNum, scope = {}, options = {}) {
  const query = { setNum: canonicalMarketSet(setNum), condition: scope.condition || 'N', country: scope.country || 'GLOBAL' };
  if (!['N', 'U'].includes(query.condition) || !['GLOBAL', 'KR'].includes(query.country)) throw new MarketApiError('INVALID_SCOPE');
  const params = new URLSearchParams({ condition: query.condition, country: query.country, currency: 'KRW' });
  if (options.refresh) params.set('refresh', '1');
  const data = await requestJson(server, '/v1/market/' + encodeURIComponent(query.setNum) + '?' + params, options);
  return validateMarketResponse(data, query, options.now == null ? Date.now() : options.now);
}

export function marketFromApi(data, now = Date.now()) {
  const current = data.current;
  const trades = data.trades.filter(row => number(row.price) && row.price > 0).map(row => ({ ...row }));
  const market = { ...current, value: current.value, source: 'BrickLink', provider: 'bricklink', sourceUrl: data.sourceUrl,
    observedAt: data.observedAt, expiresAt: data.expiresAt, currency: 'KRW', condition: data.query.condition, country: data.query.country,
    evidenceKind: 'daily-market-observations', basis: current.basis, stale: data.status === 'stale', status: data.status, quality: data.quality,
    trades, historicalTrades: [], observationHistory: data.history, latest: current.latestPrice,
    latestDateLabel: current.latestTradeAt, askingPriceKrw: current.lowestAskingPrice,
    snapshotAgeDays: Math.max(0, Math.floor((now - Date.parse(data.observedAt)) / 86400000)) };
  return market;
}
