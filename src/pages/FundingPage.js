import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { filterSets, getThemes } from '../utils/api';
import { getCachedTranslation, translateName } from '../utils/translate';
import { useLanguage } from '../contexts/LanguageContext';
import SetCard from '../components/SetCard';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var PAGE_SIZE = 40;

function FundingPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;

  var s1 = useState(null); var bdpParentId = s1[0]; var setBdpParentId = s1[1];
  var s2 = useState([]); var bdpSeries = s2[0]; var setBdpSeries = s2[1];
  var s3 = useState('all'); var selSeries = s3[0]; var setSelSeries = s3[1];
  var s4 = useState([]); var allResults = s4[0]; var setAllResults = s4[1];
  var s5 = useState(0); var totalCount = s5[0]; var setTotalCount = s5[1];
  var s6 = useState(1); var page = s6[0]; var setPage = s6[1];
  var s7 = useState(true); var loading = s7[0]; var setLoading = s7[1];
  var s8 = useState(null); var error = s8[0]; var setError = s8[1];
  var s9 = useState(false); var hasMore = s9[0]; var setHasMore = s9[1];
  var s10 = useState(false); var loaded = s10[0]; var setLoaded = s10[1];
  var s11 = useState({}); var themeMap = s11[0]; var setThemeMap = s11[1];
  var s12 = useState({}); var themeNames = s12[0]; var setThemeNames = s12[1];

  var sentinelRef = useRef(null);
  var currentSeriesRef = useRef('all');

  // Load themes and find BDP theme on mount
  useEffect(function() {
    (async function() {
      try {
        var allThemes = [];
        var pg = 1; var more = true;
        while (more) {
          var data = await getThemes(pg, 1000);
          allThemes = allThemes.concat(data.results);
          more = data.next != null;
          pg++;
        }
        var map = {};
        allThemes.forEach(function(theme) {
          map[theme.id] = theme.name;
        });
        setThemeMap(map);

        var bdpParent = allThemes.find(function(theme) {
          return theme.name === 'BrickLink Designer Program';
        });

        if (bdpParent) {
          setBdpParentId(bdpParent.id);
          var children = allThemes.filter(function(theme) {
            return theme.parent_id === bdpParent.id;
          }).sort(function(a, b) {
            return a.name.localeCompare(b.name);
          });
          setBdpSeries(children);
        } else {
          setError(t('bdpThemeNotFound'));
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load themes:', e);
        setError(t('apiError'));
        setLoading(false);
      }
    })();
  }, []);

  // Translate series names
  useEffect(function() {
    if (lang !== 'ko' || bdpSeries.length === 0) return;
    bdpSeries.forEach(function(series) {
      if (themeNames[series.id]) return;
      var cached = getCachedTranslation(series.name);
      if (cached) {
        setThemeNames(function(prev) {
          var o = {}; o[series.id] = cached;
          return Object.assign({}, prev, o);
        });
      } else {
        translateName(series.name).then(function(result) {
          if (result && result !== series.name) {
            setThemeNames(function(prev) {
              var o = {}; o[series.id] = result;
              return Object.assign({}, prev, o);
            });
          }
        });
      }
    });
  }, [bdpSeries, lang]);

  var getSeriesName = function(series) {
    if (lang === 'ko' && themeNames[series.id]) return themeNames[series.id];
    return series.name;
  };

  var getThemeName = function(themeId) {
    if (lang === 'ko' && themeNames[themeId]) return themeNames[themeId];
    return themeMap[themeId] || ('Theme ' + themeId);
  };

  // Fetch BDP sets
  var doFetch = useCallback(async function(themeId, pg, append) {
    setLoading(true);
    setError(null);
    try {
      var data = await filterSets({
        themeId: themeId,
        page: pg,
        pageSize: PAGE_SIZE,
        ordering: '-year',
      });
      if (append) {
        setAllResults(function(prev) { return prev.concat(data.results); });
      } else {
        setAllResults(data.results);
      }
      setTotalCount(data.count);
      setPage(pg);
      setHasMore(data.results.length >= PAGE_SIZE);
      setLoaded(true);
    } catch (err) {
      setError(t('apiError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load sets when bdpParentId is found or series changes
  useEffect(function() {
    if (!bdpParentId) return;
    currentSeriesRef.current = selSeries;
    setAllResults([]);
    setPage(1);
    setHasMore(false);
    setLoaded(false);
    var themeId = selSeries === 'all' ? bdpParentId : selSeries;
    doFetch(themeId, 1, false);
  }, [bdpParentId, selSeries]);

  // Infinite scroll
  useEffect(function() {
    if (!sentinelRef.current) return;
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && hasMore && !loading && loaded) {
        var themeId = currentSeriesRef.current === 'all' ? bdpParentId : currentSeriesRef.current;
        doFetch(themeId, page + 1, true);
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return function() { obs.disconnect(); };
  });

  // Group by series (sub-theme) when viewing all, or by year when viewing a specific series
  var displayGroups = useMemo(function() {
    if (allResults.length === 0) return [];

    if (selSeries === 'all') {
      var groups = {};
      allResults.forEach(function(set) {
        var tid = set.theme_id || 0;
        if (!groups[tid]) {
          groups[tid] = { id: tid, name: getThemeName(tid), sets: [], maxYear: 0 };
        }
        groups[tid].sets.push(set);
        if (set.year > groups[tid].maxYear) groups[tid].maxYear = set.year;
      });
      return Object.values(groups).sort(function(a, b) { return b.maxYear - a.maxYear; });
    } else {
      var yearGroups = {};
      allResults.forEach(function(set) {
        var year = set.year || 0;
        if (!yearGroups[year]) {
          yearGroups[year] = { id: year, name: year + (lang === 'ko' ? '\uB144' : ''), sets: [] };
        }
        yearGroups[year].sets.push(set);
      });
      return Object.values(yearGroups).sort(function(a, b) { return b.id - a.id; });
    }
  }, [allResults, selSeries, themeMap, themeNames, lang]);

  // Header section
  var headerSection = React.createElement('div', { className: 'search-section' },
    React.createElement('div', { className: 'new-products-header' },
      React.createElement('h2', null, t('fundingProducts')),
      React.createElement('p', { className: 'new-products-desc' }, t('fundingDesc'))
    ),
    React.createElement('div', { className: 'funding-info-notice' },
      React.createElement('span', { className: 'funding-info-icon' }, '\u2139\uFE0F'),
      React.createElement('span', null, t('fundingNotice'))
    ),
    bdpSeries.length > 0 ? React.createElement('div', { className: 'funding-series-tabs' },
      React.createElement('button', {
        className: 'funding-series-tab' + (selSeries === 'all' ? ' active' : ''),
        onClick: function() { setSelSeries('all'); },
      }, t('allSeries')),
      bdpSeries.map(function(series) {
        return React.createElement('button', {
          key: series.id,
          className: 'funding-series-tab' + (String(selSeries) === String(series.id) ? ' active' : ''),
          onClick: function() { setSelSeries(String(series.id)); },
        }, getSeriesName(series));
      })
    ) : null
  );

  // Results
  var resultsSection = null;
  if (displayGroups.length > 0) {
    var summaryText = t('total') + ' ' + totalCount + t('count') + ' ' + t('fundingProductsFound');
    var summary = React.createElement('div', { className: 'search-results-summary' }, summaryText);

    var sections = displayGroups.map(function(group) {
      var header = React.createElement('div', { className: 'theme-header' },
        React.createElement('span', { className: 'theme-title' }, group.name),
        React.createElement('span', { className: 'theme-count' }, group.sets.length + t('setsCount'))
      );
      var grid = React.createElement('div', { className: 'set-grid' },
        group.sets.map(function(set) {
          return React.createElement(SetCard, { key: set.set_num, set: set });
        })
      );
      return React.createElement('div', { key: group.id, className: 'theme-section' }, header, grid);
    });

    resultsSection = React.createElement(React.Fragment, null, summary, sections);
  }

  var loadingMore = loading && allResults.length > 0 ? React.createElement(Loading, null) : null;
  var initialLoading = loading && allResults.length === 0 && !error ? React.createElement(Loading, null) : null;
  var emptyResults = !loading && !error && loaded && allResults.length === 0 ?
    React.createElement(EmptyState, { title: t('noResults'), message: t('noFundingProducts') }) : null;

  return React.createElement('div', null,
    headerSection,
    initialLoading,
    error ? React.createElement(ErrorMessage, { message: error, onRetry: function() {
      if (bdpParentId) {
        var themeId = selSeries === 'all' ? bdpParentId : selSeries;
        doFetch(themeId, 1, false);
      }
    }}) : null,
    resultsSection,
    loadingMore,
    emptyResults,
    React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } })
  );
}

export default FundingPage;
