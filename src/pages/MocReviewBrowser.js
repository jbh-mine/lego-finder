import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchMocs, getMocSearchUrl, getMocCatalogInfo } from '../utils/mocApi';
import { translateSearchQuery } from '../utils/searchDict';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

// Directory installations use publication order; saved blog introductions
// use their own explicit review-date order below.
var DEFAULT_SORT = '-published';

var SORT_OPTIONS = [
  { key: 'newest', value: '-published' },
  { key: 'hottest', value: '' },
  { key: 'mostLiked', value: '-likes' },
  { key: 'mostParts', value: '-num_parts' },
];

function MocReviewBrowser() {
  var lc = useLanguage();
  var t = lc.t;
  var catalogInfo = getMocCatalogInfo();
  var reviewCatalog = catalogInfo.scope === 'official-blog-reviews';
  var initialSort = reviewCatalog ? '-reviewed' : DEFAULT_SORT;
  var sortOptions = reviewCatalog ? [{ key: 'reviewed', value: '-reviewed' }] : SORT_OPTIONS;

  var s1 = useState(''); var query = s1[0]; var setQuery = s1[1];
  var s2 = useState(''); var qInput = s2[0]; var setQInput = s2[1];
  var s3 = useState(''); var theme = s3[0]; var setTheme = s3[1];
  var s4 = useState(initialSort); var sort = s4[0]; var setSort = s4[1];
  var s5 = useState([]); var results = s5[0]; var setResults = s5[1];
  var s6 = useState([]); var themes = s6[0]; var setThemes = s6[1];
  var s7 = useState(0); var total = s7[0]; var setTotal = s7[1];
  var s8 = useState(false); var loading = s8[0]; var setLoading = s8[1];
  var s9 = useState(null); var error = s9[0]; var setError = s9[1];
  var s10 = useState(false); var loaded = s10[0]; var setLoaded = s10[1];
  var s12 = useState(false); var hasMore = s12[0]; var setHasMore = s12[1];
  var sourceState = useState(''); var source = sourceState[0]; var setSource = sourceState[1];

  var sentinelRef = useRef(null);
  var stateRef = useRef({ query: '', theme: '', sort: initialSort, page: 1 });
  var requestRef = useRef(0);
  var loadingRef = useRef(false);

  var doFetch = useCallback(async function(opts, append) {
    var requestId = ++requestRef.current;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    if (!append) {
      setResults([]);
      setHasMore(false);
      setSource('');
    }
    try {
      var data = await searchMocs(opts);
      if (requestId !== requestRef.current) return;
      if (append) {
        setResults(function(prev) {
          var existing = new Set(prev.map(function(moc) { return moc.mocNum; }));
          return prev.concat(data.results.filter(function(moc) { return !existing.has(moc.mocNum); }));
        });
      } else {
        setResults(data.results);
      }
      setTotal(data.total);
      setSource(data.source || '');
      if (data.themes && data.themes.length > 0) setThemes(data.themes);
      stateRef.current.page = opts.page || 1;
      setHasMore(!!data.hasMore);
      setLoaded(true);
    } catch (e) {
      if (requestId !== requestRef.current) return;
      setError(t('mocUnavailable'));
      setHasMore(false);
      setLoaded(true);
    } finally {
      if (requestId === requestRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [t]);

  // The official-review catalog is ordered by blog introduction date.
  useEffect(function() {
    stateRef.current = { query: '', theme: '', sort: initialSort, page: 1 };
    doFetch({ sort: initialSort, page: 1 }, false);
  }, []); // eslint-disable-line

  var applySearch = function(e) {
    if (e) e.preventDefault();
    var translated = translateSearchQuery(qInput.trim());
    setQuery(translated);
    stateRef.current = { query: translated, theme: theme, sort: sort, page: 1 };
    doFetch({ q: translated, theme: theme, sort: sort, page: 1 }, false);
  };

  var changeTheme = function(v) {
    setTheme(v);
    stateRef.current = { query: query, theme: v, sort: sort, page: 1 };
    doFetch({ q: query, theme: v, sort: sort, page: 1 }, false);
  };

  var changeSort = function(v) {
    setSort(v);
    stateRef.current = { query: query, theme: theme, sort: v, page: 1 };
    doFetch({ q: query, theme: theme, sort: v, page: 1 }, false);
  };

  // Infinite scroll
  useEffect(function() {
    if (!sentinelRef.current || typeof IntersectionObserver === 'undefined') return;
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current && loaded) {
        var st = stateRef.current;
        var nextPage = st.page + 1;
        doFetch({ q: st.query, theme: st.theme, sort: st.sort, page: nextPage }, true);
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return function() { obs.disconnect(); };
  });

  var headerSection = React.createElement('div', { className: 'search-section' },
    React.createElement('div', { className: 'new-products-header' },
      React.createElement('h3', null, t('mocReviewMode')),
      React.createElement('p', { className: 'new-products-desc' }, t(reviewCatalog ? 'mocReviewsDesc' : 'mocsDesc')),
      React.createElement('div', { className: 'new-products-source-notice' },
        React.createElement('span', { className: 'new-products-source-icon' }, '\u2139\uFE0F'),
        React.createElement('span', { className: 'new-products-source-text' },
          t('mocSourceNotice'),
          React.createElement('a', {
            href: reviewCatalog ? catalogInfo.sourceUrl : 'https://rebrickable.com/mocs/',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'new-products-source-link'
          }, reviewCatalog ? t('mocOfficialBlog') : 'rebrickable.com/mocs'),
          t('mocSourceNoticeSuffix')
        )
      )
    ),
    React.createElement('form', { className: 'moc-search-form', onSubmit: applySearch },
      React.createElement('div', { className: 'search-input-wrapper' },
        React.createElement('input', {
          type: 'text',
          'aria-label': t('mocSearchPlaceholder'),
          placeholder: t('mocSearchPlaceholder'),
          value: qInput,
          onChange: function(e) { setQInput(e.target.value); }
        }),
        qInput ? React.createElement('button', {
          type: 'button',
          className: 'search-clear-btn',
          'aria-label': t('clearSearch'),
          onClick: function() { setQInput(''); }
        }, '\u00D7') : null
      ),
      React.createElement('button', { type: 'submit' }, t('searchBtn'))
    ),
    !reviewCatalog ? React.createElement('div', { className: 'moc-filter-row' },
      React.createElement('select', {
        className: 'funding-year-select',
        'aria-label': t('mocAllThemes'),
        value: theme,
        onChange: function(e) { changeTheme(e.target.value); }
      },
        React.createElement('option', { value: '' }, t('mocAllThemes')),
        themes.map(function(th) {
          return React.createElement('option', { key: th.value, value: th.value }, th.name);
        })
      )
    ) : null,
    React.createElement('div', { className: 'moc-sort-tabs' },
      sortOptions.map(function(opt) {
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
                  e.target.style.opacity = '0.3';
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
              t('mocDesigner') + ': ' + moc.designer) : null,
            React.createElement('div', { className: 'set-card-meta' },
              React.createElement('span', null, moc.parts ? (moc.parts + ' ' + t('numParts')) : ''),
              React.createElement('span', null, moc.year || ''),
              moc.reviewedAt ? React.createElement('span', null, t('mocReviewedAt') + ': ' + moc.reviewedAt.slice(0, 10)) : null
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
    ? React.createElement(EmptyState, { title: t('noResults'), message: t(reviewCatalog ? 'mocReviewNoResults' : 'mocNoResults') })
    : null;

  return React.createElement('div', null,
    headerSection,
    initialLoading,
    error ? React.createElement(ErrorMessage, {
      message: error,
      onRetry: function() {
        stateRef.current.page = 1;
        doFetch({ q: query, theme: theme, sort: sort, page: 1 }, false);
      }
    }) : null,
    source === 'snapshot' ? React.createElement('p', { className: 'new-products-desc', role: 'status' }, t(reviewCatalog ? 'mocReviewSnapshotNotice' : 'mocSnapshotNotice')) : null,
    React.createElement('p', null, React.createElement('a', {
      href: getMocSearchUrl({ q: query, theme: theme, sort: sort }),
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'new-products-source-link'
    }, t('mocSearchOriginal'))),
    resultsSection,
    loadingMore,
    emptyResults,
    hasMore && !loading ? React.createElement('button', {
      type: 'button',
      onClick: function() {
        if (loadingRef.current) return;
        var st = stateRef.current;
        doFetch({ q: st.query, theme: st.theme, sort: st.sort, page: st.page + 1 }, true);
      }
    }, t('mocLoadMore')) : null,
    React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } })
  );
}

export default MocReviewBrowser;
