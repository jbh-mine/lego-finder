import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getCollection, removeFromCollection,
  getWishlist, removeFromWishlist,
} from '../utils/collection';
import { getThemes } from '../utils/api';
import { getCachedTranslation, translateName } from '../utils/translate';
import { EmptyState } from '../components/Loading';
import TranslatedName from '../components/TranslatedName';

var PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function CollectionPage() {
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;
  var tabState = useState('collection');
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];
  var collState = useState([]);
  var collection = collState[0];
  var setCollection = collState[1];
  var wishState = useState([]);
  var wishlist = wishState[0];
  var setWishlist = wishState[1];
  var tmState = useState({}); var themeMap = tmState[0]; var setThemeMap = tmState[1];
  var tnState = useState({}); var themeNames = tnState[0]; var setThemeNames = tnState[1];
  var navigate = useNavigate();

  var loadData = useCallback(function() {
    setCollection(getCollection());
    setWishlist(getWishlist());
  }, []);

  useEffect(function() {
    loadData();
  }, [loadData]);

  // Load all themes once on mount
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
        // ignore
      }
    })();
  }, []);

  // Translate theme names to Korean
  useEffect(function() {
    if (lang !== 'ko') return;
    var allItems = collection.concat(wishlist);
    if (allItems.length === 0) return;
    var themeIds = {};
    allItems.forEach(function(item) {
      if (item.theme_id && themeMap[item.theme_id]) {
        themeIds[item.theme_id] = themeMap[item.theme_id];
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
  }, [collection, wishlist, themeMap, lang, themeNames]);

  var getThemeName = function(themeId) {
    if (!themeId) return t('themePrefix') + ' -';
    if (lang === 'ko' && themeNames[themeId]) return themeNames[themeId];
    return themeMap[themeId] || (t('themePrefix') + ' ' + themeId);
  };

  var handleRemoveCollection = function(e, setNum) {
    e.stopPropagation();
    removeFromCollection(setNum);
    loadData();
  };

  var handleRemoveWishlist = function(e, setNum) {
    e.stopPropagation();
    removeFromWishlist(setNum);
    loadData();
  };

  var currentList = activeTab === 'collection' ? collection : wishlist;
  var totalParts = collection.reduce(function(sum, item) { return sum + (item.num_parts || 0); }, 0);

  // Group current list by theme_id, sorted by item count desc then theme name
  var themeGroups = useMemo(function() {
    if (currentList.length === 0) return [];
    var groups = {};
    currentList.forEach(function(item) {
      var tid = item.theme_id || 0;
      if (!groups[tid]) {
        groups[tid] = { themeId: tid, themeName: getThemeName(tid), sets: [] };
      }
      groups[tid].sets.push(item);
    });
    return Object.values(groups).sort(function(a, b) {
      if (b.sets.length !== a.sets.length) return b.sets.length - a.sets.length;
      return (a.themeName || '').localeCompare(b.themeName || '');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentList, themeMap, themeNames, lang]);

  var renderCard = function(item) {
    var yearLabel = item.year + t('yearSuffix');
    var partsLabel = (item.num_parts || 0).toLocaleString() + t('partsUnit');
    return React.createElement('div', {
      key: item.set_num,
      className: 'set-card',
      onClick: function() { navigate('/set/' + item.set_num); }
    },
      React.createElement('img', {
        className: 'set-card-img',
        src: item.set_img_url || PLACEHOLDER_IMG,
        alt: item.name,
        loading: 'lazy',
        onError: function(e) { e.target.src = PLACEHOLDER_IMG; }
      }),
      React.createElement('div', { className: 'set-card-body' },
        React.createElement('div', { className: 'set-card-num' }, item.set_num),
        React.createElement('div', { className: 'set-card-name' },
          lang === 'ko' ? React.createElement(TranslatedName, { name: item.name }) : item.name
        ),
        React.createElement('div', { className: 'set-card-meta' },
          React.createElement('span', null, yearLabel),
          React.createElement('span', null, partsLabel)
        )
      ),
      React.createElement('div', { className: 'set-card-actions' },
        React.createElement('button', {
          className: 'btn-icon wishlist-active',
          onClick: function(e) {
            if (activeTab === 'collection') handleRemoveCollection(e, item.set_num);
            else handleRemoveWishlist(e, item.set_num);
          }
        }, t('remove'))
      )
    );
  };

  var groupedSection = null;
  if (currentList.length > 0) {
    groupedSection = themeGroups.map(function(group) {
      var header = React.createElement('div', { className: 'theme-header' },
        React.createElement('span', { className: 'theme-title' }, group.themeName),
        React.createElement('span', { className: 'theme-count' }, group.sets.length + t('setsCount'))
      );
      var grid = React.createElement('div', { className: 'set-grid' },
        group.sets.map(renderCard)
      );
      return React.createElement('div', { key: group.themeId, className: 'theme-section' }, header, grid);
    });
  }

  return React.createElement('div', null,
    React.createElement('div', { className: 'collection-tabs' },
      React.createElement('button', {
        className: activeTab === 'collection' ? 'active' : '',
        onClick: function() { setActiveTab('collection'); }
      }, t('collection') + ' (' + collection.length + ')'),
      React.createElement('button', {
        className: activeTab === 'wishlist' ? 'active' : '',
        onClick: function() { setActiveTab('wishlist'); }
      }, t('wishlist') + ' (' + wishlist.length + ')')
    ),
    activeTab === 'collection' && collection.length > 0 && React.createElement('div', { className: 'collection-stats' },
      React.createElement('div', { className: 'stat-item' },
        React.createElement('div', { className: 'stat-value' }, collection.length),
        React.createElement('div', { className: 'stat-label' }, t('ownedSets'))
      ),
      React.createElement('div', { className: 'stat-item' },
        React.createElement('div', { className: 'stat-value' }, totalParts.toLocaleString()),
        React.createElement('div', { className: 'stat-label' }, t('totalParts'))
      ),
      React.createElement('div', { className: 'stat-item' },
        React.createElement('div', { className: 'stat-value' },
          (collection.length > 0 ? Math.min.apply(null, collection.map(function(s) { return s.year; })) : '-') +
          '~' +
          (collection.length > 0 ? Math.max.apply(null, collection.map(function(s) { return s.year; })) : '-')
        ),
        React.createElement('div', { className: 'stat-label' }, t('yearRange'))
      )
    ),
    currentList.length === 0
      ? React.createElement(EmptyState, {
          title: activeTab === 'collection' ? t('collectionEmpty') : t('wishlistEmpty'),
          message: activeTab === 'collection' ? t('collectionEmptyDesc') : t('wishlistEmptyDesc')
        })
      : groupedSection
  );
}

export default CollectionPage;
