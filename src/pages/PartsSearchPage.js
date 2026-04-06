import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchParts, getPartCategories } from '../utils/api';
import { translateSearchQuery } from '../utils/searchDict';
import { useLanguage } from '../contexts/LanguageContext';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var PH = 'https://rebrickable.com/static/img/nil_mf.jpg';

function PartsSearchPage() {
  var nav = useNavigate();
  var lc = useLanguage(); var t = lc.t;
  var s1 = useState(''); var query = s1[0]; var setQuery = s1[1];
  var s2 = useState(null); var results = s2[0]; var setResults = s2[1];
  var s3 = useState(1); var page = s3[0]; var setPage = s3[1];
  var s4 = useState(false); var loading = s4[0]; var setLoading = s4[1];
  var s5 = useState(null); var error = s5[0]; var setError = s5[1];
  var s6 = useState(false); var searched = s6[0]; var setSearched = s6[1];
  var s7 = useState([]); var categories = s7[0]; var setCategories = s7[1];
  var s8 = useState(''); var selCat = s8[0]; var setSelCat = s8[1];

  var PAGE_SIZE = 20;

  useEffect(function() {
    getPartCategories().then(function(data) {
      var cats = data.results || data;
      if (Array.isArray(cats)) {
        cats.sort(function(a, b) { return a.name.localeCompare(b.name); });
        setCategories(cats);
      }
    }).catch(function() {});
  }, []);

  var doSearch = useCallback(function(searchQuery, searchPage, catId) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    var translatedQuery = translateSearchQuery(searchQuery.trim());
    searchParts(translatedQuery, searchPage, PAGE_SIZE, catId || null)
      .then(function(data) {
        setResults(data);
        setSearched(true);
      })
      .catch(function(err) {
        setError(
          err.response && err.response.status === 404
            ? t('noSearchResults')
            : t('apiErrorGeneric')
        );
      })
      .finally(function() {
        setLoading(false);
      });
  }, [t]);

  var handleSearch = function(e) {
    e.preventDefault();
    setPage(1);
    doSearch(query, 1, selCat);
  };

  var handlePageChange = function(newPage) {
    setPage(newPage);
    doSearch(query, newPage, selCat);
    window.scrollTo(0, 0);
  };

  var handleCatChange = function(e) {
    setSelCat(e.target.value);
  };

  return React.createElement('div', null,
    React.createElement('div', { className: 'search-section' },
      React.createElement('h2', null, t('partsSearch')),
      React.createElement('form', { className: 'search-bar', onSubmit: handleSearch },
        React.createElement('input', {
          type: 'text',
          value: query,
          onChange: function(e) { setQuery(e.target.value); },
          placeholder: t('partsSearchPlaceholder'),
        }),
        React.createElement('button', { type: 'submit', disabled: loading },
          loading ? t('searching') : t('searchBtn')
        )
      ),
      React.createElement('div', { className: 'parts-filter-row' },
        React.createElement('div', { className: 'filter-group parts-cat-filter' },
          React.createElement('label', null, t('partCategory')),
          React.createElement('select', { value: selCat, onChange: handleCatChange },
            React.createElement('option', { value: '' }, t('allCategories')),
            categories.map(function(cat) {
              return React.createElement('option', { key: cat.id, value: cat.id }, cat.name);
            })
          )
        )
      )
    ),

    loading && React.createElement(Loading, null),

    error && React.createElement(ErrorMessage, { message: error, onRetry: function() { doSearch(query, page, selCat); } }),

    !loading && !error && results && results.results && results.results.length > 0 &&
      React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'parts-result-grid' },
          results.results.map(function(part) {
            return React.createElement('div', {
              key: part.part_num,
              className: 'part-result-card',
              onClick: function() { nav('/part/' + encodeURIComponent(part.part_num)); },
            },
              React.createElement('img', {
                className: 'part-result-img',
                src: part.part_img_url || PH,
                alt: part.name,
                loading: 'lazy',
                onError: function(e) { e.target.src = PH; },
              }),
              React.createElement('div', { className: 'part-result-body' },
                React.createElement('div', { className: 'part-result-num' }, part.part_num),
                React.createElement('div', { className: 'part-result-name' }, part.name),
                part.part_cat_id && React.createElement('div', { className: 'part-result-cat' },
                  (categories.find(function(c) { return c.id === part.part_cat_id; }) || {}).name || ''
                )
              )
            );
          })
        ),
        React.createElement(Pagination, {
          page: page,
          totalCount: results.count,
          pageSize: PAGE_SIZE,
          onPageChange: handlePageChange,
        })
      ),

    !loading && !error && searched && results && results.results && results.results.length === 0 &&
      React.createElement(EmptyState, {
        title: t('noResults'),
        message: '"' + query + '"' + t('noResultsDesc'),
      }),

    !searched && !loading &&
      React.createElement('div', { className: 'empty-state' },
        React.createElement('h3', null, t('partsSearchEmpty')),
        React.createElement('p', null, t('partsSearchEmptyDesc'))
      )
  );
}

export default PartsSearchPage;
