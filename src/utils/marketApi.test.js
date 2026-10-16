import { canonicalMarketSet, fetchMarket, marketFromApi, normalizeMarketServer, saveMarketServer, savedMarketServer, testMarketServer, validateMarketResponse, MARKET_SERVER_KEY } from './marketApi';

const now = Date.parse('2026-10-16T06:00:00Z');
export function fixture(overrides = {}) {
  return { schemaVersion: 1, status: 'fresh', query: { setNum: '21322-1', provider: 'bricklink', condition: 'N', country: 'GLOBAL', currency: 'KRW' },
    observedAt: '2026-10-16T05:40:00Z', expiresAt: '2026-10-16T06:40:00Z', retryAfterSeconds: 0,
    sourceUrl: 'https://www.bricklink.com/v2/catalog/catalogitem.page?S=21322-1',
    current: { value: 100000, basis: 'recent-30d-median', sampleCount: 1, min: 100000, max: 100000, latestPrice: 100000, latestTradeAt: '2026-10-15T00:00:00Z', sixMonthAverage: 90000, sixMonthQuantityAverage: 91000, sixMonthLots: 10, sixMonthUnits: 20, lowestAskingPrice: 110000, askingLots: 3 },
    trades: [{ rowKey: 'a:0', price: 100000, date: '2026-10-15T00:00:00Z', datePrecision: 'timestamp', quantity: 1, sellerCountry: 'US', buyerCountry: 'KR' }],
    history: [{ date: '2026-10-16', observedAt: '2026-10-16T05:40:00Z', price: 100000, basis: 'recent-30d-median', sampleCount: 1, currency: 'KRW', condition: 'N', country: 'GLOBAL', source: 'BrickLink' }],
    quality: { historyKind: 'daily-market-observations', tradeIdentity: 'anonymous-provider-rows', subconditionKnown: false },
    refresh: { state: 'ok', errorCode: null, nextRefreshAt: '2026-10-16T05:50:00Z' }, ...overrides };
}
const scope = { setNum: '21322-1', condition: 'N', country: 'GLOBAL' };
const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data, headers: { get: () => null } });

beforeEach(() => localStorage.clear());
test('server URL accepts HTTPS base paths and local HTTP, rejects secret-bearing and remote HTTP URLs', () => {
  expect(normalizeMarketServer(' https://market.example.com/api/ ')).toBe('https://market.example.com/api');
  expect(normalizeMarketServer('http://localhost:8080')).toBe('http://localhost:8080');
  expect(normalizeMarketServer('http://[::1]:8080')).toBe('http://[::1]:8080');
  ['http://example.com', 'https://user:pass@example.com', 'https://example.com/?key=x', 'https://example.com/#x', 'https://example.com/token/x', 'javascript:alert(1)'].forEach(value => expect(() => normalizeMarketServer(value)).toThrow('INVALID_SERVER_URL'));
  expect(canonicalMarketSet('21322')).toBe('21322-1');
  expect(canonicalMarketSet('21322-2')).toBe('21322-2');
  ['set.name', 'a_b', 'a'.repeat(39), '../x'].forEach(value => expect(() => canonicalMarketSet(value)).toThrow('INVALID_SET_NUMBER'));
});
test('explicit disconnect survives a configured build default', () => {
  const before = process.env.REACT_APP_MARKET_API_URL;
  process.env.REACT_APP_MARKET_API_URL = 'https://default.example.com';
  expect(savedMarketServer()).toBe('https://default.example.com');
  saveMarketServer('');
  expect(localStorage.getItem(MARKET_SERVER_KEY)).toBe('');
  expect(savedMarketServer()).toBe('');
  if (before === undefined) delete process.env.REACT_APP_MARKET_API_URL; else process.env.REACT_APP_MARKET_API_URL = before;
});
test('transport supports any catalog set, exact scope and base path with no credentials', async () => {
  const data = fixture({ query: { ...fixture().query, setNum: '10182-1', condition: 'U', country: 'KR' },
    history: fixture().history.map(row => ({ ...row, condition: 'U', country: 'KR' })), trades: fixture().trades.map(row => ({ ...row, sellerCountry: 'KR' })) });
  const transport = jest.fn().mockResolvedValue(json(data));
  await fetchMarket('https://market.example.com/api', '10182', { condition: 'U', country: 'KR' }, { fetchImpl: transport, refresh: true, now });
  expect(transport).toHaveBeenCalledWith('https://market.example.com/api/v1/market/10182-1?condition=U&country=KR&currency=KRW&refresh=1', expect.objectContaining({ credentials: 'omit', method: 'GET', cache: 'no-store' }));
  expect(transport.mock.calls[0][1].headers).toEqual({ Accept: 'application/json' });
  await expect(fetchMarket('https://market.example.com', '21322', { country: 'US' }, { fetchImpl: transport })).rejects.toMatchObject({ code: 'INVALID_SCOPE' });
});
test('wrong product, scope, currency, future capture and untrusted source never enter the UI', () => {
  [{ query: { ...fixture().query, setNum: '10305-1' } }, { query: { ...fixture().query, condition: 'U' } },
    { query: { ...fixture().query, country: 'KR' } }, { query: { ...fixture().query, currency: 'USD' } },
    { observedAt: '2026-10-17T00:00:00Z' }, { sourceUrl: 'javascript:alert(1)' }, { trades: [{ price: {} }] },
    { history: [null] }, { history: [{ ...fixture().history[0], date: '2026-02-30' }] },
    { current: { ...fixture().current, latestPrice: {} } }]
    .forEach(overrides => expect(() => validateMarketResponse(fixture(overrides), scope, now)).toThrow('INVALID_RESPONSE'));
});
test('expired no-sales is stale, and only daily observations become history in the adapter', () => {
  const data = validateMarketResponse(fixture({ status: 'no-sales', current: { value: null, basis: null, sampleCount: 0 }, expiresAt: '2026-10-16T05:50:00Z' }), scope, now);
  expect(data.status).toBe('stale');
  expect(validateMarketResponse(fixture({ refresh: { state: 'failed' } }), scope, now).status).toBe('stale');
  expect(() => validateMarketResponse(fixture({ status: 'no-sales' }), scope, now)).toThrow('INVALID_RESPONSE');
  expect(() => validateMarketResponse(fixture({ current: { value: null, basis: null, sampleCount: 0 } }), scope, now)).toThrow('INVALID_RESPONSE');
  const market = marketFromApi(fixture(), now);
  expect(market.historicalTrades).toEqual([]);
  expect(market.observationHistory).toEqual(fixture().history);
  expect(market.evidenceKind).toBe('daily-market-observations');
});
test('configuration and quota failures keep their actionable codes and retry times', async () => {
  for (const [status, code] of [[503, 'NOT_CONFIGURED'], [404, 'NOT_FOUND'], [429, 'QUOTA_EXCEEDED']]) {
    await expect(fetchMarket('https://market.example.com', '21322', {}, { fetchImpl: async () => json({ error: { code }, retryAfterSeconds: 900 }, status) }))
      .rejects.toMatchObject({ status, code, retryAfterSeconds: 900 });
  }
  expect(await testMarketServer('https://market.example.com', { fetchImpl: async () => json({ ok: true, schemaVersion: 1, provider: 'bricklink', configured: false }) })).toMatchObject({ configured: false });
});
test('external abort cancels the request instead of presenting a provider error', async () => {
  const controller = new AbortController();
  const promise = fetchMarket('https://market.example.com', '21322', {}, { signal: controller.signal,
    fetchImpl: (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('abort')))) });
  controller.abort();
  await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
});
test('request timeout is bounded and distinguished from caller cancellation', async () => {
  jest.useFakeTimers();
  const promise = fetchMarket('https://market.example.com', '21322', {}, { timeoutMs: 2000,
    fetchImpl: (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('abort')))) });
  const assertion = expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
  jest.advanceTimersByTime(2000);
  await assertion;
  jest.useRealTimers();
});
