import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getMocDetail } from '../utils/mocApi';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading, ErrorMessage } from '../components/Loading';

function MocDetailPage() {
  var params = useParams();
  var location = useLocation();
  var lc = useLanguage();
  var t = lc.t;

  var mocNum = params.mocNum;
  var stateMoc = (location.state && location.state.moc) || null;

  var s1 = useState(stateMoc); var detail = s1[0]; var setDetail = s1[1];
  var s2 = useState(false); var loading = s2[0]; var setLoading = s2[1];
  var s3 = useState(null); var error = s3[0]; var setError = s3[1];

  useEffect(function() {
    var alive = true;
    setLoading(true);
    setError(null);
    getMocDetail(mocNum).then(function(data) {
      if (!alive) return;
      if (data) {
        setDetail(function(prev) {
          var base = prev || {};
          return Object.assign({}, base, data, {
            parts: data.parts || (base.parts || 0),
            year: data.year || (base.year || 0),
            designer: data.designer || (base.designer || ''),
            designerSlug: data.designerSlug || (base.designerSlug || ''),
            image: data.image || (base.img || ''),
          });
        });
      }
      setLoading(false);
    }).catch(function() {
      if (!alive) return;
      setError(t('apiError'));
      setLoading(false);
    });
    return function() { alive = false; };
  }, [mocNum]); // eslint-disable-line

  if (loading && !detail) {
    return React.createElement('div', null, React.createElement(Loading, null));
  }
  if (error && !detail) {
    return React.createElement(ErrorMessage, { message: error });
  }
  if (!detail) {
    return React.createElement('div', null, React.createElement(Loading, null));
  }

  var displayImage = detail.image || detail.img || '';
  var canonicalUrl = detail.canonicalUrl ||
    ('https://rebrickable.com/mocs/' + mocNum + '/');

  var backBtn = React.createElement(Link, { to: '/mocs', className: 'back-btn' }, t('back'));

  var detailCard = React.createElement('div', { className: 'set-detail' },
    React.createElement('div', { className: 'set-detail-header' },
      displayImage ? React.createElement('img', {
        className: 'set-detail-img',
        src: displayImage,
        alt: detail.name
      }) : null,
      React.createElement('div', { className: 'set-detail-info' },
        React.createElement('div', { className: 'set-num' }, mocNum),
        React.createElement('h1', null, detail.name || mocNum),
        React.createElement('div', { className: 'detail-meta' },
          detail.designer ? React.createElement('div', { className: 'detail-meta-item' },
            React.createElement('span', { className: 'label' }, t('mocDesigner') + ':'),
            React.createElement('span', null, detail.designer)
          ) : null,
          detail.parts ? React.createElement('div', { className: 'detail-meta-item' },
            React.createElement('span', { className: 'label' }, t('numParts') + ':'),
            React.createElement('span', null, detail.parts)
          ) : null,
          detail.year ? React.createElement('div', { className: 'detail-meta-item' },
            React.createElement('span', { className: 'label' }, t('releaseYear') + ':'),
            React.createElement('span', null, detail.year)
          ) : null,
          detail.theme ? React.createElement('div', { className: 'detail-meta-item' },
            React.createElement('span', { className: 'label' }, t('theme') + ':'),
            React.createElement('span', null, detail.theme)
          ) : null,
          detail.likes ? React.createElement('div', { className: 'detail-meta-item' },
            React.createElement('span', { className: 'label' }, '\u2665 Likes:'),
            React.createElement('span', null, detail.likes)
          ) : null
        ),
        detail.description ? React.createElement('p', { className: 'moc-desc' }, detail.description) : null,
        React.createElement('div', { className: 'detail-actions' },
          React.createElement('a', {
            href: canonicalUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'btn-collection moc-rebrickable-btn'
          }, t('mocViewOnRebrickable'))
        )
      )
    )
  );

  return React.createElement('div', null, backBtn, detailCard);
}

export default MocDetailPage;
