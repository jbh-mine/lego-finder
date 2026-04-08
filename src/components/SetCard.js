import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import useTranslatedName from '../hooks/useTranslatedName';
import useInstructions from '../hooks/useInstructions';
import useLegoPrice from '../hooks/useLegoPrice';
import {
  isInCollection, addToCollection, removeFromCollection,
  isInWishlist, addToWishlist, removeFromWishlist,
} from '../utils/collection';
import '../styles/price.css';

var PH = 'https://rebrickable.com/static/img/nil_mf.jpg';

function SetCard(props) {
  var set = props.set;
  var nav = useNavigate();
  var lc = useLanguage();
  var t = lc.t;
  var lang = lc.lang;
  var translated = useTranslatedName(set.name);
  var insData = useInstructions(set.set_num);
  var instructions = insData.instructions;
  var priceData = useLegoPrice(set.set_num);
  var cs = useState(false); var inC = cs[0]; var setC = cs[1];
  var ws = useState(false); var inW = ws[0]; var setW = ws[1];

  useEffect(function() {
    setC(isInCollection(set.set_num));
    setW(isInWishlist(set.set_num));
  }, [set.set_num]);

  var togC = function(e) {
    e.stopPropagation();
    if (inC) { removeFromCollection(set.set_num); setC(false); }
    else { addToCollection(set); setC(true); }
  };
  var togW = function(e) {
    e.stopPropagation();
    if (inW) { removeFromWishlist(set.set_num); setW(false); }
    else { addToWishlist(set); setW(true); }
  };

  var insButtons = [];
  if (instructions.length > 0) {
    if (instructions.length === 1) {
      insButtons.push(
        React.createElement('a', {
          key: 'ins-0',
          className: 'btn-icon btn-instructions',
          href: instructions[0].url,
          target: '_blank',
          rel: 'noopener noreferrer',
          onClick: function(e) { e.stopPropagation(); },
        }, t('buildInstructions') + ' PDF')
      );
    } else {
      instructions.forEach(function(ins, idx) {
        insButtons.push(
          React.createElement('a', {
            key: 'ins-' + idx,
            className: 'btn-icon btn-instructions btn-ins-booklet',
            href: ins.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            onClick: function(e) { e.stopPropagation(); },
          }, t('buildInstructions') + ' ' + ins.sequence + '/' + ins.total)
        );
      });
    }
  }

  var fxBadgeText = lang === 'ko' ? '당시 환율 적용' : 'historical FX';
  var fxBadgeTitle = priceData.priceFromUsd && priceData.fromUsd
    ? '$' + priceData.fromUsd.toFixed(2) + ' USD' + (priceData.year ? ' (' + priceData.year + ')' : '')
    : '';

  var priceNode = null;
  if (priceData.formatted) {
    var children = [priceData.formatted];
    if (priceData.priceFromUsd) {
      children.push(
        React.createElement('span', {
          key: 'fx-badge',
          className: 'price-fx-badge',
          title: fxBadgeTitle,
        }, fxBadgeText)
      );
    }
    priceNode = React.createElement('div', { className: 'set-card-price' }, children);
  } else if (priceData.isDiscontinued) {
    priceNode = React.createElement('div', { className: 'set-card-price discontinued' }, t('retired'));
  }

  return React.createElement('div', { className: 'set-card', onClick: function() { nav('/set/' + set.set_num); } },
    React.createElement('img', { className: 'set-card-img', src: set.set_img_url || PH, alt: set.name, loading: 'lazy', onError: function(e) { e.target.src = PH; } }),
    React.createElement('div', { className: 'set-card-body' },
      React.createElement('div', { className: 'set-card-num' }, set.set_num),
      React.createElement('div', { className: 'set-card-name' }, translated || set.name),
      translated && React.createElement('div', { className: 'set-card-name-en' }, set.name),
      React.createElement('div', { className: 'set-card-meta' },
        React.createElement('span', null, set.year + t('yearSuffix')),
        React.createElement('span', null, (set.num_parts || 0).toLocaleString() + t('partsUnit'))
      ),
      priceNode
    ),
    React.createElement('div', { className: 'set-card-actions' },
      React.createElement('button', { className: 'btn-icon' + (inC ? ' active' : ''), onClick: togC }, inC ? t('owned') : t('notOwned')),
      React.createElement('button', { className: 'btn-icon' + (inW ? ' wishlist-active' : ''), onClick: togW }, inW ? t('wished') : t('notWished')),
      insButtons
    )
  );
}

export default SetCard;
