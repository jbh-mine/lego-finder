import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import useMarketData from './useMarketData';
import { fetchMarket, savedMarketServer, saveMarketServer } from './marketApi';

jest.mock('./marketApi', () => ({
  MARKET_POLL_MIN_MS: 60000, MARKET_REFRESH_COOLDOWN_MS: 600000,
  fetchMarket: jest.fn(), savedMarketServer: jest.fn(), saveMarketServer: jest.fn(value => value), testMarketServer: jest.fn(),
}));
const start = Date.parse('2026-10-16T06:00:00Z');
function data(at = start, overrides = {}) {
  return { observedAt: new Date(at).toISOString(), expiresAt: new Date(at + 60000).toISOString(),
    query: { setNum: '21322-1' }, current: { value: 100000 }, status: 'fresh', refresh: { nextRefreshAt: new Date(at + 600000).toISOString() }, ...overrides };
}
function Harness({ id = '21322-1' }) {
  const api = useMarketData(id);
  return <><span data-testid="value">{api.response?.current.value || 'none'}</span><span data-testid="status">{api.response?.status}</span>
    <span data-testid="error">{api.error?.code}</span><span data-testid="cooldown">{api.cooldownSeconds}</span>
    <button onClick={api.refresh} disabled={api.loading || api.cooldownSeconds > 0}>refresh</button>
    <button onClick={() => api.setCountry('KR')}>KR</button><button onClick={() => api.save('')}>disconnect</button></>;
}
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(start); jest.clearAllMocks();
  savedMarketServer.mockReturnValue('https://market.example.com');
  fetchMarket.mockImplementation(async () => data(Date.now()));
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});
afterEach(() => { jest.useRealTimers(); });
async function flush() { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); }

test('initial catalog query supports any ID; manual refresh respects a ten-minute cooldown', async () => {
  fetchMarket.mockImplementation(async () => data(Date.now(), { expiresAt: new Date(Date.now() + 21600000).toISOString(), refresh: { state: 'ok', nextRefreshAt: new Date(Date.now() + 21600000).toISOString() } }));
  render(<Harness id="10182-1" />); await flush();
  expect(fetchMarket).toHaveBeenCalledWith('https://market.example.com', '10182-1', { condition: 'N', country: 'GLOBAL' }, expect.objectContaining({ refresh: false, signal: expect.anything() }));
  expect(screen.getByRole('button', { name: 'refresh' })).toBeDisabled();
  act(() => jest.advanceTimersByTime(599000)); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(1000)); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'refresh' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'refresh' })); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(2);
  expect(fetchMarket.mock.calls[1][3].refresh).toBe(true);
  expect(screen.getByRole('button', { name: 'refresh' })).toBeDisabled();
});
test('expired data does not consume provider calls in a hidden tab, then refreshes on visibility', async () => {
  render(<Harness />); await flush();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  act(() => jest.advanceTimersByTime(600000)); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  fireEvent(document, new Event('visibilitychange')); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(2);
});
test('changed scope aborts old requests and ignores a response even if its transport did not honor abort', async () => {
  let resolveOld;
  fetchMarket.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce(data(start, { current: { value: 200000 } }));
  render(<Harness />); await flush();
  const oldSignal = fetchMarket.mock.calls[0][3].signal;
  fireEvent.click(screen.getByRole('button', { name: 'KR' })); await flush();
  expect(oldSignal.aborted).toBe(true);
  expect(fetchMarket.mock.calls[1][2]).toEqual({ condition: 'N', country: 'KR' });
  await act(async () => resolveOld(data(start, { current: { value: 999999 } })));
  expect(screen.getByTestId('value')).toHaveTextContent('200000');
});
test('failed refresh retains cached value only as stale and exposes quota backoff', async () => {
  fetchMarket.mockImplementationOnce(async () => data(start, { expiresAt: new Date(start + 3600000).toISOString() }))
    .mockRejectedValueOnce(Object.assign(new Error(), { code: 'QUOTA_EXCEEDED', retryAfterSeconds: 900 }));
  render(<Harness />); await flush();
  act(() => jest.advanceTimersByTime(600000)); await flush();
  fireEvent.click(screen.getByRole('button', { name: 'refresh' })); await flush();
  expect(screen.getByTestId('status')).toHaveTextContent('stale');
  expect(screen.getByTestId('value')).toHaveTextContent('100000');
  expect(screen.getByTestId('error')).toHaveTextContent('QUOTA_EXCEEDED');
  expect(screen.getByRole('button', { name: 'refresh' })).toBeDisabled();
});
test('disconnect and unmount cancel outstanding requests and clear live results', async () => {
  fetchMarket.mockImplementation(() => new Promise(() => {}));
  const view = render(<Harness />); await flush();
  const signal = fetchMarket.mock.calls[0][3].signal;
  fireEvent.click(screen.getByRole('button', { name: 'disconnect' })); await flush();
  expect(signal.aborted).toBe(true);
  expect(saveMarketServer).toHaveBeenCalledWith('');
  expect(screen.getByTestId('value')).toHaveTextContent('none');
  view.unmount();
});
test('a failure without data automatically retries after its 15-minute quota backoff', async () => {
  fetchMarket.mockRejectedValueOnce(Object.assign(new Error(), { code: 'QUOTA_EXCEEDED', retryAfterSeconds: 900 }))
    .mockImplementation(async () => data(Date.now()));
  render(<Harness />); await flush();
  expect(screen.getByTestId('error')).toHaveTextContent('QUOTA_EXCEEDED');
  act(() => jest.advanceTimersByTime(840000)); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(60000)); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId('value')).toHaveTextContent('100000');
});
test('failed manual refresh retries before the old fresh TTL and values older than 24 hours disappear', async () => {
  fetchMarket.mockResolvedValueOnce(data(start, { expiresAt: new Date(start + 21600000).toISOString(), refresh: { state: 'ok', nextRefreshAt: new Date(start + 21600000).toISOString() } }))
    .mockRejectedValue(Object.assign(new Error(), { code: 'UPSTREAM_UNAVAILABLE', retryAfterSeconds: 900 }));
  render(<Harness />); await flush();
  act(() => jest.advanceTimersByTime(600000)); await flush();
  fireEvent.click(screen.getByRole('button', { name: 'refresh' })); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(2);
  act(() => jest.advanceTimersByTime(900000)); await flush();
  expect(fetchMarket).toHaveBeenCalledTimes(3);
  jest.setSystemTime(start + 86400000);
  fireEvent(document, new Event('visibilitychange')); await flush();
  expect(screen.getByTestId('value')).toHaveTextContent('none');
});
