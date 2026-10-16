import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export class ApiError extends Error {
  constructor(code, message, status = 503, retryAfterSeconds = 900) {
    super(message); this.code = code; this.status = status; this.retryAfterSeconds = retryAfterSeconds;
  }
}
function integer(env, key, fallback, min, max) {
  const value = env[key] === undefined ? fallback : Number(env[key]);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error('Invalid configuration: ' + key);
  return value;
}
export function loadConfig(env = process.env) {
  const secret = key => {
    try {
      const value = env[key] !== undefined ? env[key] : env[key + '_FILE'] ? readFileSync(env[key + '_FILE'], 'utf8') : '';
      return String(value).replace(/[\r\n]+$/, '');
    } catch (error) { throw new Error('Invalid configuration: ' + key + '_FILE'); }
  };
  const credentials = { consumerKey: secret('BRICKLINK_CONSUMER_KEY'), consumerSecret: secret('BRICKLINK_CONSUMER_SECRET'),
    token: secret('BRICKLINK_TOKEN_VALUE'), tokenSecret: secret('BRICKLINK_TOKEN_SECRET') };
  const origins = (env.ALLOW_ORIGINS ?? 'https://jbh-mine.github.io').split(',').map(value => value.trim()).filter(Boolean);
  for (const origin of origins) {
    let url; try { url = new URL(origin); } catch (error) { throw new Error('Invalid configuration: ALLOW_ORIGINS'); }
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) throw new Error('ALLOW_ORIGINS must contain exact HTTP(S) origins');
  }
  return {
    host: env.HOST || '0.0.0.0', port: integer(env, 'PORT', 8080, 0, 65535),
    dbPath: resolve(env.DB_PATH || './data/market.sqlite'), credentials,
    configured: Object.values(credentials).every(Boolean), adminToken: secret('ADMIN_TOKEN'), origins,
    trustProxy: env.TRUST_PROXY === '1',
    ttlMs: integer(env, 'CACHE_TTL_SECONDS', 21600, 600, 21600) * 1000,
    rawMaxAgeMs: 86400000, retentionDays: integer(env, 'OBSERVATION_RETENTION_DAYS', 730, 1, 730),
    dailyBudget: integer(env, 'DAILY_PROVIDER_BUDGET', 4500, 1, 4500),
    intervalMs: integer(env, 'PROVIDER_MIN_INTERVAL_MS', 1000, 1000, 60000),
    timeoutMs: integer(env, 'PROVIDER_TIMEOUT_MS', 10000, 1000, 30000),
    schedulerMs: integer(env, 'SCHEDULER_INTERVAL_SECONDS', 900, 60, 86400) * 1000,
    cooldownMs: 600000, backoffMs: 900000, maxWatch: 500, maxQueue: 64,
  };
}
export function parseQuery(setNum, params = new URLSearchParams()) {
  if (typeof setNum !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/.test(setNum)) throw new ApiError('INVALID_SET', 'Invalid catalog SET identifier.', 400, 0);
  const normalized = /-\d+$/.test(setNum) ? setNum : setNum + '-1';
  if (normalized.length > 40) throw new ApiError('INVALID_SET', 'Catalog SET identifier is too long.', 400, 0);
  const condition = params.get('condition') || 'N';
  const country = params.get('country') || 'GLOBAL';
  if (!['N', 'U'].includes(condition) || !['GLOBAL', 'KR'].includes(country) || (params.get('currency') || 'KRW') !== 'KRW') {
    throw new ApiError('INVALID_SCOPE', 'Use condition N/U, country GLOBAL/KR and currency KRW.', 400, 0);
  }
  for (const name of params.keys()) if (!['condition', 'country', 'currency', 'refresh'].includes(name)) throw new ApiError('INVALID_PARAMETER', 'Unsupported query parameter.', 400, 0);
  for (const name of new Set(params.keys())) if (params.getAll(name).length !== 1) throw new ApiError('INVALID_PARAMETER', 'Repeated query parameters are not allowed.', 400, 0);
  if (params.has('refresh') && params.get('refresh') !== '1') throw new ApiError('INVALID_PARAMETER', 'Use refresh=1 to request a refresh.', 400, 0);
  return { setNum: normalized, provider: 'bricklink', condition, country, currency: 'KRW' };
}
export function queryKey(query) { return [query.setNum, query.condition, query.country, query.currency].join('|'); }
