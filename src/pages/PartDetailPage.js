import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getPartDetail, getPartColors, getPartCategories } from '../utils/api';
import { Loading, ErrorMessage } from '../components/Loading';

var PH = 'https://rebrickable.com/static/img/nil_mf.jpg';

function PartDetailPage() {
  var p = useParams(); var partNum = decodeURIComponent(p.partNum);
  var nav = useNavigate();
  var lc = useLanguage(); var t = lc.t;
  var s1 = useState(null); var part = s1[0]; var setPart = s1[1];
  var s2 = useState(null); var colors = s2[0]; var setColors = s2[1];
  var s3 = useState(true); var loading = s3[0]; var setLoading = s3[1];
  var s4 = useState(null); var error = s4[0]; var setError = s4[1];
  var s5 = useState(null); var catName = s5[0]; var setCatName = s5[1];
  var s6 = useState(null); var selColor = s6[0]; var setSelColor = s6[1];

  useEffect(function() {
    (async function() {
      setLoading(true); setError(null);
      try {
        var detail = await getPartDetail(partNum);
        setPart(detail);
        var colorsData = await getPartColors(partNum);
        var colorResults = colorsData.results || colorsData;
        if (Array.isArray(colorResults)) {
          colorResults.sort(function(a, b) {
            var na = (a.color_name || ''); var nb = (b.color_name || '');
            return na.localeCompare(nb);
          });
          setColors(colorResults);
        }
        if (detail.part_cat_id) {
          try {
            var cats = await getPartCategories();
            var catList = cats.results || cats;
            if (Array.isArray(catList)) {
              var found = catList.find(function(c) { return c.id === detail.part_cat_id; });
              if (found) setCatName(found.name);
            }
          } catch(e) {}
        }
      } catch(e) {
        setError(e.response && e.response.status === 404
          ? '"' + partNum + '"' + t('partNotFound')
          : t('apiErrorGeneric'));
      } finally { setLoading(false); }
    })();
  }, [partNum, t]);

  if (loading) return React.createElement(Loading, { message: t('partLoading') });
  if (error) return React.createElement(React.Fragment, null,
    React.createElement(Link, { to: '/parts', className: 'back-btn' }, t('back')),
    React.createElement(ErrorMessage, { message: error })
  );
  if (!part) return null;

  var imgUrl = part.part_img_url || PH;
  if (selColor && selColor.part_img_url) {
    imgUrl = selColor.part_img_url;
  }

  return React.createElement('div', null,
    React.createElement(Link, { to: '/parts', className: 'back-btn' }, t('back')),
    React.createElement('div', { className: 'set-detail' },
      React.createElement('div', { className: 'set-detail-header' },
        React.createElement('img', {
          className: 'set-detail-img',
          src: imgUrl,
          alt: part.name,
          onError: function(e) { e.target.src = PH; },
        }),
        React.createElement('div', { className: 'set-detail-info' },
          React.createElement('div', { className: 'set-num' }, part.part_num),
          React.createElement('h1', null, part.name),
          React.createElement('div', { className: 'detail-meta' },
            catName && React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, t('partCategory')),
              React.createElement('span', null, catName)
            ),
            part.part_url && React.createElement('div', { className: 'detail-meta-item' },
              React.createElement('span', { className: 'label' }, 'Rebrickable'),
              React.createElement('a', { href: part.part_url, target: '_blank', rel: 'noopener noreferrer' }, t('detailPage'))
            )
          ),
          selColor && React.createElement('div', { className: 'part-selected-color' },
            React.createElement('span', { className: 'part-color-swatch', style: { background: '#' + (selColor.color_rgb || '999') } }),
            React.createElement('span', null, selColor.color_name || ''),
            React.createElement('span', { className: 'part-color-sets-count' },
              ' (' + (selColor.num_sets || 0) + ' ' + t('setsUnit') + ')'
            )
          )
        )
      ),

      React.createElement('div', { className: 'part-detail-section' },
        React.createElement('h3', { className: 'part-section-title' },
          t('availableColors') + (colors ? ' (' + colors.length + ')' : '')
        ),
        colors && colors.length > 0
          ? React.createElement('div', { className: 'part-colors-grid' },
              colors.map(function(c) {
                var isSelected = selColor && selColor.color_id === c.color_id;
                return React.createElement('div', {
                  key: c.color_id,
                  className: 'part-color-item' + (isSelected ? ' part-color-selected' : ''),
                  onClick: function() { setSelColor(isSelected ? null : c); },
                },
                  React.createElement('span', {
                    className: 'part-color-swatch',
                    style: { background: '#' + (c.color_rgb || '999') },
                  }),
                  React.createElement('span', { className: 'part-color-name' }, c.color_name || 'Color ' + c.color_id),
                  React.createElement('span', { className: 'part-color-count' }, c.num_sets || 0)
                );
              })
            )
          : React.createElement('p', { style: { color: '#999', padding: '12px 0' } }, t('noColorsInfo'))
      ),

      selColor && selColor.elements && selColor.elements.length > 0 &&
        React.createElement('div', { className: 'part-detail-section' },
          React.createElement('h3', { className: 'part-section-title' }, t('elementIds')),
          React.createElement('div', { className: 'part-elements-list' },
            selColor.elements.map(function(el) {
              return React.createElement('span', { key: el, className: 'part-element-badge' }, el);
            })
          )
        ),

      selColor && selColor.num_set_parts > 0 &&
        React.createElement('div', { className: 'part-detail-section' },
          React.createElement('h3', { className: 'part-section-title' },
            t('containingSets') + ' (' + (selColor.num_sets || 0) + ')'
          ),
          React.createElement('p', { className: 'part-sets-hint' },
            React.createElement('a', {
              href: 'https://rebrickable.com/parts/' + part.part_num + '/' + selColor.color_id + '/',
              target: '_blank',
              rel: 'noopener noreferrer',
            }, t('viewSetsOnRebrickable'))
          )
        )
    )
  );
}

export default PartDetailPage;
