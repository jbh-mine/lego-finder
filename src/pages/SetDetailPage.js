import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import useTranslatedName from '../hooks/useTranslatedName';
import useInstructions from '../hooks/useInstructions';
import { getLegoPageUrl } from '../utils/instructions';
import { getSetDetail, getSetParts, getSetMinifigs } from '../utils/api';
import { isInCollection, addToCollection, removeFromCollection, isInWishlist, addToWishlist, removeFromWishlist } from '../utils/collection';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage } from '../components/Loading';

var PH = 'https://rebrickable.com/static/img/nil_mf.jpg';

function SetDetailPage() {
  var p = useParams(); var setNum = p.setNum;
  var lc = useLanguage(); var t = lc.t;
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
  var translated = useTranslatedName(set ? set.name : null);
  var insData = useInstructions(setNum);
  var instructions = insData.instructions;
  var insLoading = insData.loading;
  var PPS = 50;

  useEffect(function() {
    (async function() {
      setLoading(true); setError(null);
      try {
        var d = await getSetDetail(setNum);
        setSet(d); setInC(isInCollection(setNum)); setInW(isInWishlist(setNum));
        var r = await Promise.all([getSetParts(setNum, 1, PPS), getSetMinifigs(setNum)]);
        setParts(r[0]); setMinifigs(r[1]);
      } catch(e) {
        setError(e.response && e.response.status === 404 ? '\"' + setNum + '\"' + t('setNotFound') : t('apiErrorGeneric'));
      } finally { setLoading(false); }
    })();
  }, [setNum, t]);

  var loadPP = async function(pg) {
    setPLoading(true);
    try { var d = await getSetParts(setNum, pg, PPS); setParts(d); setPP(pg); }
    catch(e) {} finally { setPLoading(false); }
  };
  var togC = function() { if (inC) { removeFromCollection(setNum); setInC(false); } else { addToCollection(set); setInC(true); } };
  var togW = function() { if (inW) { removeFromWishlist(setNum); setInW(false); } else { addToWishlist(set); setInW(true); } };

  if (loading) return React.createElement(Loading, { message: t('setLoading') });
  if (error) return React.createElement(ErrorMessage, { message: error });
  if (!set) return null;

  // Build instruction links section
  var insSection;
  if (insLoading) {
    insSection = React.createElement('div', { className: 'ins-section' },
      React.createElement('span', { className: 'ins-loading-text' }, t('instructionLoading'))
    );
  } else if (instructions.length > 0) {
    var insLinks = instructions.map(function(ins, idx) {
      var label;
      if (instructions.length === 1) {
        label = t('buildInstructions') + ' PDF';
      } else {
        label = t('buildInstructions') + ' ' + ins.sequence + '/' + ins.total;
      }
      return React.createElement('a', {
        key: idx,
        className: 'btn-instructions-detail btn-ins-dl',
        href: ins.url,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
        React.createElement('span', { className: 'ins-dl-icon' }, '\uD83D\uDCC4'),
        React.createElement('span', null, label)
      );
    });
    insSection = React.createElement('div', { className: 'ins-section' }, insLinks);
  } else {
    insSection = null;
  }

  // LEGO Korea official site URL
  var legoKrUrl = getLegoPageUrl(setNum);

  return React.createElement('div', null,
    React.createElement(Link, { to: '/', className: 'back-btn' }, t('back')),
    React.createElement('div', { className: 'set-detail' },
      React.createElement('div', { className: 'set-detail-header' },
        React.createElement('img', { className: 'set-detail-img', src: set.set_img_url || PH, alt: set.name, onError: function(e) { e.target.src = PH; } }),
        React.createElement('div', { className: 'set-detail-info' },
          React.createElement('div', { className: 'set-num' }, set.set_num),
          React.createElement('h1', null, translated || set.name),
          translated && React.createElement('div', { className: 'set-name-original' }, set.name),
          React.createElement('div', { className: 'detail-meta' },
            React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, t('releaseYear')), React.createElement('span', null, set.year + t('yearSuffix'))),
            React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, t('numParts')), React.createElement('span', null, (set.num_parts || 0).toLocaleString() + t('partsCount'))),
            set.theme_id && React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, t('themeId')), React.createElement('span', null, set.theme_id)),
            set.set_url && React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, 'Rebrickable'), React.createElement('a', { href: set.set_url, target: '_blank', rel: 'noopener noreferrer' }, t('detailPage'))),
            React.createElement('div', { className: 'detail-meta-item' }, React.createElement('span', { className: 'label' }, t('legoKorea')), React.createElement('a', { href: legoKrUrl, target: '_blank', rel: 'noopener noreferrer' }, t('detailPage')))
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
                    React.createElement('div', { className: 'part-name' }, item.part && item.part.name),
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
                  React.createElement('div', { className: 'part-name' }, mf.set_name),
                  React.createElement('div', { className: 'part-qty' }, 'x' + mf.quantity)
                );
              })
            )
          : React.createElement('p', { style: { color: '#999', textAlign: 'center', padding: 20 } }, t('noMinifigs'))
      )
    )
  );
}

export default SetDetailPage;
