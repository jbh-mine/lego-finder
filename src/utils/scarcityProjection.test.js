import { recomputeForPeriod } from './scarcityProjection';

const raw = { setNum: '10278-1', name: 'Police Station', themeKey: 'Other',
  msrp: { value: 100000 }, market: { value: 200000 }, hasExclusiveMinifigs: false };

test.each([3, 5])('%i year projection actually spans the selected years', years => {
  const result = recomputeForPeriod(raw, years);
  expect(result.projSeries[0]).toEqual({ label: 'now', projected: 200000 });
  expect(result.projSeries[result.projSeries.length - 1]).toEqual({
    label: '+' + years * 12 + 'm',
    projected: Math.round(200000 * Math.pow(1 + result.themeInfo.avgReturnPct / 100, years)),
  });
  expect(result.pastSeries).toHaveLength(13);
  expect(result.pastSeries[12].theme).toBe(200000);
});
