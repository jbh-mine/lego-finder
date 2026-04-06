import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
            ? `\uC138\uD2B8 "${setNum}"\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`
            : 'API \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.'
        );
      } finally {
        setLoading(false);
      }
    }
    loadSet();
  }, [setNum]);

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

  if (loading) return <Loading message="\uC138\uD2B8 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!set) return null;

  return (
    <div>
      <Link to="/" className="back-btn">\u2190 \uB4A4\uB85C\uAC00\uAE30</Link>

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
                <span className="label">\uCD9C\uC2DC \uC5F0\uB3C4</span>
                <span>{set.year}\uB144</span>
              </div>
              <div className="detail-meta-item">
                <span className="label">\uBD80\uD488 \uC218</span>
                <span>{set.num_parts?.toLocaleString()}\uAC1C</span>
              </div>
              {set.theme_id && (
                <div className="detail-meta-item">
                  <span className="label">\uD14C\uB9C8 ID</span>
                  <span>{set.theme_id}</span>
                </div>
              )}
              {set.set_url && (
                <div className="detail-meta-item">
                  <span className="label">Rebrickable</span>
                  <a href={set.set_url} target="_blank" rel="noopener noreferrer">
                    \uC0C1\uC138 \uD398\uC774\uC9C0 \u2192
                  </a>
                </div>
              )}
            </div>

            <div className="detail-actions">
              <button
                className={`btn-collection ${inCollection ? 'active' : ''}`}
                onClick={toggleCollection}
              >
                {inCollection ? '\u2605 \uCEEC\uB809\uC158\uC5D0\uC11C \uC81C\uAC70' : '\u2606 \uB0B4 \uCEEC\uB809\uC158\uC5D0 \uCD94\uAC00'}
              </button>
              <button
                className={`btn-wishlist ${inWish ? 'active' : ''}`}
                onClick={toggleWishlist}
              >
                {inWish ? '\u2665 \uC704\uC2DC\uB9AC\uC2A4\uD2B8\uC5D0\uC11C \uC81C\uAC70' : '\u2661 \uC704\uC2DC\uB9AC\uC2A4\uD2B8\uC5D0 \uCD94\uAC00'}
              </button>
            </div>
          </div>
        </div>

        <div className="collection-tabs">
          <button
            className={activeTab === 'parts' ? 'active' : ''}
            onClick={() => setActiveTab('parts')}
          >
            \uBD80\uD488 \uBAA9\uB85D ({parts?.count || 0})
          </button>
          <button
            className={activeTab === 'minifigs' ? 'active' : ''}
            onClick={() => setActiveTab('minifigs')}
          >
            \uBBF8\uB2C8\uD53C\uADDC\uC5B4 ({minifigs?.count || 0})
          </button>
        </div>

        {activeTab === 'parts' && (
          <div className="parts-section">
            {partsLoading ? (
              <Loading message="\uBD80\uD488 \uB85C\uB529 \uC911..." />
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
                            background: `#${item.color.rgb}`,
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
              <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>\uBD80\uD488 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</p>
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
              <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>\uBBF8\uB2C8\uD53C\uADDC\uC5B4 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SetDetailPage;
