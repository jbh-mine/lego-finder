import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import MocWebSearch from '../components/MocWebSearch';
import MocReviewBrowser from './MocReviewBrowser';
import { MOC_SEARCH_ENGINE_ID } from '../config/mocSearchConfig';
import { getMocArchiveSearchUrl } from '../utils/mocArchiveSearch';

export default function MocsPage() {
  var t = useLanguage().t;
  var modeState = useState('web');
  var mode = modeState[0];
  var setMode = modeState[1];
  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];

  return React.createElement('div', null,
    React.createElement('div', { className: 'search-section' },
      React.createElement('div', { className: 'new-products-header' },
        React.createElement('h2', null, t('mocsTitle')),
        React.createElement('p', { className: 'new-products-desc' }, t('mocWebPageScope'))
      ),
      React.createElement('div', { className: 'moc-sort-tabs', role: 'group', 'aria-label': t('mocSearchMode') },
        React.createElement('button', {
          type: 'button', className: 'moc-sort-tab' + (mode === 'web' ? ' active' : ''),
          'aria-pressed': mode === 'web', onClick: function() { setMode('web'); }
        }, t('mocWebMode')),
        React.createElement('button', {
          type: 'button', className: 'moc-sort-tab' + (mode === 'reviews' ? ' active' : ''),
          'aria-pressed': mode === 'reviews', onClick: function() { setMode('reviews'); }
        }, t('mocReviewMode'))
      )
    ),
    mode === 'web'
      ? React.createElement(React.Fragment, null,
          React.createElement(MocWebSearch, {
            searchEngineId: MOC_SEARCH_ENGINE_ID, query: query, onQueryChange: setQuery
          }),
          React.createElement('aside', { className: 'new-products-source-notice moc-archive-notice', 'aria-label': t('mocArchiveTitle') },
            React.createElement('div', null,
              React.createElement('h3', null, t('mocArchiveTitle')),
              React.createElement('p', null, t('mocArchiveScope')),
              React.createElement('a', {
                href: getMocArchiveSearchUrl(query), target: '_blank', rel: 'noopener noreferrer',
                className: 'new-products-source-link'
              }, t('mocArchiveSearch'))
            )
          )
        )
      : React.createElement(MocReviewBrowser)
  );
}
