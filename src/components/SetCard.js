import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import useTranslatedName from '../hooks/useTranslatedName';
import useInstructions from '../hooks/useInstructions';
import {
  isInCollection, addToCollection, removeFromCollection,
  isInWishlist, addToWishlist, removeFromWishlist,
} from '../utils/collection';

var PH = 'https://rebrickable.com/static/img/nil_mf.jpg';

function SetCard(props) {
  var set = props.set;
  var nav = useNavigate();
  var lc = useLanguage();
  var t = lc.t;
  var translated = useTranslatedName(set.name);
  var insData = useInstructions(set.set_num);
  var instructions = insData.instructions;
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

  return React.createElement('div', { className: 'set-card', onClick: function() { nav('/set/' + set.set_num); } },
    React.createElement('img', { className: 'set-card-img', src: set.set_img_url || PH, alt: set.name, loading: 'lazy', onError: function(e) { e.target.src = PH; } }),
    React.createElement('div', { className: 'set-card-body' },
      React.createElement('div', { className: 'set-card-num' }, set.set_num),
      React.createElement('div', { className: 'set-card-name' }, translated || set.name),
      translated && React.createElement('div', { className: 'set-card-name-en' }, set.name),
      React.createElement('div', { className: 'set-card-meta' },
        React.createElement('span', null, set.year + t('yearSuffix')),
        React.createElement('span', null, (set.num_parts || 0).toLocaleString() + t('partsUnit'))
      )
    ),
    React.createElement('div', { className: 'set-card-actions' },
      React.createElement('button', { className: 'btn-icon' + (inC ? ' active' : ''), onClick: togC }, inC ? t('owned') : t('notOwned')),
      React.createElement('button', { className: 'btn-icon' + (inW ? ' wishlist-active' : ''), onClick: togW }, inW ? t('wished') : t('notWished')),
      insButtons
    )
  );
}

export default SetCard;
