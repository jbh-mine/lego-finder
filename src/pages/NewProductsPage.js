import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { filterSets, getThemes } from '../utils/api';
import { getCachedTranslation, translateName } from '../utils/translate';
import { useLanguage } from '../contexts/LanguageContext';
import SetCard from '../components/SetCard';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var PAGE_SIZE = 40;

function NewProductsPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;

  var curYear = new Date().getFullYear();
  var s1 = useState(String(curYear)); var selYear = s1[0]; var setSelYear = s1[1];
  var s2 = useState([]); var allResults = s2[0]; var setAllResults = s2[1];
  var s3 = useState(0); var totalCount = s3[0]; var setTotalCount = s3[1];
  var s4 = useState(1); var page = s4[0]; var setPage = s4[1];
  var s5 = useState(false); var loading = s5[0]; var setLoading = s5[1];
  var s6 = useState(null); var error = s6[0]; var setError = s6[1];
  var s7 = useState(false); var hasMore = s7[0]; var setHasMore = s7[1];
  var s8 = useState({}); var themeMap = s8[0]; var setThemeMap = s8[1];
  var s9 = useState({}); var themeNames = s9[0]; var setThemeNames = s9[1];
  var s10 = useState(false); var loaded = s10[0]; var setLoaded = s10[1];

  var sentinelRef = useRef(null);
  var curYearRef = useRef(selYear);

  // Load themes on mount
  useEffect(function() {
    (async function() {
      try {
        var allThemes = {};
        var pg = 1; var more = true;
        while (more) {
          var data = await getThemes(pg, 1000);
          data.results.forEach(function(theme) {
            allThemes[theme.id] = theme.name;
          });
          more = data.next != null;
          pg++;
        }
        setThemeMap(allThemes);
      } catch (e) {
        console.error('Failed to load themes:', e);
      }
    })();
  }, []);

  // Translate theme names
  useEffect(function() {
    if (lang !== 'ko' || allResults.length === 0) return;
    var themeIds = {};
    allResults.forEach(function(set) {
      if (set.theme_id && themeMap[set.theme_id]) {
        themeIds[set.theme_id] = themeMap[set.theme_id];
      }
    });
    Object.keys(themeIds).forEach(function(tid) {
      if (themeNames[tid]) return;
      var name = themeIds[tid];
      var cached = getCachedTranslation(name);
      if (cached) {
        setThemeNames(function(prev) {
          var o = {}; o[tid] = cached;
          return Object.assign({}, prev, o);
        });
      } else {
        translateName(name).then(function(result) {
          if (result && result !== name) {
            setThemeNames(function(prev) {
              var o = {}; o[tid] = result;
              return Object.assign({}, prev, o);
            });
          }
        });
      }
    });
  }, [allResults, themeMap, lang]);

  var getThemeName = function(themeId) {
    if (lang === 'ko' && themeNames[themeId]) return themeNames[themeId];
    return themeMap[themeId] || (t('themePrefix') + ' ' + themeId);
  };

  // Extract numeric part from set_num (e.g. "76463-1" -> 76463)
  var getSetNumber = function(setNum) {
    var match = setNum ? setNum.match(/^(\d+)/) : null;
    return match ? parseInt(match[1], 10) : 0;
  };

  // Fetch new products — ordered by set_num descending (newest first)
  var doFetch = useCallback(async function(year, pg, append) {
    setLoading(true);
    setError(null);
    try {
      var data = await filterSets({
        minYear: year,
        maxYear: year,
        page: pg,
        pageSize: PAGE_SIZE,
        ordering: '-set_num',
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

  // Load on mount and when year changes
  useEffect(function() {
    curYearRef.current = selYear;
    setAllResults([]);
    setPage(1);
    setHasMore(false);
    setLoaded(false);
    doFetch(selYear, 1, false);
  }, [selYear]);

  // Infinite scroll
  useEffect(function() {
    if (!sentinelRef.current) return;
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && hasMore && !loading && loaded) {
        doFetch(curYearRef.current, page + 1, true);
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return function() { obs.disconnect(); };
  });

  // Group by theme — sort by highest set_num in each group (newest first)
  var themeGroups = useMemo(function() {
    if (allResults.length === 0) return [];
    var groups = {};
    allResults.forEach(function(set) {
      var themeId = set.theme_id || 0;
      if (!groups[themeId]) {
        groups[themeId] = {
          themeId: themeId,
          themeName: getThemeName(themeId),
          sets: [],
          maxSetNum: 0,
        };
      }
      groups[themeId].sets.push(set);
      var num = getSetNumber(set.set_num);
      if (num > groups[themeId].maxSetNum) {
        groups[themeId].maxSetNum = num;
      }
    });
    // Sort theme groups by highest set_num descending (newest themes first)
    return Object.values(groups).sort(function(a, b) {
      return b.maxSetNum - a.maxSetNum;
    });
  }, [allResults, themeMap, themeNames, lang]);

  // Year options
  var yearOptions = [];
  for (var y = curYear; y >= curYear - 2; y--) {
    yearOptions.push(y);
  }

  // Header section
  var headerSection = React.createElement('div', { className: 'search-section' },
    React.createElement('div', { className: 'new-products-header' },
      React.createElement('h2', null, t('newProducts')),
      React.createElement('p', { className: 'new-products-desc' }, t('newProductsDesc'))
    ),
    React.createElement('div', { className: 'new-products-filters' },
      React.createElement('div', { className: 'new-products-year-tabs' },
        yearOptions.map(function(yr) {
          return React.createElement('button', {
            key: yr,
            className: 'new-year-tab' + (selYear === String(yr) ? ' active' : ''),
            onClick: function() { setSelYear(String(yr)); },
          }, yr + t('yearSuffix') + ' ' + t('newLabel'));
        })
      )
    )
  );

  // Results
  var resultsSection = null;
  if (themeGroups.length > 0) {
    var summaryText = t('total') + ' ' + totalCount + t('count') + ' ' + t('newProductsFound');
    var summary = React.createElement('div', { className: 'search-results-summary' }, summaryText);

    var themeSections = themeGroups.map(function(group) {
      var header = React.createElement('div', { className: 'theme-header' },
        React.createElement('span', { className: 'theme-title' }, group.themeName),
        React.createElement('span', { className: 'theme-count' }, group.sets.length + t('setsCount'))
      );
      var grid = React.createElement('div', { className: 'set-grid' },
        group.sets.map(function(set) {
          return React.createElement(SetCard, { key: set.set_num, set: set });
        })
      );
      return React.createElement('div', { key: group.themeId, className: 'theme-section' }, header, grid);
    });

    resultsSection = React.createElement(React.Fragment, null, summary, themeSections);
  }

  var loadingMore = null;
  if (loading && allResults.length > 0) {
    loadingMore = React.createElement(Loading, null);
  }

  var initialLoading = null;
  if (loading && allResults.length === 0) {
    initialLoading = React.createElement(Loading, null);
  }

  var emptyResults = null;
  if (!loading && !error && loaded && allResults.length === 0) {
    emptyResults = React.createElement(EmptyState, {
      title: t('noResults'),
      message: t('noNewProducts'),
    });
  }

  return React.createElement('div', null,
    headerSection,
    initialLoading,
    error ? React.createElement(ErrorMessage, { message: error, onRetry: function() { doFetch(selYear, 1, false); } }) : null,
    resultsSection,
    loadingMore,
    emptyResults,
    React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } })
  );
}

export default NewProductsPage;
