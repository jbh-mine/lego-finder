import { computeScarcityScore } from './scarcityScore';

export const SUPPORTED_PERIODS = [3, 5];
export const FORECAST_MIN_OBSERVATIONS = 6;
export const FORECAST_MIN_SPAN_DAYS = 180;
const DAY_MS = 86400000;

// Transaction dates only. Fetch dates, relative dates, MSRP history, and
// observations of different conditions/currencies/sources cannot create history.
function eligibleHistory(raw) {
  const market = raw.market || {};
  return (raw.marketHistory || []).filter(point => {
    const timestamp = Date.parse(point.date);
    return Number.isFinite(timestamp) && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(point.date || '') &&
      (point.date.length !== 10 || new Date(timestamp).toISOString().slice(0, 10) === point.date) &&
      (!Number.isFinite(Date.parse(market.observedAt)) || timestamp <= Date.parse(market.observedAt)) &&
      point.datePrecision !== 'relative' && Number.isFinite(point.price) && point.price > 0 &&
      point.currency === market.currency && point.source === market.source && point.condition === market.condition;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export function projectObservedHistory(raw, period, now = Date.now()) {
  const history = eligibleHistory(raw);
  const spanDays = history.length > 1 ? (Date.parse(history[history.length - 1].date) - Date.parse(history[0].date)) / DAY_MS : 0;
  const market = raw.market;
  const reasons = [];
  if (!market || !Number.isFinite(market.value) || market.value <= 0) reasons.push('missing-market');
  if (history.length < FORECAST_MIN_OBSERVATIONS) reasons.push('insufficient-observations');
  if (spanDays < FORECAST_MIN_SPAN_DAYS) reasons.push('short-span');
  if (!market || !market.condition || /unspecified|unknown/i.test(market.condition)) reasons.push('unknown-condition');
  // Derive freshness from the actual dated evidence, never from optional
  // precomputed flags. A fresh capture of months-old trades is still stale.
  const capturedAt = Date.parse(market && market.observedAt);
  const latestTradeAt = history.length ? Date.parse(history[history.length - 1].date) : NaN;
  if (market && (!Number.isFinite(capturedAt) || !Number.isFinite(now) || capturedAt > now)) reasons.push('missing-observation-time');
  if (market && ((Number.isFinite(capturedAt) && now - capturedAt > 30 * DAY_MS) ||
      (Number.isFinite(latestTradeAt) && now - latestTradeAt > 30 * DAY_MS))) reasons.push('stale-market');
  const result = { available: false, history, count: history.length, spanDays: Math.floor(spanDays), reasons,
    from: history.length ? history[0].date : null, to: history.length ? history[history.length - 1].date : null,
    series: [], annualRatePct: null };
  if (reasons.length) return result;

  const origin = Date.parse(history[0].date);
  const xs = history.map(point => (Date.parse(point.date) - origin) / (DAY_MS * 365.25));
  const ys = history.map(point => Math.log(point.price));
  const n = history.length;
  const xMean = xs.reduce((sum, x) => sum + x, 0) / n;
  const yMean = ys.reduce((sum, y) => sum + y, 0) / n;
  const sxx = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const slope = xs.reduce((sum, x, index) => sum + (x - xMean) * (ys[index] - yMean), 0) / sxx;
  const intercept = yMean - slope * xMean;
  const residualVariance = ys.reduce((sum, y, index) => sum + (y - intercept - slope * xs[index]) ** 2, 0) / (n - 2);
  const residualStd = Math.sqrt(residualVariance);
  if (!Number.isFinite(slope) || !Number.isFinite(residualStd) || residualStd < 1e-6) {
    result.reasons.push('insufficient-variation');
    return result;
  }
  const observedAt = Date.parse(market.observedAt);
  const anchorX = Number.isFinite(observedAt) ? (observedAt - origin) / (DAY_MS * 365.25) : xs[n - 1];
  const series = Array.from({ length: period * 4 + 1 }, (_, index) => {
    const years = index / 4;
    const central = market.value * Math.exp(slope * years);
    // A model-error band, not a calibrated probability/confidence claim.
    // Future uncertainty includes regression uncertainty and observed noise.
    const error = index === 0 ? 0 : 2 * residualStd * Math.sqrt(1 + 1 / n + (anchorX + years - xMean) ** 2 / sxx);
    return { years, label: '+' + index * 3 + 'm', projected: Math.round(central),
      range: [Math.round(central * Math.exp(-error)), Math.round(central * Math.exp(error))] };
  });
  if (series.some(point => !Number.isFinite(point.projected) || point.range.some(value => !Number.isFinite(value)))) {
    result.reasons.push('numerical-range');
    return result;
  }
  return { ...result, available: true, series, annualRatePct: (Math.exp(slope) - 1) * 100,
    model: { slope, residualStd, xMean, sxx, count: n, anchorX } };
}

export function computePriceScenario(marketValue, period, { annualRatePct = 0, feePct = 0, fixedCosts = 0 } = {}) {
  const price = Number(marketValue), rate = Number(annualRatePct), fee = Number(feePct), costs = Number(fixedCosts);
  if (!Number.isFinite(price) || price <= 0) return { available: false, reason: 'missing-market', series: [] };
  if (!SUPPORTED_PERIODS.includes(period) || !Number.isFinite(rate) || rate <= -100 ||
      !Number.isFinite(fee) || fee < 0 || fee > 100 || !Number.isFinite(costs) || costs < 0) {
    return { available: false, reason: 'invalid-input', series: [] };
  }
  const gross = price * (1 + rate / 100) ** period;
  const net = gross * (1 - fee / 100) - costs;
  if (!Number.isFinite(gross) || !Number.isFinite(net)) return { available: false, reason: 'invalid-input', series: [] };
  return { available: true, annualRatePct: rate, feePct: fee, fixedCosts: costs,
    gross: Math.round(gross), net: Math.round(net), difference: Math.round(net - price),
    series: Array.from({ length: period * 4 + 1 }, (_, index) => ({ years: index / 4,
      gross: Math.round(price * (1 + rate / 100) ** (index / 4)),
      net: Math.round(price * (1 + rate / 100) ** (index / 4) * (1 - fee / 100) - costs) })) };
}

export function recomputeForPeriod(raw, period, now = Date.now()) {
  const years = SUPPORTED_PERIODS.includes(Number(period)) ? Number(period) : 3;
  const forecast = projectObservedHistory(raw, years, now);
  return { ...raw, raw, period: years, forecast,
    score: computeScarcityScore({ msrp: raw.msrp && raw.msrp.value, market: raw.market && raw.market.value,
      comparable: Boolean(raw.msrp && raw.msrp.comparisonEligible && raw.market) }),
    pastSeries: forecast.history.map(point => ({ label: point.date, market: point.price })),
    projSeries: forecast.series };
}
