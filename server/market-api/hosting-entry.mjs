import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfig } from './config.mjs';

export const ENTRY_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const FREE_PRESET = Object.freeze({ MAX_WATCHED_SCOPES: '50', MAX_PROVIDER_QUEUE: '8',
  SCHEDULER_BATCH_SIZE: '4', DAILY_PROVIDER_BUDGET: '1200' });

// Pure adapter: the hosting preset is opt-in and explicit settings win.
export function hostingEnvironment(env, directory = ENTRY_DIRECTORY) {
  const adapted = { ...env };
  if (adapted.HOST === undefined && adapted.IP !== undefined) adapted.HOST = adapted.IP;
  const preset = adapted.MARKET_HOSTING_PRESET;
  if (preset && preset !== 'alwaysdata-free') throw new Error('Invalid configuration: MARKET_HOSTING_PRESET');
  if (preset === 'alwaysdata-free') {
    for (const [name, value] of Object.entries(FREE_PRESET)) if (adapted[name] === undefined) adapted[name] = value;
  }
  adapted.DB_PATH = resolve(directory, adapted.DB_PATH || 'data/market.sqlite');
  return adapted;
}

export function requireNode24(version = process.versions.node) {
  const major = Number(version.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) throw new Error('Node.js 24 or newer is required.');
}

export function loadHostingConfig(directory = ENTRY_DIRECTORY) {
  requireNode24();
  // Reserve platform binding values before .env, which does not overwrite the
  // existing environment. In particular, alwaysdata supplies IP rather than HOST.
  if (process.env.HOST === undefined && process.env.IP !== undefined) process.env.HOST = process.env.IP;
  try { process.loadEnvFile(join(directory, '.env')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error('The server .env configuration could not be loaded.');
  }
  return loadConfig(hostingEnvironment(process.env, directory));
}

export async function startHostingServer() {
  const config = loadHostingConfig();
  // Defer node:sqlite import until after the Node version check. Merely importing
  // this entry point never opens the database, listens or starts the scheduler.
  const { startServer } = await import('./server.mjs');
  return startServer(config);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startHostingServer();
}
