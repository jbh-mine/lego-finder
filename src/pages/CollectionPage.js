import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCollection, removeFromCollection,
  getWishlist, removeFromWishlist,
} from '../utils/collection';
import { EmptyState } from '../components/Loading';

const PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function CollectionPage() {
  const [activeTab, setActiveTab] = useState('collection');
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  const loadData = useCallback(() => {
    setCollection(getCollection());
    setWishlist(getWishlist());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveCollection = (e, setNum) => {
    e.stopPropagation();
    removeFromCollection(setNum);
    loadData();
  };

  const handleRemoveWishlist = (e, setNum) => {
    e.stopPropagation();
    removeFromWishlist(setNum);
    loadData();
  };

  const currentList = activeTab === 'collection' ? collection : wishlist;
  const totalParts = collection.reduce((sum, item) => sum + (item.num_parts || 0), 0);

  return (
    <div>
      <div className="collection-tabs">
        <button
          className={activeTab === 'collection' ? 'active' : ''}
          onClick={() => setActiveTab('collection')}
        >
          \uB0B4 \uCEEC\uB809\uC158 ({collection.length})
        </button>
        <button
          className={activeTab === 'wishlist' ? 'active' : ''}
          onClick={() => setActiveTab('wishlist')}
        >
          \uC704\uC2DC\uB9AC\uC2A4\uD2B8 ({wishlist.length})
        </button>
      </div>

      {activeTab === 'collection' && collection.length > 0 && (
        <div className="collection-stats">
          <div className="stat-item">
            <div className="stat-value">{collection.length}</div>
            <div className="stat-label">\uBCF4\uC720 \uC138\uD2B8</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{totalParts.toLocaleString()}</div>
            <div className="stat-label">\uCD1D \uBD80\uD488 \uC218</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {collection.length > 0
                ? Math.min(...collection.map((s) => s.year))
                : '-'}
              ~
              {collection.length > 0
                ? Math.max(...collection.map((s) => s.year))
                : '-'}
            </div>
            <div className="stat-label">\uC5F0\uB3C4 \uBC94\uC704</div>
          </div>
        </div>
      )}

      {currentList.length === 0 ? (
        <EmptyState
          title={activeTab === 'collection' ? '\uCEEC\uB809\uC158\uC774 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4' : '\uC704\uC2DC\uB9AC\uC2A4\uD2B8\uAC00 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4'}
          message={
            activeTab === 'collection'
              ? '\uAC80\uC0C9 \uACB0\uACFC\uC5D0\uC11C \u2606 \uBCF4\uC720 \uBC84\uD2BC\uC744 \uB20C\uB7EC \uB0B4 \uCEEC\uB809\uC158\uC5D0 \uCD94\uAC00\uD574\uBCF4\uC138\uC694.'
              : '\uAC80\uC0C9 \uACB0\uACFC\uC5D0\uC11C \u2661 \uC704\uC2DC \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC704\uC2DC\uB9AC\uC2A4\uD2B8\uC5D0 \uCD94\uAC00\uD574\uBCF4\uC138\uC694.'
          }
        />
      ) : (
        <div className="set-grid">
          {currentList.map((item) => (
            <div
              key={item.set_num}
              className="set-card"
              onClick={() => navigate(`/set/${item.set_num}`)}
            >
              <img
                className="set-card-img"
                src={item.set_img_url || PLACEHOLDER_IMG}
                alt={item.name}
                loading="lazy"
                onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
              />
              <div className="set-card-body">
                <div className="set-card-num">{item.set_num}</div>
                <div className="set-card-name">{item.name}</div>
                <div className="set-card-meta">
                  <span>{item.year}\uB144</span>
                  <span>{item.num_parts?.toLocaleString()}\uAC1C \uBD80\uD488</span>
                </div>
              </div>
              <div className="set-card-actions">
                <button
                  className="btn-icon wishlist-active"
                  onClick={(e) =>
                    activeTab === 'collection'
                      ? handleRemoveCollection(e, item.set_num)
                      : handleRemoveWishlist(e, item.set_num)
                  }
                >
                  \uC81C\uAC70
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollectionPage;
