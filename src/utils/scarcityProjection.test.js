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
