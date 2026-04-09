import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { filterSets, getThemes } from '../utils/api';
import { getCachedTranslation, translateName } from '../utils/translate';
import { useLanguage } from '../contexts/LanguageContext';
import SetCard from '../components/SetCard';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';
import bdpUpcomingData from '../data/bdpUpcoming.json';

var PAGE_SIZE = 40;

// Status display order for upcoming cards (confirmed first, rumors last)
var STATUS_ORDER = { confirmed: 0, reviewing: 1, rumor: 2 };

// localStorage cache for BDP theme discovery (fast path + proxy-flake resilience)
var BDP_CACHE_KEY = 'bdpThemeCache_v1';
var BDP_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function loadBdpCache() {
  try {
    var raw = typeof localStorage !== 'undefined' ? localStorage.getItem(BDP_CACHE_KEY) : null;
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || Date.now() - parsed.ts > BDP_CACHE_TTL) return null;
    if (!parsed.parentId || !parsed.series || !parsed.themeMap) return null;
    return parsed;
  } catch (e) { return null; }
}

function saveBdpCache(data) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(BDP_CACHE_KEY, JSON.stringify(Object.assign({}, data, { ts: Date.now() })));
  } catch (e) { /* quota or private mode — ignore */ }
}

function FundingPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;

  // NEW: top-level segment — 'released' (existing BDP library) or 'upcoming' (curated JSON)
  var segState = useState('released');
  var segment = segState[0]; var setSegment = segState[1];

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

  // year filter and name search (released tab only)
  var s13 = useState('all'); var selYear = s13[0]; var setSelYear = s13[1];
  var s14 = useState(''); var searchName = s14[0]; var setSearchName = s14[1];

  var sentinelRef = useRef(null);
  var currentSeriesRef = useRef('all');

  // Load themes and find BDP theme on mount.
  // Strategy:
  //   1. Try localStorage cache first — instant load, avoids heavy paginated calls
  //      through flaky public CORS proxies.
  //   2. Always attempt a background refresh from Rebrickable.
  //   3. If ALL pages fail AND no cache exists, show apiError.
  //   4. If SOME pages fail but we already have cache, stay silent — user's
  //      cached view keeps working.
  useEffect(function() {
    var cached = loadBdpCache();
    var hadCache = false;
    if (cached) {
      hadCache = true;
      setBdpParentId(cached.parentId);
      setBdpSeries(cached.series);
      setThemeMap(cached.themeMap);
    }

    (async function() {
      try {
        var allThemes = [];
        var pg = 1; var more = true;
        var MAX_PAGES = 20; // safety bound — Rebrickable currently has <5 pages at size 200
        var PAGE_SIZE_THEMES = 200; // smaller than 1000 to be kinder to CORS proxies/timeouts
        var pageFailures = 0;

        while (more && pg <= MAX_PAGES) {
          try {
            var data = await getThemes(pg, PAGE_SIZE_THEMES);
            allThemes = allThemes.concat((data && data.results) || []);
            more = data && data.next != null;
            pg++;
          } catch (pageErr) {
            console.error('[FundingPage] getThemes page ' + pg + ' failed:',
              pageErr && pageErr.message, pageErr && pageErr.response && pageErr.response.status);
            pageFailures++;
            // If we already collected SOMETHING, break and use what we have.
            if (allThemes.length > 0) { more = false; break; }
            // Otherwise, give up the loop and rely on cache / error path below.
            throw pageErr;
          }
        }

        if (allThemes.length === 0) {
          throw new Error('No themes returned from Rebrickable');
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
          var children = allThemes.filter(function(theme) {
            return theme.parent_id === bdpParent.id;
          }).sort(function(a, b) {
            return a.name.localeCompare(b.name);
          });
          setBdpParentId(bdpParent.id);
          setBdpSeries(children);
          saveBdpCache({ parentId: bdpParent.id, series: children, themeMap: map });
        } else if (!hadCache) {
          setError(t('bdpThemeNotFound'));
          setLoading(false);
        }
      } catch (e) {
        console.error('[FundingPage] Failed to load themes:',
          e && e.message, e && e.response && e.response.status);
        // Only surface an error if we have NO cached fallback to show the user.
        if (!hadCache) {
          setError(t('apiError'));
          setLoading(false);
        }
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
    return themeMap[themeId] || (t('themePrefix') + ' ' + themeId);
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
      console.error('[FundingPage] filterSets failed:',
        err && err.message, err && err.response && err.response.status);
      setError(t('apiError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load sets when bdpParentId is found or series changes (released segment only)
  useEffect(function() {
    if (segment !== 'released') return;
    if (!bdpParentId) return;
    currentSeriesRef.current = selSeries;
    setAllResults([]);
    setPage(1);
    setHasMore(false);
    setLoaded(false);
    setSelYear('all');
    setSearchName('');
    var themeId = selSeries === 'all' ? bdpParentId : selSeries;
    doFetch(themeId, 1, false);
  }, [bdpParentId, selSeries, segment]);

  // Infinite scroll (released segment only)
  useEffect(function() {
    if (segment !== 'released') return;
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

  // Extract available years from results
  var availableYears = useMemo(function() {
    var years = {};
    allResults.forEach(function(set) {
      if (set.year) years[set.year] = true;
    });
    return Object.keys(years).map(Number).sort(function(a, b) { return b - a; });
  }, [allResults]);

  // Filter results by year and name
  var filteredResults = useMemo(function() {
    var results = allResults;
    if (selYear !== 'all') {
      var yr = parseInt(selYear);
      results = results.filter(function(set) { return set.year === yr; });
    }
    if (searchName.trim()) {
      var q = searchName.trim().toLowerCase();
      results = results.filter(function(set) {
        var name = (set.name || '').toLowerCase();
        var num = (set.set_num || '').toLowerCase();
        return name.indexOf(q) >= 0 || num.indexOf(q) >= 0;
      });
    }
    return results;
  }, [allResults, selYear, searchName]);

  // Group by series (sub-theme) when viewing all, or by year when viewing a specific series
  var displayGroups = useMemo(function() {
    if (filteredResults.length === 0) return [];

    if (selSeries === 'all') {
      var groups = {};
      filteredResults.forEach(function(set) {
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
      filteredResults.forEach(function(set) {
        var year = set.year || 0;
        if (!yearGroups[year]) {
          yearGroups[year] = { id: year, name: year + t('yearSuffix'), sets: [] };
        }
        yearGroups[year].sets.push(set);
      });
      return Object.values(yearGroups).sort(function(a, b) { return b.id - a.id; });
    }
  }, [filteredResults, selSeries, themeMap, themeNames, lang]);

  // Handle year change
  var handleYearChange = function(e) {
    setSelYear(e.target.value);
  };

  // Handle search name change
  var handleSearchChange = function(e) {
    setSearchName(e.target.value);
  };

  // Clear search
  var handleClearSearch = function() {
    setSearchName('');
  };

  // ---- Upcoming list (sorted by status then by expectedLaunchDate asc) ----
  var upcomingItems = useMemo(function() {
    var list = (bdpUpcomingData && bdpUpcomingData.upcoming) ? bdpUpcomingData.upcoming.slice() : [];
    list.sort(function(a, b) {
      var sa = STATUS_ORDER[a.status] != null ? STATUS_ORDER[a.status] : 9;
      var sb = STATUS_ORDER[b.status] != null ? STATUS_ORDER[b.status] : 9;
      if (sa !== sb) return sa - sb;
      var da = a.expectedLaunchDate || '9999-12-31';
      var db = b.expectedLaunchDate || '9999-12-31';
      return da.localeCompare(db);
    });
    return list;
  }, []);

  var statusLabel = function(status) {
    if (status === 'confirmed') return t('bdpUpcomingStatusConfirmed');
    if (status === 'reviewing') return t('bdpUpcomingStatusReviewing');
    if (status === 'rumor') return t('bdpUpcomingStatusRumor');
    return status;
  };

  // Segment tabs (Released / Upcoming)
  var segmentTabs = React.createElement('div', { className: 'bdp-segment-tabs', role: 'tablist' },
    React.createElement('button', {
      className: 'bdp-segment-tab' + (segment === 'released' ? ' active' : ''),
      role: 'tab',
      'aria-selected': segment === 'released',
      onClick: function() { setSegment('released'); },
    }, t('bdpTabReleased')),
    React.createElement('button', {
      className: 'bdp-segment-tab' + (segment === 'upcoming' ? ' active' : ''),
      role: 'tab',
      'aria-selected': segment === 'upcoming',
      onClick: function() { setSegment('upcoming'); },
    }, t('bdpTabUpcoming'))
  );

  // Header section
  var headerSection = React.createElement('div', { className: 'search-section' },
    React.createElement('div', { className: 'new-products-header' },
      React.createElement('h2', null, t('fundingProducts')),
      React.createElement('p', { className: 'new-products-desc' },
        segment === 'upcoming' ? t('bdpUpcomingDesc') : t('fundingDesc')
      )
    ),
    segmentTabs,
    segment === 'released' ? React.createElement('div', { className: 'funding-info-notice' },
      React.createElement('span', { className: 'funding-info-icon' }, '\u2139\uFE0F'),
      React.createElement('span', null, t('fundingNotice'))
    ) : null,
    segment === 'released' && bdpSeries.length > 0 ? React.createElement('div', { className: 'funding-series-tabs' },
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
    ) : null,
    // Filter row: year select + name search (released only)
    segment === 'released' && loaded && allResults.length > 0 ? React.createElement('div', { className: 'funding-filter-row' },
      React.createElement('div', { className: 'funding-filter-year' },
        React.createElement('select', {
          className: 'funding-year-select',
          value: selYear,
          onChange: handleYearChange,
        },
          React.createElement('option', { value: 'all' }, t('allYears')),
          availableYears.map(function(yr) {
            return React.createElement('option', { key: yr, value: String(yr) }, yr + t('yearSuffix'));
          })
        )
      ),
      React.createElement('div', { className: 'funding-filter-search' },
        React.createElement('div', { className: 'search-input-wrapper' },
          React.createElement('input', {
            type: 'text',
            className: 'funding-search-input',
            value: searchName,
            onChange: handleSearchChange,
            placeholder: t('searchByName'),
          }),
          searchName ? React.createElement('button', {
            type: 'button',
            className: 'search-clear-btn',
            onClick: handleClearSearch,
            'aria-label': t('clearSearch'),
          }, '\u00D7') : null
        )
      )
    ) : null
  );

  // Results count (released)
  var resultsSection = null;
  if (segment === 'released' && displayGroups.length > 0) {
    var displayCount = filteredResults.length;
    var summaryText = t('total') + ' ' + displayCount + t('count') + ' ' + t('fundingProductsFound');
    if ((selYear !== 'all' || searchName.trim()) && displayCount !== totalCount) {
      summaryText += ' (' + t('ofTotal') + ' ' + totalCount + t('count') + ')';
    }
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

  // ---- Upcoming detail view: BrickLink-style product cards with gallery ----
  var upcomingGalleryState = useState({}); // { [itemId]: selectedIndex }
  var galleryIndexes = upcomingGalleryState[0]; var setGalleryIndexes = upcomingGalleryState[1];

  var setGalleryIdx = function(itemId, idx) {
    setGalleryIndexes(function(prev) {
      var o = {}; o[itemId] = idx;
      return Object.assign({}, prev, o);
    });
  };

  var upcomingSection = null;
  if (segment === 'upcoming') {
    if (upcomingItems.length === 0) {
      upcomingSection = React.createElement(EmptyState, {
        title: t('noResults'),
        message: t('bdpUpcomingEmpty')
      });
    } else {
      var placeholderSvg = React.createElement('svg', {
        className: 'bdp-upcoming-placeholder',
        viewBox: '0 0 64 64',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': 'true'
      },
        React.createElement('rect', { x: 8, y: 20, width: 48, height: 36, rx: 3, fill: 'currentColor', opacity: 0.6 }),
        React.createElement('circle', { cx: 20, cy: 16, r: 4, fill: 'currentColor' }),
        React.createElement('circle', { cx: 32, cy: 16, r: 4, fill: 'currentColor' }),
        React.createElement('circle', { cx: 44, cy: 16, r: 4, fill: 'currentColor' })
      );

      var cards = upcomingItems.map(function(item) {
        var name = (lang === 'ko' && item.nameKo) ? item.nameKo : item.nameEn;
        var desc = (lang === 'ko' && item.descriptionKo) ? item.descriptionKo : (item.descriptionEn || '');
        var gallery = item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : (item.imageUrl ? [item.imageUrl] : []);
        var currentIdx = galleryIndexes[item.id] || 0;
        var currentImgSrc = gallery[currentIdx] || item.imageUrl || '';

        // --- Image gallery section ---
        var mainImageEl = currentImgSrc
          ? React.createElement('img', {
              className: 'bdp-detail-main-img',
              src: currentImgSrc,
              alt: name,
              loading: 'lazy',
              key: 'gimg-' + item.id + '-' + currentIdx
            })
          : placeholderSvg;

        var thumbStrip = gallery.length > 1
          ? React.createElement('div', { className: 'bdp-detail-thumbs' },
              gallery.map(function(src, idx) {
                return React.createElement('img', {
                  key: 'thumb-' + idx,
                  className: 'bdp-detail-thumb' + (idx === currentIdx ? ' active' : ''),
                  src: src,
                  alt: name + ' ' + (idx + 1),
                  loading: 'lazy',
                  onClick: function() { setGalleryIdx(item.id, idx); }
                });
              })
            )
          : null;

        var gallerySection = React.createElement('div', { className: 'bdp-detail-gallery' },
          React.createElement('div', { className: 'bdp-detail-main-img-wrap' }, mainImageEl),
          thumbStrip
        );

        // --- Spec table ---
        var specRows = [];
        specRows.push(React.createElement('tr', { key: 'round' },
          React.createElement('th', null, t('bdpUpcomingRound')),
          React.createElement('td', null, item.round)
        ));
        specRows.push(React.createElement('tr', { key: 'designer' },
          React.createElement('th', null, t('bdpUpcomingDesigner')),
          React.createElement('td', null,
            item.designer,
            item.designerLocation ? React.createElement('span', { className: 'bdp-detail-location' }, ' \u00B7 ' + item.designerLocation) : null
          )
        ));
        if (item.estimatedParts) {
          specRows.push(React.createElement('tr', { key: 'parts' },
            React.createElement('th', null, t('bdpUpcomingEstimatedParts')),
            React.createElement('td', null,
              item.estimatedParts.toLocaleString(),
              item.uniqueParts ? React.createElement('span', { className: 'bdp-detail-sub' }, ' (' + t('bdpDetailUniqueParts') + ': ' + item.uniqueParts + ')') : null
            )
          ));
        }
        if (item.minifigures != null) {
          specRows.push(React.createElement('tr', { key: 'minifigs' },
            React.createElement('th', null, t('bdpDetailMinifigures')),
            React.createElement('td', null, item.minifigures)
          ));
        }
        if (item.stickers != null) {
          specRows.push(React.createElement('tr', { key: 'stickers' },
            React.createElement('th', null, t('bdpDetailStickers')),
            React.createElement('td', null, item.stickers === 0 ? t('bdpDetailNoStickers') : item.stickers)
          ));
        }
        if (item.estimatedUsd) {
          specRows.push(React.createElement('tr', { key: 'price' },
            React.createElement('th', null, t('bdpUpcomingEstimatedUsd')),
            React.createElement('td', null, '$' + item.estimatedUsd)
          ));
        }
        specRows.push(React.createElement('tr', { key: 'crowdfunding' },
          React.createElement('th', null, t('bdpDetailCrowdfunding')),
          React.createElement('td', null,
            React.createElement('span', { className: 'bdp-detail-date-highlight' },
              item.crowdfundingNote || item.expectedLaunchDate
            )
          )
        ));
        specRows.push(React.createElement('tr', { key: 'status' },
          React.createElement('th', null, t('bdpDetailStatus')),
          React.createElement('td', null,
            React.createElement('span', { className: 'brick-status ' + item.status }, statusLabel(item.status))
          )
        ));

        var specTable = React.createElement('table', { className: 'bdp-detail-spec-table' },
          React.createElement('tbody', null, specRows)
        );

        // --- Description ---
        var descSection = desc
          ? React.createElement('div', { className: 'bdp-detail-desc' },
              React.createElement('h4', null, t('bdpDetailDescription')),
              React.createElement('p', null, desc)
            )
          : null;

        // --- Action buttons ---
        var actionButtons = React.createElement('div', { className: 'bdp-detail-actions' },
          item.brickLinkUrl ? React.createElement('a', {
            className: 'bdp-detail-btn primary',
            href: item.brickLinkUrl,
            target: '_blank',
            rel: 'noopener noreferrer'
          }, t('bdpDetailViewOnBrickLink')) : null,
          item.brickLinkUrl !== item.ideasProjectUrl && item.ideasProjectUrl ? React.createElement('a', {
            className: 'bdp-detail-btn',
            href: item.ideasProjectUrl,
            target: '_blank',
            rel: 'noopener noreferrer'
          }, t('bdpUpcomingViewOnIdeas')) : null
        );

        // --- Notes ---
        var notesEl = item.notes
          ? React.createElement('div', { className: 'bdp-detail-notes' }, item.notes)
          : null;

        // --- Combined card ---
        return React.createElement('div', {
          key: item.id,
          className: 'bdp-detail-card',
          'data-status': item.status
        },
          gallerySection,
          React.createElement('div', { className: 'bdp-detail-info' },
            React.createElement('div', { className: 'bdp-detail-header' },
              React.createElement('h3', { className: 'bdp-detail-name' }, name),
              React.createElement('span', { className: 'brick-status ' + item.status }, statusLabel(item.status))
            ),
            item.designer ? React.createElement('div', { className: 'bdp-detail-designer-line' },
              t('bdpDetailBy') + ' ',
              React.createElement('strong', null, item.designer)
            ) : null,
            specTable,
            descSection,
            notesEl,
            actionButtons
          )
        );
      });

      upcomingSection = React.createElement('div', { className: 'bdp-detail-list' }, cards);
    }
  }

  // No filter results message
  var noFilterResults = segment === 'released' && !loading && !error && loaded && filteredResults.length === 0 && allResults.length > 0 ?
    React.createElement(EmptyState, {
      title: t('noResults'),
      message: t('noFundingMatch')
    }) : null;

  var loadingMore = segment === 'released' && loading && allResults.length > 0 ? React.createElement(Loading, null) : null;
  var initialLoading = segment === 'released' && loading && allResults.length === 0 && !error ? React.createElement(Loading, null) : null;
  var emptyResults = segment === 'released' && !loading && !error && loaded && allResults.length === 0 ?
    React.createElement(EmptyState, { title: t('noResults'), message: t('noFundingProducts') }) : null;

  return React.createElement('div', null,
    headerSection,
    initialLoading,
    segment === 'released' && error ? React.createElement(ErrorMessage, { message: error, onRetry: function() {
      if (bdpParentId) {
        var themeId = selSeries === 'all' ? bdpParentId : selSeries;
        doFetch(themeId, 1, false);
      }
    }}) : null,
    resultsSection,
    upcomingSection,
    noFilterResults,
    loadingMore,
    emptyResults,
    segment === 'released' ? React.createElement('div', { ref: sentinelRef, style: { height: 1, marginBottom: 40 } }) : null
  );
}

export default FundingPage;