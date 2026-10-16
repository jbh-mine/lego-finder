import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMarket, savedMarketServer, saveMarketServer, testMarketServer, MARKET_POLL_MIN_MS, MARKET_REFRESH_COOLDOWN_MS } from './marketApi';

// Provider calls belong to the selected product and scope. Abort plus the ticket
// guard prevents a slow previous query from replacing a newer selection.
export default function useMarketData(setNum) {
  const [server, setServer] = useState(savedMarketServer);
  const [condition, setCondition] = useState('N');
  const [country, setCountry] = useState('GLOBAL');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [testing, setTesting] = useState(false);
  const [nextRefresh, setNextRefresh] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const [clock, setClock] = useState(Date.now);
  const request = useRef({ ticket: 0, controller: null });
  const healthRequest = useRef({ ticket: 0, controller: null });
  const lastAttempt = useRef(0);
  const key = [server, setNum, condition, country].join('|');
  const response = result && result.key === key && clock - Date.parse(result.data.observedAt) < 86400000 ? result.data : null;

  const load = useCallback(async (refresh = false) => {
    if (!server || !setNum) return;
    request.current.controller?.abort();
    const controller = new AbortController();
    const ticket = ++request.current.ticket;
    request.current.controller = controller;
    lastAttempt.current = Date.now();
    setLoading(true); setError(null);
    if (refresh) setNextRefresh(Date.now() + MARKET_REFRESH_COOLDOWN_MS);
    try {
      const data = await fetchMarket(server, setNum, { condition, country }, { signal: controller.signal, refresh });
      if (ticket !== request.current.ticket) return;
      setResult({ key, data });
      const backoff = data.status === 'stale' || ['failed', 'quota'].includes(data.refresh.state)
        ? Math.max(Date.parse(data.refresh.nextRefreshAt) || 0, Date.now() + (Number(data.retryAfterSeconds) || 0) * 1000) : 0;
      const allowedAt = Math.max(Date.parse(data.observedAt) + MARKET_REFRESH_COOLDOWN_MS, backoff);
      setNextRefresh(previous => refresh ? Math.max(previous, allowedAt) : allowedAt);
      setRetryAt(backoff);
      setHealth({ configured: true });
    } catch (failure) {
      if (ticket !== request.current.ticket || failure.name === 'AbortError') return;
      setError(failure);
      const retry = Date.now() + Math.max(60, failure.retryAfterSeconds || 0) * 1000;
      setNextRefresh(previous => Math.max(previous, retry)); setRetryAt(retry);
      setResult(previous => previous && previous.key === key && Date.now() - Date.parse(previous.data.observedAt) < 86400000
        ? { ...previous, data: { ...previous.data, status: 'stale' } } : null);
    } finally { if (ticket === request.current.ticket) setLoading(false); }
  }, [server, setNum, condition, country, key]);

  useEffect(() => {
    setResult(null); setError(null); setNextRefresh(0); setRetryAt(0); lastAttempt.current = 0;
    if (server && setNum && document.visibilityState !== 'hidden') load();
    return () => { request.current.ticket++; request.current.controller?.abort(); };
  }, [server, setNum, condition, country, load]);

  useEffect(() => {
    function tick() {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now(); setClock(now);
      setResult(previous => previous && now - Date.parse(previous.data.observedAt) >= 86400000 ? null : previous);
      if (!server || !setNum || loading || now - lastAttempt.current < MARKET_POLL_MIN_MS) return;
      if (response && (Date.parse(response.expiresAt) <= now || response.status === 'stale' || error) && now >= retryAt) load();
      else if (error && now >= retryAt) load();
      else if (!response && !error && !lastAttempt.current) load();
    }
    const timer = setInterval(tick, MARKET_POLL_MIN_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [server, setNum, response, loading, error, retryAt, load]);

  useEffect(() => () => {
    healthRequest.current.ticket++; healthRequest.current.controller?.abort();
  }, []);

  function save(value) {
    const normalized = saveMarketServer(value);
    healthRequest.current.ticket++; healthRequest.current.controller?.abort();
    setTesting(false); setHealth(null); setServer(normalized);
    return normalized;
  }
  async function test(value) {
    healthRequest.current.controller?.abort();
    const controller = new AbortController();
    const ticket = ++healthRequest.current.ticket;
    healthRequest.current.controller = controller;
    setTesting(true); setHealth(null);
    try {
      const data = await testMarketServer(value, { signal: controller.signal });
      if (ticket === healthRequest.current.ticket) setHealth(data);
    } catch (failure) {
      if (ticket === healthRequest.current.ticket && failure.name !== 'AbortError') setHealth({ error: failure });
    } finally { if (ticket === healthRequest.current.ticket) setTesting(false); }
  }
  function refresh() { if (!loading && Date.now() >= nextRefresh) load(true); }
  return { server, save, test, health, testing, condition, setCondition, country, setCountry,
    response, loading, error, refresh, cooldownSeconds: Math.max(0, Math.ceil((nextRefresh - clock) / 1000)),
    expired: Boolean(response && Date.parse(response.expiresAt) <= clock) };
}
