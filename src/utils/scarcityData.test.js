import { lookupObservedMarket, lookupReferencePrice, marketHistory } from './scarcityData';

const entry = { modelNumber: '10305', source: 'KREAM', sourceUrl: 'https://kream.co.kr/products/72708',
  observedAt: '2026-10-16T05:40:00Z', currency: 'KRW', condition: 'platform-standard-unspecified',
  retailPriceKrw: 519900, retailPriceSource: 'KREAM-listed release price', askingPriceKrw: 565000,
  totalTradeCount: 897, trades: [
    { price: 535000, date: null, dateLabel: '19시간 전', datePrecision: 'relative' },
    { price: 564000, date: '2026-10-14', datePrecision: 'day' }, { price: 564000, date: '2026-10-13', datePrecision: 'day' },
    { price: 541000, date: '2026-10-13', datePrecision: 'day' }, { price: 550000, date: '2026-10-12', datePrecision: 'day' },
  ] };
const dataset = { sets: { '10305': entry } };

test('verified trade median, latest price and asking price remain distinct with actual dates', () => {
  const market = lookupObservedMarket('10305-1', dataset);
  expect(market).toMatchObject({ value: 550000, latest: 535000, askingPriceKrw: 565000, sampleCount: 5, min: 535000, max: 564000 });
  expect(marketHistory(market)[0]).toMatchObject({ date: null, datePrecision: 'relative' });
  expect(lookupReferencePrice('10305-1', market)).toMatchObject({ value: 519900, kind: 'platform-release', comparisonEligible: true });
});

test('old observations do not enter the five latest public trade median', () => {
  const market = lookupObservedMarket('10305', { sets: { '10305': { ...entry, trades: [...entry.trades, { price: 10000, date: '2020-01-01' }] } } });
  expect(market.value).toBe(550000);
  expect(market.trades).toHaveLength(5);
  expect(marketHistory(market)).toHaveLength(6);
});

test('wrong model mappings, currencies, undocumented observations and missing records yield no market price', () => {
  expect(lookupObservedMarket('75192', dataset)).toBeNull();
  for (const overrides of [{ modelNumber: '10179' }, { currency: 'USD' }, { sourceUrl: '' }, { observedAt: null }, { trades: [] }]) {
    expect(lookupObservedMarket('10305', { sets: { '10305': { ...entry, ...overrides } } })).toBeNull();
  }
});

test('unverified historic MSRP and USD conversions never become confirmed Korean release prices', () => {
  const prices = { meta: { lastUpdated: '2026-04-08', source: 'mixed historical records' }, prices: {
    '10278': { price: 239900, discontinued: true }, '910008': { price: 258400, priceFromUsd: true, usd: 199.99 },
  } };
  expect(lookupReferencePrice('10278-1', null, prices)).toMatchObject({ value: 239900, kind: 'unverified-reference', comparisonEligible: false });
  expect(lookupReferencePrice('910008-1', null, prices)).toMatchObject({ value: 258400, kind: 'converted-reference', comparisonEligible: false });
  expect(lookupReferencePrice('99999-1', null, prices)).toBeNull();
});
test('international BrickLink evidence cannot acquire a comparable Korean release price from another scope', () => {
  const prices = { meta: {}, prices: { '10305': { price: 519900 } } };
  expect(lookupReferencePrice('10305-1', { provider: 'bricklink', retailPriceKrw: 519900 }, prices))
    .toMatchObject({ kind: 'unverified-reference', comparisonEligible: false });
});
test('API forecast history uses accumulated daily observations exclusively, never anonymous order rows', () => {
  const observations = [{ date: '2026-10-16', price: 100000, basis: 'recent-30d-median' }];
  expect(marketHistory({ evidenceKind: 'daily-market-observations', observationHistory: observations,
    trades: [{ date: '2025-01-01', price: 90000 }] })).toBe(observations);
});
