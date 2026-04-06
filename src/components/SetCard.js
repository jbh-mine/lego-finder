import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  isInCollection, addToCollection, removeFromCollection,
  isInWishlist, addToWishlist, removeFromWishlist,
} from '../utils/collection';

const PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function SetCard({ set }) {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [inCollection, setInCollection] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    setInCollection(isInCollection(set.set_num));
    setInWishlist(isInWishlist(set.set_num));
  }, [set.set_num]);

  const handleCollectionToggle = (e) => {
    e.stopPropagation();
    if (inCollection) {
      removeFromCollection(set.set_num);
      setInCollection(false);
    } else {
      addToCollection(set);
      setInCollection(true);
    }
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(set.set_num);
      setInWishlist(false);
    } else {
      addToWishlist(set);
      setInWishlist(true);
    }
  };

  const yearLabel = lang === 'ko' ? `${set.year}년` : set.year;
  const partsLabel = lang === 'ko' ? `${set.num_parts?.toLocaleString()}개 부품` : `${set.num_parts?.toLocaleString()} parts`;

  return (
    <div className="set-card" onClick={() => navigate(`/set/${set.set_num}`)}>
      <img
        className="set-card-img"
        src={set.set_img_url || PLACEHOLDER_IMG}
        alt={set.name}
        loading="lazy"
        onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
      />
      <div className="set-card-body">
        <div className="set-card-num">{set.set_num}</div>
        <div className="set-card-name">{set.name}</div>
        <div className="set-card-meta">
          <span>{yearLabel}</span>
          <span>{partsLabel}</span>
        </div>
      </div>
      <div className="set-card-actions">
        <button
          className={`btn-icon ${inCollection ? 'active' : ''}`}
          onClick={handleCollectionToggle}
        >
          {inCollection ? t('owned') : t('notOwned')}
        </button>
        <button
          className={`btn-icon ${inWishlist ? 'wishlist-active' : ''}`}
          onClick={handleWishlistToggle}
        >
          {inWishlist ? t('wished') : t('notWished')}
        </button>
      </div>
    </div>
  );
}

export default SetCard;
