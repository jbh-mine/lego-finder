import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { searchSets, getThemes } from '../utils/api';
import { translateSearchQuery } from '../utils/searchDict';
import { getCachedTranslation, translateName } from '../utils/translate';
import { useLanguage } from '../contexts/LanguageContext';
import SetCard from '../components/SetCard';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var PAGE_SIZE = 40;

function SearchPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;

  var s1 = useState(''); var query = s1[0]; var setQuery = s1[1];
  var s2 = useState([]); var allResults = s2[0]; var setAllResults = s2[1];
  var s3 = useState(0); var totalCount = s3[0]; var setTotalCount = s3[1];
  var s4 = useState(1); var page = s4[0]; var setPage = s4[1];
  var s5 = useState(false); var loading = s5[0]; var setLoading = s5[1];
  var s6 = useState(null); var error = s6[0]; var setError = s6[1];
  var s7 = useState(false); var searched = s7[0]; var setSearched = s7[1];
  var s8 = useState({}); var themeMap = s8[0]; var setThemeMap = s8[1];
  var s9 = useState(false); var hasMore = s9[0]; var setHasMore = s9[1];

  // Translated theme names { id: translatedName }
  var s10 = useState({}); var themeNames = s10[0]; var setThemeNames = s10[1];

  var sentinelRef = useRef(null);
  var curQueryRef = useRef('');

  // Load all themes on mount for theme_id -> name mapping
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

  // Translate theme names when lang is ko and results change
  useEffect(function() {
    if (lang !== 'ko' || allResults.length === 0) return;
    // Collect unique theme IDs from results
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

  // Get translated theme name
  var getThemeName = function(themeId) {
    if (lang === 'ko' && themeNames[themeId]) return themeNames[themeId];
    return themeMap[themeId] || ('Theme ' + themeId);
  };

  var doSearch = useCallback(async function(searchQuery, searchPage, append) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      var translatedQuery = translateSearchQuery(searchQuery.trim());
      var data = await searchSets(translatedQuery, searchPage, PAGE_SIZE);
      if (append) {
        setAllResults(function(prev) { return prev.concat(data.results); });
      } else {
        setAllResults(data.results);
      }
      setTotalCount(data.count);
      setPage(searchPage);
      setHasMore(data.results.length >= PAGE_SIZE);
      setSearched(true);
    } catch (err) {
      setError(
        err.response && err.response.status === 404
          ? t('noSearchResults')
          : t('apiError')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  var handleSearch = function(e) {
    e.preventDefault();
    setAllResults([]);
    setPage(1);
    setHasMore(false);
    curQueryRef.current = query;
    doSearch(query, 1, false);
  };

  // Infinite scroll observer
  useEffect(function() {
    if (!sentinelRef.current) return;
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && hasMore && !loading && searched) {
        doSearch(curQueryRef.current, page + 1, true);
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return function() { obs.disconnect(); };
  });

  // Group results by theme_id
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
        };
      }
      groups[themeId].sets.push(set);
    });

    // Sort groups: most sets first
    return Object.values(groups).sort(function(a, b) {
      return b.sets.length - a.sets.length;
    });
  }, [allResults, themeMap, themeNames, lang]);

  // Search form
  var searchSection = React.createElement('div', { className: 'search-section' },
    React.createElement('h2', null, t('searchTitle')),
    React.createElement('form', { className: 'search-bar', onSubmit: handleSearch },
      React.createElement('input', {
        type: 'text',
        value: query,
        onChange: function(e) { setQuery(e.target.value); },
        placeholder: t('searchPlaceholder'),
      }),
      React.createElement('button', { type: 'submit', disabled: loading },
        loading ? t('searching') : t('searchBtn')
      )
    )
  );

  // Results grouped by theme
  var resultsSection = null;
  if (themeGroups.length > 0) {
    var summaryText = t('total') + ' ' + totalCount + t('count') + ' ' + t('searchResultsFound');
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

  // Loading more indicator (infinite scroll)
  var loadingMore = null;
  if (loading && allResults.length > 0) {
    loadingMore = React.createElement(Loading, null);
  }

  // Initial loading (first page)
  var initialLoading = null;
  if (loading && allResults.length === 0) {
    initialLoading = React.createElement(Loading, null);
  }

  // Empty / no results / initial states
  var emptyResults = null;
  if (!loading && !error && searched && allResults.length === 0) {
    emptyResults = React.createElement(EmptyState, {
      title: t('noResults'),
      message: '"' + query + '"' + t('noResultsDesc'),
    });
  }

  var initialState = null;
  if (!searched && !loading) {
    initialState = React.createElement('div', { className: 'empty-state' },
      React.createElement('h3', null, t('searchEmpty')),
      React.createElement('p', null, t('searchEmptyDesc'))
    );
  }

  return React.createElement('div', null,
    searchSection,
    initialLoading,
    error ? React.createElement(ErrorMessage, { message: error, onRetry: function() { doSearch(query, page, false); } }) : null,
    resultsSection,
    loadingMore,
    emptyResults,
    initialState,
    React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } })
  );
}

export default SearchPage;
