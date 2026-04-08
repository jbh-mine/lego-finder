// PPP (Price Per Part) cost-effectiveness ranking page.
//
// Iterates over every set in prices.json that has a valid KRW price
// (active OR discontinued — historical Korean MSRP is used for the
// latter), fetches num_parts via Rebrickable API (with localStorage
// cache keyed by setNum and a 7-day TTL), computes KRW/part, and
// renders a sortable bento-grid ranking.
//
// As of schemaVersion 2, prices.json carries a top-level `themes` map
// keyed by Korean LEGO series id (starwars, harrypotter, icons, ...)
// and every entry has its own `theme` + `year` field. We use those
// directly so the theme filter dropdown can show Korean labels and
// works without waiting on Rebrickable. Discontinued sets are opt-in
// via a toggle so users can rank historical-MSRP value-per-part too.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import pricesJson from '../data/prices.json';
import { getSetDetail } from '../utils/api';
import { getKrwPrice } from '../utils/price';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading } from '../components/Loading';

var META_CACHE_KEY = 'lego_ppp_meta_cache_v1';
var META_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
var CONCURRENCY = 4;

function loadMetaCache() {
  try { return JSON.parse(localStorage.getItem(META_CACHE_KEY) || '{}'); }
  catch (e) { return {}; }
}
function saveMetaCache(c) {
  try { localStorage.setItem(META_CACHE_KEY, JSON.stringify(c)); } catch (e) {}
}

function fmtKrw(n) {
  if (n == null || isNaN(n)) return '-';
  return '\u20A9' + Math.round(n).toLocaleString('ko-KR');
}

// Normalize a setNum to the canonical "<num>-1" form that Rebrickable
// expects. prices.json keys are stored without the variant suffix.
function normalizeSetNum(s) {
  if (!s) return '';
  return String(s).indexOf('-') >= 0 ? s : s + '-1';
}

function PppPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang || lc.language || 'ko';

  var s1 = useState([]);    var rows = s1[0];     var setRows = s1[1];
  var s2 = useState(true);  var loading = s2[0];  var setLoading = s2[1];
  var s3 = useState(0);     var progress = s3[0]; var setProgress = s3[1];
  var s4 = useState(0);     var total = s4[0];    var setTotal = s4[1];
  var s5 = useState('all'); var themeFilter = s5[0]; var setThemeFilter = s5[1];
  var s6 = useState(20);    var topN = s6[0];     var setTopN = s6[1];
  var s7 = useState(true);  var includeDiscontinued = s7[0]; var setIncludeDiscontinued = s7[1];

  // Themes map from prices.json (schemaVersion 2). Keyed by series id
  // (starwars, harrypotter, ...) -> { ko, en, order }.
  var themesMap = (pricesJson && pricesJson.themes) || {};

  // Fetch metadata for every priced set whenever the discontinued
  // toggle changes. We re-run because the candidate key set differs.
  var fetchAll = useCallback(async function() {
    setLoading(true);
    setProgress(0);

    var pricesObj = (pricesJson && pricesJson.prices) || {};
    var keys = Object.keys(pricesObj).filter(function(k) {
      var entry = pricesObj[k];
      if (!entry || typeof entry !== 'object') return false;
      // Skip USD-only BDP entries (they need an async exchange-rate
      // lookup that PPP doesn't currently support).
      if (!entry.price || entry.price <= 0) return false;
      // Discontinued sets carry historical Korean MSRP — opt-in.
      if (entry.discontinued && !includeDiscontinued) return false;
      return true;
    });

    setTotal(keys.length);

    var cache = loadMetaCache();
    var now = Date.now();
    var results = [];

    var idx = 0;
    var doneCount = 0;
    async function worker() {
      while (idx < keys.length) {
        var i = idx++;
        var setKey = keys[i];
        var entry = pricesObj[setKey];
        var canonical = normalizeSetNum(setKey);

        var meta = null;
        var cached = cache[canonical];
        if (cached && cached.t && (now - cached.t) < META_TTL_MS) {
          meta = cached.data;
        } else {
          try {
            var detail = await getSetDetail(canonical);
            meta = detail ? {
              setNum: detail.set_num,
              name: detail.name,
              year: detail.year,
              numParts: detail.num_parts,
              themeId: detail.theme_id,
              imgUrl: detail.set_img_url,
            } : null;
            if (meta) {
              cache[canonical] = { t: now, data: meta };
            }
          } catch (e) {
            meta = null;
          }
        }

        if (meta && meta.numParts && meta.numParts > 0) {
          // Read price from prices.json directly so historical MSRP for
          // discontinued sets still flows through. getKrwPrice would
          // return discontinued:true and zero out the value.
          var krw = entry.price;
          if (krw && krw > 0) {
            results.push({
              setNum: meta.setNum || canonical,
              name: meta.name || entry.name || canonical,
              year: meta.year || entry.year,
              numParts: meta.numParts,
              themeKey: entry.theme || null,
              themeId: meta.themeId,
              imgUrl: meta.imgUrl,
              priceKrw: krw,
              ppp: krw / meta.numParts,
              discontinued: !!entry.discontinued,
            });
          }
        }

        doneCount++;
        setProgress(doneCount);
      }
    }

    var workers = [];
    for (var w = 0; w < CONCURRENCY; w++) workers.push(worker());
    await Promise.all(workers);

    saveMetaCache(cache);

    // Sort by PPP ascending (cheapest per part = best value)
    results.sort(function(a, b) { return a.ppp - b.ppp; });
    setRows(results);
    setLoading(false);
  }, [includeDiscontinued]);

  useEffect(function() { fetchAll(); }, [fetchAll]);

  // Build theme dropdown options from the prices.json themes map,
  // sorted by the curated `order` field. Falls back to any theme keys
  // observed in the result rows that aren't already in the map.
  var themeOptions = useMemo(function() {
    var seen = {};
    rows.forEach(function(r) {
      if (r.themeKey) seen[r.themeKey] = true;
    });
    Object.keys(themesMap).forEach(function(k) { seen[k] = true; });
    var keys = Object.keys(seen);
    keys.sort(function(a, b) {
      var oa = themesMap[a] && themesMap[a].order != null ? themesMap[a].order : 999;
      var ob = themesMap[b] && themesMap[b].order != null ? themesMap[b].order : 999;
      return oa - ob;
    });
    return keys.map(function(k) {
      var th = themesMap[k];
      var label = th ? (lang === 'ko' ? th.ko : th.en) : k;
      return { id: k, name: label };
    });
  }, [rows, themesMap, lang]);

  // Filter + top-N
  var visible = useMemo(function() {
    var filtered = rows;
    if (themeFilter !== 'all') {
      filtered = rows.filter(function(r) { return r.themeKey === themeFilter; });
    }
    return filtered.slice(0, topN);
  }, [rows, themeFilter, topN]);

  function themeLabel(key) {
    if (!key) return '';
    var th = themesMap[key];
    if (!th) return key;
    return lang === 'ko' ? th.ko : th.en;
  }

  var statsCell = React.createElement('div', { className: 'bento-cell bento-w-4' },
    React.createElement('div', { className: 'bento-cell-content' },
      React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', marginBottom: 6 } },
        t('pppDatasetLabel')),
      React.createElement('div', { style: { fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text, #222)' } },
        rows.length + ' / ' + total),
      React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--color-text-muted, #888)', marginTop: 4 } },
        t('pppDatasetHint'))
    )
  );

  var bestCell = rows.length > 0 ? React.createElement('div', { className: 'bento-cell bento-w-4' },
    React.createElement('div', { className: 'bento-cell-content' },
      React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', marginBottom: 6 } },
        t('pppBestLabel')),
      React.createElement('div', { style: { fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text, #222)' } },
        fmtKrw(rows[0].ppp) + ' / ' + t('pppCellParts')),
      React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-secondary, #666)', marginTop: 4 } },
        rows[0].setNum + ' \u00B7 ' + (rows[0].name || ''))
    )
  ) : null;

  var avgCell = rows.length > 0 ? React.createElement('div', { className: 'bento-cell bento-w-4' },
    React.createElement('div', { className: 'bento-cell-content' },
      React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', marginBottom: 6 } },
        t('pppAvgLabel')),
      React.createElement('div', { style: { fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text, #222)' } },
        fmtKrw(rows.reduce(function(a, r) { return a + r.ppp; }, 0) / rows.length) + ' / ' + t('pppCellParts')),
      React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--color-text-muted, #888)', marginTop: 4 } },
        t('pppAvgHint'))
    )
  ) : null;

  var includeDiscLabel = lang === 'ko' ? '단종 제품 포함 (과거 정가 기준)' : 'Include discontinued (historical MSRP)';
  var discBadgeText = lang === 'ko' ? '단종' : 'Retired';

  var headerSection = React.createElement('div', { className: 'search-section' },
    React.createElement('h2', null, t('pppPageTitle')),
    React.createElement('p', { className: 'new-products-desc' }, t('pppPageDesc')),
    React.createElement('div', { className: 'bento-grid', style: { marginTop: 14 } },
      statsCell, bestCell, avgCell
    ),
    React.createElement('div', { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 } },
      React.createElement('label', { style: { fontSize: '0.9rem', color: 'var(--color-text-secondary, #666)' } },
        t('pppFilterTheme')),
      React.createElement('select', {
        className: 'funding-year-select',
        value: themeFilter,
        onChange: function(e) { setThemeFilter(e.target.value); }
      },
        React.createElement('option', { value: 'all' }, t('pppFilterAllThemes')),
        themeOptions.map(function(th) {
          return React.createElement('option', { key: th.id, value: th.id }, th.name);
        })
      ),
      React.createElement('label', { style: { fontSize: '0.9rem', color: 'var(--color-text-secondary, #666)' } },
        t('pppFilterTopN')),
      React.createElement('select', {
        className: 'funding-year-select',
        value: topN,
        onChange: function(e) { setTopN(parseInt(e.target.value, 10)); }
      },
        [10, 20, 30, 50, 100].map(function(n) {
          return React.createElement('option', { key: n, value: n }, 'Top ' + n);
        })
      ),
      React.createElement('label', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.9rem',
          color: 'var(--color-text-secondary, #666)',
          cursor: 'pointer'
        }
      },
        React.createElement('input', {
          type: 'checkbox',
          checked: includeDiscontinued,
          onChange: function(e) { setIncludeDiscontinued(e.target.checked); }
        }),
        includeDiscLabel
      )
    )
  );

  var loadingProgress = loading ? React.createElement('div', { className: 'search-results-summary' },
    t('pppLoadingPrefix') + ' ' + progress + ' / ' + total,
    React.createElement(Loading, null)
  ) : null;

  var grid = !loading ? React.createElement('div', { className: 'bento-grid' },
    visible.map(function(r, i) {
      var isTop3 = i < 3;
      var rankColor = i === 0 ? '#ffd500' : i === 1 ? '#b8b8b8' : i === 2 ? '#cd7f32' : 'var(--color-text-muted, #888)';
      return React.createElement('div', {
        key: r.setNum,
        className: 'bento-cell bento-w-4'
      },
        React.createElement('div', { className: 'bento-cell-content' },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
            React.createElement('div', {
              style: {
                fontSize: '1.4rem',
                fontWeight: 900,
                color: rankColor,
                minWidth: 36,
                textAlign: 'center',
                textShadow: isTop3 ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
              }
            }, '#' + (i + 1)),
            r.imgUrl ? React.createElement('img', {
              src: r.imgUrl,
              alt: r.name,
              style: { width: 60, height: 48, objectFit: 'contain', borderRadius: 4, background: 'var(--color-surface-soft, #f5f5f5)' },
              loading: 'lazy'
            }) : null,
            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
              React.createElement(Link, {
                to: '/set/' + r.setNum,
                style: { fontWeight: 700, color: 'var(--color-text, #222)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              }, r.name || r.setNum),
              React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--color-text-muted, #888)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
                React.createElement('span', null, r.setNum + ' \u00B7 ' + (r.year || '')),
                r.themeKey ? React.createElement('span', {
                  style: {
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'var(--color-surface-soft, #f0f0f0)',
                    color: 'var(--color-text-secondary, #555)',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }
                }, themeLabel(r.themeKey)) : null,
                r.discontinued ? React.createElement('span', {
                  style: {
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'rgba(218, 41, 28, 0.12)',
                    color: '#DA291C',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: '1px solid rgba(218, 41, 28, 0.35)'
                  }
                }, discBadgeText) : null
              )
            )
          ),
          React.createElement('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 6,
              marginTop: 6,
              fontSize: '0.85rem'
            }
          },
            React.createElement('div', null,
              React.createElement('div', { style: { color: 'var(--color-text-muted, #888)', fontSize: '0.75rem' } }, t('pppCellPrice')),
              React.createElement('div', { style: { fontWeight: 700, color: 'var(--color-text, #222)' } }, fmtKrw(r.priceKrw))
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { color: 'var(--color-text-muted, #888)', fontSize: '0.75rem' } }, t('pppCellParts')),
              React.createElement('div', { style: { fontWeight: 700, color: 'var(--color-text, #222)' } }, r.numParts.toLocaleString('ko-KR'))
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { color: 'var(--color-text-muted, #888)', fontSize: '0.75rem' } }, t('pppCellPpp')),
              React.createElement('div', { style: { fontWeight: 800, color: '#4a9eff' } }, fmtKrw(r.ppp))
            )
          )
        )
      );
    })
  ) : null;

  return React.createElement('div', null,
    headerSection,
    loadingProgress,
    grid,
    !loading && rows.length === 0 ? React.createElement('div', { className: 'empty-state' },
      React.createElement('h3', null, t('pppEmptyTitle')),
      React.createElement('p', null, t('pppEmptyMsg'))
    ) : null
  );
}

export default PppPage;
