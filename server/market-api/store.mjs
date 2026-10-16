import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { queryKey, ApiError } from './config.mjs';

export class Store {
  constructor(file, { rawMaxAgeMs = 86400000, retentionDays = 730, maxWatch = 500 } = {}) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file, { timeout: 5000 });
    this.rawMaxAgeMs = rawMaxAgeMs; this.retentionDays = retentionDays; this.maxWatch = maxWatch;
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, query_json TEXT NOT NULL,
        observed_at INTEGER, expires_at INTEGER, raw_json TEXT, normalized_json TEXT,
        last_attempt INTEGER, error_code TEXT, next_refresh INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL DEFAULT 'ok');
      CREATE TABLE IF NOT EXISTS watchlist (key TEXT PRIMARY KEY, query_json TEXT NOT NULL, last_requested INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS observations (key TEXT NOT NULL, date TEXT NOT NULL, observed_at INTEGER NOT NULL,
        price REAL NOT NULL, sample_count INTEGER NOT NULL, basis TEXT NOT NULL, PRIMARY KEY(key,date));
      CREATE TABLE IF NOT EXISTS quota (day TEXT PRIMARY KEY, calls INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS observations_age ON observations(date);
      PRAGMA user_version=1;`);
  }
  watch(query, now) {
    const key = queryKey(query);
    this.db.prepare('INSERT INTO watchlist VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET last_requested=excluded.last_requested').run(key, JSON.stringify(query), now);
    this.db.prepare('DELETE FROM watchlist WHERE key IN (SELECT key FROM watchlist ORDER BY last_requested DESC,key DESC LIMIT -1 OFFSET ?)').run(this.maxWatch);
  }
  get(query) {
    const row = this.db.prepare('SELECT * FROM cache WHERE key=?').get(queryKey(query));
    if (!row) return null;
    return { ...row, normalized: row.normalized_json ? JSON.parse(row.normalized_json) : null };
  }
  success(query, normalized, raw, now, ttlMs) {
    const key = queryKey(query), date = new Date(now).toISOString().slice(0, 10);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`INSERT INTO cache(key,query_json,observed_at,expires_at,raw_json,normalized_json,last_attempt,error_code,next_refresh,state)
        VALUES(?,?,?,?,?,?,?,NULL,?,'ok') ON CONFLICT(key) DO UPDATE SET observed_at=excluded.observed_at,expires_at=excluded.expires_at,
        raw_json=excluded.raw_json,normalized_json=excluded.normalized_json,last_attempt=excluded.last_attempt,error_code=NULL,next_refresh=excluded.next_refresh,state='ok'`)
        .run(key, JSON.stringify(query), now, now + ttlMs, JSON.stringify(raw), JSON.stringify(normalized), now, now + ttlMs);
      if (normalized.current.value !== null) this.db.prepare(`INSERT INTO observations VALUES(?,?,?,?,?,?) ON CONFLICT(key,date)
        DO UPDATE SET observed_at=excluded.observed_at,price=excluded.price,sample_count=excluded.sample_count,basis=excluded.basis`)
        .run(key, date, now, normalized.current.value, normalized.current.sampleCount, 'recent-30d-median');
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  failure(query, error, now, nextRefresh) {
    this.db.prepare(`INSERT INTO cache(key,query_json,last_attempt,error_code,next_refresh,state) VALUES(?,?,?,?,?,?)
      ON CONFLICT(key) DO UPDATE SET last_attempt=excluded.last_attempt,error_code=excluded.error_code,next_refresh=excluded.next_refresh,state=excluded.state`)
      .run(queryKey(query), JSON.stringify(query), now, error.code, nextRefresh, error.code === 'QUOTA_EXCEEDED' ? 'quota' : 'failed');
  }
  history(query) {
    return this.db.prepare('SELECT date,observed_at,price,sample_count,basis FROM observations WHERE key=? ORDER BY date').all(queryKey(query))
      .map(row => ({ date: row.date, observedAt: new Date(row.observed_at).toISOString(), price: row.price, basis: row.basis,
        sampleCount: row.sample_count, currency: 'KRW', condition: query.condition, country: query.country, source: 'BrickLink' }));
  }
  consumeQuota(now, limit) {
    const day = new Date(now).toISOString().slice(0, 10);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const calls = this.db.prepare('SELECT calls FROM quota WHERE day=?').get(day)?.calls || 0;
      if (calls >= limit) throw new ApiError('QUOTA_EXCEEDED', 'The daily provider request budget is exhausted.', 429, Math.ceil((Date.parse(day + 'T00:00:00Z') + 86400000 - now) / 1000));
      this.db.prepare('INSERT INTO quota VALUES(?,1) ON CONFLICT(day) DO UPDATE SET calls=calls+1').run(day);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  due(now, limit = 50) {
    return this.db.prepare(`SELECT w.query_json FROM watchlist w LEFT JOIN cache c ON c.key=w.key
      WHERE w.last_requested>=? AND COALESCE(c.next_refresh,0)<=? ORDER BY COALESCE(c.next_refresh,0) LIMIT ?`)
      .all(now - 7 * 86400000, now, limit).map(row => JSON.parse(row.query_json));
  }
  cleanup(now) {
    this.db.prepare('UPDATE cache SET raw_json=NULL,normalized_json=NULL WHERE observed_at<=?').run(now - this.rawMaxAgeMs);
    this.db.prepare('DELETE FROM observations WHERE date<?').run(new Date(now - this.retentionDays * 86400000).toISOString().slice(0, 10));
    this.db.prepare('DELETE FROM watchlist WHERE last_requested<?').run(now - 7 * 86400000);
    this.db.prepare('DELETE FROM cache WHERE COALESCE(last_attempt,observed_at,0)<? AND key NOT IN (SELECT key FROM watchlist)').run(now - 7 * 86400000);
    this.db.prepare('DELETE FROM quota WHERE day<?').run(new Date(now - 7 * 86400000).toISOString().slice(0, 10));
  }
  close() { this.db.close(); }
}
