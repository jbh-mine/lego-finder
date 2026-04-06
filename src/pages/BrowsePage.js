import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemes, filterSets } from '../utils/api';
import SetCard from '../components/SetCard';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

function BrowsePage() {
  var lang = useLanguage();
  var t = lang.t;
  var themesState = useState([]);
  var themes = themesState[0];
  var setThemes = themesState[1];
  var selThemeState = useState('');
  var selectedTheme = selThemeState[0];
  var setSelectedTheme = selThemeState[1];
  var minYState = useState('');
  var minYear = minYState[0];
  var setMinYear = minYState[1];
  var maxYState = useState('');
  var maxYear = maxYState[0];
  var setMaxYear = maxYState[1];
  var resState = useState(null);
  var results = resState[0];
  var setResults = resState[1];
  var pageState = useState(1);
  var page = pageState[0];
  var setPage = pageState[1];
  var loadState = useState(false);
  var loading = loadState[0];
  var setLoading = loadState[1];
  var tlState = useState(true);
  var themesLoading = tlState[0];
  var setThemesLoading = tlState[1];
  var errState = useState(null);
  var error = errState[0];
  var setError = errState[1];

  var PAGE_SIZE = 20;
  var currentYear = new Date().getFullYear();

  useEffect(function() {
    async function loadThemes() {
      try {
        var data = await getThemes(1, 1000);
        var parentThemes = data.results.filter(function(th) { return !th.parent_id; });
        setThemes(parentThemes);
      } catch (err) {
        console.error('Theme load failed:', err);
      } finally {
        setThemesLoading(false);
      }
    }
    loadThemes();
  }, []);

  var doFilter = useCallback(async function(filterPage) {
    setLoading(true);
    setError(null);
    try {
      var data = await filterSets({
        themeId: selectedTheme || undefined,
        minYear: minYear || undefined,
        maxYear: maxYear || undefined,
        page: filterPage,
        pageSize: PAGE_SIZE,
      });
      setResults(data);
    } catch (err) {
      setError(t('filterError'));
    } finally {
      setLoading(false);
    }
  }, [selectedTheme, minYear, maxYear, t]);

  var handleFilter = function() {
    setPage(1);
    doFilter(1);
  };

  var handleReset = function() {
    setSelectedTheme('');
    setMinYear('');
    setMaxYear('');
    setResults(null);
    setPage(1);
  };

  var handlePageChange = function(newPage) {
    setPage(newPage);
    doFilter(newPage);
    window.scrollTo(0, 0);
  };

  var yearOptions = [];
  for (var y = currentYear; y >= 1950; y--) {
    yearOptions.push(y);
  }

  return React.createElement('div', null,
    React.createElement('div', { className: 'filter-section' },
      React.createElement('div', { className: 'filter-group' },
        React.createElement('label', null, t('theme')),
        React.createElement('select', {
          value: selectedTheme,
          onChange: function(e) { setSelectedTheme(e.target.value); },
          disabled: themesLoading
        },
          React.createElement('option', { value: '' }, t('allThemes')),
          themes.map(function(theme) {
            return React.createElement('option', { key: theme.id, value: theme.id }, theme.name);
          })
        )
      ),
      React.createElement('div', { className: 'filter-group' },
        React.createElement('label', null, t('startYear')),
        React.createElement('select', {
          value: minYear,
          onChange: function(e) { setMinYear(e.target.value); }
        },
          React.createElement('option', { value: '' }, t('all')),
          yearOptions.map(function(y) {
            return React.createElement('option', { key: y, value: y }, y + t('yearSuffix'));
          })
        )
      ),
      React.createElement('div', { className: 'filter-group' },
        React.createElement('label', null, t('endYear')),
        React.createElement('select', {
          value: maxYear,
          onChange: function(e) { setMaxYear(e.target.value); }
        },
          React.createElement('option', { value: '' }, t('all')),
          yearOptions.map(function(y) {
            return React.createElement('option', { key: y, value: y }, y + t('yearSuffix'));
          })
        )
      ),
      React.createElement('button', {
        className: 'filter-btn',
        onClick: handleFilter,
        disabled: loading
      }, loading ? t('searching') : t('applyFilter')),
      React.createElement('button', {
        className: 'filter-reset',
        onClick: handleReset
      }, t('reset'))
    ),
    loading && React.createElement(Loading, null),
    error && React.createElement(ErrorMessage, { message: error, onRetry: function() { doFilter(page); } }),
    !loading && !error && results && results.results && results.results.length > 0 && React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'set-grid' },
        results.results.map(function(set) {
          return React.createElement(SetCard, { key: set.set_num, set: set });
        })
      ),
      React.createElement(Pagination, { page: page, totalCount: results.count, pageSize: PAGE_SIZE, onPageChange: handlePageChange })
    ),
    !loading && !error && results && results.results && results.results.length === 0 && React.createElement(EmptyState, { title: t('noResults2'), message: t('noFilterResults') }),
    !results && !loading && React.createElement('div', { className: 'empty-state' },
      React.createElement('h3', null, t('browseTitle')),
      React.createElement('p', null, t('browseDesc'))
    )
  );
}

export default BrowsePage;
