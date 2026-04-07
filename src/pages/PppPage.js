// PPP (Price Per Part) cost-effectiveness ranking page.
//
// Iterates over every set in prices.json that has a valid KRW price,
// fetches num_parts + theme via Rebrickable API (with localStorage cache
// keyed by setNum and a 7-day TTL), computes KRW/part, and renders a
// sortable bento-grid ranking. Users can filter by theme to find the
// cheapest-per-part sets within a single theme (e.g. \"top 10 Star Wars
// by PPP\").

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import pricesJson from '../data/prices.json';
import { getSetDetail } from '../utils/api';
import { getKrwPrice } from '../utils/price';
import { useLanguage } from '../contexts/LanguageContext';
import { translateThemeName } from '../utils/translate';
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

// Normalize a setNum (strip the "-1" variant suffix that prices.json
// sometimes carries) so the API call always uses the canonical form.
function normalizeSetNum(s) {
  if (!s) return '';
  return String(s).indexOf('-') >= 0 ? s : s + '-1';
}

function PppPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;

  var s1 = useState([]);    var rows = s1[0];     var setRows = s1[1];
  var s2 = useState(true);  var loading = s2[0];  var setLoading = s2[1];
  var s3 = useState(0);     var progress = s3[0]; var setProgress = s3[1];
  var s4 = useState(0);     var total = s4[0];    var setTotal = s4[1];
  var s5 = useState('all'); var themeFilter = s5[0]; var setThemeFilter = s5[1];
  var s6 = useState(20);    var topN = s6[0];     var setTopN = s6[1];

  // Fetch metadata for every priced set on mount.
  var fetchAll = useCallback(async function() {
    setLoading(true);

    // Build the input list from prices.json keys, but filter to those
    // that resolve to a real KRW price via getKrwPrice (handles aliases
    // and variant suffixes consistently with SearchPage / ScarcityPage).
    var keys = Object.keys(pricesJson || {}).filter(function(k) {
      // Skip the meta object
      if (k === 'meta' || k === '_meta') return false;
      var entry = pricesJson[k];
      return entry && typeof entry === 'object' && (entry.price || entry.priceKrw);
    });

    setTotal(keys.length);

    var cache = loadMetaCache();
    var now = Date.now();
    var results = [];

    // Process in CONCURRENCY chunks
    var idx = 0;
    var doneCount = 0;
    async function worker() {
      while (idx < keys.length) {
        var i = idx++;
        var setKey = keys[i];
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
          var krw = getKrwPrice(canonical);
          if (krw && krw > 0) {
            results.push({
              setNum: meta.setNum || canonical,
              name: meta.name,
              year: meta.year,
              numParts: meta.numParts,
              themeId: meta.themeId,
              imgUrl: meta.imgUrl,
              priceKrw: krw,
              ppp: krw / meta.numParts,
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
  }, []);

  useEffect(function() { fetchAll(); }, [fetchAll]);

  // Build the unique theme list from results
  var themeOptions = useMemo(function() {
    var seen = {};
    rows.forEach(function(r) {
      if (r.themeId != null) seen[r.themeId] = true;
    });
    return Object.keys(seen).map(function(id) {
      return { id: id, name: translateThemeName(String(id), lang) || ('Theme ' + id) };
    });
  }, [rows, lang]);

  // Filter + top-N
  var visible = useMemo(function() {
    var filtered = rows;
    if (themeFilter !== 'all') {
      filtered = rows.filter(function(r) { return String(r.themeId) === String(themeFilter); });
    }
    return filtered.slice(0, topN);
  }, [rows, themeFilter, topN]);

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
        fmtKrw(rows[0].ppp) + ' / ' + t('numParts')),
      React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-secondary, #666)', marginTop: 4 } },
        rows[0].setNum + ' \u00B7 ' + (rows[0].name || ''))
    )
  ) : null;

  var avgCell = rows.length > 0 ? React.createElement('div', { className: 'bento-cell bento-w-4' },
    React.createElement('div', { className: 'bento-cell-content' },
      React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-text-muted, #888)', marginBottom: 6 } },
        t('pppAvgLabel')),
      React.createElement('div', { style: { fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text, #222)' } },
        fmtKrw(rows.reduce(function(a, r) { return a + r.ppp; }, 0) / rows.length) + ' / ' + t('numParts')),
      React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--color-text-muted, #888)', marginTop: 4 } },
        t('pppAvgHint'))
    )
  ) : null;

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
              React.createElement('div', { style: { fontSize: '0.8rem', color: 'var(--color-text-muted, #888)' } },
                r.setNum + ' \u00B7 ' + (r.year || ''))
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
