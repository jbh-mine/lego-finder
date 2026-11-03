const ORIGIN = 'https://jbh-mine.github.io';
const MAX_BODY = 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAILURE_CODES = new Set(['NOT_FOUND', 'PROVIDER_AUTH', 'UPSTREAM_UNAVAILABLE', 'UPSTREAM_INVALID',
  'UPSTREAM_SCOPE_MISMATCH', 'UPSTREAM_RATE_LIMITED', 'UPSTREAM_FAILED', 'QUOTA_EXCEEDED', 'PAYLOAD_TOO_LARGE']);
const CURRENT_FIELDS = ['value', 'basis', 'sampleCount', 'min', 'max', 'latestPrice', 'latestTradeAt',
  'sixMonthAverage', 'sixMonthQuantityAverage', 'sixMonthLots', 'sixMonthUnits', 'lowestAskingPrice', 'askingLots'];
const QUALITY_FIELDS = ['historyKind', 'tradeIdentity', 'subconditionKnown', 'providerDetailCount', 'returnedTradeCount', 'historyComplete'];
const TRADE_FIELDS = ['rowKey', 'price', 'date', 'datePrecision', 'quantity', 'sellerCountry', 'buyerCountry'];

class HttpError extends Error {
  constructor(status, code, message, retryAfterSeconds = 0) {
    super(message); Object.assign(this, { status, code, retryAfterSeconds });
  }
}
const fail = (status, code, message, retry = 0) => { throw new HttpError(status, code, message, retry); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER;
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 2147483647;
const nullable = (value, predicate) => value === null || predicate(value);
function fields(value, expected) {
  return object(value) && Object.keys(value).length === expected.length && expected.every(name => Object.hasOwn(value, name));
}
function timestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
}
function noQuery(url) {
  if (url.searchParams.size) fail(400, 'INVALID_PARAMETER', 'This route does not accept query parameters.');
}
function parseMarket(url, id) {
  const keys = ['condition', 'country', 'currency', 'refresh'];
  for (const name of url.searchParams.keys()) {
    if (!keys.includes(name) || url.searchParams.getAll(name).length !== 1) fail(400, 'INVALID_PARAMETER', 'Unsupported or repeated query parameter.');
  }
  let setNum;
  try { setNum = decodeURIComponent(id); } catch { fail(400, 'INVALID_SET', 'Invalid catalog identifier.'); }
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/.test(setNum)) fail(400, 'INVALID_SET', 'Invalid catalog identifier.');
  if (!/-\d+$/.test(setNum)) setNum += '-1';
  if (setNum.length > 40) fail(400, 'INVALID_SET', 'Catalog identifier is too long.');
  const condition = url.searchParams.get('condition') ?? 'N';
  const country = url.searchParams.get('country') ?? 'GLOBAL';
  const currency = url.searchParams.get('currency') ?? 'KRW';
  if (!['N', 'U'].includes(condition) || !['GLOBAL', 'KR'].includes(country) || currency !== 'KRW') {
    fail(400, 'INVALID_SCOPE', 'Use condition N/U, country GLOBAL/KR and currency KRW.');
  }
  if (url.searchParams.has('refresh') && url.searchParams.get('refresh') !== '1') fail(400, 'INVALID_PARAMETER', 'Use refresh=1.');
  return { setNum, condition, country, refresh: url.searchParams.has('refresh') };
}

async function readLimited(stream, maximum) {
  if (!stream) return '';
  const reader = stream.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); fail(413, 'BODY_TOO_LARGE', 'Request body exceeds 1 MiB.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { fail(400, 'INVALID_BODY', 'Request body must use UTF-8 JSON.'); }
}
async function readBody(request) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) {
    fail(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use application/json.');
  }
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY)) fail(413, 'BODY_TOO_LARGE', 'Request body exceeds 1 MiB.');
  let body;
  try { body = JSON.parse(await readLimited(request.body, MAX_BODY)); }
  catch (error) { if (error instanceof HttpError) throw error; fail(400, 'INVALID_BODY', 'Provide a JSON object.'); }
  if (!object(body)) fail(400, 'INVALID_BODY', 'Provide a JSON object.');
  return body;
}
function validatePublish(body, now) {
  if (!fields(body, ['leaseId', 'observedAt', 'normalized']) || !UUID.test(body.leaseId) || !timestamp(body.observedAt)) return false;
  const at = Date.parse(body.observedAt);
  if (at > now + 60000 || at < now - 300000 || !fields(body.normalized, ['current', 'trades', 'quality'])) return false;
  const { current, trades, quality } = body.normalized;
  if (!fields(current, CURRENT_FIELDS) || !count(current.sampleCount) || current.sampleCount > 1000000 ||
      !nullable(current.value, positive) || (current.value === null ? current.basis !== null || current.sampleCount !== 0 : current.basis !== 'recent-30d-median' || current.sampleCount < 1) ||
      ['min', 'max', 'latestPrice', 'sixMonthAverage', 'sixMonthQuantityAverage', 'lowestAskingPrice'].some(name => !nullable(current[name], positive)) ||
      ['sixMonthLots', 'sixMonthUnits', 'askingLots'].some(name => !nullable(current[name], count)) ||
      !nullable(current.latestTradeAt, timestamp) || (current.latestTradeAt !== null && Date.parse(current.latestTradeAt) > at) ||
      ((current.latestTradeAt === null) !== (current.latestPrice === null)) ||
      (current.value !== null && (!positive(current.min) || !positive(current.max) || current.value < current.min || current.value > current.max)) ||
      (current.value === null && (current.min !== null || current.max !== null))) return false;
  if (!Array.isArray(trades) || trades.length > 500 || trades.some(row => !fields(row, TRADE_FIELDS) ||
      typeof row.rowKey !== 'string' || row.rowKey.length < 1 || row.rowKey.length > 100 || !positive(row.price) ||
      !timestamp(row.date) || Date.parse(row.date) > at || row.datePrecision !== 'timestamp' ||
      !Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > 2147483647 ||
      ![row.sellerCountry, row.buyerCountry].every(country => country === null || typeof country === 'string' && /^[A-Z]{2}$/.test(country)))) return false;
  if (new Set(trades.map(row => row.rowKey)).size !== trades.length || !fields(quality, QUALITY_FIELDS) ||
      quality.historyKind !== 'daily-market-observations' || quality.tradeIdentity !== 'anonymous-provider-rows' ||
      quality.subconditionKnown !== false || quality.historyComplete !== false || !count(quality.providerDetailCount) ||
      quality.providerDetailCount > 1000000 || quality.returnedTradeCount !== trades.length || quality.providerDetailCount < trades.length ||
      current.sampleCount > quality.providerDetailCount) return false;
  return true;
}
function validateWorker(action, body, now) {
  const valid = action === 'heartbeat' ? fields(body, ['providerConfigured']) && typeof body.providerConfigured === 'boolean'
    : action === 'claim' ? fields(body, [])
    : action === 'reserve' ? fields(body, ['leaseId']) && UUID.test(body.leaseId)
    : action === 'failure' ? fields(body, ['leaseId', 'errorCode']) && UUID.test(body.leaseId) && FAILURE_CODES.has(body.errorCode)
    : action === 'publish' && validatePublish(body, now);
  if (!valid) fail(400, 'INVALID_BODY', 'Collector payload does not match this operation.');
}
async function digestToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer ([\x21-\x7e]{32,512})$/i.exec(header);
  if (!match) fail(401, 'UNAUTHORIZED', 'Collector authentication is required.');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(match[1]));
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
}
function routePath(pathname) {
  for (const prefix of ['/functions/v1/lego-market-api', '/lego-market-api']) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return pathname.slice(prefix.length) || '/';
  }
  return pathname;
}
function ipKey(request) {
  const candidate = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',').at(-1).trim();
  return candidate && /^[0-9a-f:.]{1,64}$/i.test(candidate) ? candidate : 'unknown';
}

// The limiter is best-effort per Edge isolate; durable quota/leases are in SQL.
export function createHandler({ rpc, now = Date.now, allowedOrigin = ORIGIN, maxClients = 10000 } = {}) {
  if (typeof rpc !== 'function') throw new Error('A market RPC transport is required.');
  const clients = new Map();
  return async request => {
    const origin = request.headers.get('origin');
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
    const send = (status, body, extra = {}) => {
      const retry = Number(body?.retryAfterSeconds);
      return new Response(status === 204 ? null : JSON.stringify(body), { status,
        headers: { ...headers, ...(retry > 0 && Number.isFinite(retry) ? { 'Retry-After': String(Math.ceil(retry)) } : {}), ...extra } });
    };
    try {
      if (origin && origin !== allowedOrigin) fail(403, 'ORIGIN_DENIED', 'This origin is not allowed.');
      if (origin) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, Vary: 'Origin',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'Retry-After' });
      if (request.method === 'OPTIONS') {
        const method = request.headers.get('access-control-request-method');
        const requestedHeaders = (request.headers.get('access-control-request-headers') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
        if (method && !['GET', 'POST'].includes(method) || requestedHeaders.some(name => !['content-type', 'authorization'].includes(name))) {
          fail(403, 'PREFLIGHT_DENIED', 'This cross-origin request is not allowed.');
        }
        return send(204, null);
      }
      const url = new URL(request.url), path = routePath(url.pathname);
      const collector = /^\/v1\/collector\/(heartbeat|claim|reserve|publish|failure)$/.exec(path);
      const market = /^\/v1\/market\/([^/]+)$/.exec(path);
      const method = collector ? 'POST' : path === '/health' || market ? 'GET' : null;
      if (!method) fail(404, 'NOT_FOUND', 'API route not found.');
      if (request.method !== method) return send(405, { schemaVersion: 1, error: { code: 'METHOD_NOT_ALLOWED', message: 'Unsupported HTTP method.' }, retryAfterSeconds: 0 }, { Allow: method });
      const key = (collector ? 'worker|' : 'public|') + ipKey(request), window = Math.floor(now() / 60000);
      if (clients.size >= maxClients) for (const [stored, value] of clients) if (value.window !== window) clients.delete(stored);
      if (!clients.has(key) && clients.size >= maxClients) fail(429, 'RATE_LIMITED', 'Too many clients; retry shortly.', 60);
      const counter = clients.get(key)?.window === window ? clients.get(key) : { window, calls: 0 };
      counter.calls++; clients.set(key, counter);
      if (counter.calls > (collector ? 360 : 60)) fail(429, 'RATE_LIMITED', 'Too many requests; retry shortly.', 60);
      let action, payload, workerDigest = null;
      if (collector) {
        noQuery(url); workerDigest = await digestToken(request);
        payload = await readBody(request); action = collector[1];
        validateWorker(action, payload, now());
      } else if (market) { action = 'get'; payload = parseMarket(url, market[1]); }
      else { noQuery(url); action = 'health'; payload = {}; }
      const result = await rpc(action, payload, workerDigest);
      if (!object(result) || !Number.isInteger(result.httpStatus) || result.httpStatus < 200 || result.httpStatus > 599 ||
          result.httpStatus === 204 || !object(result.body)) fail(503, 'STORAGE_UNAVAILABLE', 'Market storage returned an invalid response.', 30);
      return send(result.httpStatus, result.body);
    } catch (error) {
      const safe = error instanceof HttpError ? error : new HttpError(503, 'STORAGE_UNAVAILABLE', 'Market storage is temporarily unavailable.', 30);
      return send(safe.status, { schemaVersion: 1, error: { code: safe.code, message: safe.message }, retryAfterSeconds: safe.retryAfterSeconds });
    }
  };
}

export function createRpc({ url, serviceKey, fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  let endpoint;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(parsed.hostname) || parsed.port || parsed.username || parsed.password ||
        parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error();
    endpoint = parsed.origin + '/rest/v1/rpc/lego_market_dispatch';
    if (typeof serviceKey !== 'string' || !serviceKey) throw new Error();
  } catch { throw new Error('Supabase server configuration is unavailable.'); }
  return async (action, payload, workerDigest = null) => {
    try {
      const response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error',
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ p_action: action, p_payload: payload, p_worker_digest: workerDigest }), signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) throw new Error();
      return JSON.parse(await readLimited(response.body, 2 * MAX_BODY));
    } catch { throw new Error('Market storage transport failed.'); }
  };
}
