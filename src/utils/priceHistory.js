import historyData from '../data/priceHistoryIndex.json';

// Returns sorted array of {d, p} for a given setNum (variant suffix stripped).
// Empty array if no history.
export function getPriceHistory(setNum) {
  if (!setNum) return [];
  var key = String(setNum).replace(/-\d+$/, '');
  var series = historyData && historyData.series && historyData.series[key];
  if (!series || series.length === 0) return [];
  return series.slice().sort(function(a, b) { return a.d < b.d ? -1 : 1; });
}

export function getPriceStats(history) {
  if (!history || history.length === 0) return null;
  var min = history[0].p;
  var max = history[0].p;
  for (var i = 1; i < history.length; i++) {
    if (history[i].p < min) min = history[i].p;
    if (history[i].p > max) max = history[i].p;
  }
  var first = history[0].p;
  var latest = history[history.length - 1].p;
  return {
    min: min,
    max: max,
    first: first,
    latest: latest,
    change: latest - first,
    changePct: first > 0 ? ((latest - first) / first * 100) : 0
  };
}

export function getSnapshotCount() {
  return (historyData && historyData.snapshotCount) || 0;
}
