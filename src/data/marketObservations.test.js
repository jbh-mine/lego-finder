import observations from './marketObservations.json';

const expectedProducts = {
  '10305': 72708, '21322': 39083, '75192': 39097, '10188': 42003,
  '75159': 39053, '10246': 39085, '10278': 41092,
};

test('the captured market snapshot contains exactly 35 visible trades with verified product identities', function() {
  expect(observations.schemaVersion).toBe(1);
  expect(observations.meta.automaticRefresh).toBe(false);
  expect(Object.keys(observations.sets).sort()).toEqual(Object.keys(expectedProducts).sort());
  let total = 0;
  Object.entries(observations.sets).forEach(function([number, product]) {
    expect(product.modelNumber).toBe(number);
    expect(product.productId).toBe(expectedProducts[number]);
    expect(product.sourceUrl).toBe('https://kream.co.kr/products/' + expectedProducts[number]);
    expect(product.source).toBe('KREAM');
    expect(product.currency).toBe('KRW');
    expect(product.condition).toBe('platform-standard-unspecified');
    expect(product.trades).toHaveLength(5);
    expect(Number.isInteger(product.totalTradeCount)).toBe(true);
    expect(product.totalTradeCount).toBeGreaterThan(product.trades.length);
    expect(Number.isFinite(Date.parse(product.observedAt))).toBe(true);
    expect(Date.parse(product.observedAt)).toBeLessThanOrEqual(Date.parse(observations.meta.capturedAt));
    product.trades.forEach(function(trade) {
      expect(Number.isInteger(trade.price)).toBe(true);
      expect(trade.price).toBeGreaterThan(0);
      if (trade.datePrecision === 'relative') {
        expect(trade.date).toBeNull();
        expect(trade.dateLabel).toMatch(/^\d+(?:시간|분|초|일) 전$/);
      } else {
        expect(trade.datePrecision).toBe('day');
        expect(new Date(trade.date).toISOString().slice(0, 10)).toBe(trade.date);
        expect(trade.dateLabel).toBe(trade.date.slice(2).replace(/-/g, '/'));
        expect(Date.parse(trade.date)).toBeLessThanOrEqual(Date.parse(product.observedAt));
      }
    });
    total += product.trades.length;
  });
  expect(total).toBe(35);
});

test('visible trade medians are independent of asking prices and duplicated hidden tabs', function() {
  const expectedMedians = {
    '10305': 550000, '21322': 390000, '75192': 820000, '10188': 920000,
    '75159': 1350000, '10246': 400000, '10278': 389000,
  };
  Object.entries(expectedMedians).forEach(function([number, median]) {
    const prices = observations.sets[number].trades.map(trade => trade.price).sort((a, b) => a - b);
    expect(prices[2]).toBe(median);
  });
  expect(observations.sets['10305'].trades.map(trade => trade.price)).toEqual([535000, 564000, 564000, 541000, 550000]);
  expect(observations.sets['10305'].askingPriceKrw).toBe(565000);
  expect(observations.sets['75159'].askingPriceKrw).toBeNull();
  expect(observations.sets['75159'].trades[0].date).toBe('2026-06-19');
  expect(observations.sets['10305'].trades[0].dateLabel).toBe('19시간 전');
  expect(observations.sets['75192'].trades[0].dateLabel).toBe('14시간 전');
});

test('USD release prices and platform conversions are not recorded as Korean release prices', function() {
  Object.entries({ '10305': 519900, '21322': 259900, '75192': 1100000 }).forEach(function([number, price]) {
    expect(observations.sets[number].retailPriceKrw).toBe(price);
    expect(observations.sets[number].retailPriceUsd).toBeNull();
    expect(observations.sets[number].retailConvertedKrw).toBeNull();
  });
  Object.entries({ '10188': [400, 539400], '75159': [500, 674200], '10246': [160, 215700], '10278': [199, 268300] }).forEach(function([number, [usd, converted]]) {
    expect(observations.sets[number].retailPriceKrw).toBeNull();
    expect(observations.sets[number].retailPriceUsd).toBe(usd);
    expect(observations.sets[number].retailConvertedKrw).toBe(converted);
    expect(observations.sets[number].retailConvertedSource).toContain('한국 원화 출시가 아님');
  });
});
