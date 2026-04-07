// Scarcity Score algorithm
//
// Inputs (all numbers in the same currency, KRW):
//   msrp           - original retail / list price
//   market         - estimated current secondary-market price
//   themeAvgPct    - 3-year average annual return % for the set's theme
//   exclusivity    - true if the set has exclusive minifigs / parts
//
// Steps:
//   1. Return score      = (market - msrp) / msrp * 100
//   2. Theme delta       = (return - themeAvgPct), bounded
//   3. Exclusivity bonus = +20 if exclusive, else 0
//   4. Raw composite     = 0.55 * returnScore + 0.25 * themeDelta + 0.20 * 100 * (exclusive?1:0)
//   5. Normalize to 0..100 via a soft sigmoid centered at 25
//   6. Grade: S >= 80, A >= 65, B >= 50, C >= 35, D < 35

function clamp(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function gradeFromScore(score) {
  if (score >= 80) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

function gradeColor(grade) {
  switch (grade) {
    case 'S': return '#d4af37'; // gold
    case 'A': return '#0a8a4e'; // green
    case 'B': return '#0066cc'; // blue
    case 'C': return '#e08a00'; // amber
    default:  return '#999999'; // gray for D
  }
}

function computeScarcityScore(input) {
  var msrp = Number(input.msrp) || 0;
  var market = Number(input.market) || 0;
  var themeAvgPct = Number(input.themeAvgPct) || 0;
  var exclusive = !!input.exclusivity;

  if (msrp <= 0) {
    return {
      returnPct: 0,
      themeDelta: 0,
      exclusivityBonus: exclusive ? 20 : 0,
      finalScore: 0,
      grade: 'D',
      gradeColor: gradeColor('D')
    };
  }

  var returnPct = (market - msrp) / msrp * 100;
  var themeDelta = returnPct - themeAvgPct;
  var exclusivityBonus = exclusive ? 20 : 0;

  // Weighted composite (raw, can exceed 100 or go negative)
  var raw = 0.55 * returnPct + 0.25 * themeDelta + exclusivityBonus;

  // Soft sigmoid normalization centered at 25 with k=0.06 for a gentle curve
  var k = 0.06;
  var normalized = 100 / (1 + Math.exp(-k * (raw - 25)));
  var finalScore = Math.round(clamp(normalized, 0, 100));

  var grade = gradeFromScore(finalScore);

  return {
    returnPct: Math.round(returnPct * 10) / 10,
    themeDelta: Math.round(themeDelta * 10) / 10,
    exclusivityBonus: exclusivityBonus,
    rawComposite: Math.round(raw * 10) / 10,
    finalScore: finalScore,
    grade: grade,
    gradeColor: gradeColor(grade)
  };
}

export { computeScarcityScore, gradeFromScore, gradeColor };
