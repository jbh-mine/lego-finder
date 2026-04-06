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

const PLACEHOLDER_IMG = 'https://rebrickable.com/static/img/nil_mf.jpg';

function SetDetailPage() {
  const { setNum } = useParams();
  const { t } = useLanguage();
  const [set, setSet] = useState(null);
  const [parts, setParts] = useState(null);
  const [minifigs, setMinifigs] = useState(null);
  const [partsPage, setPartsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [partsLoading, setPartsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inCollection, setInCollection] = useState(false);
  const [inWish, setInWish] = useState(false);
  const [activeTab, setActiveTab] = useState('parts');

  const PARTS_PAGE_SIZE = 50;

  useEffect(() => {
    async function loadSet() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSetDetail(setNum);
        setSet(data);
        setInCollection(isInCollection(setNum));
        setInWish(isInWishlist(setNum));

        const [partsData, minifigsData] = await Promise.all([
          getSetParts(setNum, 1, PARTS_PAGE_SIZE),
          getSetMinifigs(setNum),
        ]);
        setParts(partsData);
        setMinifigs(minifigsData);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? '"' + setNum + '"' + t('setNotFound')
            : t('apiErrorGeneric')
        );
      } finally {
        setLoading(false);
      }
    }
    loadSet();
  }, [setNum, t]);

  const loadPartsPage = async (newPage) => {
    setPartsLoading(true);
    try {
      const data = await getSetParts(setNum, newPage, PARTS_PAGE_SIZE);
      setParts(data);
      setPartsPage(newPage);
    } catch (err) {
      console.error('Parts load failed:', err);
    } finally {
      setPartsLoading(false);
    }
  };

  const toggleCollection = () => {
    if (inCollection) {
      removeFromCollection(setNum);
      setInCollection(false);
    } else {
      addToCollection(set);
      setInCollection(true);
    }
  };

  const toggleWishlist = () => {
    if (inWish) {
      removeFromWishlist(setNum);
      setInWish(false);
    } else {
      addToWishlist(set);
      setInWish(true);
    }
  };

  if (loading) return <Loading message={t('setLoading')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!set) return null;

  const yearLabel = set.year + t('yearSuffix');
  const partsLabel = (set.num_parts || 0).toLocaleString() + t('partsCount');

  return (
    <div>
      <Link to="/" className="back-btn">{t('back')}</Link>

      <div className="set-detail">
        <div className="set-detail-header">
          <img
            className="set-detail-img"
            src={set.set_img_url || PLACEHOLDER_IMG}
            alt={set.name}
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
          />
          <div className="set-detail-info">
            <div className="set-num">{set.set_num}</div>
            <h1>{set.name}</h1>

            <div className="detail-meta">
              <div className="detail-meta-item">
                <span className="label">{t('releaseYear')}</span>
                <span>{yearLabel}</span>
              </div>
              <div className="detail-meta-item">
                <span className="label">{t('numParts')}</span>
                <span>{partsLabel}</span>
              </div>
              {set.theme_id && (
                <div className="detail-meta-item">
                  <span className="label">{t('themeId')}</span>
                  <span>{set.theme_id}</span>
                </div>
              )}
              {set.set_url && (
                <div className="detail-meta-item">
                  <span className="label">Rebrickable</span>
                  <a href={set.set_url} target="_blank" rel="noopener noreferrer">
                    {t('detailPage')}
                  </a>
                </div>
              )}
            </div>

            <div className="detail-actions">
              <button
                className={`btn-collection ${inCollection ? 'active' : ''}`}
                onClick={toggleCollection}
              >
                {inCollection ? t('removeCollection') : t('addCollection')}
              </button>
              <button
                className={`btn-wishlist ${inWish ? 'active' : ''}`}
                onClick={toggleWishlist}
              >
                {inWish ? t('removeWishlist') : t('addWishlist')}
              </button>
            </div>
          </div>
        </div>

        <div className="collection-tabs">
          <button
            className={activeTab === 'parts' ? 'active' : ''}
            onClick={() => setActiveTab('parts')}
          >
            {t('partsList')} ({parts?.count || 0})
          </button>
          <button
            className={activeTab === 'minifigs' ? 'active' : ''}
            onClick={() => setActiveTab('minifigs')}
          >
            {t('minifigures')} ({minifigs?.count || 0})
          </button>
        </div>

        {activeTab === 'parts' && (
          <div className="parts-section">
            {partsLoading ? (
              <Loading message={t('partsLoading')} />
            ) : parts?.results?.length > 0 ? (
              <>
                <div className="parts-grid">
                  {parts.results.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="part-card">
                      <img
                        src={item.part?.part_img_url || PLACEHOLDER_IMG}
                        alt={item.part?.name}
                        loading="lazy"
                        onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                      />
                      <div className="part-name">{item.part?.name}</div>
                      <div className="part-qty">x{item.quantity}</div>
                      {item.color?.name && (
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#999',
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}>
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: '#' + (item.color.rgb || '999'),
                            border: '1px solid #ddd',
                            display: 'inline-block',
                          }}></span>
                          {item.color.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Pagination
                  page={partsPage}
                  totalCount={parts.count}
                  pageSize={PARTS_PAGE_SIZE}
                  onPageChange={loadPartsPage}
                />
              </>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>{t('noParts')}</p>
            )}
          </div>
        )}

        {activeTab === 'minifigs' && (
          <div className="parts-section">
            {minifigs?.results?.length > 0 ? (
              <div className="parts-grid">
                {minifigs.results.map((mf, idx) => (
                  <div key={`${mf.set_num}-${idx}`} className="part-card">
                    <img
                      src={mf.set_img_url || PLACEHOLDER_IMG}
                      alt={mf.set_name}
                      loading="lazy"
                      onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                    />
                    <div className="part-name">{mf.set_name}</div>
                    <div className="part-qty">x{mf.quantity}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>{t('noMinifigs')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SetDetailPage;
