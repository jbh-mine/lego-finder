import { computeScarcityScore } from './scarcityScore';

test('premium uses documented price inputs and the visible index formula', () => {
  expect(computeScarcityScore({ msrp: 100000, market: 150000 }))
    .toEqual({ available: true, returnPct: 50, premiumKrw: 50000, finalScore: 75 });
  expect(computeScarcityScore({ msrp: 100000, market: 100000 }).finalScore).toBe(50);
  expect(computeScarcityScore({ msrp: 100000, market: 200000 }).finalScore).toBe(100);
  expect(computeScarcityScore({ msrp: 100000, market: 50000 }).returnPct).toBe(-50);
});

test.each([{}, { msrp: 100 }, { msrp: 0, market: 100 }, { msrp: 100, market: Infinity }, { msrp: 100, market: 200, comparable: false }])
  ('missing, invalid, and incomparable inputs have no score or fabricated zero-grade', input => {
    expect(computeScarcityScore(input)).toEqual({ available: false, returnPct: null, premiumKrw: null, finalScore: null });
  });

test('illustrative theme returns and guessed exclusive parts cannot alter the index', () => {
  const input = { msrp: 100000, market: 150000 };
  expect(computeScarcityScore({ ...input, themeAvgPct: 999, exclusivity: true })).toEqual(computeScarcityScore(input));
});
