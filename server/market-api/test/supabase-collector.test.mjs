import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCollectorConfig, SupabaseCollector, startCollector } from '../supabase-collector.mjs';
import { fixture, mockTransport, NOW } from './fixtures.mjs';

// SYNTHETIC provider responses and an in-memory bridge. No production requests.
const TOKEN = 'a'.repeat(64);
const QUERY = { setNum: '21322-1', provider: 'bricklink', condition: 'N', country: 'GLOBAL', currency: 'KRW' };
const LEASE = '12345678-1234-4234-8234-123456789012';
function environment({ configured = true, bridgeRespond, providerRespond, bridgeThrow, config: overrides = {} } = {}) {
  let clock = NOW;
  const env = { LEGO_SUPABASE_API_URL: 'https://example.supabase.co/functions/v1/lego-market-api', LEGO_COLLECTOR_TOKEN: TOKEN,
    ...(configured ? { BRICKLINK_CONSUMER_KEY: 'fixture-consumer', BRICKLINK_CONSUMER_SECRET: 'fixture-secret',
      BRICKLINK_TOKEN_VALUE: 'fixture-token', BRICKLINK_TOKEN_SECRET: 'fixture-token-secret' } : {}) };
  const config = { ...loadCollectorConfig(env), ...overrides };
  const bridgeCalls = [], providerCalls = [], starts = [], waits = [], logs = [], events = [];
  const defaultReply = action => action === 'claim' ? { job: { leaseId: LEASE, query: QUERY } } : action === 'reserve' ? { reserved: true } : { ok: true };
  const collector = new SupabaseCollector(config, { now: () => clock,
    wait: async (milliseconds, { signal } = {}) => { if (signal?.aborted) throw new Error('aborted'); waits.push(milliseconds); clock += milliseconds; },
    log: value => logs.push(value),
    bridgeFetch: async (input, options) => {
      const action = new URL(input).pathname.split('/').at(-1), body = JSON.parse(options.body);
      bridgeCalls.push({ action, body, input, options }); events.push('bridge:' + action);
      if (bridgeThrow?.(action)) throw new Error('PRIVATE_BRIDGE_ERROR=' + TOKEN);
      const result = bridgeRespond ? await bridgeRespond(action, body, { advance: milliseconds => { clock += milliseconds; }, calls: bridgeCalls }) : undefined;
      const status = result?.status ?? 200, data = result?.body ?? defaultReply(action);
      return { status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(data) };
    },
    providerFetch: (input, options) => {
      starts.push(clock); events.push('provider:' + new URL(input).searchParams.get('guide_type'));
      return mockTransport({ calls: providerCalls, respond: providerRespond ? (url, headers) => providerRespond(url, headers, milliseconds => { clock += milliseconds; }) : undefined })(input, options);
    },
  });
  return { collector, config, bridgeCalls, providerCalls, starts, waits, logs, events, advance: milliseconds => { clock += milliseconds; } };
}

test('bridge configuration requires a server token and HTTPS, with localhost HTTP available only by explicit test opt-in', () => {
  const env = { LEGO_SUPABASE_API_URL: 'https://example.supabase.co/functions/v1/lego-market-api/', LEGO_COLLECTOR_TOKEN: TOKEN };
  assert.equal(loadCollectorConfig(env).apiUrl, env.LEGO_SUPABASE_API_URL.slice(0, -1));
  for (const url of [undefined, 'http://example.com', 'https://private:secret@example.com', 'https://example.com?token=secret', 'https://example.com/#secret']) {
    assert.throws(() => loadCollectorConfig({ ...env, LEGO_SUPABASE_API_URL: url }), error => error.code === 'INVALID_API_URL' && !error.message.includes('secret'));
  }
  assert.throws(() => loadCollectorConfig({ ...env, LEGO_COLLECTOR_TOKEN: 'too-short' }), /INVALID_COLLECTOR_TOKEN/);
  assert.throws(() => loadCollectorConfig({ ...env, LEGO_SUPABASE_API_URL: 'http://127.0.0.1:9876' }), /INVALID_API_URL/);
  assert.equal(loadCollectorConfig({ ...env, LEGO_SUPABASE_API_URL: 'http://127.0.0.1:9876' }, { allowInsecureLocalhost: true }).apiUrl, 'http://127.0.0.1:9876');
  assert.throws(() => loadCollectorConfig({ ...env, LEGO_SUPABASE_API_URL: 'http://example.com' }, { allowInsecureLocalhost: true }), /INVALID_API_URL/);
});

test('absent provider credentials send only a false-presence heartbeat, without claiming or fabricating prices', async () => {
  const env = environment({ configured: false });
  assert.deepEqual(await env.collector.runOnce(), { state: 'not-configured' });
  assert.deepEqual(env.bridgeCalls.map(call => call.action), ['heartbeat']);
  assert.deepEqual(env.bridgeCalls[0].body, { providerConfigured: false }); assert.equal(env.providerCalls.length, 0);
});

test('one job is singleflight, each provider HTTP call has a reservation, and sold/stock starts remain one second apart', async () => {
  const env = environment();
  const results = await Promise.all([env.collector.runOnce(), env.collector.runOnce(), env.collector.runOnce()]);
  assert.ok(results.every(result => result.state === 'published'));
  assert.deepEqual(env.events, ['bridge:heartbeat', 'bridge:claim', 'bridge:reserve', 'provider:sold', 'bridge:reserve', 'provider:stock', 'bridge:publish']);
  assert.equal(env.starts[1] - env.starts[0], 1000);
  assert.ok(env.bridgeCalls.every(call => call.input.startsWith('https://example.supabase.co/functions/v1/lego-market-api/v1/collector/')));
  assert.ok(env.bridgeCalls.every(call => call.options.headers.Authorization === 'Bearer ' + TOKEN));
  assert.ok(env.providerCalls.every(call => call.options.headers.Authorization.startsWith('OAuth ') && !call.options.headers.Authorization.includes(TOKEN)));
  const published = env.bridgeCalls.find(call => call.action === 'publish').body;
  assert.equal(published.normalized.current.value, 200); assert.equal(published.normalized.current.sampleCount, 3);
  assert.equal(published.normalized.trades.filter(row => row.price === 200).length, 2);
  assert.equal(new Set(published.normalized.trades.map(row => row.rowKey)).size, 4);
  assert.equal(published.normalized.quality.tradeIdentity, 'anonymous-provider-rows');
  assert.deepEqual(Object.keys(published).sort(), ['leaseId', 'normalized', 'observedAt']);
  assert.equal(JSON.stringify(published).includes('fixture-secret'), false);
});

test('all provider rows determine the median before display trades are capped at 500', async () => {
  const env = environment({ providerRespond: url => {
    const guide = fixture(url.searchParams.get('guide_type'));
    if (url.searchParams.get('guide_type') === 'sold') {
      guide.data.price_detail = Array.from({ length: 1001 }, (_, index) => ({ quantity: 1, unit_price: index < 500 ? '900.0000' : '100.0000',
        seller_country_code: 'US', buyer_country_code: 'GB', date_ordered: index < 500 ? '2026-10-15T00:00:00Z' : '2026-10-14T00:00:00Z' }));
      guide.data.unit_quantity = 1001; guide.data.total_quantity = 1001;
    }
    return guide;
  } });
  assert.equal((await env.collector.runOnce()).state, 'published');
  const { normalized } = env.bridgeCalls.find(call => call.action === 'publish').body;
  assert.equal(normalized.current.value, 100); assert.equal(normalized.current.sampleCount, 1001);
  assert.equal(normalized.trades.length, 500); assert.ok(normalized.trades.every(row => row.price === 900));
  assert.equal(normalized.quality.providerDetailCount, 1001); assert.equal(normalized.quality.returnedTradeCount, 500);
});

test('PROVIDER_WAIT retries only the reservation, without an upstream request before approval', async () => {
  let reservations = 0;
  const env = environment({ bridgeRespond: action => action === 'reserve' && ++reservations === 1 ? { status: 429, body: { error: { code: 'PROVIDER_WAIT' }, retryAfterMs: 1000 } } : undefined });
  assert.equal((await env.collector.runOnce()).state, 'published');
  assert.deepEqual(env.events.slice(0, 5), ['bridge:heartbeat', 'bridge:claim', 'bridge:reserve', 'bridge:reserve', 'provider:sold']);
  assert.equal(env.providerCalls.length, 2); assert.deepEqual(env.waits, [1000, 1000]);
});

test('reservation retries are bounded and excessive waits never trigger provider traffic', async () => {
  const env = environment({ config: { maxReserveWaits: 2 }, bridgeRespond: action => action === 'reserve' ? { status: 429, body: { error: { code: 'PROVIDER_WAIT' }, retryAfterMs: 1000 } } : undefined });
  assert.deepEqual(await env.collector.runOnce(), { state: 'failed', errorCode: 'UPSTREAM_FAILED' });
  assert.equal(env.bridgeCalls.filter(call => call.action === 'reserve').length, 3); assert.equal(env.providerCalls.length, 0);
  assert.deepEqual(env.bridgeCalls.at(-1).body, { leaseId: LEASE, errorCode: 'UPSTREAM_FAILED' });
});

test('quota exhaustion is persisted as a safe failure without touching the provider', async () => {
  const env = environment({ bridgeRespond: action => action === 'reserve' ? { status: 429, body: { error: { code: 'QUOTA_EXCEEDED' }, retryAfterSeconds: 3600 } } : undefined });
  assert.deepEqual(await env.collector.runOnce(), { state: 'failed', errorCode: 'QUOTA_EXCEEDED' });
  assert.equal(env.providerCalls.length, 0); assert.equal(env.bridgeCalls.at(-1).body.errorCode, 'QUOTA_EXCEEDED');
});

test('HTTP 200 body authentication failure and mismatched currency are reported without provider text or credentials', async () => {
  for (const code of ['PROVIDER_AUTH', 'UPSTREAM_SCOPE_MISMATCH']) {
    const env = environment({ providerRespond: url => {
      if (code === 'PROVIDER_AUTH') return { meta: { code: 401, description: 'PRIVATE_PROVIDER_ERROR=' + TOKEN } };
      const guide = fixture(url.searchParams.get('guide_type')); guide.data.currency_code = 'USD'; return guide;
    } });
    assert.deepEqual(await env.collector.runOnce(), { state: 'failed', errorCode: code });
    assert.equal(env.bridgeCalls.at(-1).action, 'failure'); assert.equal(env.bridgeCalls.at(-1).body.errorCode, code);
    assert.equal(env.providerCalls.length, 1);
    assert.equal(JSON.stringify(env.bridgeCalls.map(call => call.body)).includes(TOKEN), false);
  }
});

test('a normalized payload over 1 MiB is rejected before publication and reports only its safe failure code', async () => {
  const env = environment({ providerRespond: url => {
    const guide = fixture(url.searchParams.get('guide_type'));
    if (url.searchParams.get('guide_type') === 'sold') guide.data.price_detail = Array.from({ length: 500 }, () => ({ quantity: 1,
      unit_price: '100.0000', date_ordered: '2026-10-15T00:00:00Z', seller_country_code: 'X'.repeat(2200), buyer_country_code: 'GB' }));
    return guide;
  } });
  assert.deepEqual(await env.collector.runOnce(), { state: 'failed', errorCode: 'PAYLOAD_TOO_LARGE' });
  assert.equal(env.bridgeCalls.some(call => call.action === 'publish'), false);
  assert.deepEqual(env.bridgeCalls.at(-1).body, { leaseId: LEASE, errorCode: 'PAYLOAD_TOO_LARGE' });
});

test('a locally expired lease never performs a late fetch, failure report or publication', async () => {
  const env = environment({ bridgeRespond: (action, body, context) => { if (action === 'claim') context.advance(116000); } });
  assert.equal((await env.collector.runOnce()).state, 'lease-expired');
  assert.equal(env.providerCalls.length, 0); assert.deepEqual(env.bridgeCalls.map(call => call.action), ['heartbeat', 'claim']);
  const slow = environment({ providerRespond: (url, options, advance) => {
    if (url.searchParams.get('guide_type') === 'stock') advance(116000);
    return fixture(url.searchParams.get('guide_type'));
  } });
  assert.equal((await slow.collector.runOnce()).state, 'lease-expired');
  assert.equal(slow.bridgeCalls.some(call => ['publish', 'failure'].includes(call.action)), false);
});

test('an expired server lease or ambiguous publish response is never retried or republished', async () => {
  const expired = environment({ bridgeRespond: action => action === 'reserve' ? { status: 409, body: { error: { code: 'LEASE_EXPIRED' } } } : undefined });
  assert.equal((await expired.collector.runOnce()).state, 'lease-expired');
  assert.equal(expired.providerCalls.length, 0); assert.equal(expired.bridgeCalls.some(call => call.action === 'failure'), false);
  const lost = environment({ bridgeThrow: action => action === 'publish' });
  assert.deepEqual(await lost.collector.runOnce(), { state: 'failed', errorCode: 'BRIDGE_UNAVAILABLE' });
  assert.equal(lost.bridgeCalls.filter(call => call.action === 'publish').length, 1);
  assert.equal(lost.bridgeCalls.some(call => call.action === 'failure'), false);
});

test('bridge authentication failures and malformed jobs fail closed without an upstream call', async () => {
  const unauthorized = environment({ bridgeRespond: () => ({ status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'PRIVATE=' + TOKEN } } }) });
  await assert.rejects(unauthorized.collector.runOnce(), error => error.code === 'UNAUTHORIZED' && !error.message.includes(TOKEN));
  assert.equal(unauthorized.providerCalls.length, 0); assert.equal(unauthorized.bridgeCalls.length, 1);
  for (const job of [{ leaseId: 'unsafe', query: QUERY }, { leaseId: LEASE, query: { ...QUERY, currency: 'USD' } },
    { leaseId: LEASE, query: { ...QUERY, setNum: '../private' } }, { leaseId: LEASE, query: { ...QUERY, setNum: '21322' } }]) {
    const env = environment({ bridgeRespond: action => action === 'claim' ? { body: { job } } : undefined });
    await assert.rejects(env.collector.runOnce(), error => error.code === 'BRIDGE_INVALID'); assert.equal(env.providerCalls.length, 0);
  }
});

test('one-shot mode does not poll again and continuous mode stops cleanly when its signal is aborted', async () => {
  const once = environment({ bridgeRespond: action => action === 'claim' ? { body: { job: null } } : undefined });
  await once.collector.run({ once: true }); assert.equal(once.waits.length, 0); assert.equal(once.logs[0].state, 'idle');
  const loop = environment({ configured: false }), controller = new AbortController();
  loop.collector.wait = async () => { controller.abort(); throw new Error('aborted'); };
  await loop.collector.run({ signal: controller.signal });
  assert.deepEqual(loop.bridgeCalls.map(call => call.action), ['heartbeat']); assert.equal(loop.logs.length, 1);
  await assert.rejects(startCollector({ args: ['--not-supported'], env: {} }), error => error.code === 'INVALID_ARGUMENT');
});

test('abort during an upstream call leaves the lease to expire and never publishes partial work', async () => {
  const controller = new AbortController();
  const env = environment({ providerRespond: url => { controller.abort(); return fixture(url.searchParams.get('guide_type')); } });
  assert.deepEqual(await env.collector.runOnce({ signal: controller.signal }), { state: 'stopped' });
  assert.equal(env.providerCalls.length, 1); assert.equal(env.bridgeCalls.some(call => ['publish', 'failure'].includes(call.action)), false);
});
