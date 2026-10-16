import { getThemeReturn } from '../data/themeReturns';
import { computeScarcityScore } from './scarcityScore';

export function recomputeForPeriod(raw, period) {
  const themeInfo = getThemeReturn(raw.themeKey, period);
  const growth = months => Math.pow(1 + themeInfo.avgReturnPct / 100, months / 12);
  const months = period * 12;
  const pastSeries = Array.from({ length: 13 }, (_, index) => ({
    label: index === 12 ? 'now' : '-' + (12 - index) + 'm',
    theme: Math.round(raw.market.value / growth(12 - index)),
    market: index === 12 ? Math.round(raw.market.value) : null,
  }));
  const step = period === 3 ? 3 : 6;
  const projSeries = [];
  for (let month = 0; month <= months; month += step) {
    projSeries.push({ label: month === 0 ? 'now' : '+' + month + 'm',
      projected: Math.round(raw.market.value * growth(month)) });
  }
  return {
    setNum: raw.setNum, name: raw.name, year: raw.year, numParts: raw.numParts,
    imgUrl: raw.imgUrl, theme: raw.themeKey, themeInfo, period, periodMonths: months,
    msrp: raw.msrp, market: raw.market,
    score: computeScarcityScore({ msrp: raw.msrp.value, market: raw.market.value,
      themeAvgPct: themeInfo.avgReturnPct, exclusivity: raw.hasExclusiveMinifigs }),
    pastSeries, projSeries, hasExclusiveMinifigs: raw.hasExclusiveMinifigs, raw,
  };
}
