import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import useTranslatedName from '../hooks/useTranslatedName';
import useInstructions from '../hooks/useInstructions';
import useLegoPrice from '../hooks/useLegoPrice';
import { getLegoPageUrl } from '../utils/instructions';
import { getLegoKrProductUrl } from '../utils/price';
import { getSetDetail, getSetParts, getSetMinifigs } from '../utils/api';
import { isInCollection, addToCollection, removeFromCollection, isInWishlist, addToWishlist, removeFromWishlist } from '../utils/collection';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage } from '../components/Loading';
import TranslatedName from '../components/TranslatedName';
import bdpImagesData from '../data/bdpImages.json';
import legoImagesData from '../data/legoImages.json';
import '../styles/price.css';

var PH = 'https://rebrickable.com/static/img/nil_mf.jpg';

function SetDetailPage() {
  var p = useParams(); var setNum = p.setNum;
  var lc = useLanguage(); var t = lc.t; var lang = lc.lang;
  var navigate = useNavigate();
  var s1 = useState(null); var set = s1[0]; var setSet = s1[1];
  var s2 = useState(null); var parts = s2[0]; var setParts = s2[1];
  var s3 = useState(null); var minifigs = s3[0]; var setMinifigs = s3[1];
  var s4 = useState(1); var pp = s4[0]; var setPP = s4[1];
  var s5 = useState(true); var loading = s5[0]; var setLoading = s5[1];
  var s6 = useState(false); var pLoading = s6[0]; var setPLoading = s6[1];
  var s7 = useState(null); var error = s7[0]; var setError = s7[1];
  var s8 = useState(false); var inC = s8[0]; var setInC = s8[1];
  var s9 = useState(false); var inW = s9[0]; var setInW = s9[1];
  var s10 = useState('parts'); var tab = s10[0]; var setTab = s10[1];
  var s15 = useState(false); var imagePopupOpen = s15[0]; var setImagePopupOpen = s15[1];

  // Image gallery states
  var s16 = useState([]); var allImages = s16[0]; var setAllImages = s16[1];
  var s17 = useState(0); var imgIdx = s17[0]; var setImgIdx = s17[1];

  var translated = useTranslatedName(set ? set.name : null);
  var insData = useInstructions(setNum);
  var instructions = insData.instructions;
  var insLoading = insData.loading;
  var legoProductNumber = insData.legoProductNumber;
  var fileSizes = insData.fileSizes;
  var priceData = useLegoPrice(setNum);
  var PPS = 50;

  var rebrickableNum = setNum ? setNum.replace(/-.*$/, '') : '';

  // Touch swipe refs
  var touchStartXRef = useRef(0);
  var touchDeltaXRef = useRef(0);
  var allImagesRef = useRef([]);

  // Keep images ref in sync
  useEffect(function() { allImagesRef.current = allImages; }, [allImages]);

  // Load set data
  useEffect(function() {
    (async function() {
      setLoading(true); setError(null);
      try {
        var d = await getSetDetail(setNum);
        setSet(d); setInC(isInCollection(setNum)); setInW(isInWishlist(setNum));
        var r = await Promise.all([getSetParts(setNum, 1, PPS), getSetMinifigs(setNum)]);
        setParts(r[0]); setMinifigs(r[1]);
      } catch(e) {
        setError(e.response && e.response.status === 404 ? '"' + setNum + '"' + t('setNotFound') : t('apiErrorGeneric'));
      } finally { setLoading(false); }
    })();
  }, [setNum, t]);

  // Load images from Rebrickable (match Rebrickable set page exactly)
  // For BDP sets, use pre-fetched gallery image IDs from bdpImages.json
  // For regular sets, fallback to legoImages.json (also pre-fetched via scripts/fetch-images.js)
  useEffect(function() {
    if (!set) return;
    var images = [];
    var bdpIds = bdpImagesData.sets && bdpImagesData.sets[set.set_num];
    var legoIds = legoImagesData.sets && legoImagesData.sets[set.set_num];
    if (bdpIds && bdpIds.length > 0) {
      // Build gallery URLs from Rebrickable CDN using pre-fetched IDs (BDP sets)
      images = bdpIds.map(function(id) {
        return 'https://cdn.rebrickable.com/media/thumbs/sets/' + set.set_num + '/' + id + '.jpg/1000x800p.jpg';
      });
    } else if (legoIds && legoIds.length > 0) {
      // Regular (non-BDP) sets: use pre-fetched Rebrickable gallery IDs
      images = legoIds.map(function(id) {
        return 'https://cdn.rebrickable.com/media/thumbs/sets/' + set.set_num + '/' + id + '.jpg/1000x800p.jpg';
      });
      // If the primary set_img_url isn't represented, prepend it as the first image
      if (set.set_img_url && images.indexOf(set.set_img_url) === -1) {
        var primaryIdMatch = set.set_img_url.match(/\/sets\/[^/]+\/(\d+)\.jpg\//);
        var primaryId = primaryIdMatch ? primaryIdMatch[1] : null;
        if (!primaryId || legoIds.indexOf(primaryId) === -1) {
          images.unshift(set.set_img_url);
        }
      }
    } else if (set.set_img_url) {
      images.push(set.set_img_url);
    }
    setAllImages(images);
    setImgIdx(0);
  }, [set]);

  var loadPP = async function(pg) {
    setPLoading(true);
    try { var d = await getSetParts(setNum, pg, PPS); setParts(d); setPP(pg); }
    catch(e) {} finally { setPLoading(false); }
  };
  var togC = function() { if (inC) { removeFromCollection(setNum); setInC(false); } else { addToCollection(set); setInC(true); } };
  var togW = function() { if (inW) { removeFromWishlist(setNum); setInW(false); } else { addToWishlist(set); setInW(true); } };

  var handleBack = function() { navigate(-1); };

  var openImagePopup = function() { setImagePopupOpen(true); };
  var closeImagePopup = function() { setImagePopupOpen(false); };

  // Navigation functions
  var goNext = function() {
    setImgIdx(function(prev) {
      return prev < allImagesRef.current.length - 1 ? prev + 1 : prev;
    });
  };
  var goPrev = function() {
    setImgIdx(function(prev) {
      return prev > 0 ? prev - 1 : prev;
    });
  };

  // Touch handlers
  var handleTouchStart = function(e) {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };
  var handleTouchMove = function(e) {
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };
  var handleTouchEnd = function() {
    if (Math.abs(touchDeltaXRef.current) > 50) {
      if (touchDeltaXRef.current < 0) goNext();
      else goPrev();
    }
  };

  // Close popup on Escape, arrow keys for navigation
  useEffect(function() {
    if (!imagePopupOpen) return;
    var handleKeyDown = function(e) {
      if (e.key === 'Escape') closeImagePopup();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return function() {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [imagePopupOpen]);

  if (loading) return React.createElement(Loading, { message: t('setLoading') });
  if (error) return React.createElement(ErrorMessage, { message: error });
  if (!set) return null;

  var imgSrc = allImages.length > 0 ? allImages[imgIdx] || PH : (set.set_img_url || PH);
  var showNav = allImages.length > 1;

  // Build image gallery element
  var galleryChildren = [];

  // Main image
  galleryChildren.push(React.createElement('img', {
    key: 'img',
    className: 'gallery-main-img',
    src: imgSrc,
    alt: set.name,
    onError: function(e) { e.target.src = PH; },
    onClick: openImagePopup,
    draggable: false,
  }));

  // Left arrow
  if (showNav && imgIdx > 0) {
    galleryChildren.push(React.createElement('button', {
      key: 'left',
      className: 'gallery-arrow gallery-arrow-left',
      onClick: function(e) { e.stopPropagation(); goPrev(); },
      'aria-label': 'Previous image',
    }, '\u2039'));
  }

  // Right arrow
  if (showNav && imgIdx < allImages.length - 1) {
    galleryChildren.push(React.createElement('button', {
      key: 'right',
      className: 'gallery-arrow gallery-arrow-right',
      onClick: function(e) { e.stopPropagation(); goNext(); },
      'aria-label': 'Next image',
    }, '\u203A'));
  }

  // Counter badge
  if (showNav) {
    galleryChildren.push(React.createElement('span', {
      key: 'counter',
      className: 'gallery-counter',
    }, (imgIdx + 1) + ' / ' + allImages.length));
  }

  var mainGalleryEl = React.createElement('div', {
    className: 'image-gallery',
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }, galleryChildren);

  // Thumbnail strip
  var thumbsEl = null;
  if (showNav) {
    var thumbButtons = allImages.map(function(url, i) {
      // Use smaller Rebrickable variant for thumbnails if applicable
      var thumbUrl = url.indexOf('/1000x800p.jpg') !== -1
        ? url.replace('/1000x800p.jpg', '/230x180p.jpg')
        : url;
      return React.createElement('button', {
        key: i,
        className: 'gallery-thumb' + (i === imgIdx ? ' active' : ''),
        onClick: function(e) { e.stopPropagation(); setImgIdx(i); },
        'aria-label': 'Image ' + (i + 1),
      },
        React.createElement('img', {
          src: thumbUrl,
          alt: '',
          loading: 'lazy',
          onError: function(e) { e.target.src = PH; },
          draggable: false,
        })
      );
    });
    thumbsEl = React.createElement('div', { className: 'gallery-thumbs' }, thumbButtons);
  }

  var galleryEl = React.createElement('div', { className: 'image-gallery-wrapper' },
    mainGalleryEl,
    thumbsEl
  );

  // Build instruction cards section
  var insSection;
  if (insLoading) {
    insSection = React.createElement('div', { className: 'ins-section' },
      React.createElement('span', { className: 'ins-loading-text' }, t('instructionLoading'))
    );
  } else if (instructions.length > 0) {
    var insCards = instructions.map(function(ins, idx) {
      var label;
      var fileName;
      if (instructions.length === 1) {
        label = t('buildInstructions');
        fileName = legoProductNumber ? legoProductNumber + '.pdf' : 'instructions.pdf';
      } else {
        label = t('buildInstructions') + ' ' + ins.sequence + '/' + ins.total;
        fileName = (legoProductNumber || 'ins') + '_' + ins.sequence + '.pdf';
      }

      var sizeText = fileSizes[idx] || '';

      var thumbnail = React.createElement('div', { className: 'ins-card-thumb' },
        React.createElement('div', { className: 'ins-card-thumb-inner' },
          React.createElement('span', { className: 'ins-card-thumb-icon' }, 'PDF'),
          instructions.length > 1 ? React.createElement('span', { className: 'ins-card-thumb-seq' }, ins.sequence + '/' + ins.total) : null
        )
      );

      var info = React.createElement('div', { className: 'ins-card-info' },
        React.createElement('div', { className: 'ins-card-name' }, label),
        React.createElement('div', { className: 'ins-card-file' }, fileName),
        sizeText ? React.createElement('div', { className: 'ins-card-size' }, sizeText) : React.createElement('div', { className: 'ins-card-size ins-card-size-loading' }, '...')
      );

      var dlBtn = React.createElement('a', {
        className: 'ins-card-dl',
        href: ins.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        title: t('download'),
      },
        React.createElement('span', { className: 'ins-card-dl-icon' }, '\u2B07'),
        React.createElement('span', { className: 'ins-card-dl-text' }, t('download'))
      );

      return React.createElement('div', { key: idx, className: 'ins-card' },
        thumbnail,
        info,
        dlBtn
      );
    });

    insSection = React.createElement('div', { className: 'ins-cards-container' }, insCards);
  } else {
    insSection = null;
  }

  var legoKrUrl = getLegoPageUrl(setNum, legoProductNumber);

  // Image zoom popup with swipe
  var imagePopup = null;
  if (imagePopupOpen) {
    var popupChildren = [];

    // Close button
    popupChildren.push(React.createElement('button', {
      key: 'close',
      className: 'image-popup-close',
      onClick: closeImagePopup,
    }, '\u00D7'));

    // Image area with swipe
    var popupContentChildren = [];

    // Left arrow in popup
    if (showNav && imgIdx > 0) {
      popupContentChildren.push(React.createElement('button', {
        key: 'pleft',
        className: 'popup-gallery-arrow popup-gallery-arrow-left',
        onClick: goPrev,
      }, '\u2039'));
    }

    popupContentChildren.push(React.createElement('img', {
      key: 'pimg',
      className: 'image-popup-img',
      src: imgSrc,
      alt: set.name,
      onError: function(e) { e.target.src = PH; },
      draggable: false,
    }));

    // Right arrow in popup
    if (showNav && imgIdx < allImages.length - 1) {
      popupContentChildren.push(React.createElement('button', {
        key: 'pright',
        className: 'popup-gallery-arrow popup-gallery-arrow-right',
        onClick: goNext,
      }, '\u203A'));
    }

    popupChildren.push(React.createElement('div', {
      key: 'pcontent',
      className: 'image-popup-content',
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }, popupContentChildren));

    // Popup dots
    if (showNav) {
      popupChildren.push(React.createElement('div', { key: 'pdots', className: 'popup-gallery-dots' },
        allImages.map(function(_, i) {
          return React.createElement('button', {
            key: i,
            className: 'popup-gallery-dot' + (i === imgIdx ? ' active' : ''),
            onClick: function() { setImgIdx(i); },
          });
        })
      ));
    }

    // Caption
    var captionText = set.set_num + ' - ' + (translated || set.name);
    if (showNav) captionText += ' (' + (imgIdx + 1) + '/' + allImages.length + ')';
    popupChildren.push(React.createElement('div', {
      key: 'pcaption',
      className: 'image-popup-caption',
    }, captionText));

    imagePopup = React.createElement('div', {
      className: 'image-popup-overlay',
      onClick: closeImagePopup,
    },
      React.createElement('div', {
        className: 'image-popup-container',
        onClick: function(e) { e.stopPropagation(); },
      }, popupChildren)
    );
  }

  return React.createElement('div', null,
    React.createElement('button', { className: 'back-btn', onClick: handleBack }, t('back')),
    React.createElement('div', { className: 'set-detail' },
      React.createElement('div', { className: 'set-detail-header' },
        galleryEl,
        React.createElement('div', { className: 'set-detail-info' },
          React.createElement('div', { className: 'set-num' }, set.set_num),
          React.createElement('h1', null, translated || set.name),
          translated && React.createElement('div', { className: 'set-name-original' }, set.name),
          React.createElement('div', { className: 'detail-meta' },
            React.createElement('div', { className: 'detail-meta-item detail-price-row' },
              React.createElement('span', { className: 'label' }, t('legoKorea') + ' ' + (lang === 'ko' ? '\uAC00\uACA9' : 'Price')),
              priceData.formatted ? React.createElement('span', { className: 'detail-price' }, priceData.formatted)
                : priceData.isDiscontinued ? React.createElement('span', { className: 'detail-price discontinued' }, lang === 'ko' ? '\uB2E8\uC885 \uC81C\uD488' : 'Retired')
                : React.createElement('a', { href: getLegoKrProductUrl(setNum), target: '_blank', rel: 'noopener noreferrer', className: 'detail-price-link' }, lang === 'ko' ? '\uAC00\uACA9 \uD655\uC778' : 'Check Price')
            ),
            React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, t('releaseYear')), React.createElement('span', null, set.year + t('yearSuffix'))),
            React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, t('numParts')), React.createElement('span', null, (set.num_parts || 0).toLocaleString() + t('partsCount'))),
            set.theme_id && React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, t('themeId')), React.createElement('span', null, set.theme_id)),
            set.set_url && React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, 'Rebrickable'),
              React.createElement('a', { href: set.set_url, target: '_blank', rel: 'noopener noreferrer' },
                t('detailPage') + ' (' + rebrickableNum + ')'
              )
            ),
            React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, t('legoKorea')),
              React.createElement('a', { href: legoKrUrl, target: '_blank', rel: 'noopener noreferrer' },
                t('detailPage') + (legoProductNumber ? ' (' + legoProductNumber + ')' : '')
              )
            )
          ),
          React.createElement('div', { className: 'detail-actions' },
            React.createElement('button', { className: 'btn-collection' + (inC ? ' active' : ''), onClick: togC }, inC ? t('removeCollection') : t('addCollection')),
            React.createElement('button', { className: 'btn-wishlist' + (inW ? ' active' : ''), onClick: togW }, inW ? t('removeWishlist') : t('addWishlist'))
          ),
          insSection && React.createElement('div', { className: 'ins-title' }, t('buildInstructions')),
          insSection
        )
      ),
      React.createElement('div', { className: 'collection-tabs' },
        React.createElement('button', { className: tab === 'parts' ? 'active' : '', onClick: function() { setTab('parts'); } }, t('partsList') + ' (' + (parts && parts.count || 0) + ')'),
        React.createElement('button', { className: tab === 'minifigs' ? 'active' : '', onClick: function() { setTab('minifigs'); } }, t('minifigures') + ' (' + (minifigs && minifigs.count || 0) + ')')
      ),
      tab === 'parts' && React.createElement('div', { className: 'parts-section' },
        pLoading ? React.createElement(Loading, { message: t('partsLoading') })
        : parts && parts.results && parts.results.length > 0
          ? React.createElement(React.Fragment, null,
              React.createElement('div', { className: 'parts-grid' },
                parts.results.map(function(item, i) {
                  return React.createElement('div', { key: item.id + '-' + i, className: 'part-card' },
                    React.createElement('img', { src: (item.part && item.part.part_img_url) || PH, alt: item.part && item.part.name, loading: 'lazy', onError: function(e) { e.target.src = PH; } }),
                    React.createElement('div', { className: 'part-name' },
                      lang === 'ko'
                        ? React.createElement(TranslatedName, { name: item.part && item.part.name })
                        : (item.part && item.part.name)
                    ),
                    React.createElement('div', { className: 'part-qty' }, 'x' + item.quantity),
                    item.color && item.color.name && React.createElement('div', { style: { fontSize: '0.7rem', color: '#999', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 } },
                      React.createElement('span', { style: { width: 10, height: 10, borderRadius: '50%', background: '#' + (item.color.rgb || '999'), border: '1px solid #ddd', display: 'inline-block' } }),
                      item.color.name
                    )
                  );
                })
              ),
              React.createElement(Pagination, { page: pp, totalCount: parts.count, pageSize: PPS, onPageChange: loadPP })
            )
          : React.createElement('p', { style: { color: '#999', textAlign: 'center', padding: 20 } }, t('noParts'))
      ),
      tab === 'minifigs' && React.createElement('div', { className: 'parts-section' },
        minifigs && minifigs.results && minifigs.results.length > 0
          ? React.createElement('div', { className: 'parts-grid' },
              minifigs.results.map(function(mf, i) {
                return React.createElement('div', { key: mf.set_num + '-' + i, className: 'part-card' },
                  React.createElement('img', { src: mf.set_img_url || PH, alt: mf.set_name, loading: 'lazy', onError: function(e) { e.target.src = PH; } }),
                  React.createElement('div', { className: 'part-name' },
                    lang === 'ko'
                      ? React.createElement(TranslatedName, { name: mf.set_name })
                      : mf.set_name
                  ),
                  React.createElement('div', { className: 'part-qty' }, 'x' + mf.quantity)
                );
              })
            )
          : React.createElement('p', { style: { color: '#999', textAlign: 'center', padding: 20 } }, t('noMinifigs'))
      )
    ),
    imagePopup
  );
}

export default SetDetailPage;
