import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getCollection, removeFromCollection,
  getWishlist, removeFromWishlist,
} from '../utils/collection';
import { EmptyState } from '../components/Loading';

const PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function CollectionPage() {
  const { t } = useLanguage();
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
          {t('collection')} ({collection.length})
        </button>
        <button
          className={activeTab === 'wishlist' ? 'active' : ''}
          onClick={() => setActiveTab('wishlist')}
        >
          {t('wishlist')} ({wishlist.length})
        </button>
      </div>

      {activeTab === 'collection' && collection.length > 0 && (
        <div className="collection-stats">
          <div className="stat-item">
            <div className="stat-value">{collection.length}</div>
            <div className="stat-label">{t('ownedSets')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{totalParts.toLocaleString()}</div>
            <div className="stat-label">{t('totalParts')}</div>
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
            <div className="stat-label">{t('yearRange')}</div>
          </div>
        </div>
      )}

      {currentList.length === 0 ? (
        <EmptyState
          title={activeTab === 'collection' ? t('collectionEmpty') : t('wishlistEmpty')}
          message={activeTab === 'collection' ? t('collectionEmptyDesc') : t('wishlistEmptyDesc')}
        />
      ) : (
        <div className="set-grid">
          {currentList.map((item) => {
            const yearLabel = item.year + t('yearSuffix');
            const partsLabel = (item.num_parts || 0).toLocaleString() + t('partsUnit');
            return (
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
                    <span>{yearLabel}</span>
                    <span>{partsLabel}</span>
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
                    {t('remove')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CollectionPage;
