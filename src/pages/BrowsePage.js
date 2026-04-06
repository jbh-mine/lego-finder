import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemes, filterSets } from '../utils/api';
import { getCachedTranslation, translateName } from '../utils/translate';
import SetCard from '../components/SetCard';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var SETS_PER_THEME = 8;
var INITIAL_THEMES = 4;
var LOAD_MORE_THEMES = 3;
var FILTER_PAGE_SIZE = 20;
var STORAGE_KEY = 'lego_browse_state';

function BrowsePage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;

  // Try to restore saved state from sessionStorage
  var savedState = null;
  try {
    var raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) savedState = JSON.parse(raw);
  } catch (e) {}

  // Themes state
  var ts1 = useState([]); var themes = ts1[0]; var setThemes = ts1[1];
  var ts2 = useState(savedState ? savedState.showCount || INITIAL_THEMES : INITIAL_THEMES); var showCount = ts2[0]; var setShowCount = ts2[1];
  var ts3 = useState({}); var themeData = ts3[0]; var setThemeData = ts3[1];
  var ts4 = useState(true); var themesLoading = ts4[0]; var setThemesLoading = ts4[1];

  // Theme name translations
  var tn1 = useState({}); var themeNames = tn1[0]; var setThemeNames = tn1[1];

  // Filter state - restore from saved state if available
  var fs1 = useState(savedState ? savedState.selTheme || '' : ''); var selTheme = fs1[0]; var setSelTheme = fs1[1];
  var fs2 = useState(savedState ? savedState.minY || '' : ''); var minY = fs2[0]; var setMinY = fs2[1];
  var fs3 = useState(savedState ? savedState.maxY || '' : ''); var maxY = fs3[0]; var setMaxY = fs3[1];
  var fs4 = useState(null); var filterRes = fs4[0]; var setFilterRes = fs4[1];
  var fs5 = useState(savedState ? savedState.filterPage || 1 : 1); var filterPage = fs5[0]; var setFilterPage = fs5[1];
  var fs6 = useState(false); var filterLoading = fs6[0]; var setFilterLoading = fs6[1];
  var fs7 = useState(savedState ? savedState.isFiltering || false : false); var isFiltering = fs7[0]; var setIsFiltering = fs7[1];
  var fs8 = useState(null); var error = fs8[0]; var setError = fs8[1];
  var fs9 = useState(false); var filterHasMore = fs9[0]; var setFilterHasMore = fs9[1];

  // Track if we need to re-run filter on mount (restored state)
  var restoredRef = useRef(savedState && savedState.isFiltering ? true : false);
  var scrollPosRef = useRef(savedState ? savedState.scrollPos || 0 : 0);

  var sentinelRef = useRef(null);
  var curYear = new Date().getFullYear();

  // Save state to sessionStorage whenever filter-related state changes
  useEffect(function() {
    try {
      var stateToSave = {
        selTheme: selTheme,
        minY: minY,
        maxY: maxY,
        isFiltering: isFiltering,
        filterPage: filterPage,
        showCount: showCount,
        scrollPos: window.scrollY || 0,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {}
  }, [selTheme, minY, maxY, isFiltering, filterPage, showCount]);

  // Save scroll position before unload / navigation
  useEffect(function() {
    var saveScroll = function() {
      try {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          var s = JSON.parse(raw);
          s.scrollPos = window.scrollY || 0;
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        }
      } catch (e) {}
    };
    window.addEventListener('beforeunload', saveScroll);
    return function() {
      saveScroll();
      window.removeEventListener('beforeunload', saveScroll);
    };
  }, []);

  // Load all parent themes on mount
  useEffect(function() {
    (async function() {
      try {
        var data = await getThemes(1, 1000);
        var parent = data.results.filter(function(th) { return !th.parent_id; });
        setThemes(parent);
      } catch(e) { console.error(e); }
      finally { setThemesLoading(false); }
    })();
  }, []);

  // Re-run filter if state was restored
  useEffect(function() {
    if (restoredRef.current && themes.length > 0) {
      restoredRef.current = false;
      // Re-run filter search to restore results
      doFilterRestore(selTheme, minY, maxY, filterPage);
    }
  }, [themes]);

  // Restore scroll position after filter results load
  useEffect(function() {
    if (scrollPosRef.current > 0 && filterRes && filterRes.results && filterRes.results.length > 0) {
      setTimeout(function() {
        window.scrollTo(0, scrollPosRef.current);
        scrollPosRef.current = 0;
      }, 100);
    }
  }, [filterRes]);

  // Special restore function that loads all pages up to saved filterPage
  var doFilterRestore = useCallback(async function(theme, minYear, maxYear, targetPage) {
    setFilterLoading(true);
    setError(null);
    try {
      var allResults = [];
      for (var pg = 1; pg <= targetPage; pg++) {
        var data = await filterSets({
          themeId: theme || undefined,
          minYear: minYear || undefined,
          maxYear: maxYear || undefined,
          page: pg,
          pageSize: FILTER_PAGE_SIZE,
        });
        allResults = allResults.concat(data.results);
        if (pg === targetPage) {
          setFilterHasMore(data.results.length >= FILTER_PAGE_SIZE);
        }
      }
      setFilterRes({ count: data.count, results: allResults });
      setFilterPage(targetPage);
    } catch(e) { setError(t('filterError')); }
    finally { setFilterLoading(false); }
  }, [t]);

  // Translate theme names when lang is ko
  useEffect(function() {
    if (lang !== 'ko' || themes.length === 0) return;
    themes.forEach(function(theme) {
      if (themeNames[theme.id]) return;
      var cached = getCachedTranslation(theme.name);
      if (cached) {
        setThemeNames(function(prev) {
          var o = {}; o[theme.id] = cached;
          return Object.assign({}, prev, o);
        });
      } else {
        translateName(theme.name).then(function(result) {
          if (result && result !== theme.name) {
            setThemeNames(function(prev) {
              var o = {}; o[theme.id] = result;
              return Object.assign({}, prev, o);
            });
          }
        });
      }
    });
  }, [themes, lang]);

  // Helper to get translated theme name
  var getThemeName = function(theme) {
    if (lang === 'ko' && themeNames[theme.id]) return themeNames[theme.id];
    return theme.name;
  };

  // Load sets for each visible theme
  useEffect(function() {
    if (isFiltering) return;
    var visible = themes.slice(0, showCount);
    visible.forEach(function(theme) {
      if (!themeData[theme.id] && !themeData[theme.id + '_loading']) {
        loadThemeSets(theme.id, 1, false);
      }
    });
  }, [themes, showCount, isFiltering]);

  var loadThemeSets = useCallback(async function(tid, page, append) {
    setThemeData(function(prev) {
      var o = {}; o[tid] = Object.assign({}, prev[tid] || {}, { loading: true }); o[tid + '_loading'] = true;
      return Object.assign({}, prev, o);
    });
    try {
      var data = await filterSets({ themeId: tid, page: page, pageSize: SETS_PER_THEME });
      setThemeData(function(prev) {
        var existing = (prev[tid] && prev[tid].sets) || [];
        var o = {};
        o[tid] = {
          sets: append ? existing.concat(data.results) : data.results,
          count: data.count,
          page: page,
          hasMore: data.count > page * SETS_PER_THEME,
          loading: false,
        };
        delete o[tid + '_loading'];
        return Object.assign({}, prev, o);
      });
    } catch(e) {
      setThemeData(function(prev) {
        var o = {}; o[tid] = Object.assign({}, prev[tid] || {}, { loading: false });
        return Object.assign({}, prev, o);
      });
    }
  }, []);

  // Infinite scroll observer
  useEffect(function() {
    if (!sentinelRef.current) return;
    var obs = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting) return;
      if (isFiltering && filterHasMore && !filterLoading) {
        doFilter(filterPage + 1, true);
      } else if (!isFiltering && showCount < themes.length && !themesLoading) {
        setShowCount(function(p) { return Math.min(p + LOAD_MORE_THEMES, themes.length); });
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return function() { obs.disconnect(); };
  });

  // Filter functions
  var doFilter = useCallback(async function(page, append) {
    setFilterLoading(true);
    setError(null);
    try {
      var data = await filterSets({
        themeId: selTheme || undefined,
        minYear: minY || undefined,
        maxYear: maxY || undefined,
        page: page,
        pageSize: FILTER_PAGE_SIZE,
      });
      if (append && filterRes) {
        setFilterRes({ count: data.count, results: filterRes.results.concat(data.results) });
      } else {
        setFilterRes(data);
      }
      setFilterPage(page);
      setFilterHasMore(data.results.length >= FILTER_PAGE_SIZE);
    } catch(e) { setError(t('filterError')); }
    finally { setFilterLoading(false); }
  }, [selTheme, minY, maxY, filterRes, t]);

  var handleFilter = function() { setIsFiltering(true); setFilterPage(1); doFilter(1, false); };
  var handleReset = function() {
    setSelTheme(''); setMinY(''); setMaxY(''); setFilterRes(null); setIsFiltering(false);
    // Clear saved state on reset
    try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
  };

  var yrs = [];
  for (var y = curYear; y >= 1950; y--) yrs.push(y);

  var visibleThemes = themes.slice(0, showCount);

  // Render filter section
  var filterEl = React.createElement('div', { className: 'filter-section' },
    React.createElement('div', { className: 'filter-group' },
      React.createElement('label', null, t('theme')),
      React.createElement('select', { value: selTheme, onChange: function(e) { setSelTheme(e.target.value); }, disabled: themesLoading },
        React.createElement('option', { value: '' }, t('allThemes')),
        themes.map(function(th) { return React.createElement('option', { key: th.id, value: th.id }, getThemeName(th)); })
      )
    ),
    React.createElement('div', { className: 'filter-group' },
      React.createElement('label', null, t('startYear')),
      React.createElement('select', { value: minY, onChange: function(e) { setMinY(e.target.value); } },
        React.createElement('option', { value: '' }, t('all')),
        yrs.map(function(y) { return React.createElement('option', { key: y, value: y }, y + t('yearSuffix')); })
      )
    ),
    React.createElement('div', { className: 'filter-group' },
      React.createElement('label', null, t('endYear')),
      React.createElement('select', { value: maxY, onChange: function(e) { setMaxY(e.target.value); } },
        React.createElement('option', { value: '' }, t('all')),
        yrs.map(function(y) { return React.createElement('option', { key: y, value: y }, y + t('yearSuffix')); })
      )
    ),
    React.createElement('button', { className: 'filter-btn', onClick: handleFilter, disabled: filterLoading }, filterLoading ? t('searching') : t('applyFilter')),
    React.createElement('button', { className: 'filter-reset', onClick: handleReset }, t('reset'))
  );

  // Render main content
  var content;
  if (isFiltering) {
    var items = [];
    if (error) items.push(React.createElement(ErrorMessage, { key: 'err', message: error }));
    if (filterRes && filterRes.results && filterRes.results.length > 0) {
      items.push(React.createElement('div', { key: 'grid', className: 'set-grid' },
        filterRes.results.map(function(s) { return React.createElement(SetCard, { key: s.set_num, set: s }); })
      ));
    }
    if (filterRes && filterRes.results && filterRes.results.length === 0 && !filterLoading) {
      items.push(React.createElement(EmptyState, { key: 'empty', title: t('noResults2'), message: t('noFilterResults') }));
    }
    if (filterLoading) items.push(React.createElement(Loading, { key: 'load' }));
    content = items;
  } else {
    var sections = [];
    if (themesLoading) sections.push(React.createElement(Loading, { key: 'tl' }));
    visibleThemes.forEach(function(theme) {
      var d = themeData[theme.id];
      var children = [];
      children.push(React.createElement('div', { key: 'hdr', className: 'theme-header' },
        React.createElement('h2', { className: 'theme-title' }, getThemeName(theme)),
        d && d.count ? React.createElement('span', { className: 'theme-count' }, d.count.toLocaleString() + t('setsCount')) : null
      ));
      if (d && d.sets && d.sets.length > 0) {
        children.push(React.createElement('div', { key: 'grid', className: 'set-grid' },
          d.sets.map(function(s) { return React.createElement(SetCard, { key: s.set_num, set: s }); })
        ));
        if (d.hasMore && !d.loading) {
          children.push(React.createElement('div', { key: 'more', className: 'theme-more' },
            React.createElement('button', { onClick: function() { loadThemeSets(theme.id, d.page + 1, true); } },
              t('showMore') + ' (' + (d.count - d.sets.length) + ')'
            )
          ));
        }
      }
      if (d && d.loading) children.push(React.createElement(Loading, { key: 'ld' }));
      sections.push(React.createElement('div', { key: theme.id, className: 'theme-section' }, children));
    });
    content = sections;
  }

  return React.createElement('div', null,
    filterEl,
    content,
    React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } })
  );
}

export default BrowsePage;
