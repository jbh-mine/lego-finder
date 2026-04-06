import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  isInCollection, addToCollection, removeFromCollection,
  isInWishlist, addToWishlist, removeFromWishlist,
} from '../utils/collection';

var PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function getInstructionsUrl(setNum) {
  var cleanNum = setNum ? setNum.replace(/-.*$/, '') : '';
  return 'https://www.lego.com/en-us/service/building-instructions/' + cleanNum;
}

function SetCard(props) {
  var set = props.set;
  var navigate = useNavigate();
  var lang = useLanguage();
  var t = lang.t;
  var inCollState = useState(false);
  var inCollection = inCollState[0];
  var setInCollection = inCollState[1];
  var inWishState = useState(false);
  var inWishlist = inWishState[0];
  var setInWishlist = inWishState[1];

  useEffect(function() {
    setInCollection(isInCollection(set.set_num));
    setInWishlist(isInWishlist(set.set_num));
  }, [set.set_num]);

  var handleCollectionToggle = function(e) {
    e.stopPropagation();
    if (inCollection) {
      removeFromCollection(set.set_num);
      setInCollection(false);
    } else {
      addToCollection(set);
      setInCollection(true);
    }
  };

  var handleWishlistToggle = function(e) {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(set.set_num);
      setInWishlist(false);
    } else {
      addToWishlist(set);
      setInWishlist(true);
    }
  };

  var handleInstructions = function(e) {
    e.stopPropagation();
    window.open(getInstructionsUrl(set.set_num), '_blank');
  };

  var yearLabel = set.year + t('yearSuffix');
  var partsLabel = (set.num_parts || 0).toLocaleString() + t('partsUnit');

  return React.createElement('div', { className: 'set-card', onClick: function() { navigate('/set/' + set.set_num); } },
    React.createElement('img', {
      className: 'set-card-img',
      src: set.set_img_url || PLACEHOLDER_IMG,
      alt: set.name,
      loading: 'lazy',
      onError: function(e) { e.target.src = PLACEHOLDER_IMG; }
    }),
    React.createElement('div', { className: 'set-card-body' },
      React.createElement('div', { className: 'set-card-num' }, set.set_num),
      React.createElement('div', { className: 'set-card-name' }, set.name),
      React.createElement('div', { className: 'set-card-meta' },
        React.createElement('span', null, yearLabel),
        React.createElement('span', null, partsLabel)
      )
    ),
    React.createElement('div', { className: 'set-card-actions' },
      React.createElement('button', {
        className: 'btn-icon' + (inCollection ? ' active' : ''),
        onClick: handleCollectionToggle
      }, inCollection ? t('owned') : t('notOwned')),
      React.createElement('button', {
        className: 'btn-icon' + (inWishlist ? ' wishlist-active' : ''),
        onClick: handleWishlistToggle
      }, inWishlist ? t('wished') : t('notWished')),
      React.createElement('button', {
        className: 'btn-icon btn-instructions',
        onClick: handleInstructions
      }, t('buildInstructions'))
    )
  );
}

export default SetCard;
