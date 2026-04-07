import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { searchSets, getThemes, filterSets } from '../utils/api';
import { translateSearchQuery, SET_NUM_MAP } from '../utils/searchDict';
import { getCachedTranslation, translateName } from '../utils/translate';
import { useLanguage } from '../contexts/LanguageContext';
import SetCard from '../components/SetCard';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var PAGE_SIZE = 40;
var SEARCH_STATE_KEY = 'lego_search_state';

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

  // Extra name-search results (loaded once on first page)
  var s11 = useState([]); var nameExtras = s11[0]; var setNameExtras = s11[1];

  // Sort order state
  var s12 = useState('default'); var sortOrder = s12[0]; var setSortOrder = s12[1];

  // Matched theme ID for priority sorting
  var s13 = useState(null); var matchedThemeId = s13[0]; var setMatchedThemeId = s13[1];

  // Whether state was restored from sessionStorage
  var s14 = useState(false); var stateRestored = s14[0]; var setStateRestored = s14[1];

  var sentinelRef = useRef(null);
  var curQueryRef = useRef('');
  var matchedThemeRef = useRef(null);

  // Listen for resetSearch event from Header
  useEffect(function() {
    var handleReset = function() {
      setQuery('');
      setAllResults([]);
      setTotalCount(0);
      setPage(1);
      setSearched(false);
      setError(null);
      setHasMore(false);
      setNameExtras([]);
      setSortOrder('default');
      setMatchedThemeId(null);
      curQueryRef.current = '';
      matchedThemeRef.current = null;
      window.scrollTo(0, 0);
    };
    window.addEventListener('resetSearch', handleReset);
    return function() { window.removeEventListener('resetSearch', handleReset); };
  }, []);

  // Restore search state from sessionStorage on mount
  useEffect(function() {
    try {
      var saved = sessionStorage.getItem(SEARCH_STATE_KEY);
      if (saved) {
        var state = JSON.parse(saved);
        if (state.query && state.allResults && state.allResults.length > 0) {
          setQuery(state.query);
          curQueryRef.current = state.query;
          setAllResults(state.allResults);
          setTotalCount(state.totalCount || 0);
          setPage(state.page || 1);
          setSearched(true);
          setHasMore(state.hasMore || false);
          setSortOrder(state.sortOrder || 'default');
          setMatchedThemeId(state.matchedThemeId || null);
          matchedThemeRef.current = state.matchedThemeId || null;
          setNameExtras(state.nameExtras || []);
          setStateRestored(true);
          // Restore scroll position after render
          if (state.scrollY) {
            requestAnimationFrame(function() {
              setTimeout(function() { window.scrollTo(0, state.scrollY); }, 50);
            });
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Save search state to sessionStorage whenever results change
  useEffect(function() {
    if (!searched || allResults.length === 0) return;
    try {
      var state = {
        query: curQueryRef.current,
        allResults: allResults,
        totalCount: totalCount,
        page: page,
        searched: searched,
        hasMore: hasMore,
        sortOrder: sortOrder,
        matchedThemeId: matchedThemeId,
        nameExtras: nameExtras,
        scrollY: window.scrollY,
      };
      sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore quota errors
    }
  }, [allResults, totalCount, page, searched, hasMore, sortOrder, matchedThemeId, nameExtras]);

  // Update scroll position in sessionStorage on scroll
  useEffect(function() {
    if (!searched) return;
    var timer = null;
    var handleScroll = function() {
      clearTimeout(timer);
      timer = setTimeout(function() {
        try {
          var saved = sessionStorage.getItem(SEARCH_STATE_KEY);
          if (saved) {
            var state = JSON.parse(saved);
            state.scrollY = window.scrollY;
            sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
          }
        } catch (e) {}
      }, 200);
    };
    window.addEventListener('scroll', handleScroll);
    return function() {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [searched]);

  // Load all themes on mount
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

  // Translate theme names when lang is ko
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

  var findMatchingThemeIds = function(translatedQuery) {
    var q = translatedQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    var matches = [];
    Object.keys(themeMap).forEach(function(tid) {
      var name = themeMap[tid].toLowerCase();
      if (name === q || name.indexOf(q) >= 0 || q.indexOf(name) >= 0) {
        matches.push(parseInt(tid));
      }
    });
    return matches;
  };

  var doSearch = useCallback(async function(searchQuery, searchPage, append) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      var translatedQuery = translateSearchQuery(searchQuery.trim());
      
      // If translated query is a set number (from SET_NUM_MAP), search by set number
      if (/^\d[\d\-]*$/.test(translatedQuery) && translatedQuery !== searchQuery.trim()) {
        // This was a Korean nickname mapped to a set number
        var data = await searchSets(translatedQuery, 1, PAGE_SIZE);
        if (data.results.length > 0) {
          matchedThemeRef.current = null;
          setMatchedThemeId(null);
          setNameExtras([]);
          setAllResults(data.results);
          setTotalCount(data.count);
          setPage(1);
          setHasMore(data.results.length >= PAGE_SIZE);
          setSearched(true);
          setLoading(false);
          return;
        }
        // If no results by number, fall through to normal search
      }
      
      var matchedThemeIds = findMatchingThemeIds(translatedQuery);

      if (matchedThemeIds.length > 0) {
        var primaryThemeId = matchedThemeIds[0];
        matchedThemeRef.current = primaryThemeId;
        setMatchedThemeId(primaryThemeId);

        if (searchPage === 1) {
          var promises = [
            filterSets({ themeId: primaryThemeId, page: 1, pageSize: PAGE_SIZE }),
            searchSets(translatedQuery, 1, PAGE_SIZE)
          ];
          for (var i = 1; i < matchedThemeIds.length && i < 3; i++) {
            promises.push(filterSets({ themeId: matchedThemeIds[i], page: 1, pageSize: PAGE_SIZE }));
          }

          var results = await Promise.all(promises);
          var themeData = results[0];
          var nameData = results[1];

          var seen = {};
          var merged = [];
          themeData.results.forEach(function(s) {
            if (!seen[s.set_num]) { seen[s.set_num] = true; merged.push(s); }
          });
          for (var j = 2; j < results.length; j++) {
            results[j].results.forEach(function(s) {
              if (!seen[s.set_num]) { seen[s.set_num] = true; merged.push(s); }
            });
          }
          var extras = [];
          nameData.results.forEach(function(s) {
            if (!seen[s.set_num]) { seen[s.set_num] = true; merged.push(s); extras.push(s); }
          });
          setNameExtras(extras);

          setAllResults(merged);
          setTotalCount(themeData.count + extras.length);
          setPage(1);
          setHasMore(themeData.results.length >= PAGE_SIZE);
          setSearched(true);
        } else {
          var themeData2 = await filterSets({ themeId: primaryThemeId, page: searchPage, pageSize: PAGE_SIZE });
          if (append) {
            setAllResults(function(prev) {
              var seen2 = {};
              prev.forEach(function(s) { seen2[s.set_num] = true; });
              var newItems = themeData2.results.filter(function(s) { return !seen2[s.set_num]; });
              return prev.concat(newItems);
            });
          }
          setPage(searchPage);
          setHasMore(themeData2.results.length >= PAGE_SIZE);
        }
      } else {
        matchedThemeRef.current = null;
        setMatchedThemeId(null);
        setNameExtras([]);
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
      }
    } catch (err) {
      setError(
        err.response && err.response.status === 404
          ? t('noSearchResults')
          : t('apiError')
      );
    } finally {
      setLoading(false);
    }
  }, [t, themeMap]);

  var handleSearch = function(e) {
    e.preventDefault();
    setAllResults([]);
    setNameExtras([]);
    setPage(1);
    setHasMore(false);
    matchedThemeRef.current = null;
    setMatchedThemeId(null);
    curQueryRef.current = query;
    setSortOrder('default');
    doSearch(query, 1, false);
  };

  // Clear search input
  var handleClearQuery = function() {
    setQuery('');
  };

  // Infinite scroll
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

  // Sorted flat results (used when sortOrder !== 'default')
  var sortedResults = useMemo(function() {
    if (sortOrder === 'default' || allResults.length === 0) return null;
    var sorted = allResults.slice();
    if (sortOrder === 'parts_desc') {
      sorted.sort(function(a, b) { return (b.num_parts || 0) - (a.num_parts || 0); });
    } else if (sortOrder === 'parts_asc') {
      sorted.sort(function(a, b) { return (a.num_parts || 0) - (b.num_parts || 0); });
    } else if (sortOrder === 'year_desc') {
      sorted.sort(function(a, b) { return (b.year || 0) - (a.year || 0); });
    } else if (sortOrder === 'name_asc') {
      sorted.sort(function(a, b) {
        var nameA = (a.name || '').toLowerCase();
        var nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'ko');
      });
    }
    return sorted;
  }, [allResults, sortOrder]);

  // Theme-grouped results (used when sortOrder === 'default')
  var themeGroups = useMemo(function() {
    if (sortOrder !== 'default' || allResults.length === 0) return [];
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

    var primaryTheme = matchedThemeId;

    return Object.values(groups).sort(function(a, b) {
      // If there's a matched theme, it always comes first
      if (primaryTheme) {
        var aMatch = (a.themeId === primaryTheme) ? 1 : 0;
        var bMatch = (b.themeId === primaryTheme) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      // Then sort by number of sets (most first), then alphabetically
      if (b.sets.length !== a.sets.length) {
        return b.sets.length - a.sets.length;
      }
      return a.themeName.localeCompare(b.themeName, 'ko');
    });
  }, [allResults, themeMap, themeNames, lang, sortOrder, matchedThemeId]);

  // Handle sort change
  var handleSortChange = function(e) {
    setSortOrder(e.target.value);
  };

  // Search form with clear button
  var clearBtn = query ? React.createElement('button', {
    type: 'button',
    className: 'search-clear-btn',
    onClick: handleClearQuery,
    'aria-label': t('clearSearch'),
  }, '\u00D7') : null;

  var searchSection = React.createElement('div', { className: 'search-section' },
    React.createElement('h2', null, t('searchTitle')),
    React.createElement('form', { className: 'search-bar', onSubmit: handleSearch },
      React.createElement('div', { className: 'search-input-wrapper' },
        React.createElement('input', {
          type: 'text',
          value: query,
          onChange: function(e) { setQuery(e.target.value); },
          placeholder: t('searchPlaceholder'),
        }),
        clearBtn
      ),
      React.createElement('button', { type: 'submit', disabled: loading },
        loading ? t('searching') : t('searchBtn')
      )
    )
  );

  // Results section
  var resultsSection = null;
  var hasSomeResults = sortOrder === 'default' ? themeGroups.length > 0 : (sortedResults && sortedResults.length > 0);

  if (hasSomeResults) {
    var summaryText = t('total') + ' ' + totalCount + t('count') + ' ' + t('searchResultsFound');

    // Sort selectbox
    var sortSelect = React.createElement('select', {
      className: 'search-sort-select',
      value: sortOrder,
      onChange: handleSortChange,
    },
      React.createElement('option', { value: 'default' }, t('sortDefault')),
      React.createElement('option', { value: 'parts_desc' }, t('sortPartsDesc')),
      React.createElement('option', { value: 'parts_asc' }, t('sortPartsAsc')),
      React.createElement('option', { value: 'year_desc' }, t('sortYearDesc')),
      React.createElement('option', { value: 'name_asc' }, t('sortName'))
    );

    var summary = React.createElement('div', { className: 'search-results-summary search-results-summary-flex' },
      React.createElement('span', null, summaryText),
      sortSelect
    );

    var contentSection;
    if (sortOrder === 'default') {
      // Theme-grouped view
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
      contentSection = themeSections;
    } else {
      // Flat sorted view
      contentSection = [React.createElement('div', { key: 'sorted-grid', className: 'set-grid' },
        sortedResults.map(function(set) {
          return React.createElement(SetCard, { key: set.set_num, set: set });
        })
      )];
    }

    resultsSection = React.createElement(React.Fragment, null, summary, contentSection);
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
