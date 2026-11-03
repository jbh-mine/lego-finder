import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../config.mjs';
import { ENTRY_DIRECTORY, hostingEnvironment, loadHostingConfig, requireNode24 } from '../hosting-entry.mjs';

const root = fileURLToPath(new URL('../.test-data/', import.meta.url));
const keys = ['HOST', 'IP', 'PORT', 'DB_PATH', 'MARKET_HOSTING_PRESET', 'MAX_WATCHED_SCOPES', 'MAX_PROVIDER_QUEUE',
  'SCHEDULER_BATCH_SIZE', 'DAILY_PROVIDER_BUDGET', 'CACHE_TTL_SECONDS', 'OBSERVATION_RETENTION_DAYS', 'ALLOW_ORIGINS',
  'SCHEDULER_INTERVAL_SECONDS', 'PROVIDER_MIN_INTERVAL_MS', 'PROVIDER_TIMEOUT_MS', 'ADMIN_TOKEN', 'ADMIN_TOKEN_FILE',
  'BRICKLINK_CONSUMER_KEY', 'BRICKLINK_CONSUMER_SECRET', 'BRICKLINK_TOKEN_VALUE', 'BRICKLINK_TOKEN_SECRET',
  'BRICKLINK_CONSUMER_KEY_FILE', 'BRICKLINK_CONSUMER_SECRET_FILE', 'BRICKLINK_TOKEN_VALUE_FILE', 'BRICKLINK_TOKEN_SECRET_FILE'];
function setup(t) {
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(join(root, 'hosting-'));
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value;
    assert.equal(dirname(resolve(directory)), resolve(root));
    rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

test('capacity defaults are unchanged and bounded scheduler batches must fit strictly inside the queue', () => {
  const config = loadConfig({});
  assert.equal(config.maxWatch, 500); assert.equal(config.maxQueue, 64); assert.equal(config.schedulerBatchSize, 50);
  const small = loadConfig({ MAX_WATCHED_SCOPES: '1', MAX_PROVIDER_QUEUE: '2', SCHEDULER_BATCH_SIZE: '1' });
  assert.equal(small.maxWatch, 1); assert.equal(small.maxQueue, 2); assert.equal(small.schedulerBatchSize, 1);
  for (const env of [{ MAX_WATCHED_SCOPES: '0' }, { MAX_WATCHED_SCOPES: '501' }, { MAX_PROVIDER_QUEUE: '1' },
    { MAX_PROVIDER_QUEUE: '65' }, { SCHEDULER_BATCH_SIZE: '0' }, { SCHEDULER_BATCH_SIZE: '51' },
    { MAX_PROVIDER_QUEUE: '8', SCHEDULER_BATCH_SIZE: '8' }, { MAX_PROVIDER_QUEUE: '8' }]) {
    assert.throws(() => loadConfig(env), /Invalid configuration/);
  }
});

test('the free preset is opt-in and explicit capacity or budget settings take priority', () => {
  const defaults = loadConfig(hostingEnvironment({}));
  assert.equal(defaults.dailyBudget, 4500); assert.equal(defaults.maxWatch, 500);
  const free = loadConfig(hostingEnvironment({ MARKET_HOSTING_PRESET: 'alwaysdata-free' }));
  assert.equal(free.maxQueue, 8); assert.equal(free.schedulerBatchSize, 4);
  assert.equal(free.maxWatch, 50); assert.equal(free.dailyBudget, 1200);
  const custom = loadConfig(hostingEnvironment({ MARKET_HOSTING_PRESET: 'alwaysdata-free', MAX_WATCHED_SCOPES: '20',
    MAX_PROVIDER_QUEUE: '6', SCHEDULER_BATCH_SIZE: '2', DAILY_PROVIDER_BUDGET: '300' }));
  assert.equal(custom.maxWatch, 20); assert.equal(custom.maxQueue, 6); assert.equal(custom.schedulerBatchSize, 2); assert.equal(custom.dailyBudget, 300);
  assert.throws(() => hostingEnvironment({ MARKET_HOSTING_PRESET: 'misspelled' }), /MARKET_HOSTING_PRESET/);
});

test('database defaults and relative overrides resolve from the entry directory rather than the host working directory', () => {
  assert.equal(hostingEnvironment({}).DB_PATH, join(ENTRY_DIRECTORY, 'data', 'market.sqlite'));
  const base = resolve(root, 'server-folder');
  assert.equal(hostingEnvironment({ DB_PATH: './persistent/prices.sqlite' }, base).DB_PATH, join(base, 'persistent', 'prices.sqlite'));
  const absolute = resolve(root, 'volume', 'market.sqlite');
  assert.equal(hostingEnvironment({ DB_PATH: absolute }, base).DB_PATH, absolute);
});

test('platform IP and PORT are reserved before .env, whose credentials remain server-only and are not printed', t => {
  const directory = setup(t);
  process.env.IP = 'fd00::1234'; process.env.PORT = '18123';
  writeFileSync(join(directory, '.env'), 'HOST=0.0.0.0\nPORT=8080\nDB_PATH=./private/market.sqlite\nBRICKLINK_CONSUMER_KEY=fixture-private-key\nADMIN_TOKEN=fixture-private-token\n');
  const config = loadHostingConfig(directory);
  assert.equal(config.host, 'fd00::1234'); assert.equal(config.port, 18123);
  assert.equal(config.dbPath, join(directory, 'private', 'market.sqlite'));
  assert.equal(config.credentials.consumerKey, 'fixture-private-key'); assert.equal(config.adminToken, 'fixture-private-token');
  assert.equal(existsSync(join(directory, 'private')), false);
});

test('explicit platform HOST wins over IP and file HOST while file-only values and free defaults still load', t => {
  const directory = setup(t);
  process.env.HOST = '127.0.0.2'; process.env.IP = 'fd00::5678'; process.env.MARKET_HOSTING_PRESET = 'alwaysdata-free';
  process.env.DAILY_PROVIDER_BUDGET = '200';
  writeFileSync(join(directory, '.env'), 'HOST=0.0.0.0\nPORT=18080\nDAILY_PROVIDER_BUDGET=300\nMAX_WATCHED_SCOPES=25\n');
  const config = loadHostingConfig(directory);
  assert.equal(config.host, '127.0.0.2'); assert.equal(config.port, 18080);
  assert.equal(config.dailyBudget, 200); assert.equal(config.maxWatch, 25);
  assert.equal(config.maxQueue, 8); assert.equal(config.schedulerBatchSize, 4);
});

test('an absent .env is supported, loading does not open a DB, and configuration failures do not echo secret values', t => {
  const directory = setup(t);
  const config = loadHostingConfig(directory);
  assert.equal(config.configured, false); assert.equal(config.dbPath, join(directory, 'data', 'market.sqlite'));
  assert.equal(existsSync(join(directory, 'data')), false);
  const secret = 'fixture-secret-must-never-be-repeated';
  writeFileSync(join(directory, '.env'), 'ADMIN_TOKEN=' + secret + '\nMAX_PROVIDER_QUEUE=' + secret + '\n');
  assert.throws(() => loadHostingConfig(directory), error => error.message.includes('MAX_PROVIDER_QUEUE') && !error.message.includes(secret));
});

test('the entry point requires Node 24 before importing the SQLite server', () => {
  assert.throws(() => requireNode24('20.20.2'), /Node.js 24/);
  assert.throws(() => requireNode24('invalid'), /Node.js 24/);
  assert.doesNotThrow(() => requireNode24('24.19.0'));
});
