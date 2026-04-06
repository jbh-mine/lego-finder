import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchParts, getPartCategories } from '../utils/api';
import { translateSearchQuery } from '../utils/searchDict';
import { getCachedTranslation, translateName } from '../utils/translate';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var PH = 'https://rebrickable.com/static/img/nil_mf.jpg';
var PAGE_SIZE = 100;

function PartsSearchPage() {
  var nav = useNavigate();
  var lc = useLanguage(); var t = lc.t; var lang = lc.lang;

  var s1 = useState(''); var query = s1[0]; var setQuery = s1[1];
  var s2 = useState([]); var allResults = s2[0]; var setAllResults = s2[1];
  var s3 = useState(0); var totalCount = s3[0]; var setTotalCount = s3[1];
  var s5 = useState(false); var loading = s5[0]; var setLoading = s5[1];
  var s6 = useState(null); var error = s6[0]; var setError = s6[1];
  var s7 = useState(false); var searched = s7[0]; var setSearched = s7[1];
  var s8 = useState([]); var categories = s8[0]; var setCategories = s8[1];
  var s9 = useState(''); var selCat = s9[0]; var setSelCat = s9[1];

  // Translated category names { id: name }
  var s11 = useState({}); var catNames = s11[0]; var setCatNames = s11[1];

  // Load categories
  useEffect(function() {
    getPartCategories().then(function(data) {
      var cats = data.results || data;
      if (Array.isArray(cats)) {
        cats.sort(function(a, b) { return a.name.localeCompare(b.name); });
        setCategories(cats);
      }
    }).catch(function() {});
  }, []);

  // Translate category names when lang is ko
  useEffect(function() {
    if (lang !== 'ko' || categories.length === 0) return;
    categories.forEach(function(cat) {
      if (catNames[cat.id]) return;
      var cached = getCachedTranslation(cat.name);
      if (cached) {
        setCatNames(function(prev) {
          var o = {}; o[cat.id] = cached;
          return Object.assign({}, prev, o);
        });
      } else {
        translateName(cat.name).then(function(result) {
          if (result && result !== cat.name) {
            setCatNames(function(prev) {
              var o = {}; o[cat.id] = result;
              return Object.assign({}, prev, o);
            });
          }
        });
      }
    });
  }, [categories, lang]);

  // Helper to get translated category name
  var getCatName = function(cat) {
    if (lang === 'ko' && catNames[cat.id]) return catNames[cat.id];
    return cat.name;
  };

  // Load all pages of results
  var doSearchAll = useCallback(async function(searchQuery, catId) {
    if (!searchQuery.trim() && !catId) return;
    setLoading(true);
    setError(null);
    setAllResults([]);
    try {
      var translatedQuery = searchQuery.trim() ? translateSearchQuery(searchQuery.trim()) : '';
      var all = [];
      var pg = 1;
      var more = true;
      while (more) {
        var data = await searchParts(translatedQuery || '', pg, PAGE_SIZE, catId || null);
        all = all.concat(data.results);
        setTotalCount(data.count);
        setAllResults(all.slice());
        more = data.results.length >= PAGE_SIZE;
        pg++;
      }
      setSearched(true);
    } catch (err) {
      setError(
        err.response && err.response.status === 404
          ? t('noSearchResults')
          : t('apiErrorGeneric')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  var handleSearch = function(e) {
    e.preventDefault();
    doSearchAll(query, selCat);
  };

  var handleCatChange = function(e) {
    setSelCat(e.target.value);
  };

  // Group results by category
  var grouped = [];
  if (allResults.length > 0) {
    var groups = {};
    allResults.forEach(function(part) {
      var catId = part.part_cat_id || 0;
      if (!groups[catId]) {
        var catObj = categories.find(function(c) { return c.id === catId; });
        var catName = '';
        if (catObj) {
          catName = getCatName(catObj);
        } else {
          catName = 'Category ' + catId;
        }
        groups[catId] = { catId: catId, catName: catName, parts: [] };
      }
      groups[catId].parts.push(part);
    });
    grouped = Object.values(groups).sort(function(a, b) {
      return b.parts.length - a.parts.length;
    });
  }

  // Render
  var searchSection = React.createElement('div', { className: 'search-section' },
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
            return React.createElement('option', { key: cat.id, value: cat.id }, getCatName(cat));
          })
        )
      )
    )
  );

  var resultsSection = null;
  if (grouped.length > 0) {
    var summaryText = t('total') + ' ' + totalCount + t('count') + ' ' + t('searchResultsFound');
    if (loading) {
      summaryText += ' (' + allResults.length + '/' + totalCount + ' ' + t('loading') + '...)';
    }
    var summary = React.createElement('div', { className: 'search-results-summary' }, summaryText);

    var sections = grouped.map(function(group) {
      var header = React.createElement('div', { className: 'theme-header' },
        React.createElement('span', { className: 'theme-title' }, group.catName),
        React.createElement('span', { className: 'theme-count' }, group.parts.length + t('partsCount'))
      );

      var grid = React.createElement('div', { className: 'parts-result-grid' },
        group.parts.map(function(part) {
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
              React.createElement('div', { className: 'part-result-name' }, part.name)
            )
          );
        })
      );

      return React.createElement('div', { key: group.catId, className: 'theme-section' }, header, grid);
    });

    resultsSection = React.createElement(React.Fragment, null, summary, sections);
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
      React.createElement('h3', null, t('partsSearchEmpty')),
      React.createElement('p', null, t('partsSearchEmptyDesc'))
    );
  }

  // Loading indicator
  var loadingEl = null;
  if (loading && allResults.length === 0) {
    loadingEl = React.createElement(Loading, null);
  }
  // Loading more indicator (while fetching additional pages)
  var loadingMore = null;
  if (loading && allResults.length > 0) {
    loadingMore = React.createElement(Loading, null);
  }

  return React.createElement('div', null,
    searchSection,
    loadingEl,
    error ? React.createElement(ErrorMessage, { message: error, onRetry: function() { doSearchAll(query, selCat); } }) : null,
    resultsSection,
    loadingMore,
    emptyResults,
    initialState
  );
}

export default PartsSearchPage;
