// Static 3-year average appreciation by LEGO theme.
// These are illustrative figures derived from public secondary-market trackers
// (BrickEconomy, Brickpicker community averages 2023-2025) and are intended as
// rough comparison baselines, not investment advice.
//
// Schema: { avgReturnPct, sample, years }
//   avgReturnPct  - average annual % appreciation over the window
//   sample        - approximate number of retired sets in the sample
//   years         - lookback window in years

var THEME_RETURNS = {
  'Star Wars':         { avgReturnPct: 12.5, sample: 47, years: 3 },
  'Modular Buildings': { avgReturnPct: 18.3, sample: 14, years: 3 },
  'Castle':            { avgReturnPct: 15.0, sample: 8,  years: 3 },
  'Creator Expert':    { avgReturnPct: 14.2, sample: 23, years: 3 },
  'Icons':             { avgReturnPct: 11.8, sample: 31, years: 3 },
  'Harry Potter':      { avgReturnPct: 9.5,  sample: 19, years: 3 },
  'Technic':           { avgReturnPct: 6.2,  sample: 28, years: 3 },
  'Architecture':      { avgReturnPct: 8.7,  sample: 22, years: 3 },
  'Ideas':             { avgReturnPct: 16.4, sample: 17, years: 3 },
  'Marvel':            { avgReturnPct: 7.1,  sample: 24, years: 3 },
  'Disney':            { avgReturnPct: 10.3, sample: 11, years: 3 },
  'BDP':               { avgReturnPct: 13.5, sample: 12, years: 3 },
  'Other':             { avgReturnPct: 5.0,  sample: 0,  years: 3 }
};

// Heuristic theme classification based on set number prefix and name keywords.
// Used because Rebrickable's API returns theme_id as a number, not a name,
// and we want to avoid an extra API call.
function classifyTheme(detail) {
  if (!detail) return 'Other';
  var name = (detail.name || '').toLowerCase();
  var num = String(detail.set_num || '').replace(/-\d+$/, '');

  // BDP (BrickLink Designer Program) — 91xxxx
  if (/^91\d{4}$/.test(num)) return 'BDP';

  // Name keyword matching (most reliable)
  if (/star ?wars|millennium|tie fighter|x-wing|death star|at-at|mandalorian/i.test(name)) return 'Star Wars';
  if (/hogwarts|harry potter|hogsmeade|dumbledore|hagrid|dobby/i.test(name)) return 'Harry Potter';
  if (/marvel|spider|avengers|iron man|hulk|thor|guardians|x-men/i.test(name)) return 'Marvel';
  if (/disney|frozen|mickey|cinderella|princess/i.test(name)) return 'Disney';
  if (/castle|knight|medieval|blacksmith/i.test(name)) return 'Castle';
  if (/modular|assembly square|parisian restaurant|detective|town hall|brick bank|pet shop|grand emporium|fire brigade|cafe corner|police station|boutique hotel|jazz club|bookshop|natural history museum|tudor corner|downtown diner|corner garage|palace cinema/i.test(name)) return 'Modular Buildings';
  if (/architecture|skyline|landmark/i.test(name)) return 'Architecture';
  if (/technic|bugatti|porsche|liebherr|crawler|bulldozer/i.test(name)) return 'Technic';
  if (/typewriter|grand piano|tree house|nasa|globe|fender|atari|polaroid|optimus prime/i.test(name)) return 'Ideas';

  // Set number prefix fallbacks
  if (/^75/.test(num)) return 'Star Wars';
  if (/^76/.test(num)) {
    // 76xxx is shared between Marvel/DC/Harry Potter; default Marvel unless name said otherwise
    return 'Marvel';
  }
  if (/^42/.test(num)) return 'Technic';
  if (/^21/.test(num)) {
    // 21xxx is Architecture or Ideas; default Architecture
    return 'Architecture';
  }
  if (/^102\d{2}$/.test(num) || /^103\d{2}$/.test(num)) return 'Icons';
  if (/^71/.test(num)) return 'Icons';

  return 'Other';
}

function getThemeReturn(themeKey) {
  return THEME_RETURNS[themeKey] || THEME_RETURNS['Other'];
}

export { THEME_RETURNS, classifyTheme, getThemeReturn };
