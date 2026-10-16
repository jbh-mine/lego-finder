import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../config.mjs';
import { Store } from '../store.mjs';
import { createProvider } from '../provider.mjs';
import { createApplication } from '../server.mjs';
import { fixture, mockTransport, NOW } from './fixtures.mjs';

// All network traffic in this suite is loopback. Provider responses are synthetic.
async function application(t, { configured = true, config: overrides = {}, respond, transport } = {}) {
  const config = { ...loadConfig(configured ? { BRICKLINK_CONSUMER_KEY: 'fixture-consumer', BRICKLINK_CONSUMER_SECRET: 'fixture-secret',
    BRICKLINK_TOKEN_VALUE: 'fixture-token', BRICKLINK_TOKEN_SECRET: 'fixture-token-secret', ADMIN_TOKEN: 'fixture-admin' } : {}), ...overrides };
  const calls = []; let clock = NOW;
  const now = () => clock;
  const provider = createProvider(config, { now, transport: transport || mockTransport({ calls, respond }) });
  const app = createApplication(config, { store: new Store(':memory:', config), provider, now,
    wait: async milliseconds => { clock += milliseconds; }, scheduler: false });
  await new Promise((resolve, reject) => { app.server.once('error', reject); app.server.listen(0, '127.0.0.1', resolve); });
  const base = 'http://127.0.0.1:' + app.server.address().port;
  t.after(() => app.close());
  return { ...app, config, calls, advance: milliseconds => { clock += milliseconds; },
    async request(path, options) {
      const response = await fetch(base + path, options);
      const body = response.status === 204 ? null : await response.json();
      return { response, body };
    } };
}

test('health exposes no secrets and an unconfigured market fails with a safe 503', async t => {
  const app = await application(t, { configured: false });
  const health = await app.request('/health');
  assert.deepEqual(health.body, { ok: true, schemaVersion: 1, configured: false, provider: 'bricklink' });
  const result = await app.request('/v1/market/21322');
  assert.equal(result.response.status, 503); assert.equal(result.body.error.code, 'NOT_CONFIGURED');
  assert.equal(result.response.headers.get('Retry-After'), '900'); assert.equal(app.calls.length, 0);
});

test('CORS allows only exact configured origins and preflights, while no-origin CLI requests remain valid', async t => {
  const app = await application(t);
  const allowed = await app.request('/health', { headers: { Origin: 'https://jbh-mine.github.io' } });
  assert.equal(allowed.response.headers.get('Access-Control-Allow-Origin'), 'https://jbh-mine.github.io');
  assert.equal(allowed.response.headers.get('Vary'), 'Origin');
  for (const origin of ['https://jbh-mine.github.io.evil.example', 'https://evil.example', 'null']) {
    const denied = await app.request('/health', { headers: { Origin: origin } });
    assert.equal(denied.response.status, 403); assert.equal(denied.body.error.code, 'ORIGIN_DENIED');
    assert.equal(denied.response.headers.has('Access-Control-Allow-Origin'), false);
  }
  const preflight = await app.request('/v1/admin/refresh', { method: 'OPTIONS', headers: { Origin: 'https://jbh-mine.github.io' } });
  assert.equal(preflight.response.status, 204); assert.match(preflight.response.headers.get('Access-Control-Allow-Headers'), /Authorization/);
  assert.equal((await app.request('/health')).response.status, 200);
});

test('market response keeps sold rows, current median, daily observations and asking quotes distinct', async t => {
  const app = await application(t);
  const result = await app.request('/v1/market/21322?condition=N&country=GLOBAL&currency=KRW');
  assert.equal(result.response.status, 200); assert.equal(result.body.status, 'fresh');
  assert.deepEqual(result.body.query, { setNum: '21322-1', provider: 'bricklink', condition: 'N', country: 'GLOBAL', currency: 'KRW' });
  assert.equal(result.body.current.value, 200); assert.equal(result.body.current.sampleCount, 3);
  assert.equal(result.body.current.latestPrice, 100); assert.equal(result.body.current.lowestAskingPrice, 90);
  assert.equal(result.body.trades.length, 4); assert.equal(result.body.history.length, 1);
  assert.equal(result.body.history[0].basis, 'recent-30d-median'); assert.equal(result.body.quality.historyKind, 'daily-market-observations');
  assert.equal(result.body.quality.historyComplete, false); assert.equal(result.body.refresh.state, 'ok');
  assert.deepEqual(result.body.retention, { rawHours: 24, observationDays: 730 });
  assert.equal(result.response.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.body.sourceUrl, 'https://www.bricklink.com/v2/catalog/catalogitem.page?S=21322-1');
  await app.request('/v1/market/21322?refresh=1'); assert.equal(app.calls.length, 2);
  const bad = await app.request('/v1/market/21322?currency=USD'); assert.equal(bad.response.status, 400);
  const canonicalTooLong = await app.request('/v1/market/' + 'A'.repeat(40)); assert.equal(canonicalTooLong.response.status, 400);
  assert.equal((await app.request('/v1/market/21322%2F1')).response.status, 400);
});

test('no-sales is a real successful empty recent window and unknown SET is a distinct 404', async t => {
  const app = await application(t, { respond: url => {
    if (url.pathname.includes('missing-1')) return { meta: { code: 404 } };
    const guide = fixture(url.searchParams.get('guide_type'));
    if (url.searchParams.get('guide_type') === 'sold') guide.data.price_detail = guide.data.price_detail.filter(row => row.date_ordered.startsWith('2026-08'));
    return guide;
  } });
  const empty = await app.request('/v1/market/21322');
  assert.equal(empty.response.status, 200); assert.equal(empty.body.status, 'no-sales');
  assert.equal(empty.body.current.value, null); assert.equal(empty.body.current.sixMonthAverage, 350);
  assert.equal(empty.body.history.length, 0); assert.equal(empty.body.trades.length, 1);
  const missing = await app.request('/v1/market/missing');
  assert.equal(missing.response.status, 404); assert.equal(missing.body.error.code, 'NOT_FOUND');
  const calls = app.calls.length;
  assert.equal((await app.request('/v1/market/missing')).response.status, 404); assert.equal(app.calls.length, calls);
});

test('upstream JSON and HTTP auth errors stay safe, and failed refresh exposes only unchanged stale source data', async t => {
  let failure = false;
  const app = await application(t, { respond: url => failure ? { meta: { code: 401, description: 'PRIVATE_SIGNATURE_DO_NOT_ECHO' } } : fixture(url.searchParams.get('guide_type')) });
  const first = (await app.request('/v1/market/21322')).body;
  failure = true; app.advance(app.config.ttlMs + 1);
  const stale = await app.request('/v1/market/21322');
  assert.equal(stale.body.status, 'stale'); assert.equal(stale.body.observedAt, first.observedAt);
  assert.equal(stale.body.refresh.state, 'failed'); assert.equal(stale.body.refresh.errorCode, 'PROVIDER_AUTH');
  assert.equal(JSON.stringify(stale.body).includes('PRIVATE_SIGNATURE'), false);
  app.advance(86400001);
  const expired = await app.request('/v1/market/21322');
  assert.equal(expired.response.status, 503); assert.equal(expired.body.error.code, 'PROVIDER_AUTH');
  const httpAuth = await application(t, { transport: async () => ({ status: 403, ok: false }) });
  const rejected = await httpAuth.request('/v1/market/21322');
  assert.equal(rejected.response.status, 503); assert.equal(rejected.body.error.code, 'PROVIDER_AUTH');
});

test('administrator refresh requires a bearer token, validates bounded JSON and obeys the public refresh cooldown', async t => {
  const app = await application(t);
  const post = (body, token = 'fixture-admin') => app.request('/v1/admin/refresh', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body });
  assert.equal((await post('{}', 'wrong')).response.status, 401);
  assert.equal((await app.request('/v1/admin/refresh', { method: 'POST', body: '{}' })).response.status, 401);
  assert.equal((await post('{broken')).response.status, 400);
  assert.equal((await post('[]')).response.status, 400);
  assert.equal((await post('{"force":true}')).response.status, 400);
  assert.equal((await post(JSON.stringify({ setNum: '21322', padding: 'X'.repeat(8192) }))).response.status, 413);
  const first = await post('{"setNum":"21322"}'); assert.equal(first.response.status, 200);
  const second = await post('{"setNum":"21322"}'); assert.equal(second.body.refresh.state, 'cooldown');
  assert.equal(app.calls.length, 2);
  const batch = await post('{}'); assert.equal(batch.response.status, 202); assert.equal(batch.body.scheduled, 0);
});

test('persistent global provider budget returns 429 before making excess calls', async t => {
  const app = await application(t, { config: { dailyBudget: 2 } });
  await app.request('/v1/market/21322');
  const result = await app.request('/v1/market/21322?condition=U');
  assert.equal(result.response.status, 429); assert.equal(result.body.error.code, 'QUOTA_EXCEEDED');
  assert.equal(app.calls.length, 2); assert.ok(Number(result.response.headers.get('Retry-After')) > 0);
});

test('direct servers ignore forged forwarded IPs while one explicitly trusted proxy isolates clients using its rightmost hop', async t => {
  const direct = await application(t);
  for (let index = 0; index < 60; index++) {
    const result = await direct.request('/not-a-route', { headers: { 'X-Forwarded-For': '192.0.2.' + (index + 1) } });
    assert.equal(result.response.status, 404);
  }
  assert.equal((await direct.request('/not-a-route', { headers: { 'X-Forwarded-For': '198.51.100.1' } })).body.error.code, 'RATE_LIMITED');
  const proxy = await application(t, { config: { trustProxy: true } });
  for (let index = 0; index < 60; index++) await proxy.request('/not-a-route', { headers: { 'X-Forwarded-For': '198.51.100.99, 192.0.2.1' } });
  const blocked = await proxy.request('/not-a-route', { headers: { 'X-Forwarded-For': '198.51.100.100, 192.0.2.1' } });
  assert.equal(blocked.body.error.code, 'RATE_LIMITED');
  assert.equal((await proxy.request('/not-a-route', { headers: { 'X-Forwarded-For': '198.51.100.99, 192.0.2.2' } })).response.status, 404);
});
