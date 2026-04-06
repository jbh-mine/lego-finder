import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isInCollection, addToCollection, removeFromCollection,
  isInWishlist, addToWishlist, removeFromWishlist,
} from '../utils/collection';

const PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function SetCard({ set }) {
  const navigate = useNavigate();
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
          <span>{set.year}년</span>
          <span>{set.num_parts?.toLocaleString()}개 부품</span>
        </div>
      </div>
      <div className="set-card-actions">
        <button
          className={`btn-icon ${inCollection ? 'active' : ''}`}
          onClick={handleCollectionToggle}
          title={inCollection ? '컬렉션에서 제거' : '컬렉션에 추가'}
        >
          {inCollection ? '★ 보유' : '☆ 보유'}
        </button>
        <button
          className={`btn-icon ${inWishlist ? 'wishlist-active' : ''}`}
          onClick={handleWishlistToggle}
          title={inWishlist ? '위시리스트에서 제거' : '위시리스트에 추가'}
        >
          {inWishlist ? '♥ 위시' : '♡ 위시'}
        </button>
      </div>
    </div>
  );
}

export default SetCard;
