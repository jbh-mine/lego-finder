import priceData from '../data/prices.json';
import marketObservations from '../data/marketObservations.json';

function numberOf(setNum) { return String(setNum).replace(/-\d+$/, ''); }
function positive(value) { return typeof value === 'number' && Number.isFinite(value) && value > 0; }

export function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length ? (sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2) : null;
}

export function lookupObservedMarket(setNum, dataset = marketObservations, now = Date.now()) {
  const number = numberOf(setNum);
  const entry = dataset && dataset.sets && dataset.sets[number];
  if (!entry || entry.modelNumber !== number || entry.currency !== 'KRW' || !entry.sourceUrl ||
      !Number.isFinite(Date.parse(entry.observedAt))) return null;
  const historicalTrades = (entry.trades || []).filter(trade => positive(trade.price));
  const trades = historicalTrades.slice(0, 5);
  if (!trades.length) return null;
  const latestDate = trades[0].date && Date.parse(trades[0].date);
  return { ...entry, trades, historicalTrades, value: median(trades.map(trade => trade.price)), latest: trades[0].price,
    latestDateLabel: trades[0].dateLabel || trades[0].date || null,
    latestTradeAgeDays: latestDate && Number.isFinite(latestDate) ? Math.max(0, Math.floor((now - latestDate) / 86400000)) : null,
    snapshotAgeDays: Math.max(0, Math.floor((now - Date.parse(entry.observedAt)) / 86400000)),
    sampleCount: trades.length, min: Math.min(...trades.map(trade => trade.price)), max: Math.max(...trades.map(trade => trade.price)) };
}

export function lookupReferencePrice(setNum, market, dataset = priceData) {
  if (market && positive(market.retailPriceKrw)) {
    return { value: market.retailPriceKrw, kind: 'platform-release', comparisonEligible: true,
      source: market.retailPriceSource, sourceUrl: market.sourceUrl, observedAt: market.observedAt };
  }
  if (market && positive(market.retailPriceUsd)) {
    return { value: positive(market.retailConvertedKrw) ? market.retailConvertedKrw : null,
      kind: 'converted-reference', comparisonEligible: false, usd: market.retailPriceUsd,
      source: market.retailPriceSource || 'KREAM USD release-price reference',
      sourceUrl: market.sourceUrl, observedAt: market.observedAt };
  }
  const entry = dataset && dataset.prices && dataset.prices[numberOf(setNum)];
  if (!entry || !positive(entry.price)) return null;
  return { value: entry.price, kind: entry.priceFromUsd ? 'converted-reference' : 'unverified-reference',
    comparisonEligible: false, usd: entry.usd || null, source: dataset.meta && dataset.meta.source,
    observedAt: dataset.meta && dataset.meta.lastUpdated, sourceUrl: null };
}

export function observedExamples(dataset = marketObservations) {
  return Object.keys((dataset && dataset.sets) || {}).filter(number => lookupObservedMarket(number, dataset))
    .sort((a, b) => Number(positive(dataset.sets[b].retailPriceKrw)) - Number(positive(dataset.sets[a].retailPriceKrw)) || Number(a) - Number(b))
    .map(number => ({ number, name: dataset.sets[number].productName }));
}

export function marketHistory(market) {
  if (!market) return [];
  return (market.historicalTrades || market.trades).map(trade => ({ ...trade, currency: market.currency,
    condition: market.condition, source: market.source }));
}
