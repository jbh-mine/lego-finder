import { setTimeout as sleep } from 'node:timers/promises';
import { ApiError, queryKey } from './config.mjs';
import { normalizeGuides } from './provider.mjs';

export class MarketService {
  constructor(config, store, provider, { now = Date.now, wait = sleep } = {}) {
    this.config = config; this.store = store; this.provider = provider; this.now = now; this.wait = wait;
    this.inflight = new Map(); this.tail = Promise.resolve(); this.pending = 0; this.lastStart = -Infinity;
    this.timer = null; this.stopped = false;
  }
  providerCall(task) {
    if (this.pending >= this.config.maxQueue) return Promise.reject(new ApiError('SERVER_BUSY', 'The provider refresh queue is busy.', 503, 60));
    this.pending++;
    const operation = this.tail.then(async () => {
      const delay = this.lastStart + this.config.intervalMs - this.now();
      if (delay > 0) await this.wait(delay);
      this.lastStart = this.now();
      this.store.consumeQuota(this.now(), this.config.dailyBudget);
      return task();
    });
    this.tail = operation.catch(() => {}).finally(() => { this.pending--; });
    return operation;
  }
  async refresh(query) {
    const key = queryKey(query);
    if (this.inflight.has(key)) return this.inflight.get(key);
    const operation = (async () => {
      try {
        const sold = await this.providerCall(() => this.provider.getGuide(query, 'sold'));
        const stock = await this.providerCall(() => this.provider.getGuide(query, 'stock'));
        const at = this.now();
        const normalized = normalizeGuides(sold.payload, stock.payload, query, new Date(at).toISOString());
        this.store.success(query, normalized, { sold: sold.text, stock: stock.text }, at, this.config.ttlMs);
        return this.store.get(query);
      } catch (failure) {
        const error = failure instanceof ApiError ? failure : new ApiError('UPSTREAM_FAILED', 'Market data could not be refreshed.');
        this.store.failure(query, error, this.now(), this.now() + Math.max(this.config.backoffMs, error.retryAfterSeconds * 1000));
        throw error;
      }
    })();
    this.inflight.set(key, operation);
    try { return await operation; } finally { this.inflight.delete(key); }
  }
  response(query, row, { cooldown = false } = {}) {
    const now = this.now(), data = row?.normalized;
    if (!data || now - row.observed_at >= this.config.rawMaxAgeMs) return null;
    const stale = now >= row.expires_at || row.state !== 'ok';
    return { schemaVersion: 1, status: stale ? 'stale' : data.current.value === null ? 'no-sales' : 'fresh', query,
      observedAt: new Date(row.observed_at).toISOString(), expiresAt: new Date(row.expires_at).toISOString(),
      retryAfterSeconds: Math.max(0, Math.ceil((row.next_refresh - now) / 1000)),
      sourceUrl: 'https://www.bricklink.com/v2/catalog/catalogitem.page?S=' + encodeURIComponent(query.setNum),
      ...data, history: this.store.history(query),
      refresh: { state: cooldown ? 'cooldown' : row.state, errorCode: row.error_code || null, nextRefreshAt: new Date(row.next_refresh).toISOString() },
      retention: { rawHours: 24, observationDays: this.config.retentionDays } };
  }
  async get(query, { refresh = false, watch = true } = {}) {
    if (watch) this.store.watch(query, this.now());
    this.store.cleanup(this.now());
    if (!this.config.configured) throw new ApiError('NOT_CONFIGURED', 'The market provider has not been configured on the server.', 503, 900);
    let row = this.store.get(query);
    const cooling = row && this.now() - row.last_attempt < this.config.cooldownMs;
    if (row && ((refresh && cooling) || (!refresh && ((row.state === 'ok' && this.now() < row.expires_at) || this.now() < row.next_refresh)))) {
      const cached = this.response(query, row, { cooldown: refresh && cooling });
      if (cached) return cached;
      if (this.now() < row.next_refresh) throw new ApiError(row.error_code || 'REFRESH_PENDING', 'No sufficiently recent market data is available.', row.error_code === 'NOT_FOUND' ? 404 : row.error_code === 'QUOTA_EXCEEDED' ? 429 : 503, Math.ceil((row.next_refresh - this.now()) / 1000));
    }
    // Backoff applies to public/manual refresh too; force never bypasses quota.
    if (row?.state !== 'ok' && this.now() < row?.next_refresh) {
      const cached = this.response(query, row);
      if (cached) return cached;
      throw new ApiError(row.error_code || 'REFRESH_PENDING', 'The provider refresh is in a retry cooldown.', row.error_code === 'QUOTA_EXCEEDED' ? 429 : row.error_code === 'NOT_FOUND' ? 404 : 503, Math.ceil((row.next_refresh - this.now()) / 1000));
    }
    try { row = await this.refresh(query); }
    catch (error) {
      const cached = this.response(query, this.store.get(query));
      if (cached) return cached;
      throw error;
    }
    return this.response(query, row);
  }
  refreshDue() {
    if (this.stopped) return 0;
    this.store.cleanup(this.now());
    if (!this.config.configured) return 0;
    const due = this.store.due(this.now(), 50).filter(query => !this.inflight.has(queryKey(query)));
    for (const query of due) this.get(query, { watch: false }).catch(() => {});
    return due.length;
  }
  startScheduler() {
    if (this.timer) return;
    this.timer = setInterval(() => this.refreshDue(), this.config.schedulerMs);
    this.timer.unref();
    this.refreshDue();
  }
  async close() {
    this.stopped = true; clearInterval(this.timer); this.timer = null;
    await Promise.allSettled([...this.inflight.values()]);
    await this.tail;
  }
}
