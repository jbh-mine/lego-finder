import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getSetDetail, getSetParts, getSetMinifigs } from '../utils/api';
import {
  isInCollection, addToCollection, removeFromCollection,
  isInWishlist, addToWishlist, removeFromWishlist,
} from '../utils/collection';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage } from '../components/Loading';

var PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function getInstructionsUrl(setNum) {
  var cleanNum = setNum ? setNum.replace(/-.*$/, '') : '';
  return 'https://www.lego.com/en-us/service/building-instructions/' + cleanNum;
}

function SetDetailPage() {
  var params = useParams();
  var setNum = params.setNum;
  var lang = useLanguage();
  var t = lang.t;
  var setState = useState(null);
  var set = setState[0];
  var setSet = setState[1];
  var partsState = useState(null);
  var parts = partsState[0];
  var setParts = partsState[1];
  var minifigsState = useState(null);
  var minifigs = minifigsState[0];
  var setMinifigs = minifigsState[1];
  var ppState = useState(1);
  var partsPage = ppState[0];
  var setPartsPage = ppState[1];
  var loadState = useState(true);
  var loading = loadState[0];
  var setLoading = loadState[1];
  var plState = useState(false);
  var partsLoading = plState[0];
  var setPartsLoading = plState[1];
  var errState = useState(null);
  var error = errState[0];
  var setError = errState[1];
  var collState = useState(false);
  var inCollection = collState[0];
  var setInCollection = collState[1];
  var wishState = useState(false);
  var inWish = wishState[0];
  var setInWish = wishState[1];
  var tabState = useState('parts');
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];

  var PARTS_PAGE_SIZE = 50;

  useEffect(function() {
    async function loadSet() {
      setLoading(true);
      setError(null);
      try {
        var data = await getSetDetail(setNum);
        setSet(data);
        setInCollection(isInCollection(setNum));
        setInWish(isInWishlist(setNum));
        var results = await Promise.all([
          getSetParts(setNum, 1, PARTS_PAGE_SIZE),
          getSetMinifigs(setNum),
        ]);
        setParts(results[0]);
        setMinifigs(results[1]);
      } catch (err) {
        setError(
          err.response && err.response.status === 404
            ? '"' + setNum + '"' + t('setNotFound')
            : t('apiErrorGeneric')
        );
      } finally {
        setLoading(false);
      }
    }
    loadSet();
  }, [setNum, t]);

  var loadPartsPage = async function(newPage) {
    setPartsLoading(true);
    try {
      var data = await getSetParts(setNum, newPage, PARTS_PAGE_SIZE);
      setParts(data);
      setPartsPage(newPage);
    } catch (err) {
      console.error('Parts load failed:', err);
    } finally {
      setPartsLoading(false);
    }
  };

  var toggleCollection = function() {
    if (inCollection) {
      removeFromCollection(setNum);
      setInCollection(false);
    } else {
      addToCollection(set);
      setInCollection(true);
    }
  };

  var toggleWishlist = function() {
    if (inWish) {
      removeFromWishlist(setNum);
      setInWish(false);
    } else {
      addToWishlist(set);
      setInWish(true);
    }
  };

  if (loading) return React.createElement(Loading, { message: t('setLoading') });
  if (error) return React.createElement(ErrorMessage, { message: error });
  if (!set) return null;

  var yearLabel = set.year + t('yearSuffix');
  var partsLabel = (set.num_parts || 0).toLocaleString() + t('partsCount');

  return React.createElement('div', null,
    React.createElement(Link, { to: '/', className: 'back-btn' }, t('back')),
    React.createElement('div', { className: 'set-detail' },
      React.createElement('div', { className: 'set-detail-header' },
        React.createElement('img', {
          className: 'set-detail-img',
          src: set.set_img_url || PLACEHOLDER_IMG,
          alt: set.name,
          onError: function(e) { e.target.src = PLACEHOLDER_IMG; }
        }),
        React.createElement('div', { className: 'set-detail-info' },
          React.createElement('div', { className: 'set-num' }, set.set_num),
          React.createElement('h1', null, set.name),
          React.createElement('div', { className: 'detail-meta' },
            React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, t('releaseYear')),
              React.createElement('span', null, yearLabel)
            ),
            React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, t('numParts')),
              React.createElement('span', null, partsLabel)
            ),
            set.theme_id && React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, t('themeId')),
              React.createElement('span', null, set.theme_id)
            ),
            set.set_url && React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, 'Rebrickable'),
              React.createElement('a', { href: set.set_url, target: '_blank', rel: 'noopener noreferrer' }, t('detailPage'))
            )
          ),
          React.createElement('div', { className: 'detail-actions' },
            React.createElement('button', {
              className: 'btn-collection' + (inCollection ? ' active' : ''),
              onClick: toggleCollection
            }, inCollection ? t('removeCollection') : t('addCollection')),
            React.createElement('button', {
              className: 'btn-wishlist' + (inWish ? ' active' : ''),
              onClick: toggleWishlist
            }, inWish ? t('removeWishlist') : t('addWishlist')),
            React.createElement('a', {
              className: 'btn-instructions-detail',
              href: getInstructionsUrl(setNum),
              target: '_blank',
              rel: 'noopener noreferrer',
              onClick: function(e) { e.stopPropagation(); }
            }, t('buildInstructions'))
          )
        )
      ),
      React.createElement('div', { className: 'collection-tabs' },
        React.createElement('button', {
          className: activeTab === 'parts' ? 'active' : '',
          onClick: function() { setActiveTab('parts'); }
        }, t('partsList') + ' (' + (parts && parts.count || 0) + ')'),
        React.createElement('button', {
          className: activeTab === 'minifigs' ? 'active' : '',
          onClick: function() { setActiveTab('minifigs'); }
        }, t('minifigures') + ' (' + (minifigs && minifigs.count || 0) + ')')
      ),
      activeTab === 'parts' && React.createElement('div', { className: 'parts-section' },
        partsLoading
          ? React.createElement(Loading, { message: t('partsLoading') })
          : parts && parts.results && parts.results.length > 0
            ? React.createElement(React.Fragment, null,
                React.createElement('div', { className: 'parts-grid' },
                  parts.results.map(function(item, idx) {
                    return React.createElement('div', { key: item.id + '-' + idx, className: 'part-card' },
                      React.createElement('img', {
                        src: (item.part && item.part.part_img_url) || PLACEHOLDER_IMG,
                        alt: item.part && item.part.name,
                        loading: 'lazy',
                        onError: function(e) { e.target.src = PLACEHOLDER_IMG; }
                      }),
                      React.createElement('div', { className: 'part-name' }, item.part && item.part.name),
                      React.createElement('div', { className: 'part-qty' }, 'x' + item.quantity),
                      item.color && item.color.name && React.createElement('div', {
                        style: { fontSize: '0.7rem', color: '#999', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }
                      },
                        React.createElement('span', {
                          style: { width: 10, height: 10, borderRadius: '50%', background: '#' + (item.color.rgb || '999'), border: '1px solid #ddd', display: 'inline-block' }
                        }),
                        item.color.name
                      )
                    );
                  })
                ),
                React.createElement(Pagination, {
                  page: partsPage,
                  totalCount: parts.count,
                  pageSize: PARTS_PAGE_SIZE,
                  onPageChange: loadPartsPage
                })
              )
            : React.createElement('p', { style: { color: '#999', textAlign: 'center', padding: 20 } }, t('noParts'))
      ),
      activeTab === 'minifigs' && React.createElement('div', { className: 'parts-section' },
        minifigs && minifigs.results && minifigs.results.length > 0
          ? React.createElement('div', { className: 'parts-grid' },
              minifigs.results.map(function(mf, idx) {
                return React.createElement('div', { key: mf.set_num + '-' + idx, className: 'part-card' },
                  React.createElement('img', {
                    src: mf.set_img_url || PLACEHOLDER_IMG,
                    alt: mf.set_name,
                    loading: 'lazy',
                    onError: function(e) { e.target.src = PLACEHOLDER_IMG; }
                  }),
                  React.createElement('div', { className: 'part-name' }, mf.set_name),
                  React.createElement('div', { className: 'part-qty' }, 'x' + mf.quantity)
                );
              })
            )
          : React.createElement('p', { style: { color: '#999', textAlign: 'center', padding: 20 } }, t('noMinifigs'))
      )
    )
  );
}

export default SetDetailPage;
