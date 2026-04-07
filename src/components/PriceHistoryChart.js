import React from 'react';
import { getPriceHistory, getPriceStats } from '../utils/priceHistory';

// Pure SVG line chart for KRW price history. No external chart library.
// Returns null if fewer than 2 data points so existing UI is unchanged for
// sets without history.
function fmtKRW(v) {
  if (v == null) return '';
  return String.fromCharCode(8361) + Number(v).toLocaleString('ko-KR');
}

function PriceHistoryChart(props) {
  var setNum = props.setNum;
  var title = props.title || '\uAC00\uACA9 \uBCC0\uD654 (Price History)';
  var history = getPriceHistory(setNum);
  if (!history || history.length < 2) return null;

  var stats = getPriceStats(history);
  var W = 520, H = 170;
  var padL = 56, padR = 16, padT = 18, padB = 28;
  var innerW = W - padL - padR;
  var innerH = H - padT - padB;

  var minP = stats.min;
  var maxP = stats.max;
  var range = maxP - minP;
  if (range === 0) {
    minP = Math.max(0, minP - 1);
    maxP = maxP + 1;
    range = maxP - minP;
  }
  var pad = range * 0.1;
  var yMin = Math.max(0, minP - pad);
  var yMax = maxP + pad;
  var yRange = yMax - yMin || 1;

  var n = history.length;
  var xStep = n > 1 ? innerW / (n - 1) : 0;

  var pts = history.map(function(h, i) {
    var x = padL + i * xStep;
    var y = padT + (1 - (h.p - yMin) / yRange) * innerH;
    return { x: x, y: y, d: h.d, p: h.p };
  });

  var pathD = pts.map(function(pt, i) {
    return (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1);
  }).join(' ');

  var areaD = pathD
    + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (padT + innerH).toFixed(1)
    + ' L' + pts[0].x.toFixed(1) + ',' + (padT + innerH).toFixed(1)
    + ' Z';

  // Y-axis ticks (3)
  var yTicks = [yMin, (yMin + yMax) / 2, yMax];
  var yTickEls = yTicks.map(function(v, i) {
    var y = padT + (1 - (v - yMin) / yRange) * innerH;
    return React.createElement('g', { key: 'yt' + i },
      React.createElement('line', {
        x1: padL, x2: padL + innerW, y1: y, y2: y,
        stroke: '#eee', strokeWidth: 1
      }),
      React.createElement('text', {
        x: padL - 6, y: y + 3,
        textAnchor: 'end',
        fontSize: 10, fill: '#888'
      }, fmtKRW(Math.round(v)))
    );
  });

  // X-axis labels: first, middle, last
  var xLabelIdxs = n <= 2 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1];
  var xLabelEls = xLabelIdxs.map(function(i, k) {
    var pt = pts[i];
    return React.createElement('text', {
      key: 'xl' + k,
      x: pt.x,
      y: padT + innerH + 16,
      textAnchor: i === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle'),
      fontSize: 10, fill: '#888'
    }, pt.d);
  });

  // Data point markers
  var dotEls = pts.map(function(pt, i) {
    return React.createElement('circle', {
      key: 'd' + i,
      cx: pt.x, cy: pt.y, r: 2.5,
      fill: '#0066cc'
    });
  });

  var changeColor = stats.change > 0 ? '#d33' : (stats.change < 0 ? '#0a8' : '#666');
  var changeSign = stats.change > 0 ? '+' : '';
  var changeText = changeSign + fmtKRW(stats.change) + ' (' + changeSign + stats.changePct.toFixed(1) + '%)';

  var headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
    fontSize: '0.85rem'
  };

  var wrapStyle = {
    marginTop: 16,
    padding: '12px 14px',
    background: '#fafbfc',
    border: '1px solid #e6e8eb',
    borderRadius: 6
  };

  return React.createElement('div', { style: wrapStyle },
    React.createElement('div', { style: headerStyle },
      React.createElement('span', { style: { fontWeight: 600, color: '#333' } }, title),
      React.createElement('span', null,
        React.createElement('span', { style: { color: '#333', fontWeight: 600 } }, fmtKRW(stats.latest)),
        React.createElement('span', { style: { marginLeft: 8, color: changeColor, fontSize: '0.8rem' } }, changeText)
      )
    ),
    React.createElement('svg', {
      width: '100%',
      viewBox: '0 0 ' + W + ' ' + H,
      style: { display: 'block', maxWidth: '100%' },
      preserveAspectRatio: 'xMidYMid meet'
    },
      yTickEls,
      React.createElement('path', { d: areaD, fill: 'rgba(0,102,204,0.08)', stroke: 'none' }),
      React.createElement('path', { d: pathD, fill: 'none', stroke: '#0066cc', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }),
      dotEls,
      xLabelEls
    ),
    React.createElement('div', { style: { marginTop: 4, fontSize: '0.7rem', color: '#888', textAlign: 'right' } },
      'Min ' + fmtKRW(stats.min) + ' / Max ' + fmtKRW(stats.max) + ' / ' + n + ' pts'
    )
  );
}

export default PriceHistoryChart;
