import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchMocs } from '../utils/mocApi';
import { translateSearchQuery } from '../utils/searchDict';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

// Note: The empty-string sort ('') maps to rebrickable's /mocs/ landing page
// which only returns ~4 featured cards (not a real paginated listing). To
// guarantee a full grid on first entry we default the sort to '-published'
// (newest), which is a real listing endpoint that returns 30+ results per
// page. The "hottest" pill is still selectable but will not be used as the
// initial state.
var DEFAULT_SORT = '-published';

var SORT_OPTIONS = [
  { key: 'newest', value: '-published' },
  { key: 'hottest', value: '' },
  { key: 'mostLiked', value: '-likes' },
  { key: 'mostParts', value: '-num_parts' },
];

function MocsPage() {
  var lc = useLanguage();
  var t = lc.t;

  var s1 = useState(''); var query = s1[0]; var setQuery = s1[1];
  var s2 = useState(''); var qInput = s2[0]; var setQInput = s2[1];
  var s3 = useState(''); var theme = s3[0]; var setTheme = s3[1];
  var s4 = useState(DEFAULT_SORT); var sort = s4[0]; var setSort = s4[1];
  var s5 = useState([]); var results = s5[0]; var setResults = s5[1];
  var s6 = useState([]); var themes = s6[0]; var setThemes = s6[1];
  var s7 = useState(0); var total = s7[0]; var setTotal = s7[1];
  var s8 = useState(false); var loading = s8[0]; var setLoading = s8[1];
  var s9 = useState(null); var error = s9[0]; var setError = s9[1];
  var s10 = useState(false); var loaded = s10[0]; var setLoaded = s10[1];
  var s11 = useState(1); var page = s11[0]; var setPage = s11[1];
  var s12 = useState(false); var hasMore = s12[0]; var setHasMore = s12[1];

  var sentinelRef = useRef(null);
  var stateRef = useRef({ query: '', theme: '', sort: DEFAULT_SORT, page: 1 });

  var doFetch = useCallback(async function(opts, append) {
    setLoading(true);
    setError(null);
    try {
      var data = await searchMocs(opts);
      if (append) {
        setResults(function(prev) { return prev.concat(data.results); });
      } else {
        setResults(data.results);
      }
      setTotal(data.total);
      if (data.themes && data.themes.length > 0) setThemes(data.themes);
      // hasMore: rebrickable serves ~30 cards per listing page; if we got
      // fewer than 25 we treat that as the last page (the featured/landing
      // view returns ~4 which would otherwise wrongly trigger infinite scroll)
      setHasMore(data.results.length >= 25);
      setLoaded(true);
    } catch (e) {
      setError(t('apiError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initial load — always use the newest-sort listing endpoint so the
  // first paint shows a full grid instead of the 4-card featured page.
  useEffect(function() {
    stateRef.current = { query: '', theme: '', sort: DEFAULT_SORT, page: 1 };
    doFetch({ sort: DEFAULT_SORT, page: 1 }, false);
  }, []); // eslint-disable-line

  var applySearch = function(e) {
    if (e) e.preventDefault();
    var translated = translateSearchQuery(qInput.trim());
    setQuery(translated);
    setPage(1);
    stateRef.current = { query: translated, theme: theme, sort: sort, page: 1 };
    doFetch({ q: translated, theme: theme, sort: sort, page: 1 }, false);
  };

  var changeTheme = function(v) {
    setTheme(v);
    setPage(1);
    stateRef.current = { query: query, theme: v, sort: sort, page: 1 };
    doFetch({ q: query, theme: v, sort: sort, page: 1 }, false);
  };

  var changeSort = function(v) {
    setSort(v);
    setPage(1);
    stateRef.current = { query: query, theme: theme, sort: v, page: 1 };
    doFetch({ q: query, theme: theme, sort: v, page: 1 }, false);
  };

  // Infinite scroll
  useEffect(function() {
    if (!sentinelRef.current) return;
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && hasMore && !loading && loaded) {
        var st = stateRef.current;
        var nextPage = st.page + 1;
        st.page = nextPage;
        doFetch({ q: st.query, theme: st.theme, sort: st.sort, page: nextPage }, true);
        setPage(nextPage);
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return function() { obs.disconnect(); };
  });

  var headerSection = React.createElement('div', { className: 'search-section' },
    React.createElement('div', { className: 'new-products-header' },
      React.createElement('h2', null, t('mocsTitle')),
      React.createElement('p', { className: 'new-products-desc' }, t('mocsDesc')),
      React.createElement('div', { className: 'new-products-source-notice' },
        React.createElement('span', { className: 'new-products-source-icon' }, '\u2139\uFE0F'),
        React.createElement('span', { className: 'new-products-source-text' },
          t('mocSourceNotice'),
          React.createElement('a', {
            href: 'https://rebrickable.com/mocs/',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'new-products-source-link'
          }, 'rebrickable.com/mocs'),
          t('mocSourceNoticeSuffix')
        )
      )
    ),
    React.createElement('form', { className: 'moc-search-form', onSubmit: applySearch },
      React.createElement('div', { className: 'search-input-wrapper' },
        React.createElement('input', {
          type: 'text',
          placeholder: t('mocSearchPlaceholder'),
          value: qInput,
          onChange: function(e) { setQInput(e.target.value); }
        }),
        qInput ? React.createElement('button', {
          type: 'button',
          className: 'search-clear-btn',
          onClick: function() { setQInput(''); }
        }, '\u00D7') : null
      ),
      React.createElement('button', { type: 'submit' }, t('searchBtn'))
    ),
    React.createElement('div', { className: 'moc-filter-row' },
      React.createElement('select', {
        className: 'funding-year-select',
        value: theme,
        onChange: function(e) { changeTheme(e.target.value); }
      },
        React.createElement('option', { value: '' }, t('mocAllThemes')),
        themes.map(function(th) {
          return React.createElement('option', { key: th.value, value: th.value }, th.name);
        })
      )
    ),
    React.createElement('div', { className: 'moc-sort-tabs' },
      SORT_OPTIONS.map(function(opt) {
        return React.createElement('button', {
          key: opt.key,
          type: 'button',
          className: 'moc-sort-tab' + (sort === opt.value ? ' active' : ''),
          onClick: function() { changeSort(opt.value); }
        }, t('mocSort_' + opt.key));
      })
    )
  );

  var resultsSection = null;
  if (results.length > 0) {
    var summaryText = (total > 0 ? (t('total') + ' ' + total + ' MOCs') : (results.length + ' MOCs'));
    var summary = React.createElement('div', { className: 'search-results-summary' }, summaryText);
    var grid = React.createElement('div', { className: 'set-grid' },
      results.map(function(moc) {
        return React.createElement(Link, {
          key: moc.mocNum,
          to: '/moc/' + moc.mocNum,
          state: { moc: moc },
          className: 'set-card moc-card-link'
        },
          moc.img
            ? React.createElement('img', {
                className: 'set-card-img',
                src: moc.img,
                alt: moc.name,
                loading: 'lazy',
                onError: function(e) {
                  // If the lazy-load extraction failed, fall back to the
                  // primary CDN guess via the canonical MOC page route.
                  if (e.target.dataset.fallbackTried) {
                    e.target.style.opacity = '0.3';
                    return;
                  }
                  e.target.dataset.fallbackTried = '1';
                  e.target.src = 'https://cdn.rebrickable.com/media/thumbs/mocs/' + moc.mocNum + '/' + (moc.variant || '1') + '.jpg/300x300p.jpg';
                }
              })
            : React.createElement('div', {
                className: 'set-card-img',
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                  color: '#999',
                  fontSize: '12px'
                }
              }, moc.mocNum),
          React.createElement('div', { className: 'set-card-body' },
            React.createElement('div', { className: 'set-card-num' }, moc.mocNum),
            React.createElement('div', { className: 'set-card-name' }, moc.name),
            moc.designer ? React.createElement('div', { className: 'moc-designer' },
              '\uC9C0\uC740\uC774: ' + moc.designer) : null,
            React.createElement('div', { className: 'set-card-meta' },
              React.createElement('span', null, moc.parts ? (moc.parts + ' ' + t('numParts')) : ''),
              React.createElement('span', null, moc.year || '')
            ),
            moc.likes > 0 ? React.createElement('div', { className: 'moc-likes' },
              '\u2665 ' + moc.likes) : null
          )
        );
      })
    );
    resultsSection = React.createElement(React.Fragment, null, summary, grid);
  }

  var initialLoading = (loading && results.length === 0) ? React.createElement(Loading, null) : null;
  var loadingMore = (loading && results.length > 0) ? React.createElement(Loading, null) : null;
  var emptyResults = (!loading && !error && loaded && results.length === 0)
    ? React.createElement(EmptyState, { title: t('noResults'), message: t('mocNoResults') })
    : null;

  return React.createElement('div', null,
    headerSection,
    initialLoading,
    error ? React.createElement(ErrorMessage, {
      message: error,
      onRetry: function() { doFetch({ q: query, theme: theme, sort: sort, page: 1 }, false); }
    }) : null,
    resultsSection,
    loadingMore,
    emptyResults,
    React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } })
  );
}

export default MocsPage;
