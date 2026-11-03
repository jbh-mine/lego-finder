import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createHandler, createRpc } from '../handler.mjs';

// SYNTHETIC transport fixtures only. These are not operational credentials/prices.
const BASE = 'https://lkiyqjjihattcoykgpnn.supabase.co/functions/v1/lego-market-api';
const NOW = Date.parse('2026-11-03T08:00:00Z');
const TOKEN = 'synthetic-collector-token-for-transport-test';
const LEASE = '24af6e6f-f7f4-4e57-9416-d96d541fa57e';
function setup(options = {}) {
  const calls = [];
  const handler = createHandler({ now: () => NOW, rpc: async (...args) => { calls.push(args); return { httpStatus: 200, body: { ok: true } }; }, ...options });
  return { calls, handler, async request(path, init = {}) {
    const response = await handler(new Request(BASE + path, init));
    const body = response.status === 204 ? null : await response.json();
    return { response, body };
  } };
}
function post(body, token = TOKEN) {
  return { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
function published() {
  return { leaseId: LEASE, observedAt: new Date(NOW).toISOString(), normalized: {
    current: { value: 200, basis: 'recent-30d-median', sampleCount: 3, min: 100, max: 200,
      latestPrice: 100, latestTradeAt: '2026-11-02T08:00:00.000Z', sixMonthAverage: 350,
      sixMonthQuantityAverage: 125, sixMonthLots: 4, sixMonthUnits: 13, lowestAskingPrice: 90, askingLots: 2 },
    trades: [{ rowKey: 'synthetic-row:0', price: 100, date: '2026-11-02T08:00:00.000Z', datePrecision: 'timestamp',
      quantity: 10, sellerCountry: 'US', buyerCountry: 'KR' }],
    quality: { historyKind: 'daily-market-observations', tradeIdentity: 'anonymous-provider-rows',
      subconditionKnown: false, providerDetailCount: 4, returnedTradeCount: 1, historyComplete: false },
  } };
}

test('public health is available without a visitor JWT; exact allowed-origin CORS and no-store headers', async () => {
  const env = setup();
  const { response } = await env.request('/health', { headers: { Origin: 'https://jbh-mine.github.io' } });
  assert.equal(response.status, 200);
  assert.deepEqual(env.calls, [['health', {}, null]]);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://jbh-mine.github.io');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  const denied = await env.request('/health', { headers: { Origin: 'https://jbh-mine.github.io.evil.invalid' } });
  assert.equal(denied.response.status, 403); assert.equal(denied.body.error.code, 'ORIGIN_DENIED');
  assert.equal(denied.response.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(env.calls.length, 1);
});

test('any catalog identifier, variant and supported scope are forwarded without a seven-item list', async () => {
  const env = setup();
  await env.request('/v1/market/10294?condition=U&country=KR&currency=KRW&refresh=1');
  await env.request('/v1/market/12345-2');
  assert.deepEqual(env.calls, [
    ['get', { setNum: '10294-1', condition: 'U', country: 'KR', refresh: true }, null],
    ['get', { setNum: '12345-2', condition: 'N', country: 'GLOBAL', refresh: false }, null],
  ]);
});

test('deployed gateway and function-local route prefixes both map to the same API', async () => {
  const env = setup();
  for (const prefix of ['', '/lego-market-api', '/functions/v1/lego-market-api']) {
    const response = await env.handler(new Request('https://example.invalid' + prefix + '/health'));
    assert.equal(response.status, 200);
  }
  assert.equal(env.calls.length, 3);
});

test('unsafe identifiers, duplicate/unknown/empty arguments and invalid scopes never reach storage', async () => {
  const env = setup();
  const invalid = ['/v1/market/123?condition=N&condition=U', '/v1/market/123?currency=USD',
    '/v1/market/123?condition=', '/v1/market/123?country=US', '/v1/market/123?refresh=0',
    '/v1/market/123?token=private', '/v1/market/123%2fsecret', '/v1/market/%ZZ',
    '/v1/market/' + 'A'.repeat(40), '/health?debug=1'];
  for (const path of invalid) assert.equal((await env.request(path)).response.status, 400, path);
  assert.equal(env.calls.length, 0);
});

test('collector endpoints require their own strong bearer token and pass only SHA-256 digest to SQL', async () => {
  const env = setup();
  const missing = await env.request('/v1/collector/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(missing.response.status, 401);
  assert.equal((await env.request('/v1/collector/heartbeat', post({ providerConfigured: true }, 'short'))).response.status, 401);
  const response = await env.request('/v1/collector/heartbeat', post({ providerConfigured: false }));
  assert.equal(response.response.status, 200);
  assert.deepEqual(env.calls, [['heartbeat', { providerConfigured: false }, createHash('sha256').update(TOKEN).digest('hex')]]);
  assert.ok(!JSON.stringify(env.calls).includes(TOKEN));
  assert.equal((await env.request('/v1/collector/claim', post({}))).response.status, 200);
  assert.equal((await env.request('/v1/collector/reserve', post({ leaseId: LEASE }))).response.status, 200);
  assert.equal((await env.request('/v1/collector/failure', post({ leaseId: LEASE, errorCode: 'PROVIDER_AUTH' }))).response.status, 200);
  assert.equal((await env.request('/v1/collector/failure', post({ leaseId: LEASE, errorCode: 'PAYLOAD_TOO_LARGE' }))).response.status, 200);
});

test('only exact collector payloads and safe failure codes are accepted', async () => {
  const env = setup();
  for (const [route, payload] of [['heartbeat', {}], ['heartbeat', { providerConfigured: 'true' }],
    ['claim', { sql: 'select *' }], ['reserve', { leaseId: 'not-a-lease' }],
    ['failure', { leaseId: LEASE, errorCode: 'SECRET-UPSTREAM-ERROR' }],
    ['failure', { leaseId: LEASE, errorCode: 'SERVER_BUSY' }],
    ['failure', { leaseId: LEASE, errorCode: 'NOT_FOUND', message: 'private' }]]) {
    assert.equal((await env.request('/v1/collector/' + route, post(payload))).response.status, 400);
  }
  assert.equal((await env.request('/v1/collector/claim?debug=1', post({}))).response.status, 400);
  assert.equal(env.calls.length, 0);
});

test('normalized publication preserves median metadata even when fewer display rows are returned', async () => {
  const env = setup(), payload = published();
  const response = await env.request('/v1/collector/publish', post(payload));
  assert.equal(response.response.status, 200);
  assert.equal(env.calls[0][0], 'publish'); assert.deepEqual(env.calls[0][1], payload);
  assert.equal(env.calls[0][1].normalized.current.sampleCount, 3);
  assert.equal(env.calls[0][1].normalized.trades.length, 1);
});

test('publication rejects future/stale time, inconsistent evidence, duplicate keys and extra source data', async () => {
  const env = setup();
  const edits = [body => { body.observedAt = new Date(NOW + 60001).toISOString(); },
    body => { body.observedAt = new Date(NOW - 300001).toISOString(); },
    body => { body.normalized.current.value = 1000; },
    body => { body.normalized.quality.historyComplete = true; },
    body => { body.normalized.quality.returnedTradeCount = 2; },
    body => { body.normalized.trades.push({ ...body.normalized.trades[0] }); body.normalized.quality.returnedTradeCount = 2; },
    body => { body.normalized.trades[0].date = '2026-02-30T08:00:00Z'; },
    body => { body.normalized.current.sampleCount = -1; },
    body => { body.normalized.current.sampleCount = 5; },
    body => { body.normalized.current.latestTradeAt = null; },
    body => { body.normalized.current.latestPrice = null; },
    body => { body.normalized.current.sixMonthUnits = 2147483648; },
    body => { body.normalized.trades[0].quantity = 2147483648; },
    body => { body.normalized.trades[0].rowKey = 'a'.repeat(101); },
    body => { body.normalized.rawSold = 'private-source-blob'; },
    body => { body.normalized.trades[0].price = '100.00'; }];
  for (const edit of edits) {
    const payload = published(); edit(payload);
    assert.equal((await env.request('/v1/collector/publish', post(payload))).response.status, 400);
  }
  assert.equal(env.calls.length, 0);
});

test('no-sales publication is null and does not turn asking prices or averages into sales', async () => {
  const env = setup(), payload = published();
  Object.assign(payload.normalized.current, { value: null, basis: null, sampleCount: 0, min: null, max: null });
  assert.equal((await env.request('/v1/collector/publish', post(payload))).response.status, 200);
  payload.normalized.current.basis = 'recent-30d-median';
  assert.equal((await env.request('/v1/collector/publish', post(payload))).response.status, 400);
});

test('JSON media type, object requirement and byte-based stream size are enforced', async () => {
  const env = setup();
  const request = (body, headers = {}) => env.request('/v1/collector/claim', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, ...headers }, body });
  assert.equal((await request('{}')).response.status, 415);
  for (const body of ['null', '[]', '{invalid']) assert.equal((await request(body, { 'Content-Type': 'application/json' })).response.status, 400);
  assert.equal((await request('{}', { 'Content-Type': 'application/json', 'Content-Length': '1048577' })).response.status, 413);
  const huge = JSON.stringify({ data: '가'.repeat(400000) });
  assert.ok(huge.length < 1048576);
  assert.equal((await request(huge, { 'Content-Type': 'application/json' })).response.status, 413);
  assert.equal(env.calls.length, 0);
});

test('unsupported methods/routes and unsafe CORS preflights do not reach storage', async () => {
  const env = setup();
  assert.equal((await env.request('/health', { method: 'POST' })).response.status, 405);
  assert.equal((await env.request('/v1/admin/refresh', post({}))).response.status, 404);
  const preflight = await env.request('/health', { method: 'OPTIONS', headers: { Origin: 'https://jbh-mine.github.io',
    'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Content-Type' } });
  assert.equal(preflight.response.status, 204);
  assert.equal(preflight.body, null);
  assert.equal((await env.request('/health', { method: 'OPTIONS', headers: { Origin: 'https://jbh-mine.github.io',
    'Access-Control-Request-Method': 'DELETE' } })).response.status, 403);
  assert.equal(env.calls.length, 0);
});

test('public limiter is bounded and resets per minute, while collector traffic has a separate budget', async () => {
  let clock = NOW;
  const env = setup({ now: () => clock });
  for (let index = 0; index < 60; index++) assert.equal((await env.request('/health')).response.status, 200);
  const limited = await env.request('/health');
  assert.equal(limited.response.status, 429); assert.equal(limited.response.headers.get('Retry-After'), '60');
  assert.equal((await env.request('/v1/collector/claim', post({}))).response.status, 200);
  clock += 60000;
  assert.equal((await env.request('/health')).response.status, 200);
  const bounded = setup({ maxClients: 1 });
  await bounded.request('/health', { headers: { 'cf-connecting-ip': '192.0.2.1' } });
  assert.equal((await bounded.request('/health', { headers: { 'cf-connecting-ip': '192.0.2.2' } })).response.status, 429);
});

test('SQL pending/auth/lease/quota status and safe Retry-After are preserved', async () => {
  for (const [status, code] of [[503, 'COLLECTION_PENDING'], [401, 'UNAUTHORIZED'], [409, 'LEASE_EXPIRED'], [429, 'QUOTA_EXCEEDED']]) {
    const body = { schemaVersion: 1, error: { code, message: 'Safe fixture error' }, retryAfterSeconds: 30 };
    const env = setup({ rpc: async () => ({ httpStatus: status, body }) });
    const response = await env.request('/health');
    assert.equal(response.response.status, status); assert.deepEqual(response.body, body);
    assert.equal(response.response.headers.get('Retry-After'), '30');
  }
});

test('storage exceptions and malformed envelopes never expose sensitive internal details', async () => {
  for (const rpc of [async () => { throw new Error('fixture-service-secret stack SQL'); },
    async () => ({ httpStatus: 101, body: {} }), async () => ({ httpStatus: 200, body: null })]) {
    const env = setup({ rpc });
    const response = await env.request('/health');
    assert.equal(response.response.status, 503); assert.equal(response.body.error.code, 'STORAGE_UNAVAILABLE');
    assert.ok(!JSON.stringify(response.body).includes('fixture-service-secret'));
  }
});

test('RPC transport is pinned to the Supabase project endpoint and keeps server credentials out of payloads', async () => {
  const calls = [], key = 'synthetic-server-credential';
  const rpc = createRpc({ url: 'https://lkiyqjjihattcoykgpnn.supabase.co', serviceKey: key,
    fetchImpl: async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify({ httpStatus: 200, body: { ok: true } })); } });
  const result = await rpc('get', { setNum: '10294-1', condition: 'N', country: 'GLOBAL', refresh: false });
  assert.equal(result.httpStatus, 200);
  assert.equal(calls[0].url, 'https://lkiyqjjihattcoykgpnn.supabase.co/rest/v1/rpc/lego_market_dispatch');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.headers.apikey, key); assert.equal(calls[0].options.headers.Authorization, 'Bearer ' + key);
  assert.ok(!calls[0].options.body.includes(key));
  assert.deepEqual(JSON.parse(calls[0].options.body), { p_action: 'get', p_payload: { setNum: '10294-1', condition: 'N', country: 'GLOBAL', refresh: false }, p_worker_digest: null });
  for (const url of ['http://lkiyqjjihattcoykgpnn.supabase.co', 'https://evil.invalid', 'https://a.supabase.co/secret',
    'https://a.supabase.co?key=private', 'https://user:secret@a.supabase.co']) {
    assert.throws(() => createRpc({ url, serviceKey: key }), /configuration is unavailable/);
  }
});

test('failed, oversized or non-JSON PostgREST replies are hidden behind a safe transport error', async () => {
  for (const fetchImpl of [async () => new Response('secret SQL detail', { status: 403 }),
    async () => new Response('not-json-secret'), async () => { throw new Error('fixture secret'); },
    async () => new Response('x'.repeat(2 * 1024 * 1024 + 1))]) {
    const rpc = createRpc({ url: 'https://lkiyqjjihattcoykgpnn.supabase.co', serviceKey: 'synthetic-server-credential', fetchImpl });
    await assert.rejects(rpc('health', {}), error => error.message === 'Market storage transport failed.');
  }
});

test('storage fetch has a real timeout signal instead of waiting indefinitely', async () => {
  const rpc = createRpc({ url: 'https://lkiyqjjihattcoykgpnn.supabase.co', serviceKey: 'synthetic-server-credential', timeoutMs: 10,
    fetchImpl: async (_url, options) => new Promise((resolve, reject) => {
      const keepAlive = setTimeout(() => resolve(new Response('{}')), 1000);
      options.signal.addEventListener('abort', () => { clearTimeout(keepAlive); reject(new Error('aborted')); }, { once: true });
    }) });
  await assert.rejects(rpc('health', {}), /transport failed/);
});
