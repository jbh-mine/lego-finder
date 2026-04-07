import React, { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading } from '../components/Loading';
import { searchSets, getSetDetail } from '../utils/api';
import { translateSearchQuery, getIpSearchTerms } from '../utils/searchDict';
import { computeScarcityScore } from '../utils/scarcityScore';
import { classifyTheme, getThemeReturn, SUPPORTED_PERIODS } from '../data/themeReturns';
import { getKrwPrice, getLegoKrProductUrl } from '../utils/price';
import priceData from '../data/prices.json';

var PROXY = 'https://api.allorigins.win/raw?url=';
var USD_TO_KRW_FALLBACK = 1400;
var PERIOD_STORAGE_KEY = 'lego_scarcity_period';

function stripVariant(n) { return String(n).replace(/-\d+$/, ''); }
function ensureVariant(n) { return /-\d+$/.test(n) ? n : n + '-1'; }

function fmtKRW(v) {
  if (v == null || isNaN(v)) return '-';
  return String.fromCharCode(8361) + Math.round(v).toLocaleString('ko-KR');
}

function getInitialPeriod() {
  try {
    var stored = parseInt(localStorage.getItem(PERIOD_STORAGE_KEY), 10);
    if (SUPPORTED_PERIODS.indexOf(stored) >= 0) return stored;
  } catch (e) {}
  return 3;
}

// Canonical Korean MSRP lookup. Prefers the same source as SearchPage (getKrwPrice),
// falling back to the raw priceData.prices entry (USD-only items become KRW estimates).
// Returns null when nothing is known so caller can decide whether to estimate from parts.
function lookupMsrp(setNum) {
  var n = stripVariant(setNum);
  // 1) Canonical KRW source
  try {
    var krw = getKrwPrice(n);
    if (krw && krw.price > 0) {
      return { value: krw.price, source: 'LEGO Korea \uC815\uAC00 (prices.json)', official: true };
    }
  } catch (e) {}
  // 2) Raw entry (covers USD-only BDP items)
  var entry = priceData.prices[n];
  if (entry) {
    if (typeof entry.price === 'number' && entry.price > 0) {
      return { value: entry.price, source: 'LEGO Korea \uC815\uAC00 (prices.json)', official: true };
    }
    if (typeof entry.usd === 'number' && entry.usd > 0) {
      return { value: Math.round(entry.usd * USD_TO_KRW_FALLBACK), source: 'BDP USD x ' + USD_TO_KRW_FALLBACK + ' (\uD658\uC0B0)', official: false };
    }
  }
  return null;
}

async function fetchMarketPrice(setNum) {
  var url = 'https://www.brickeconomy.com/set/' + ensureVariant(setNum);
  try {
    var res = await fetch(PROXY + encodeURIComponent(url), { method: 'GET' });
    if (!res.ok) return null;
    var html = await res.text();
    var m = html.match(/Current Value[\s\S]{0,200}?\$([\d,]+(?:\.\d{1,2})?)/i);
    if (!m) {
      m = html.match(/Value[\s\S]{0,80}?\$([\d,]+(?:\.\d{1,2})?)/i);
    }
    if (m) {
      var usd = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(usd) && usd > 0) {
        return { value: usd * USD_TO_KRW_FALLBACK, source: 'brickeconomy via allorigins' };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Pure recompute of scarcity result from cached raw inputs (msrp/market/detail/themeKey)
// when only the selected period changes. Avoids re-fetching the network.
function recomputeForPeriod(raw, period) {
  var themeInfo = getThemeReturn(raw.themeKey, period);
  var score = computeScarcityScore({
    msrp: raw.msrp.value,
    market: raw.market.value,
    themeAvgPct: themeInfo.avgReturnPct,
    exclusivity: raw.hasExclusiveMinifigs
  });

  var months = period * 12;
  var stepMonths = Math.max(1, Math.round(months / 36));
  var monthlyTheme = themeInfo.avgReturnPct / 100 / 12;
  var pastSeries = [];
  for (var i = 0; i <= months; i += stepMonths) {
    var monthsAgo = months - i;
    var label;
    if (i === months) {
      label = 'now';
    } else if (stepMonths >= 12) {
      label = '-' + Math.round(monthsAgo / 12) + 'y';
    } else {
      label = '-' + monthsAgo + 'm';
    }
    pastSeries.push({
      label: label,
      theme: Math.round(raw.msrp.value * Math.pow(1 + monthlyTheme, i)),
      market: i === months ? Math.round(raw.market.value) : null
    });
  }
  // Ensure the final 'now' point exists even if step doesn't align with months
  if (pastSeries.length === 0 || pastSeries[pastSeries.length - 1].label !== 'now') {
    pastSeries.push({
      label: 'now',
      theme: Math.round(raw.msrp.value * Math.pow(1 + monthlyTheme, months)),
      market: Math.round(raw.market.value)
    });
  }
  var projSeries = [];
  for (var j = 0; j <= 12; j++) {
    projSeries.push({
      label: j === 0 ? 'now' : '+' + j + 'm',
      projected: Math.round(raw.market.value * Math.pow(1 + monthlyTheme, j))
    });
  }

  return {
    setNum: raw.setNum,
    name: raw.name,
    year: raw.year,
    numParts: raw.numParts,
    imgUrl: raw.imgUrl,
    theme: raw.themeKey,
    themeInfo: themeInfo,
    period: period,
    periodMonths: months,
    msrp: raw.msrp,
    market: raw.market,
    score: score,
    pastSeries: pastSeries,
    projSeries: projSeries,
    hasExclusiveMinifigs: raw.hasExclusiveMinifigs,
    raw: raw
  };
}

function ScarcityPage() {
  var lc = useLanguage(); var t = lc.t;
  var sp = useSearchParams(); var searchParams = sp[0];
  var initialSetNum = searchParams.get('setNum') || '';
  var initialQuery = searchParams.get('q') || '';

  var s1 = useState(initialSetNum || initialQuery); var input = s1[0]; var setInput = s1[1];
  var s2 = useState(false); var loading = s2[0]; var setLoading = s2[1];
  var s3 = useState(null); var result = s3[0]; var setResult = s3[1];
  var s4 = useState(null); var error = s4[0]; var setError = s4[1];
  var s5 = useState([]); var statusLog = s5[0]; var setStatusLog = s5[1];

  // ---- name search state ----
  var s6 = useState([]); var searchResults = s6[0]; var setSearchResults = s6[1];
  var s7 = useState(false); var searching = s7[0]; var setSearching = s7[1];
  var s8 = useState(false); var searched = s8[0]; var setSearched = s8[1];
  var lastQueryRef = useRef('');

  // ---- selected return period (3/5/10/20/30 years) ----
  var s9 = useState(getInitialPeriod()); var selectedPeriod = s9[0]; var setSelectedPeriod = s9[1];

  var pushStatus = function(msg) {
    setStatusLog(function(prev) { return prev.concat([msg]); });
  };

  var analyze = async function(setNumRaw, periodArg) {
    var raw = (setNumRaw || '').trim();
    if (!raw) return;
    var period = periodArg || selectedPeriod;
    setError(null); setResult(null); setLoading(true); setStatusLog([]);
    pushStatus(t('scarcityStatusFetching'));

    try {
      var setNum = ensureVariant(raw);

      var detail = null;
      try {
        detail = await getSetDetail(setNum);
        pushStatus(t('scarcityStatusDetailOk'));
      } catch (e) {
        pushStatus(t('scarcityStatusDetailFail'));
      }

      var msrp = lookupMsrp(setNum);
      if (!msrp) {
        if (detail && detail.num_parts > 0) {
          msrp = {
            value: detail.num_parts * 155,
            source: t('scarcityMsrpEstimated') + ' (' + detail.num_parts + ' x \u20A9155)',
            official: false,
            estimated: true
          };
          pushStatus(t('scarcityStatusMsrpEstimated'));
        } else {
          throw new Error(t('scarcityErrorNoMsrp'));
        }
      } else {
        pushStatus(t('scarcityStatusMsrpOk'));
      }

      var themeKey = classifyTheme(detail || { set_num: setNum, name: '' });
      var themeInfo = getThemeReturn(themeKey, period);
      pushStatus(t('scarcityStatusTheme') + ': ' + themeKey);

      pushStatus(t('scarcityStatusFetchingMarket'));
      var market = await fetchMarketPrice(setNum);
      if (!market) {
        var ageYears = (detail && detail.year) ? Math.max(0.5, new Date().getFullYear() - detail.year) : 1;
        var simGrowth = (themeInfo.avgReturnPct / 100) * ageYears;
        var simulatedMarket = msrp.value * (1 + Math.max(0, simGrowth));
        market = { value: Math.round(simulatedMarket), source: t('scarcityMarketSimulated') };
        pushStatus(t('scarcityStatusMarketSim'));
      } else {
        pushStatus(t('scarcityStatusMarketOk'));
      }

      var isOld = detail && detail.year && (new Date().getFullYear() - detail.year) >= 5;
      var isBig = detail && detail.num_parts >= 2000;
      var isBdp = themeKey === 'BDP';
      var hasExclusiveMinifigs = !!(isOld || isBig || isBdp);

      var rawCache = {
        setNum: setNum,
        name: (detail && detail.name) || raw,
        year: detail ? detail.year : null,
        numParts: detail ? detail.num_parts : null,
        imgUrl: detail ? detail.set_img_url : null,
        themeKey: themeKey,
        msrp: msrp,
        market: market,
        hasExclusiveMinifigs: hasExclusiveMinifigs
      };
      pushStatus(t('scarcityStatusDone'));
      setResult(recomputeForPeriod(rawCache, period));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Period change: if a result exists, recompute locally (no network).
  // Otherwise, just persist the choice for the next analysis.
  var onChangePeriod = function(newPeriod) {
    if (SUPPORTED_PERIODS.indexOf(newPeriod) < 0) return;
    setSelectedPeriod(newPeriod);
    try { localStorage.setItem(PERIOD_STORAGE_KEY, String(newPeriod)); } catch (e) {}
    if (result && result.raw) {
      setResult(recomputeForPeriod(result.raw, newPeriod));
    }
  };

  // ---- name search ----
  var runNameSearch = async function(raw) {
    setError(null);
    setResult(null);
    setSearchResults([]);
    setSearching(true);
    setSearched(true);
    lastQueryRef.current = raw;
    try {
      var translated = translateSearchQuery(raw);
      var ipTerms = getIpSearchTerms(raw) || getIpSearchTerms(translated) || [];
      var queries = [];
      if (translated && queries.indexOf(translated) < 0) queries.push(translated);
      if (raw && queries.indexOf(raw) < 0) queries.push(raw);
      ipTerms.forEach(function(term) {
        if (queries.indexOf(term) < 0) queries.push(term);
      });

      var promises = queries.slice(0, 5).map(function(q) {
        return searchSets(q, 1, 30).catch(function() { return { results: [] }; });
      });
      var ress = await Promise.all(promises);
      var seen = {};
      var merged = [];
      ress.forEach(function(r) {
        (r && r.results ? r.results : []).forEach(function(set) {
          if (!seen[set.set_num]) {
            seen[set.set_num] = true;
            merged.push(set);
          }
        });
      });
      // Sort by year desc as a sensible default
      merged.sort(function(a, b) { return (b.year || 0) - (a.year || 0); });
      setSearchResults(merged);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSearching(false);
    }
  };

  var onSubmit = function(e) {
    if (e) e.preventDefault();
    var raw = (input || '').trim();
    if (!raw) return;
    // If looks like a set number (digits, optional -N suffix), analyze directly
    if (/^\d+(-\d+)?$/.test(raw)) {
      setSearchResults([]);
      setSearched(false);
      analyze(raw);
      return;
    }
    runNameSearch(raw);
  };

  var onSelectSet = function(setNum) {
    analyze(setNum);
    if (typeof window !== 'undefined') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    }
  };

  var onBackToResults = function() {
    setResult(null);
    setError(null);
  };

  // Auto-run if ?setNum= present on first mount
  React.useEffect(function() {
    if (initialSetNum) { analyze(initialSetNum); return; }
    if (initialQuery) { runNameSearch(initialQuery); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- styles ----------
  var pageStyle = { maxWidth: 980, margin: '0 auto', padding: '20px 16px' };
  var titleStyle = { fontSize: '1.6rem', margin: '0 0 4px', color: 'var(--color-text, #222)' };
  var subStyle = { color: 'var(--color-text-secondary, #666)', fontSize: '0.9rem', marginBottom: 18 };
  var formStyle = { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' };
  var inputStyle = { flex: '1 1 220px', minWidth: 0, padding: '10px 12px', border: '1px solid var(--color-border, #ccc)', borderRadius: 6, fontSize: '0.95rem', background: 'var(--color-surface, #fff)', color: 'var(--color-text, #222)' };
  var btnStyle = { padding: '10px 18px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.95rem', cursor: 'pointer', fontWeight: 600 };
  var btnDisabledStyle = Object.assign({}, btnStyle, { background: '#999', cursor: 'not-allowed' });
  var cardStyle = { background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #e6e8eb)', borderRadius: 8, padding: 16, marginBottom: 16 };
  var rowStyle = { display: 'flex', gap: 16, flexWrap: 'wrap' };
  var labelStyle = { fontSize: '0.75rem', color: 'var(--color-text-muted, #888)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 };
  var valueStyle = { fontSize: '1.05rem', color: 'var(--color-text, #222)', fontWeight: 600 };
  var statusStyle = { fontSize: '0.8rem', color: 'var(--color-text-secondary, #666)', fontFamily: 'monospace', background: 'var(--color-surface-soft, #f5f7fa)', padding: 10, borderRadius: 4, marginBottom: 12, whiteSpace: 'pre-wrap' };

  // Recharts uses inline SVG that can't read CSS variables — use neutral mid colors
  // that read on both light and dark backgrounds.
  var chartGridStroke = 'rgba(128,128,128,0.3)';
  var chartAxisFill = '#9aa3b2';
  var chartTooltipContentStyle = {
    background: 'rgba(20,22,28,0.92)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: '#f0f2f6',
    fontSize: 12
  };
  var chartTooltipLabelStyle = { color: '#e6e6e6', fontWeight: 600 };
  var chartTooltipItemStyle = { color: '#f0f2f6' };

  var headerEl = React.createElement('div', null,
    React.createElement('h1', { style: titleStyle }, t('scarcityPageTitle')),
    React.createElement('div', { style: subStyle }, t('scarcityPageDesc'))
  );

  var busy = loading || searching;
  var formEl = React.createElement('form', { style: formStyle, onSubmit: onSubmit },
    React.createElement('input', {
      type: 'text',
      value: input,
      onChange: function(e) { setInput(e.target.value); },
      placeholder: t('scarcityInputPlaceholder'),
      style: inputStyle,
      'aria-label': t('scarcityInputPlaceholder')
    }),
    React.createElement('button', {
      type: 'submit',
      style: busy || !input.trim() ? btnDisabledStyle : btnStyle,
      disabled: busy || !input.trim()
    }, t('scarcitySearchBtn'))
  );

  // ---- period selector pill group ----
  var periodPillBase = {
    padding: '6px 14px', border: '1px solid var(--color-border, #ccc)', borderRadius: 999,
    background: 'var(--color-surface, #fff)', color: 'var(--color-text, #222)',
    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
  };
  var periodPillActive = Object.assign({}, periodPillBase, {
    background: '#0066cc', color: '#fff', borderColor: '#0066cc'
  });
  var periodPills = SUPPORTED_PERIODS.map(function(yrs) {
    var key = 'scarcityPeriod' + yrs + 'y';
    return React.createElement('button', {
      key: yrs,
      type: 'button',
      onClick: function() { onChangePeriod(yrs); },
      style: yrs === selectedPeriod ? periodPillActive : periodPillBase,
      'aria-pressed': yrs === selectedPeriod
    }, t(key));
  });
  var periodSelectorEl = React.createElement('div', {
    style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }
  },
    React.createElement('span', { style: { fontSize: '0.85rem', color: 'var(--color-text-secondary, #666)', fontWeight: 600 } }, t('scarcityPeriodLabel') + ':'),
    periodPills
  );

  // ---- search results list ----
  var searchListEl = null;
  if (!result && searched && !searching) {
    if (searchResults.length === 0) {
      searchListEl = React.createElement('div', { style: cardStyle },
        React.createElement('div', { style: { color: 'var(--color-text-secondary, #666)', fontSize: '0.9rem' } }, t('scarcityNoSearchResults'))
      );
    } else {
      var hint = React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-secondary, #666)', marginBottom: 10 } },
        t('scarcitySearchResultsHint') + ' (' + searchResults.length + ')'
      );
      var rowItemStyle = {
        display: 'flex', gap: 12, alignItems: 'center', padding: '10px 8px',
        borderBottom: '1px solid var(--color-border, #eee)', cursor: 'pointer', borderRadius: 4
      };
      var listItems = searchResults.slice(0, 60).map(function(set) {
        return React.createElement('div', {
          key: set.set_num,
          style: rowItemStyle,
          onClick: function() { onSelectSet(set.set_num); },
          onMouseOver: function(e) { e.currentTarget.style.background = 'var(--color-surface-soft, #f5f7fa)'; },
          onMouseOut: function(e) { e.currentTarget.style.background = 'transparent'; }
        },
          set.set_img_url ? React.createElement('img', {
            src: set.set_img_url, alt: set.name,
            style: { width: 64, height: 48, objectFit: 'contain', background: 'var(--color-surface-soft, #f5f7fa)', borderRadius: 4 }
          }) : React.createElement('div', { style: { width: 64, height: 48, background: 'var(--color-surface-soft, #f5f7fa)', borderRadius: 4 } }),
          React.createElement('div', { style: { flex: 1, minWidth: 0 } },
            React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--color-text-muted, #888)' } }, set.set_num),
            React.createElement('div', {
              style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text, #222)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
            }, set.name),
            React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--color-text-secondary, #666)' } },
              (set.year ? set.year + t('yearSuffix') + ' \u00B7 ' : '') +
              (set.num_parts ? set.num_parts.toLocaleString() + t('partsCount') : '')
            )
          ),
          React.createElement('div', {
            style: { fontSize: '0.8rem', color: '#4a9eff', whiteSpace: 'nowrap', fontWeight: 600 }
          }, t('scarcityClickToAnalyze') + ' \u2192')
        );
      });
      searchListEl = React.createElement('div', { style: cardStyle }, hint, listItems);
    }
  }

  var loadingEl = busy ? React.createElement('div', { style: cardStyle },
    React.createElement(Loading, { message: searching ? t('scarcitySearching') : t('scarcityLoading') }),
    statusLog.length > 0 ? React.createElement('div', { style: statusStyle }, statusLog.join('\n')) : null
  ) : null;

  var errorEl = error ? React.createElement('div', {
    style: Object.assign({}, cardStyle, {
      borderColor: 'rgba(220,80,80,0.5)',
      background: 'rgba(220,80,80,0.12)',
      color: '#ff8a8a'
    })
  }, error) : null;

  // ---------- Result rendering ----------
  var resultEl = null;
  if (result && !loading) {
    var s = result.score;

    var backBtn = (searchResults.length > 0) ? React.createElement('button', {
      type: 'button',
      onClick: onBackToResults,
      style: {
        marginBottom: 12, padding: '8px 14px', background: 'var(--color-surface, #fff)',
        border: '1px solid #4a9eff', color: '#4a9eff', borderRadius: 4,
        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
      }
    }, t('scarcityBackToResults')) : null;

    var setHeaderEl = React.createElement('div', { style: Object.assign({}, cardStyle, { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }) },
      result.imgUrl ? React.createElement('img', {
        src: result.imgUrl,
        alt: result.name,
        style: { width: 120, height: 90, objectFit: 'contain', borderRadius: 4, background: 'var(--color-surface-soft, #f5f7fa)' }
      }) : null,
      React.createElement('div', { style: { flex: '1 1 220px' } },
        React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--color-text-muted, #888)' } }, result.setNum),
        React.createElement('div', { style: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text, #222)', margin: '2px 0' } }, result.name),
        React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-secondary, #666)' } },
          (result.year ? result.year + t('yearSuffix') + ' \u00B7 ' : '') +
          (result.numParts ? result.numParts.toLocaleString() + t('partsCount') + ' \u00B7 ' : '') +
          t('themePrefix') + ': ' + result.theme
        ),
        React.createElement(Link, {
          to: '/set/' + result.setNum,
          style: { fontSize: '0.8rem', color: '#4a9eff', textDecoration: 'none' }
        }, '\u2192 ' + t('detailPage'))
      )
    );

    // Banner shown when MSRP is not the official LEGO Korea price
    var msrpWarnEl = (!result.msrp.official) ? React.createElement('div', {
      style: {
        background: 'var(--color-info-bg, #fff8e1)',
        border: '1px solid var(--color-info-border, #ffd88a)',
        color: 'var(--color-info-text, #7a5200)',
        padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: '0.82rem'
      }
    },
      '\u26A0\uFE0F ' + (result.msrp.estimated
        ? '\uC774 \uC81C\uD488\uC740 \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uC5D0 \uC815\uAC00 \uC815\uBCF4\uAC00 \uC5C6\uC5B4 \uBD80\uD488 \uC218 \uAE30\uBC18\uC73C\uB85C \uCD94\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C \uC815\uAC00\uC640 \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
        : '\uC774 \uC81C\uD488\uC740 \uD658\uC735 \uD658\uC0B0\uAC12\uC774\uBA70 \uC2E4\uC81C \uD55C\uAD6D \uC815\uAC00\uC640 \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.') + ' ',
      React.createElement('a', {
        href: getLegoKrProductUrl(result.setNum),
        target: '_blank', rel: 'noopener noreferrer',
        style: { color: '#4a9eff', fontWeight: 600 }
      }, '\u2192 \uB808\uACE0 \uACF5\uC2DD \uD55C\uAD6D \uC0AC\uC774\uD2B8\uC5D0\uC11C \uC815\uAC00 \uD655\uC778')
    ) : null;

    // Banner shown when chosen period exceeds the actual age of the theme
    var extrapolatedEl = (result.themeInfo && result.themeInfo.extrapolated) ? React.createElement('div', {
      style: {
        background: 'var(--color-info-bg, #fff8e1)',
        border: '1px solid var(--color-info-border, #ffd88a)',
        color: 'var(--color-info-text, #7a5200)',
        padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: '0.82rem'
      }
    }, t('scarcityExtrapolatedNote')) : null;

    var statsEl = React.createElement('div', { style: cardStyle },
      React.createElement('div', { style: rowStyle },
        React.createElement('div', { style: { flex: '1 1 140px' } },
          React.createElement('div', { style: labelStyle }, t('scarcityMsrp')),
          React.createElement('div', { style: valueStyle }, fmtKRW(result.msrp.value)),
          React.createElement('div', { style: { fontSize: '0.7rem', color: result.msrp.official ? '#3ec47a' : '#ffb84d' } },
            (result.msrp.official ? '\u2713 ' : '\u26A0 ') + result.msrp.source)
        ),
        React.createElement('div', { style: { flex: '1 1 140px' } },
          React.createElement('div', { style: labelStyle }, t('scarcityMarket')),
          React.createElement('div', { style: valueStyle }, fmtKRW(result.market.value)),
          React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--color-text-muted, #999)' } }, result.market.source)
        ),
        React.createElement('div', { style: { flex: '1 1 140px' } },
          React.createElement('div', { style: labelStyle }, t('scarcityReturn')),
          React.createElement('div', { style: Object.assign({}, valueStyle, { color: s.returnPct >= 0 ? '#3ec47a' : '#ff6b6b' }) },
            (s.returnPct >= 0 ? '+' : '') + s.returnPct + '%'),
          React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--color-text-muted, #999)' } },
            t('scarcityThemeAvg') + ' (' + result.themeInfo.years + 'y): ' + result.themeInfo.avgReturnPct + '%')
        ),
        React.createElement('div', { style: { flex: '1 1 140px' } },
          React.createElement('div', { style: labelStyle }, t('scarcityExclusive')),
          React.createElement('div', { style: valueStyle }, result.hasExclusiveMinifigs ? '+20 pts' : '0 pts'),
          React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--color-text-muted, #999)' } },
            result.hasExclusiveMinifigs ? t('scarcityExclusiveYes') : t('scarcityExclusiveNo'))
        )
      )
    );

    // ---- Brick stack score gauge (replaces flat gradient bar) ----
    // Stacks of 10 LEGO bricks fill from the bottom; the brick color
    // matches the grade (S=gold, A=green, B=blue, C=orange, D=red).
    var brickStackEl = React.createElement('div', {
      className: 'brick-stack',
      'data-grade': s.grade,
      'aria-label': 'score ' + s.finalScore + ' of 100'
    },
      React.createElement('div', { className: 'brick-stack-track' },
        React.createElement('div', {
          className: 'brick-stack-fill',
          style: { height: s.finalScore + '%' }
        })
      ),
      React.createElement('div', { className: 'brick-stack-label' },
        s.finalScore + ' / 100'
      )
    );

    var gradeBadgeEl = React.createElement('div', {
      className: 'brick-badge',
      'data-grade': s.grade,
      title: 'Grade ' + s.grade
    }, s.grade);

    var gradeMarkers = ['S', 'A', 'B', 'C', 'D'].map(function(g) {
      var pts = g === 'S' ? '80+' : g === 'A' ? '65+' : g === 'B' ? '50+' : g === 'C' ? '35+' : '0+';
      var dim = g !== s.grade;
      return React.createElement('div', {
        key: g,
        style: {
          display: 'flex', alignItems: 'center', gap: 8,
          opacity: dim ? 0.45 : 1,
          fontWeight: dim ? 500 : 700
        }
      },
        React.createElement('div', { className: 'brick-badge', 'data-grade': g, style: { width: 36, height: 22, fontSize: '0.85rem', marginTop: 4 } }, g),
        React.createElement('span', { style: { fontSize: '0.78rem', color: 'var(--color-text-secondary, #666)' } }, pts)
      );
    });

    var gaugeEl = React.createElement('div', { style: cardStyle },
      React.createElement('div', { style: { fontSize: '1rem', fontWeight: 700, color: 'var(--color-text, #222)', marginBottom: 14 } }, t('scarcityScoreTitle')),
      React.createElement('div', {
        style: { display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-around' }
      },
        brickStackEl,
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 } },
          gradeBadgeEl,
          React.createElement('div', { style: { fontSize: '0.78rem', color: 'var(--color-text-muted, #888)', textTransform: 'uppercase', letterSpacing: 0.5 } }, 'Grade')
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, gradeMarkers)
      )
    );

    var pastChartEl = React.createElement('div', { style: cardStyle },
      React.createElement('div', { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text, #333)', marginBottom: 8 } }, t('scarcityChartPastTitle')),
      React.createElement('div', { style: { width: '100%', height: 240 } },
        React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
          React.createElement(LineChart, { data: result.pastSeries, margin: { top: 8, right: 16, left: 4, bottom: 4 } },
            React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: chartGridStroke }),
            React.createElement(XAxis, { dataKey: 'label', tick: { fontSize: 10, fill: chartAxisFill }, stroke: chartAxisFill }),
            React.createElement(YAxis, { tick: { fontSize: 10, fill: chartAxisFill }, stroke: chartAxisFill, tickFormatter: function(v) { return Math.round(v / 1000) + 'k'; } }),
            React.createElement(Tooltip, {
              formatter: function(v) { return fmtKRW(v); },
              contentStyle: chartTooltipContentStyle,
              labelStyle: chartTooltipLabelStyle,
              itemStyle: chartTooltipItemStyle,
              cursor: { stroke: chartAxisFill, strokeWidth: 1 }
            }),
            React.createElement(Legend, { wrapperStyle: { fontSize: 11, color: chartAxisFill } }),
            React.createElement(Line, { type: 'monotone', dataKey: 'theme', name: t('scarcityChartThemeAvg'), stroke: '#4a9eff', strokeWidth: 2, dot: false }),
            React.createElement(Line, { type: 'monotone', dataKey: 'market', name: t('scarcityChartCurrentMarket'), stroke: '#d4af37', strokeWidth: 0, dot: { r: 6, fill: '#d4af37' } })
          )
        )
      ),
      React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--color-text-muted, #999)', marginTop: 6 } },
        t('scarcityChartPastNote')
          .replace('{years}', result.period)
          .replace('{months}', result.periodMonths) +
        ' (n=' + result.themeInfo.sample + ', ' + result.themeInfo.years + 'y)')
    );

    var projChartEl = React.createElement('div', { style: cardStyle },
      React.createElement('div', { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text, #333)', marginBottom: 8 } }, t('scarcityChartProjTitle')),
      React.createElement('div', { style: { width: '100%', height: 220 } },
        React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
          React.createElement(LineChart, { data: result.projSeries, margin: { top: 8, right: 16, left: 4, bottom: 4 } },
            React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: chartGridStroke }),
            React.createElement(XAxis, { dataKey: 'label', tick: { fontSize: 10, fill: chartAxisFill }, stroke: chartAxisFill }),
            React.createElement(YAxis, { tick: { fontSize: 10, fill: chartAxisFill }, stroke: chartAxisFill, tickFormatter: function(v) { return Math.round(v / 1000) + 'k'; } }),
            React.createElement(Tooltip, {
              formatter: function(v) { return fmtKRW(v); },
              contentStyle: chartTooltipContentStyle,
              labelStyle: chartTooltipLabelStyle,
              itemStyle: chartTooltipItemStyle,
              cursor: { stroke: chartAxisFill, strokeWidth: 1 }
            }),
            React.createElement(ReferenceLine, { y: result.market.value, stroke: chartAxisFill, strokeDasharray: '4 4', label: { value: t('scarcityChartCurrentMarket'), position: 'insideTopRight', fill: chartAxisFill, fontSize: 10 } }),
            React.createElement(Line, { type: 'monotone', dataKey: 'projected', name: t('scarcityChartProjected'), stroke: '#3ec47a', strokeWidth: 2, dot: { r: 3 } })
          )
        )
      ),
      React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--color-text-muted, #999)', marginTop: 6 } }, t('scarcityChartProjNote'))
    );

    var disclaimerEl = React.createElement('div', { style: { fontSize: '0.7rem', color: 'var(--color-text-muted, #aaa)', textAlign: 'center', padding: '8px 0' } }, t('scarcityDisclaimer'));

    resultEl = React.createElement('div', null,
      backBtn,
      setHeaderEl,
      msrpWarnEl,
      extrapolatedEl,
      gaugeEl,
      statsEl,
      pastChartEl,
      projChartEl,
      disclaimerEl
    );
  }

  return React.createElement('div', { style: pageStyle },
    headerEl,
    formEl,
    periodSelectorEl,
    loadingEl,
    errorEl,
    searchListEl,
    resultEl
  );
}

export default ScarcityPage;
