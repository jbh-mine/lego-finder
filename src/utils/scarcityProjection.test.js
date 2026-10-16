import { recomputeForPeriod, computePriceScenario, projectObservedHistory } from './scarcityProjection';

const market = { value: 100000, source: 'KREAM', condition: 'sealed-new', currency: 'KRW', observedAt: '2026-10-16T05:40:00Z' };
const now = Date.parse('2026-10-16T06:00:00Z');
function point(date, price, overrides = {}) { return { date, price, source: 'KREAM', condition: 'sealed-new', currency: 'KRW', datePrecision: 'day', ...overrides }; }

test('no verified market cannot manufacture a price, historical curve or future curve', () => {
  const result = recomputeForPeriod({ msrp: { value: 259900, comparisonEligible: true }, themeKey: 'Modular Buildings', market: null }, 3, now);
  expect(result.score.available).toBe(false);
  expect(result.pastSeries).toEqual([]);
  expect(result.projSeries).toEqual([]);
  expect(result.forecast.reasons).toContain('missing-market');
  expect(computePriceScenario(null, 3).available).toBe(false);
});

test('short dated trades remain actual observations, and capture/relative dates do not create historical points', () => {
  const raw = { market, marketHistory: [point('2026-10-12', 99000), point('2026-10-14', 101000),
    point(null, 102000, { dateLabel: '19 hours ago', datePrecision: 'relative' }),
    point('2026-10-01', 500000, { condition: 'used' }), point('2026-10-02', 100, { currency: 'USD' })] };
  const result = recomputeForPeriod(raw, 5, now);
  expect(result.pastSeries).toEqual([{ label: '2026-10-12', market: 99000 }, { label: '2026-10-14', market: 101000 }]);
  expect(result.projSeries).toEqual([]);
  expect(result.forecast).toMatchObject({ count: 2, spanDays: 2, available: false });
  expect(result.forecast.reasons).toEqual(['insufficient-observations', 'short-span']);
});

test('unknown product condition blocks automatic estimates even with long history', () => {
  const result = projectObservedHistory({ market: { ...market, condition: 'platform-standard-unspecified' }, marketHistory: [
    point('2025-01-01', 100000, { condition: 'platform-standard-unspecified' }),
    point('2025-04-01', 110000, { condition: 'platform-standard-unspecified' }),
    point('2025-07-01', 120000, { condition: 'platform-standard-unspecified' }),
    point('2025-10-01', 117000, { condition: 'platform-standard-unspecified' }),
    point('2026-01-01', 130000, { condition: 'platform-standard-unspecified' }),
    point('2026-10-14', 135000, { condition: 'platform-standard-unspecified' }),
  ] }, 3, now);
  expect(result.reasons).toEqual(['unknown-condition']);
  expect(result.series).toEqual([]);
});

test.each([3, 5])('long comparable measured history yields a %i-year model range with disclosed inputs', period => {
  const result = projectObservedHistory({ market, marketHistory: [
    point('2025-01-01', 79000), point('2025-04-01', 84000), point('2025-07-01', 82000),
    point('2025-10-01', 90000), point('2026-01-01', 91000), point('2026-10-14', 97000),
  ] }, period, now);
  expect(result.available).toBe(true);
  expect(result.from).toBe('2025-01-01');
  expect(result.to).toBe('2026-10-14');
  expect(result.series[0]).toMatchObject({ years: 0, projected: 100000, range: [100000, 100000] });
  const last = result.series[result.series.length - 1];
  expect(last.years).toBe(period);
  expect(last.range[0]).toBeLessThan(last.projected);
  expect(last.range[1]).toBeGreaterThan(last.projected);
  expect(result.model.count).toBe(6);
  expect(result.annualRatePct).toBeGreaterThan(0);
});

test('a fresh capture of stale transactions cannot pass freshness checks even when derived age flags are absent or false', () => {
  const result = projectObservedHistory({ market: { ...market, latestTradeAgeDays: 0, snapshotAgeDays: 0 }, marketHistory: [
    point('2025-01-01', 79000), point('2025-04-01', 84000), point('2025-07-01', 82000),
    point('2025-10-01', 90000), point('2026-01-01', 91000), point('2026-07-01', 97000),
  ] }, 3, now);
  expect(result.available).toBe(false);
  expect(result.reasons).toContain('stale-market');
  expect(result.series).toEqual([]);
});

test('stale snapshots and missing capture timestamps fail closed without optional freshness metadata', () => {
  const raw = { market, marketHistory: [
    point('2025-01-01', 79000), point('2025-04-01', 84000), point('2025-07-01', 82000),
    point('2025-10-01', 90000), point('2026-01-01', 91000), point('2026-10-14', 97000),
  ] };
  expect(projectObservedHistory(raw, 3, Date.parse('2026-12-01T00:00:00Z')).reasons).toContain('stale-market');
  const missingTime = projectObservedHistory({ ...raw, market: { ...market, observedAt: null } }, 3, now);
  expect(missingTime.available).toBe(false);
  expect(missingTime.reasons).toContain('missing-observation-time');
  expect(missingTime.series).toEqual([]);
});

test('scenario is a user-controlled calculation, with zero growth default and explicit selling costs', () => {
  expect(computePriceScenario(100000, 3)).toMatchObject({ available: true, gross: 100000, net: 100000, difference: 0, annualRatePct: 0 });
  expect(computePriceScenario(100000, 3, { annualRatePct: 10, feePct: 5, fixedCosts: 1000 }))
    .toMatchObject({ gross: 133100, net: 125445, difference: 25445 });
  expect(computePriceScenario(100000, 5, { annualRatePct: -10 })).toMatchObject({ gross: 59049, net: 59049, difference: -40951 });
  expect(computePriceScenario(100000, 3, { annualRatePct: -100 }).available).toBe(false);
  expect(computePriceScenario(100000, 3, { feePct: 101 }).available).toBe(false);
});

const apiMarket = { ...market, source: 'BrickLink', provider: 'bricklink', condition: 'N', country: 'GLOBAL',
  evidenceKind: 'daily-market-observations', basis: 'recent-30d-median', status: 'fresh', expiresAt: '2026-10-16T06:40:00Z', quality: { historyKind: 'daily-market-observations' } };
function observation(date, price, overrides = {}) {
  return { date, price, observedAt: date + 'T05:00:00Z', source: 'BrickLink', currency: 'KRW', condition: 'N', country: 'GLOBAL', basis: 'recent-30d-median', sampleCount: 5, ...overrides };
}
const observations = [observation('2026-01-01', 79000), observation('2026-03-01', 84000), observation('2026-05-01', 82000),
  observation('2026-07-01', 90000), observation('2026-09-01', 91000), observation('2026-10-15', 97000)];
test.each([3, 5])('API %i-year forecast uses six calendar-month medians of daily observations, not order rows', period => {
  const result = projectObservedHistory({ market: apiMarket, marketHistory: observations }, period, now);
  expect(result).toMatchObject({ available: true, kind: 'monthly-market-observations', count: 6, monthCount: 6, spanDays: 287 });
  expect(result.model.count).toBe(6);
  expect(result.series[0].projected).toBe(100000);
  expect(result.series[result.series.length - 1].years).toBe(period);
  expect(result.series[result.series.length - 1].range[0]).toBeLessThan(result.series[result.series.length - 1].projected);
});
test('same-day refreshes collapse before monthly medians, while mismatched, future and invalid dates are excluded', () => {
  const result = projectObservedHistory({ market: apiMarket, marketHistory: [
    ...observations, observation('2026-01-01', 81000, { observedAt: '2026-01-01T06:00:00Z' }), observation('2026-01-02', 83000),
    observation('2026-02-01', 1, { country: 'KR' }), observation('2026-02-01', 2, { condition: 'U' }),
    observation('2026-02-01', 3, { currency: 'USD' }), observation('2026-02-01', 4, { source: 'KREAM' }),
    observation('2026-02-01', 5, { basis: 'six-month-average' }), observation('2026-10-17', 6),
    observation('2026-02-30', 7), observation('2026-02-01', 8, { observedAt: '2026-02-02T00:00:00Z' }),
  ] }, 3, now);
  expect(result.count).toBe(7);
  expect(result.monthCount).toBe(6);
  expect(result.monthlyHistory[0].price).toBe(82000);
  expect(result.model.count).toBe(6);
});
test('many daily refreshes in fewer than six months cannot produce a forecast, even with old order dates', () => {
  const result = projectObservedHistory({ market: apiMarket, marketHistory: [
    ...Array.from({ length: 15 }, (_, i) => observation('2026-10-' + String(i + 1).padStart(2, '0'), 90000 + i * 100)),
    point('2025-01-01', 79000),
  ] }, 3, now);
  expect(result).toMatchObject({ available: false, count: 15, monthCount: 1, spanDays: 14 });
  expect(result.reasons).toEqual(['insufficient-months', 'short-span']);
});
test('stale current values, expired TTL, future capture or old daily history block the API model', () => {
  for (const changes of [{ status: 'stale' }, { expiresAt: '2026-10-16T05:59:00Z' }, { observedAt: '2026-10-17T00:00:00Z' }]) {
    expect(projectObservedHistory({ market: { ...apiMarket, ...changes }, marketHistory: observations }, 3, now).available).toBe(false);
  }
  const result = projectObservedHistory({ market: apiMarket, marketHistory: observations.slice(0, -1) }, 3, now);
  expect(result.reasons).toContain('stale-market');
  expect(projectObservedHistory({ market: { ...apiMarket, condition: 'U' }, marketHistory: observations.map(p => ({ ...p, condition: 'U' })) }, 3, now).available).toBe(true);
});
