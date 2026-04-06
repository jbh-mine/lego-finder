import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Loading(props) {
  var t = useLanguage().t;
  return React.createElement('div', { className: 'loading' },
    React.createElement('div', { className: 'loading-spinner' }),
    React.createElement('p', null, props.message || t('loading'))
  );
}

function ErrorMessage(props) {
  var t = useLanguage().t;
  return React.createElement('div', { className: 'error-message' },
    React.createElement('p', null, props.message || t('error')),
    props.onRetry && React.createElement('button', {
      onClick: props.onRetry,
      style: { marginTop: 12, padding: '8px 16px' }
    }, t('retry'))
  );
}

function EmptyState(props) {
  var t = useLanguage().t;
  return React.createElement('div', { className: 'empty-state' },
    React.createElement('h3', null, props.title || t('noResultsGeneric')),
    React.createElement('p', null, props.message || t('noResultsGenericDesc'))
  );
}

export { Loading, ErrorMessage, EmptyState };
