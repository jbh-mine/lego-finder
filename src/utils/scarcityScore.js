// A transparent price comparison, not a measured production-scarcity rating.
// Premium = (observed transaction median / documented release price - 1) * 100.
// Optional reference index = clamp(50 + premium / 2, 0, 100); MSRP parity is 50.
// Missing or incomparable prices have no score, rather than a zero/D grade.
export function computeScarcityScore(input = {}) {
  const msrp = Number(input.msrp);
  const market = Number(input.market);
  if (!Number.isFinite(msrp) || msrp <= 0 || !Number.isFinite(market) || market <= 0 || input.comparable === false) {
    return { available: false, returnPct: null, premiumKrw: null, finalScore: null };
  }
  const premium = (market / msrp - 1) * 100;
  return {
    available: true,
    returnPct: Math.round(premium * 10) / 10,
    premiumKrw: Math.round(market - msrp),
    finalScore: Math.round(Math.max(0, Math.min(100, 50 + premium / 2))),
  };
}
