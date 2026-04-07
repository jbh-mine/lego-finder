import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchSets, getThemes, filterSets } from '../utils/api';
import { translateSearchQuery, SET_NUM_MAP, getIpSearchTerms } from '../utils/searchDict';
import { getCachedTranslation, translateName } from '../utils/translate';
import { getKrwPrice } from '../utils/price';
import { getCollection, getWishlist } from '../utils/collection';
import { useLanguage } from '../contexts/LanguageContext';
import SetCard from '../components/SetCard';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

var PAGE_SIZE = 40;
var SEARCH_STATE_KEY = 'lego_search_state';

// ---------------------------------------------------------------------------
// Multi-axis filter helpers
// ---------------------------------------------------------------------------
var DEFAULT_FILTERS = {
  partsMin: '',
  partsMax: '',
  yearMin: '',
  yearMax: '',
  priceMin: '',
  priceMax: '',
  retiredMode: 'all',     // 'all' | 'only' | 'exclude'
  ownedMode: 'all',       // 'all' | 'owned' | 'wished' | 'not_owned'
};

function readFiltersFromParams(params) {
  return {
    partsMin: params.get('pmin') || '',
    partsMax: params.get('pmax') || '',
    yearMin: params.get('ymin') || '',
    yearMax: params.get('ymax') || '',
    priceMin: params.get('prmin') || '',
    priceMax: params.get('prmax') || '',
    retiredMode: params.get('rt') || 'all',
    ownedMode: params.get('ow') || 'all',
  };
}

function filtersAreDefault(f) {
  return !f.partsMin && !f.partsMax && !f.yearMin && !f.yearMax
    && !f.priceMin && !f.priceMax
    && (f.retiredMode === 'all' || !f.retiredMode)
    && (f.ownedMode === 'all' || !f.ownedMode);
}

function SearchPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;

  var sp = useSearchParams();
  var searchParams = sp[0];
  var setSearchParams = sp[1];

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

  // Multi-axis filter state
  var fs = useState(DEFAULT_FILTERS); var filters = fs[0]; var setFilters = fs[1];
  var fps = useState(false); var filterPanelOpen = fps[0]; var setFilterPanelOpen = fps[1];
  var sm = useState(''); var shareMsg = sm[0]; var setShareMsg = sm[1];

  var sentinelRef = useRef(null);
  var curQueryRef = useRef('');
  var matchedThemeRef = useRef(null);
  var didInitFromUrlRef = useRef(false);

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
      setFilters(DEFAULT_FILTERS);
      curQueryRef.current = '';
      matchedThemeRef.current = null;
      try { setSearchParams({}, { replace: true }); } catch(e) {}
      window.scrollTo(0, 0);
    };
    window.addEventListener('resetSearch', handleReset);
    return function() { window.removeEventListener('resetSearch', handleReset); };
  }, [setSearchParams]);

  // Restore search state from sessionStorage on mount (only if URL has no q)
  useEffect(function() {
    if (didInitFromUrlRef.current) return;
    didInitFromUrlRef.current = true;
    var qParam = searchParams.get('q') || '';
    var sortParam = searchParams.get('sort') || 'default';
    var urlFilters = readFiltersFromParams(searchParams);

    // If URL contains a query, drive everything from URL (deep link / share link)
    if (qParam) {
      setQuery(qParam);
      curQueryRef.current = qParam;
      setSortOrder(sortParam);
      setFilters(urlFilters);
      // Wait for themeMap then trigger initial search via the dedicated effect below
      return;
    }

    // Otherwise restore from sessionStorage as before
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
          if (state.filters) setFilters(state.filters);
          setStateRestored(true);
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
  }, [searchParams]);

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
        filters: filters,
        scrollY: window.scrollY,
      };
      sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore quota errors
    }
  }, [allResults, totalCount, page, searched, hasMore, sortOrder, matchedThemeId, nameExtras, filters]);

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
      var rawQuery = searchQuery.trim();
      var translatedQuery = translateSearchQuery(rawQuery);

      // If translated query is a set number (from SET_NUM_MAP), search by set number
      if (/^\d[\d\-]*$/.test(translatedQuery) && translatedQuery !== rawQuery) {
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
      }

      // IP / Franchise umbrella expansion
      var ipTerms = getIpSearchTerms(rawQuery) || getIpSearchTerms(translatedQuery);
      if (ipTerms && ipTerms.length > 0 && searchPage === 1) {
        var ipMatchedThemeIds = findMatchingThemeIds(translatedQuery);
        var ipPromises = [];
        if (ipMatchedThemeIds.length > 0) {
          ipPromises.push(
            filterSets({ themeId: ipMatchedThemeIds[0], page: 1, pageSize: PAGE_SIZE })
              .catch(function() { return { results: [], count: 0 }; })
          );
        }
        ipTerms.forEach(function(term) {
          ipPromises.push(
            searchSets(term, 1, PAGE_SIZE)
              .catch(function() { return { results: [], count: 0 }; })
          );
        });

        var ipResults = await Promise.all(ipPromises);
        var seenIp = {};
        var mergedIp = [];
        ipResults.forEach(function(r) {
          (r && r.results ? r.results : []).forEach(function(s) {
            if (!seenIp[s.set_num]) {
              seenIp[s.set_num] = true;
              mergedIp.push(s);
            }
          });
        });

        if (mergedIp.length > 0) {
          var primaryIpTheme = ipMatchedThemeIds.length > 0 ? ipMatchedThemeIds[0] : null;
          matchedThemeRef.current = primaryIpTheme;
          setMatchedThemeId(primaryIpTheme);
          setNameExtras([]);
          setAllResults(mergedIp);
          setTotalCount(mergedIp.length);
          setPage(1);
          setHasMore(false);
          setSearched(true);
          setLoading(false);
          return;
        }
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
        var data2 = await searchSets(translatedQuery, searchPage, PAGE_SIZE);
        if (append) {
          setAllResults(function(prev) { return prev.concat(data2.results); });
        } else {
          setAllResults(data2.results);
        }
        setTotalCount(data2.count);
        setPage(searchPage);
        setHasMore(data2.results.length >= PAGE_SIZE);
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

  // Auto-trigger search if URL has ?q= and themes are loaded
  useEffect(function() {
    var qParam = searchParams.get('q') || '';
    if (!qParam) return;
    if (Object.keys(themeMap).length === 0) return;
    if (searched && curQueryRef.current === qParam) return;
    curQueryRef.current = qParam;
    doSearch(qParam, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeMap]);

  // Sync state -> URL whenever query/sort/filters change after a search
  useEffect(function() {
    if (!searched || !curQueryRef.current) return;
    var next = {};
    next.q = curQueryRef.current;
    if (sortOrder && sortOrder !== 'default') next.sort = sortOrder;
    if (filters.partsMin) next.pmin = filters.partsMin;
    if (filters.partsMax) next.pmax = filters.partsMax;
    if (filters.yearMin) next.ymin = filters.yearMin;
    if (filters.yearMax) next.ymax = filters.yearMax;
    if (filters.priceMin) next.prmin = filters.priceMin;
    if (filters.priceMax) next.prmax = filters.priceMax;
    if (filters.retiredMode && filters.retiredMode !== 'all') next.rt = filters.retiredMode;
    if (filters.ownedMode && filters.ownedMode !== 'all') next.ow = filters.ownedMode;
    try { setSearchParams(next, { replace: true }); } catch(e) {}
  }, [searched, sortOrder, filters, setSearchParams]);

  // Build owned/wishlist set for filter when needed
  var collectionSet = useMemo(function() {
    if (filters.ownedMode === 'all') return null;
    var arr = getCollection();
    var s = {};
    for (var i = 0; i < arr.length; i++) s[arr[i].set_num] = true;
    return s;
  }, [filters.ownedMode]);
  var wishlistSet = useMemo(function() {
    if (filters.ownedMode !== 'wished') return null;
    var arr = getWishlist();
    var s = {};
    for (var i = 0; i < arr.length; i++) s[arr[i].set_num] = true;
    return s;
  }, [filters.ownedMode]);

  // Apply multi-axis filters client-side to allResults
  var filteredResults = useMemo(function() {
    if (filtersAreDefault(filters)) return allResults;
    var pmin = filters.partsMin ? parseInt(filters.partsMin, 10) : null;
    var pmax = filters.partsMax ? parseInt(filters.partsMax, 10) : null;
    var ymin = filters.yearMin ? parseInt(filters.yearMin, 10) : null;
    var ymax = filters.yearMax ? parseInt(filters.yearMax, 10) : null;
    var prmin = filters.priceMin ? parseInt(filters.priceMin, 10) : null;
    var prmax = filters.priceMax ? parseInt(filters.priceMax, 10) : null;
    var rt = filters.retiredMode || 'all';
    var ow = filters.ownedMode || 'all';
    var needsPrice = prmin !== null || prmax !== null || rt !== 'all';

    return allResults.filter(function(set) {
      var pn = set.num_parts || 0;
      if (pmin !== null && pn < pmin) return false;
      if (pmax !== null && pn > pmax) return false;

      var yr = set.year || 0;
      if (ymin !== null && yr < ymin) return false;
      if (ymax !== null && yr > ymax) return false;

      if (needsPrice) {
        var p = getKrwPrice(set.set_num);
        if (prmin !== null || prmax !== null) {
          if (!p || !p.price) return false;
          if (prmin !== null && p.price < prmin) return false;
          if (prmax !== null && p.price > prmax) return false;
        }
        if (rt === 'only' && (!p || !p.discontinued)) return false;
        if (rt === 'exclude' && p && p.discontinued) return false;
      }

      if (ow !== 'all') {
        var inC = collectionSet && collectionSet[set.set_num];
        var inW = wishlistSet && wishlistSet[set.set_num];
        if (ow === 'owned' && !inC) return false;
        if (ow === 'not_owned' && inC) return false;
        if (ow === 'wished' && !inW) return false;
      }
      return true;
    });
  }, [allResults, filters, collectionSet, wishlistSet]);

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

  // Filter handlers
  var updateFilter = function(key, value) {
    setFilters(function(prev) {
      var n = Object.assign({}, prev); n[key] = value; return n;
    });
  };
  var resetFilters = function() {
    setFilters(DEFAULT_FILTERS);
  };
  var copyShareUrl = function() {
    try {
      var url = window.location.href;
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
          setShareMsg(t('filterShareCopied'));
          setTimeout(function() { setShareMsg(''); }, 2000);
        }).catch(function() {
          setShareMsg(url);
          setTimeout(function() { setShareMsg(''); }, 4000);
        });
      } else {
        setShareMsg(url);
        setTimeout(function() { setShareMsg(''); }, 4000);
      }
    } catch (e) {}
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
    if (sortOrder === 'default' || filteredResults.length === 0) return null;
    var sorted = filteredResults.slice();
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
  }, [filteredResults, sortOrder]);

  // Theme-grouped results (used when sortOrder === 'default')
  var themeGroups = useMemo(function() {
    if (sortOrder !== 'default' || filteredResults.length === 0) return [];
    var groups = {};
    filteredResults.forEach(function(set) {
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
      if (primaryTheme) {
        var aMatch = (a.themeId === primaryTheme) ? 1 : 0;
        var bMatch = (b.themeId === primaryTheme) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      if (b.sets.length !== a.sets.length) {
        return b.sets.length - a.sets.length;
      }
      return a.themeName.localeCompare(b.themeName, 'ko');
    });
  }, [filteredResults, themeMap, themeNames, lang, sortOrder, matchedThemeId]);

  var handleSortChange = function(e) {
    setSortOrder(e.target.value);
  };

  // ----- UI -----
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

  // ---- Filter panel ----
  var filterRowStyle = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 };
  var filterLabelStyle = { minWidth: 92, fontSize: 13, color: '#444', fontWeight: 600 };
  var filterInputStyle = { width: 96, padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 };
  var filterSepStyle = { color: '#999' };
  var filterRadioWrapStyle = { display: 'flex', gap: 12, flexWrap: 'wrap' };
  var filterRadioLabelStyle = { fontSize: 13, color: '#333', cursor: 'pointer' };

  var activeFilterCount = 0;
  ['partsMin','partsMax','yearMin','yearMax','priceMin','priceMax'].forEach(function(k) { if (filters[k]) activeFilterCount++; });
  if (filters.retiredMode && filters.retiredMode !== 'all') activeFilterCount++;
  if (filters.ownedMode && filters.ownedMode !== 'all') activeFilterCount++;

  var filterToggleBtn = React.createElement('button', {
    type: 'button',
    onClick: function() { setFilterPanelOpen(!filterPanelOpen); },
    style: {
      padding: '8px 14px',
      border: '1px solid #0066cc',
      background: filterPanelOpen ? '#0066cc' : '#fff',
      color: filterPanelOpen ? '#fff' : '#0066cc',
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
    },
  }, t('filterToggleLabel') + (activeFilterCount > 0 ? ' (' + activeFilterCount + ')' : '') + (filterPanelOpen ? ' \u25B2' : ' \u25BC'));

  var shareBtn = React.createElement('button', {
    type: 'button',
    onClick: copyShareUrl,
    style: {
      padding: '8px 14px',
      border: '1px solid #888',
      background: '#fff',
      color: '#333',
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 13,
      marginLeft: 8,
    },
  }, t('filterShareUrl'));

  var resetBtn = React.createElement('button', {
    type: 'button',
    onClick: resetFilters,
    style: {
      padding: '8px 14px',
      border: '1px solid #888',
      background: '#fff',
      color: '#333',
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 13,
      marginLeft: 8,
    },
  }, t('reset'));

  var filterBarRow = React.createElement('div', { style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', margin: '12px 0' } },
    filterToggleBtn,
    activeFilterCount > 0 ? resetBtn : null,
    searched ? shareBtn : null,
    shareMsg ? React.createElement('span', { style: { marginLeft: 12, fontSize: 12, color: '#0a7d0a' } }, shareMsg) : null
  );

  var filterPanel = filterPanelOpen ? React.createElement('div', {
    style: {
      border: '1px solid #ddd',
      borderRadius: 6,
      padding: 14,
      background: '#fafafa',
      marginBottom: 14,
    },
  },
    // Parts range
    React.createElement('div', { style: filterRowStyle },
      React.createElement('span', { style: filterLabelStyle }, t('filterPartsRange')),
      React.createElement('input', {
        type: 'number', min: 0, value: filters.partsMin, placeholder: t('filterMin'),
        style: filterInputStyle,
        onChange: function(e) { updateFilter('partsMin', e.target.value); },
      }),
      React.createElement('span', { style: filterSepStyle }, '\u2013'),
      React.createElement('input', {
        type: 'number', min: 0, value: filters.partsMax, placeholder: t('filterMax'),
        style: filterInputStyle,
        onChange: function(e) { updateFilter('partsMax', e.target.value); },
      })
    ),
    // Year range
    React.createElement('div', { style: filterRowStyle },
      React.createElement('span', { style: filterLabelStyle }, t('filterYearRange')),
      React.createElement('input', {
        type: 'number', min: 1949, max: 2099, value: filters.yearMin, placeholder: t('filterMin'),
        style: filterInputStyle,
        onChange: function(e) { updateFilter('yearMin', e.target.value); },
      }),
      React.createElement('span', { style: filterSepStyle }, '\u2013'),
      React.createElement('input', {
        type: 'number', min: 1949, max: 2099, value: filters.yearMax, placeholder: t('filterMax'),
        style: filterInputStyle,
        onChange: function(e) { updateFilter('yearMax', e.target.value); },
      })
    ),
    // Price range
    React.createElement('div', { style: filterRowStyle },
      React.createElement('span', { style: filterLabelStyle }, t('filterPriceRange')),
      React.createElement('input', {
        type: 'number', min: 0, value: filters.priceMin, placeholder: t('filterMin'),
        style: filterInputStyle,
        onChange: function(e) { updateFilter('priceMin', e.target.value); },
      }),
      React.createElement('span', { style: filterSepStyle }, '\u2013'),
      React.createElement('input', {
        type: 'number', min: 0, value: filters.priceMax, placeholder: t('filterMax'),
        style: filterInputStyle,
        onChange: function(e) { updateFilter('priceMax', e.target.value); },
      })
    ),
    // Retired mode
    React.createElement('div', { style: filterRowStyle },
      React.createElement('span', { style: filterLabelStyle }, t('filterRetired')),
      React.createElement('div', { style: filterRadioWrapStyle },
        ['all','only','exclude'].map(function(mode) {
          return React.createElement('label', { key: mode, style: filterRadioLabelStyle },
            React.createElement('input', {
              type: 'radio', name: 'retiredMode', value: mode,
              checked: filters.retiredMode === mode,
              onChange: function() { updateFilter('retiredMode', mode); },
              style: { marginRight: 4 },
            }),
            t('filterRetired_' + mode)
          );
        })
      )
    ),
    // Owned mode
    React.createElement('div', { style: filterRowStyle },
      React.createElement('span', { style: filterLabelStyle }, t('filterOwned')),
      React.createElement('div', { style: filterRadioWrapStyle },
        ['all','owned','not_owned','wished'].map(function(mode) {
          return React.createElement('label', { key: mode, style: filterRadioLabelStyle },
            React.createElement('input', {
              type: 'radio', name: 'ownedMode', value: mode,
              checked: filters.ownedMode === mode,
              onChange: function() { updateFilter('ownedMode', mode); },
              style: { marginRight: 4 },
            }),
            t('filterOwned_' + mode)
          );
        })
      )
    )
  ) : null;

  var filterSection = React.createElement('div', null, filterBarRow, filterPanel);

  // ---- Results section ----
  var resultsSection = null;
  var hasSomeResults = sortOrder === 'default' ? themeGroups.length > 0 : (sortedResults && sortedResults.length > 0);
  var filteredCount = filteredResults.length;
  var filteredOut = allResults.length - filteredCount;

  if (hasSomeResults) {
    var summaryText = t('total') + ' ' + filteredCount + t('count') + ' ' + t('searchResultsFound');
    if (filteredOut > 0) {
      summaryText += ' (' + t('filterFilteredPrefix') + filteredOut + t('filterFilteredSuffix') + ')';
    }

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

  // Filter-only empty state (server returned results but client filters removed everything)
  var filteredEmpty = null;
  if (!loading && !error && searched && allResults.length > 0 && filteredCount === 0) {
    filteredEmpty = React.createElement(EmptyState, {
      title: t('noResults'),
      message: t('filterEmptyMsg'),
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
    searched ? filterSection : null,
    initialLoading,
    error ? React.createElement(ErrorMessage, { message: error, onRetry: function() { doSearch(query, page, false); } }) : null,
    resultsSection,
    filteredEmpty,
    loadingMore,
    emptyResults,
    initialState,
    React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } })
  );
}

export default SearchPage;
