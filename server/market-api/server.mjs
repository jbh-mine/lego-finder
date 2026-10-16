import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { loadConfig, parseQuery, ApiError } from './config.mjs';
import { Store } from './store.mjs';
import { createProvider } from './provider.mjs';
import { MarketService } from './service.mjs';

function authorized(header, expected) {
  const supplied = /^Bearer (.+)$/i.exec(header || '')?.[1] || '';
  return Boolean(expected && supplied) && timingSafeEqual(createHash('sha256').update(supplied).digest(), createHash('sha256').update(expected).digest());
}
async function readBody(request) {
  return new Promise((resolve, reject) => {
    let length = 0, data = '', exceeded = false;
    request.on('data', chunk => {
      length += chunk.length;
      if (length > 8192) {
        if (!exceeded) reject(new ApiError('BODY_TOO_LARGE', 'Request body exceeds 8 KiB.', 413, 0));
        exceeded = true;
      } else if (!exceeded) data += chunk;
    });
    request.on('end', () => {
      if (exceeded) return;
      try { const parsed = JSON.parse(data || '{}'); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); resolve(parsed); }
      catch (error) { reject(new ApiError('INVALID_BODY', 'Provide a JSON object.', 400, 0)); }
    });
    request.on('error', () => reject(new ApiError('INVALID_BODY', 'The request body could not be read.', 400, 0)));
  });
}
export function createApplication(config = loadConfig(), { store = new Store(config.dbPath, config), provider = createProvider(config), now = Date.now, wait, scheduler = true } = {}) {
  const service = new MarketService(config, store, provider, { now, ...(wait ? { wait } : {}) });
  const clients = new Map();
  const server = createServer({ requestTimeout: 30000, headersTimeout: 10000, maxHeaderSize: 16384 }, async (request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        ...(body.retryAfterSeconds > 0 ? { 'Retry-After': String(body.retryAfterSeconds) } : {}) });
      response.end(JSON.stringify(body));
    };
    try {
      const origin = request.headers.origin;
      if (origin && !config.origins.includes(origin)) throw new ApiError('ORIGIN_DENIED', 'This origin is not allowed.', 403, 0);
      if (origin) {
        response.setHeader('Access-Control-Allow-Origin', origin); response.setHeader('Vary', 'Origin');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.setHeader('Access-Control-Expose-Headers', 'Retry-After');
      }
      if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/health') { send(200, { ok: true, schemaVersion: 1, configured: config.configured, provider: 'bricklink' }); return; }
      let ip = request.socket.remoteAddress || 'unknown';
      if (config.trustProxy) {
        // Explicit single trusted hop. The API must be inaccessible directly;
        // choose the rightmost address added by Caddy, not an attacker prefix.
        const forwarded = String(request.headers['x-forwarded-for'] || '').split(',').at(-1).trim();
        if (isIP(forwarded)) ip = forwarded;
      }
      const window = Math.floor(now() / 60000), counter = clients.get(ip);
      const client = counter?.window === window ? counter : { window, count: 0 };
      client.count++; clients.set(ip, client);
      if (clients.size > 10000) for (const [key, value] of clients) if (value.window !== window) clients.delete(key);
      if (client.count > 60) throw new ApiError('RATE_LIMITED', 'Too many requests from this client.', 429, 60);
      const match = /^\/v1\/market\/([^/]+)$/.exec(url.pathname);
      if (request.method === 'GET' && match) {
        let id; try { id = decodeURIComponent(match[1]); } catch (error) { throw new ApiError('INVALID_SET', 'Invalid catalog SET identifier.', 400, 0); }
        const query = parseQuery(id, url.searchParams);
        send(200, await service.get(query, { refresh: url.searchParams.get('refresh') === '1' })); return;
      }
      if (request.method === 'POST' && url.pathname === '/v1/admin/refresh') {
        if (!authorized(request.headers.authorization, config.adminToken)) throw new ApiError('UNAUTHORIZED', 'Administrator authentication is required.', 401, 0);
        const body = await readBody(request);
        if (Object.keys(body).some(key => !['setNum', 'condition', 'country'].includes(key)) || (!body.setNum && Object.keys(body).length)) {
          throw new ApiError('INVALID_BODY', 'Use an empty object or setNum with optional condition and country.', 400, 0);
        }
        if (body.setNum) {
          const params = new URLSearchParams({ condition: body.condition || 'N', country: body.country || 'GLOBAL', refresh: '1' });
          send(200, await service.get(parseQuery(body.setNum, params), { refresh: true }));
        } else {
          send(202, { schemaVersion: 1, scheduled: service.refreshDue() });
        }
        return;
      }
      throw new ApiError('NOT_FOUND', 'API route not found.', 404, 0);
    } catch (failure) {
      const error = failure instanceof ApiError ? failure : new ApiError('INTERNAL_ERROR', 'The market service could not complete the request.', 500);
      if (!response.headersSent) send(error.status, { schemaVersion: 1, error: { code: error.code, message: error.message }, retryAfterSeconds: error.retryAfterSeconds });
    }
  });
  if (scheduler) service.startScheduler();
  return { server, service, store, async close() {
    await new Promise(resolve => server.close(resolve));
    await service.close(); store.close();
  } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required.');
  const config = loadConfig();
  const app = createApplication(config);
  app.server.listen(config.port, config.host, () => console.log(JSON.stringify({ event: 'listening', port: config.port, configured: config.configured, provider: 'bricklink' })));
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => app.close().then(() => process.exit(0)));
}
