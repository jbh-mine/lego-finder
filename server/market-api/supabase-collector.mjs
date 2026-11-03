import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { loadConfig, parseQuery } from './config.mjs';
import { createProvider, normalizeGuides } from './provider.mjs';

const MAX_PAYLOAD_BYTES = 1024 * 1024;
const MAX_BRIDGE_RESPONSE_BYTES = 65536;
const SAFE_PROVIDER_ERRORS = new Set(['NOT_FOUND', 'PROVIDER_AUTH', 'UPSTREAM_UNAVAILABLE', 'UPSTREAM_RATE_LIMITED',
  'UPSTREAM_INVALID', 'UPSTREAM_SCOPE_MISMATCH', 'UPSTREAM_FAILED', 'QUOTA_EXCEEDED', 'PAYLOAD_TOO_LARGE']);
const BRIDGE_ERRORS = new Set(['UNAUTHORIZED', 'LEASE_EXPIRED', 'PROVIDER_WAIT', 'QUOTA_EXCEEDED', 'RATE_LIMITED', 'NOT_CONFIGURED']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CollectorError extends Error {
  constructor(code, retryAfterMs = 15000) {
    super('Collector operation failed: ' + code);
    this.code = code; this.retryAfterMs = retryAfterMs;
  }
}

export function loadCollectorConfig(env = process.env, { allowInsecureLocalhost = false } = {}) {
  let url;
  try { url = new URL(env.LEGO_SUPABASE_API_URL); } catch (error) { throw new CollectorError('INVALID_API_URL'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(allowInsecureLocalhost && local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) {
    throw new CollectorError('INVALID_API_URL');
  }
  let token;
  try {
    token = String(env.LEGO_COLLECTOR_TOKEN !== undefined ? env.LEGO_COLLECTOR_TOKEN : env.LEGO_COLLECTOR_TOKEN_FILE ? readFileSync(env.LEGO_COLLECTOR_TOKEN_FILE, 'utf8') : '').replace(/[\r\n]+$/, '');
  } catch (error) { throw new CollectorError('INVALID_COLLECTOR_TOKEN'); }
  if (!/^[\x21-\x7e]{32,512}$/.test(token)) throw new CollectorError('INVALID_COLLECTOR_TOKEN');
  return { apiUrl: url.href.replace(/\/$/, ''), token, provider: loadConfig(env), pollMs: 15000,
    bridgeTimeoutMs: 10000, leaseMs: 115000, maxReserveWaits: 10, maxReserveWaitMs: 10000 };
}

function aborted(signal) { if (signal?.aborted) throw new CollectorError('STOPPED'); }
function combinedSignal(timeoutMs, signal) {
  const timeout = AbortSignal.timeout(Math.max(1, Math.floor(timeoutMs)));
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
function claimedQuery(query) {
  if (!query || typeof query !== 'object' || query.provider !== 'bricklink' || query.currency !== 'KRW' ||
      !['N', 'U'].includes(query.condition) || !['GLOBAL', 'KR'].includes(query.country)) throw new CollectorError('BRIDGE_INVALID');
  let normalized;
  try { normalized = parseQuery(query.setNum, new URLSearchParams({ condition: query.condition, country: query.country, currency: 'KRW' })); }
  catch (error) { throw new CollectorError('BRIDGE_INVALID'); }
  if (normalized.setNum !== query.setNum) throw new CollectorError('BRIDGE_INVALID');
  return normalized;
}

export class SupabaseCollector {
  constructor(config, { bridgeFetch = fetch, providerFetch = fetch, now = Date.now,
    wait = (milliseconds, options) => sleep(milliseconds, undefined, options), log = () => {} } = {}) {
    this.config = config; this.bridgeFetch = bridgeFetch; this.now = now; this.wait = wait; this.log = log;
    this.activeSignal = null; this.inflight = null; this.lastProviderStart = -Infinity;
    this.provider = createProvider(config.provider, { now, transport: (url, options) => {
      aborted(this.activeSignal);
      this.lastProviderStart = this.now();
      return providerFetch(url, { ...options, signal: this.activeSignal ? AbortSignal.any([options.signal, this.activeSignal]) : options.signal });
    } });
  }
  async bridge(action, payload, signal, deadline = Infinity) {
    aborted(signal);
    if (this.now() >= deadline) throw new CollectorError('LEASE_EXPIRED');
    const body = JSON.stringify(payload);
    if (Buffer.byteLength(body, 'utf8') > MAX_PAYLOAD_BYTES) throw new CollectorError('PAYLOAD_TOO_LARGE');
    let response, data;
    try {
      response = await this.bridgeFetch(this.config.apiUrl + '/v1/collector/' + action, { method: 'POST',
        headers: { Authorization: 'Bearer ' + this.config.token, 'Content-Type': 'application/json', Accept: 'application/json' },
        body, redirect: 'error', signal: combinedSignal(Math.min(this.config.bridgeTimeoutMs, deadline - this.now()), signal) });
      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > MAX_BRIDGE_RESPONSE_BYTES) throw new Error();
      data = JSON.parse(text);
    } catch (error) { aborted(signal); throw new CollectorError('BRIDGE_UNAVAILABLE'); }
    if (!response.ok || data?.error) {
      const code = BRIDGE_ERRORS.has(data?.error?.code) ? data.error.code : 'BRIDGE_FAILED';
      const delay = data?.retryAfterMs ?? (Number(data?.retryAfterSeconds) * 1000);
      throw new CollectorError(code, Number.isFinite(delay) && delay > 0 ? delay : 15000);
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new CollectorError('BRIDGE_INVALID');
    if (action === 'claim') {
      if (!Object.hasOwn(data, 'job')) throw new CollectorError('BRIDGE_INVALID');
    } else if (action === 'reserve') {
      if (data.reserved !== true) throw new CollectorError('BRIDGE_INVALID');
    } else if (data.ok !== true) throw new CollectorError('BRIDGE_INVALID');
    return data;
  }
  ensureLease(deadline, signal) { aborted(signal); if (this.now() >= deadline) throw new CollectorError('LEASE_EXPIRED'); }
  async reserve(leaseId, deadline, signal) {
    const spacing = this.lastProviderStart + 1000 - this.now();
    if (spacing > 0) await this.wait(spacing, { signal });
    for (let attempt = 0; attempt <= this.config.maxReserveWaits; attempt++) {
      this.ensureLease(deadline, signal);
      try { await this.bridge('reserve', { leaseId }, signal, deadline); return; }
      catch (error) {
        if (error.code !== 'PROVIDER_WAIT') throw error;
        if (attempt === this.config.maxReserveWaits || !Number.isInteger(error.retryAfterMs) || error.retryAfterMs > this.config.maxReserveWaitMs || this.now() + error.retryAfterMs >= deadline) {
          throw new CollectorError(this.now() + error.retryAfterMs >= deadline ? 'LEASE_EXPIRED' : 'UPSTREAM_FAILED');
        }
        await this.wait(error.retryAfterMs, { signal });
      }
    }
  }
  async collect(signal) {
    aborted(signal);
    await this.bridge('heartbeat', { providerConfigured: this.config.provider.configured }, signal);
    if (!this.config.provider.configured) return { state: 'not-configured' };
    const claimStarted = this.now();
    const { job } = await this.bridge('claim', {}, signal);
    if (job === null) return { state: 'idle' };
    if (!job || typeof job !== 'object' || !UUID.test(job.leaseId)) throw new CollectorError('BRIDGE_INVALID');
    const query = claimedQuery(job.query), deadline = claimStarted + this.config.leaseMs;
    let publishing = false;
    try {
      const guides = {};
      for (const kind of ['sold', 'stock']) {
        await this.reserve(job.leaseId, deadline, signal);
        this.ensureLease(deadline, signal);
        // Reservation is immediately before each actual, serialized provider call.
        guides[kind] = await this.provider.getGuide(query, kind);
      }
      this.ensureLease(deadline, signal);
      const observedAt = new Date(this.now()).toISOString();
      const normalized = normalizeGuides(guides.sold.payload, guides.stock.payload, query, observedAt);
      normalized.trades = normalized.trades.slice(0, 500);
      normalized.quality.returnedTradeCount = normalized.trades.length;
      const payload = { leaseId: job.leaseId, observedAt, normalized };
      if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_PAYLOAD_BYTES) throw new CollectorError('PAYLOAD_TOO_LARGE');
      publishing = true;
      await this.bridge('publish', payload, signal, deadline);
      return { state: 'published' };
    } catch (error) {
      if (signal?.aborted || error.code === 'STOPPED') return { state: 'stopped' };
      // A lost publication response is ambiguous. Never retry/re-publish it.
      if (publishing || error.code === 'LEASE_EXPIRED' || this.now() >= deadline) return { state: error.code === 'LEASE_EXPIRED' || this.now() >= deadline ? 'lease-expired' : 'failed', errorCode: error.code || 'BRIDGE_FAILED' };
      const errorCode = SAFE_PROVIDER_ERRORS.has(error.code) ? error.code : 'UPSTREAM_FAILED';
      try { await this.bridge('failure', { leaseId: job.leaseId, errorCode }, signal, deadline); }
      catch (reportError) {
        if (signal?.aborted) return { state: 'stopped' };
        return { state: reportError.code === 'LEASE_EXPIRED' ? 'lease-expired' : 'failed', errorCode: reportError.code || 'BRIDGE_FAILED' };
      }
      return { state: 'failed', errorCode };
    }
  }
  async runOnce({ signal } = {}) {
    if (this.inflight) return this.inflight;
    this.activeSignal = signal;
    const operation = this.collect(signal);
    this.inflight = operation;
    try { return await operation; }
    finally { this.inflight = null; this.activeSignal = null; }
  }
  async run({ signal, once = false } = {}) {
    do {
      let delay = this.config.pollMs;
      try {
        const result = await this.runOnce({ signal });
        this.log({ event: 'collector', ...result });
      } catch (error) {
        if (signal?.aborted || error.code === 'STOPPED') break;
        this.log({ event: 'collector', state: 'failed', errorCode: error instanceof CollectorError ? error.code : 'UPSTREAM_FAILED' });
        delay = Math.max(this.config.pollMs, Math.min(60000, error.retryAfterMs || this.config.pollMs));
      }
      if (once || signal?.aborted) break;
      try { await this.wait(delay, { signal }); } catch (error) { if (signal?.aborted) break; throw new CollectorError('WAIT_FAILED'); }
    } while (!signal?.aborted);
  }
}

export async function startCollector({ env = process.env, args = process.argv.slice(2), log = value => console.log(JSON.stringify(value)) } = {}) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new CollectorError('NODE_24_REQUIRED');
  if (args.some(argument => argument !== '--once') || args.length > 1) throw new CollectorError('INVALID_ARGUMENT');
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
  try { await new SupabaseCollector(loadCollectorConfig(env), { log }).run({ signal: controller.signal, once: args.includes('--once') }); }
  finally { process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startCollector().catch(error => { console.error(JSON.stringify({ event: 'collector', state: 'failed', errorCode: error instanceof CollectorError ? error.code : 'UPSTREAM_FAILED' })); process.exitCode = 1; });
}
