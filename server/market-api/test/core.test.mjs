import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { loadConfig, parseQuery, queryKey } from '../config.mjs';
import { oauthHeader } from '../oauth.mjs';
import { createProvider, normalizeGuides, validateGuide } from '../provider.mjs';
import { Store } from '../store.mjs';
import { MarketService } from '../service.mjs';
import { fixture, mockTransport, NOW } from './fixtures.mjs';

const testRoot = fileURLToPath(new URL('../.test-data/', import.meta.url));
function temporary(t, beforeCleanup = () => {}) {
  mkdirSync(testRoot, { recursive: true });
  const directory = mkdtempSync(join(testRoot, 'case-'));
  t.after(() => { beforeCleanup(); assert.equal(dirname(resolve(directory)), resolve(testRoot)); rmSync(directory, { recursive: true, force: true }); });
  return directory;
}
export function testConfig(overrides = {}) {
  return { ...loadConfig({ BRICKLINK_CONSUMER_KEY: 'fixture-consumer', BRICKLINK_CONSUMER_SECRET: 'fixture-secret',
    BRICKLINK_TOKEN_VALUE: 'fixture-token', BRICKLINK_TOKEN_SECRET: 'fixture-token-secret', ADMIN_TOKEN: 'fixture-admin' }), ...overrides };
}
const query = parseQuery('21322');
function environment(t, overrides = {}, transportOptions = {}) {
  const config = testConfig(overrides), store = new Store(':memory:', config), calls = [];
  let clock = NOW;
  const now = () => clock;
  const provider = createProvider(config, { now, transport: mockTransport({ calls, ...transportOptions }) });
  const service = new MarketService(config, store, provider, { now, wait: async milliseconds => { clock += milliseconds; } });
  t.after(async () => { await service.close(); store.close(); });
  return { service, store, calls, config, now, advance: milliseconds => { clock += milliseconds; } };
}

test('safe SET IDs preserve variants and isolate every supported query scope', () => {
  assert.equal(parseQuery('21322').setNum, '21322-1');
  assert.equal(parseQuery('21322-2').setNum, '21322-2');
  assert.notEqual(queryKey(query), queryKey(parseQuery('21322', new URLSearchParams('condition=U'))));
  assert.notEqual(queryKey(query), queryKey(parseQuery('21322', new URLSearchParams('country=KR'))));
  for (const id of ['../secret', '21322/1', "1' OR 1=1", 'A'.repeat(41)]) assert.throws(() => parseQuery(id));
  assert.throws(() => parseQuery('21322', new URLSearchParams('currency=USD')));
  assert.throws(() => parseQuery('21322', new URLSearchParams('condition=N&condition=U')));
});

test('OAuth signature matches the published OAuth 1.0 example and includes query parameters', () => {
  // Public protocol test-vector identifiers; these are not service credentials.
  const credentials = { consumerKey: 'dpf43f3p2l4k3l03', consumerSecret: 'kd94hf93k423kf44', token: 'nnch734d00sl2jdk', tokenSecret: 'pfkkdhi9sl3r4s00' };
  const header = oauthHeader('GET', 'http://photos.example.net/photos?file=vacation.jpg&size=original', credentials,
    { now: 1191242096000, nonce: 'kllo9940pd9333jh' });
  assert.match(header, /oauth_signature="tR3%2BTy81lMeYAr%2FFid0kMTYa%2FWM%3D"/);
  assert.notEqual(header, oauthHeader('GET', 'http://photos.example.net/photos?file=vacation.jpg&size=small', credentials,
    { now: 1191242096000, nonce: 'kllo9940pd9333jh' }));
});

test('Docker secret files preserve spaces, remove only line endings and never override direct environment values', t => {
  const folder = temporary(t), file = join(folder, 'secret');
  writeFileSync(file, ' secret value \r\n');
  const config = loadConfig({ ADMIN_TOKEN_FILE: file, BRICKLINK_CONSUMER_KEY_FILE: file, BRICKLINK_CONSUMER_SECRET_FILE: file,
    BRICKLINK_TOKEN_VALUE_FILE: file, BRICKLINK_TOKEN_SECRET_FILE: file });
  assert.equal(config.adminToken, ' secret value '); assert.equal(config.configured, true);
  assert.equal(loadConfig({ ADMIN_TOKEN: 'direct', ADMIN_TOKEN_FILE: '/missing-secret' }).adminToken, 'direct');
  assert.throws(() => loadConfig({ ADMIN_TOKEN_FILE: '/missing-secret' }), error => !error.message.includes('/missing-secret'));
  assert.throws(() => loadConfig({ CACHE_TTL_SECONDS: '86400' }));
});

test('normalization separates recent unweighted median, old six-month aggregates and asking quotes', () => {
  const data = normalizeGuides(fixture('sold'), fixture('stock'), query, new Date(NOW).toISOString());
  assert.equal(data.current.value, 200); assert.equal(data.current.sampleCount, 3);
  assert.equal(data.current.latestPrice, 100); assert.equal(data.current.sixMonthAverage, 350);
  assert.equal(data.current.sixMonthQuantityAverage, 125); assert.equal(data.current.lowestAskingPrice, 90);
  assert.equal(data.quality.providerDetailCount, 6); assert.equal(data.trades.length, 4);
  assert.equal(new Set(data.trades.map(row => row.rowKey)).size, 4);
  assert.equal(data.trades.filter(row => row.price === 200).length, 2);
  assert.equal(data.quality.tradeIdentity, 'anonymous-provider-rows');
});

test('no recent sales returns a null current value without using six-month averages or stock as sales', () => {
  const sold = fixture('sold'); sold.data.price_detail = sold.data.price_detail.filter(row => row.date_ordered.startsWith('2026-08'));
  const data = normalizeGuides(sold, fixture('stock'), query, new Date(NOW).toISOString());
  assert.equal(data.current.value, null); assert.equal(data.current.basis, null);
  assert.equal(data.current.sixMonthAverage, 350); assert.equal(data.current.lowestAskingPrice, 90);
});

test('HTTP 200 with a JSON authentication failure and wrong response scopes are rejected without echoing sensitive errors', async () => {
  const config = testConfig();
  const provider = createProvider(config, { transport: mockTransport({ respond: () => ({ meta: { code: 401, description: 'SECRET oauth_signature=sensitive' } }) }) });
  await assert.rejects(provider.getGuide(query, 'sold'), error => error.code === 'PROVIDER_AUTH' && !error.message.includes('SECRET'));
  for (const changes of [{ currency_code: 'USD' }, { new_or_used: 'U' }, { item: { no: '10179-1', type: 'SET' } }]) {
    const guide = fixture('sold'); Object.assign(guide.data, changes);
    assert.throws(() => validateGuide(guide, query), error => error.code === 'UPSTREAM_SCOPE_MISMATCH');
  }
  assert.throws(() => normalizeGuides(fixture('sold'), fixture('stock'), parseQuery('21322', new URLSearchParams('country=KR')), new Date(NOW).toISOString()),
    error => error.code === 'UPSTREAM_SCOPE_MISMATCH');
});

test('successful malformed statistics or entirely invalid sold rows fail instead of becoming no-sales', () => {
  const malformed = fixture('sold'); delete malformed.data.avg_price;
  assert.throws(() => validateGuide(malformed, query), error => error.code === 'UPSTREAM_INVALID');
  const undated = fixture('sold'); undated.data.price_detail = [{ quantity: 1, unit_price: '123.0000', date_ordered: '2026-02-30T00:00:00Z' }];
  assert.throws(() => normalizeGuides(undated, fixture('stock'), query, new Date(NOW).toISOString()), error => error.code === 'UPSTREAM_INVALID');
});

test('concurrent requests singleflight, cache TTL and refresh cooldown prevent repeated provider calls', async t => {
  const env = environment(t);
  const responses = await Promise.all([env.service.get(query), env.service.get(query), env.service.get(query)]);
  assert.equal(env.calls.length, 2); assert.equal(responses[0].status, 'fresh');
  assert.equal(responses[0].query.currency, 'KRW');
  assert.equal(env.calls[0].url.searchParams.has('country_code'), false);
  assert.match(env.calls[0].options.headers.Authorization, /^OAuth /);
  assert.equal((await env.service.get(query, { refresh: true })).refresh.state, 'cooldown');
  assert.equal(env.calls.length, 2);
  env.advance(600001);
  await env.service.get(query, { refresh: true });
  assert.equal(env.calls.length, 4); assert.equal(env.store.history(query).length, 1);
});

test('provider starts are serialized at least one second apart across independent scopes', async t => {
  const starts = [];
  const env = environment(t);
  const original = env.service.provider.getGuide;
  env.service.provider.getGuide = (...args) => { starts.push(env.now()); return original(...args); };
  await Promise.all([env.service.get(query), env.service.get(parseQuery('21322', new URLSearchParams('condition=U&country=KR')))]);
  assert.equal(starts.length, 4);
  for (let index = 1; index < starts.length; index++) assert.ok(starts[index] - starts[index - 1] >= 1000);
  assert.equal(env.calls.filter(call => call.url.searchParams.get('country_code') === 'KR').length, 2);
});

test('failed refresh preserves last-good values and timestamps, then removes source data after 24 hours', async t => {
  let failed = false;
  const env = environment(t, {}, { respond: url => failed ? { meta: { code: 401 } } : fixture(url.searchParams.get('guide_type')) });
  const first = await env.service.get(query); failed = true; env.advance(env.config.ttlMs + 1);
  const stale = await env.service.get(query);
  assert.equal(stale.status, 'stale'); assert.equal(stale.observedAt, first.observedAt);
  assert.deepEqual(stale.current, first.current); assert.equal(stale.refresh.state, 'failed'); assert.equal(stale.refresh.errorCode, 'PROVIDER_AUTH');
  const calls = env.calls.length; await env.service.get(query, { refresh: true }); assert.equal(env.calls.length, calls);
  env.advance(86400001);
  await assert.rejects(env.service.get(query), error => error.code === 'PROVIDER_AUTH');
  assert.equal(env.store.get(query).raw_json, null); assert.equal(env.store.get(query).normalized, null);
  assert.equal(env.store.history(query).length, 1);
});

test('a failed manual refresh retries after its 15-minute backoff even inside the previous successful TTL', async t => {
  let failed = false;
  const env = environment(t, {}, { respond: url => failed ? { meta: { code: 401 } } : fixture(url.searchParams.get('guide_type')) });
  const first = await env.service.get(query);
  env.advance(env.config.cooldownMs + 1); failed = true;
  const stale = await env.service.get(query, { refresh: true });
  assert.equal(stale.status, 'stale'); assert.equal(stale.observedAt, first.observedAt);
  assert.equal(env.calls.length, 3);
  env.advance(env.config.backoffMs - 1); await env.service.get(query);
  assert.equal(env.calls.length, 3);
  env.advance(2); failed = false;
  const refreshed = await env.service.get(query);
  assert.equal(refreshed.status, 'fresh'); assert.equal(env.calls.length, 5);
  assert.notEqual(refreshed.observedAt, first.observedAt);
});

test('SQLite reopening persists daily observations, quotas and last-good cache without a permanent transaction table', async t => {
  let store;
  const file = join(temporary(t, () => store?.close()), 'market.sqlite'), config = testConfig();
  store = new Store(file, config);
  const data = normalizeGuides(fixture('sold'), fixture('stock'), query, new Date(NOW).toISOString());
  store.success(query, data, { sold: 'source-one', stock: 'source-two' }, NOW, config.ttlMs);
  store.success(query, { ...data, current: { ...data.current, value: 220 } }, {}, NOW + 1000, config.ttlMs);
  store.consumeQuota(NOW, 1); store.close(); store = new Store(file, config);
  assert.equal(store.history(query).length, 1); assert.equal(store.history(query)[0].price, 220);
  assert.equal(store.get(query).normalized.current.value, 220);
  assert.throws(() => store.consumeQuota(NOW, 1), error => error.code === 'QUOTA_EXCEEDED');
  assert.doesNotThrow(() => store.consumeQuota(NOW + 86400000, 1));
  assert.deepEqual(store.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(row => row.name), ['cache', 'observations', 'quota', 'watchlist']);
  store.cleanup(NOW + 86401001); assert.equal(store.get(query).normalized, null); assert.equal(store.history(query).length, 1);
  store.cleanup(NOW + 731 * 86400000); assert.equal(store.history(query).length, 0);
});

test('inactive cache errors and source metadata expire after seven days while own observations remain independent', t => {
  const env = environment(t);
  const missing = parseQuery('unknown'), active = parseQuery('10305');
  const data = normalizeGuides(fixture('sold'), fixture('stock'), query, new Date(NOW).toISOString());
  env.store.success(query, data, {}, NOW, env.config.ttlMs);
  env.store.failure(missing, { code: 'NOT_FOUND' }, NOW, NOW + env.config.backoffMs);
  env.store.failure(active, { code: 'NOT_FOUND' }, NOW, NOW + env.config.backoffMs);
  env.store.watch(active, NOW + 7 * 86400000);
  env.store.cleanup(NOW + 8 * 86400000);
  assert.equal(env.store.get(query), null); assert.equal(env.store.get(missing), null);
  assert.equal(env.store.get(active).error_code, 'NOT_FOUND');
  assert.equal(env.store.history(query).length, 1);
});

test('daily global quota is enforced before transport and never yields fake prices', async t => {
  const env = environment(t, { dailyBudget: 2 });
  await env.service.get(query);
  await assert.rejects(env.service.get(parseQuery('21322', new URLSearchParams('condition=U'))), error => error.code === 'QUOTA_EXCEEDED' && error.status === 429);
  assert.equal(env.calls.length, 2);
});

test('watchlist prunes least-recent requests, excludes inactive scopes and scheduler cleans raw cache without credentials', async t => {
  const env = environment(t, { configured: false, maxWatch: 2 });
  env.store.watch(query, NOW - 8 * 86400000);
  const second = parseQuery('10278'), third = parseQuery('10305');
  env.store.watch(second, NOW); env.store.watch(third, NOW + 1);
  assert.equal(env.store.db.prepare('SELECT count(*) AS n FROM watchlist').get().n, 2);
  assert.equal(env.store.due(NOW + 2).length, 2);
  const data = normalizeGuides(fixture('sold'), fixture('stock'), query, new Date(NOW).toISOString());
  env.store.success(query, data, {}, NOW - 86400001, env.config.ttlMs);
  assert.equal(env.service.refreshDue(), 0); assert.equal(env.store.get(query).normalized, null);
});

test('scheduler refreshes due scopes without extending watch activity and stops its timer cleanly', async t => {
  const env = environment(t, { schedulerMs: 5, ttlMs: 10000 });
  env.store.watch(query, NOW); env.service.startScheduler();
  await new Promise(resolve => setTimeout(resolve, 20));
  await Promise.allSettled([...env.service.inflight.values()]);
  assert.equal(env.calls.length, 2);
  env.advance(10001);
  await new Promise(resolve => setTimeout(resolve, 20));
  await env.service.close(); assert.equal(env.calls.length, 4); assert.equal(env.service.timer, null);
  assert.equal(env.store.db.prepare('SELECT last_requested FROM watchlist').get().last_requested, NOW);
});
