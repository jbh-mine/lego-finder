import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { searchSets, getThemes } from '../utils/api';
import { translateSearchQuery } from '../utils/searchDict';
import { useLanguage } from '../contexts/LanguageContext';
import SetCard from '../components/SetCard';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

function SearchPage() {
  var langCtx = useLanguage();
  var t = langCtx.t;

  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];

  var resultsState = useState(null);
  var results = resultsState[0];
  var setResults = resultsState[1];

  var pageState = useState(1);
  var page = pageState[0];
  var setPage = pageState[1];

  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var errorState = useState(null);
  var error = errorState[0];
  var setError = errorState[1];

  var searchedState = useState(false);
  var searched = searchedState[0];
  var setSearched = searchedState[1];

  var themeMapState = useState({});
  var themeMap = themeMapState[0];
  var setThemeMap = themeMapState[1];

  var PAGE_SIZE = 100;

  // Load all themes on mount for theme_id -> name mapping
  useEffect(function() {
    async function loadThemes() {
      try {
        var allThemes = {};
        var pg = 1;
        var hasMore = true;
        while (hasMore) {
          var data = await getThemes(pg, 1000);
          data.results.forEach(function(theme) {
            allThemes[theme.id] = theme.name;
          });
          hasMore = data.next != null;
          pg++;
        }
        setThemeMap(allThemes);
      } catch (err) {
        console.error('Failed to load themes:', err);
      }
    }
    loadThemes();
  }, []);

  var doSearch = useCallback(async function(searchQuery, searchPage) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      var translatedQuery = translateSearchQuery(searchQuery.trim());
      var data = await searchSets(translatedQuery, searchPage, PAGE_SIZE);
      setResults(data);
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
    setPage(1);
    doSearch(query, 1);
  };

  var handlePageChange = function(newPage) {
    setPage(newPage);
    doSearch(query, newPage);
    window.scrollTo(0, 0);
  };

  // Group results by theme_id
  var themeGroups = useMemo(function() {
    if (!results || !results.results || results.results.length === 0) return [];

    var groups = {};
    results.results.forEach(function(set) {
      var themeId = set.theme_id || 0;
      if (!groups[themeId]) {
        groups[themeId] = {
          themeId: themeId,
          themeName: themeMap[themeId] || ('Theme ' + themeId),
          sets: [],
        };
      }
      groups[themeId].sets.push(set);
    });

    // Sort groups: most sets first
    return Object.values(groups).sort(function(a, b) {
      return b.sets.length - a.sets.length;
    });
  }, [results, themeMap]);

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
  if (!loading && !error && themeGroups.length > 0) {
    var summaryText = t('total') + ' ' + results.count + t('count') + ' ' + t('searchResultsFound');
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

    var pagination = React.createElement(Pagination, {
      page: page,
      totalCount: results.count,
      pageSize: PAGE_SIZE,
      onPageChange: handlePageChange,
    });

    resultsSection = React.createElement(React.Fragment, null, summary, themeSections, pagination);
  }

  // Empty / no results / initial states
  var emptyResults = null;
  if (!loading && !error && searched && results && results.results && results.results.length === 0) {
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
    loading ? React.createElement(Loading, null) : null,
    error ? React.createElement(ErrorMessage, { message: error, onRetry: function() { doSearch(query, page); } }) : null,
    resultsSection,
    emptyResults,
    initialState
  );
}

export default SearchPage;
