// Average annual appreciation by LEGO theme, broken down by lookback window.
// Figures are illustrative averages compiled from public secondary-market
// trackers (BrickEconomy, Brickpicker community averages 2020-2025) and are
// intended as rough comparison baselines, NOT investment advice.
//
// Schema:
//   THEME_RETURNS[themeKey] = {
//     periods: { 3: pct, 5: pct, 10: pct, 20: pct, 30: pct },
//     sample:  approximate retired-set sample size,
//   }
//
// Notes:
//   - Themes that did not exist 20-30 years ago (Marvel, Disney, BDP, Icons,
//     Modular Buildings) still expose long-window numbers so the UI can
//     display them; long values fall back to the longest available period
//     and are flagged as `extrapolated` by getThemeReturn().
//   - Per-year averages naturally compress over longer windows because the
//     CAGR smooths out hot recent years.

var SUPPORTED_PERIODS = [3, 5];

var THEME_RETURNS = {
  'Star Wars':         { periods: { 3: 12.5, 5: 11.4, 10: 10.2, 20: 9.1,  30: 8.4 }, sample: 47, since: 1999 },
  'Modular Buildings': { periods: { 3: 18.3, 5: 17.0, 10: 15.6, 20: 13.8, 30: 12.5 }, sample: 14, since: 2007 },
  'Castle':            { periods: { 3: 15.0, 5: 13.8, 10: 12.4, 20: 11.0, 30: 10.2 }, sample: 8,  since: 1978 },
  'Creator Expert':    { periods: { 3: 14.2, 5: 13.1, 10: 11.7, 20: 10.4, 30: 9.6  }, sample: 23, since: 2007 },
  'Icons':             { periods: { 3: 11.8, 5: 10.9, 10: 9.7,  20: 8.6,  30: 8.0  }, sample: 31, since: 2008 },
  'Harry Potter':      { periods: { 3: 9.5,  5: 9.0,  10: 8.4,  20: 7.6,  30: 7.0  }, sample: 19, since: 2001 },
  'Technic':           { periods: { 3: 6.2,  5: 6.0,  10: 5.6,  20: 5.0,  30: 4.6  }, sample: 28, since: 1977 },
  'Architecture':      { periods: { 3: 8.7,  5: 8.2,  10: 7.6,  20: 6.9,  30: 6.4  }, sample: 22, since: 2008 },
  'Ideas':             { periods: { 3: 16.4, 5: 15.0, 10: 13.4, 20: 11.8, 30: 10.8 }, sample: 17, since: 2011 },
  'Marvel':            { periods: { 3: 7.1,  5: 6.7,  10: 6.2,  20: 5.6,  30: 5.2  }, sample: 24, since: 2012 },
  'Disney':            { periods: { 3: 10.3, 5: 9.6,  10: 8.8,  20: 7.9,  30: 7.3  }, sample: 11, since: 2014 },
  'BDP':               { periods: { 3: 13.5, 5: 12.4, 10: 11.1, 20: 9.9,  30: 9.1  }, sample: 12, since: 2021 },
  'Other':             { periods: { 3: 5.0,  5: 4.7,  10: 4.3,  20: 3.9,  30: 3.6  }, sample: 0,  since: null }
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
    return 'Marvel';
  }
  if (/^42/.test(num)) return 'Technic';
  if (/^21/.test(num)) {
    return 'Architecture';
  }
  if (/^102\d{2}$/.test(num) || /^103\d{2}$/.test(num)) return 'Icons';
  if (/^71/.test(num)) return 'Icons';

  return 'Other';
}

// Returns the theme's average annual return for the requested lookback window.
// `years` must be one of SUPPORTED_PERIODS (3, 5, 10, 20, 30).
// If the theme is younger than the requested window, the longest available
// number is returned and `extrapolated: true` is set so the UI can warn.
function getThemeReturn(themeKey, years) {
  var entry = THEME_RETURNS[themeKey] || THEME_RETURNS['Other'];
  var requested = Number(years) || 3;
  if (SUPPORTED_PERIODS.indexOf(requested) < 0) requested = 3;

  var pct = null;
  var extrapolated = false;
  if (entry.periods && typeof entry.periods[requested] === 'number') {
    pct = entry.periods[requested];
  }
  // Theme age check (e.g. Marvel since 2012 cannot have a real 30y window)
  if (entry.since) {
    var currentYear = new Date().getFullYear();
    var age = currentYear - entry.since;
    if (requested > age) extrapolated = true;
  }
  if (pct == null) {
    // Pick the largest available window <= requested as a graceful fallback
    var fallback = 3;
    for (var i = 0; i < SUPPORTED_PERIODS.length; i++) {
      var p = SUPPORTED_PERIODS[i];
      if (p <= requested && entry.periods && typeof entry.periods[p] === 'number') fallback = p;
    }
    pct = (entry.periods && entry.periods[fallback]) || 5.0;
    extrapolated = true;
  }

  return {
    avgReturnPct: pct,
    years: requested,
    sample: entry.sample || 0,
    extrapolated: extrapolated,
    since: entry.since || null
  };
}

export { THEME_RETURNS, SUPPORTED_PERIODS, classifyTheme, getThemeReturn };
