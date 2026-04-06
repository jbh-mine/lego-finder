import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { searchSets } from '../utils/api';
import SetCard from '../components/SetCard';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

function SearchPage() {
  var lang = useLanguage();
  var t = lang.t;
  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];
  var resState = useState(null);
  var results = resState[0];
  var setResults = resState[1];
  var pageState = useState(1);
  var page = pageState[0];
  var setPage = pageState[1];
  var loadState = useState(false);
  var loading = loadState[0];
  var setLoading = loadState[1];
  var errState = useState(null);
  var error = errState[0];
  var setError = errState[1];
  var searchedState = useState(false);
  var searched = searchedState[0];
  var setSearched = searchedState[1];

  var PAGE_SIZE = 20;

  var doSearch = useCallback(async function(searchQuery, searchPage) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      var data = await searchSets(searchQuery.trim(), searchPage, PAGE_SIZE);
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

  return React.createElement('div', null,
    React.createElement('div', { className: 'search-section' },
      React.createElement('h2', null, t('searchTitle')),
      React.createElement('form', { className: 'search-bar', onSubmit: handleSearch },
        React.createElement('input', {
          type: 'text',
          value: query,
          onChange: function(e) { setQuery(e.target.value); },
          placeholder: t('searchPlaceholder')
        }),
        React.createElement('button', { type: 'submit', disabled: loading },
          loading ? t('searching') : t('searchBtn')
        )
      )
    ),
    loading && React.createElement(Loading, null),
    error && React.createElement(ErrorMessage, { message: error, onRetry: function() { doSearch(query, page); } }),
    !loading && !error && results && results.results && results.results.length > 0 && React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'set-grid' },
        results.results.map(function(set) {
          return React.createElement(SetCard, { key: set.set_num, set: set });
        })
      ),
      React.createElement(Pagination, {
        page: page,
        totalCount: results.count,
        pageSize: PAGE_SIZE,
        onPageChange: handlePageChange
      })
    ),
    !loading && !error && searched && results && results.results && results.results.length === 0 && React.createElement(EmptyState, {
      title: t('noResults'),
      message: '"' + query + '"' + t('noResultsDesc')
    }),
    !searched && !loading && React.createElement('div', { className: 'empty-state' },
      React.createElement('h3', null, t('searchEmpty')),
      React.createElement('p', null, t('searchEmptyDesc'))
    )
  );
}

export default SearchPage;
