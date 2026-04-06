import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Loading({ message }) {
  const { t } = useLanguage();
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>{message || t('loading')}</p>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="error-message">
      <p>{message || t('error')}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ marginTop: 12, padding: '8px 16px' }}>
          {t('retry')}
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, message }) {
  const { t } = useLanguage();
  return (
    <div className="empty-state">
      <h3>{title || t('noResultsGeneric')}</h3>
      <p>{message || t('noResultsGenericDesc')}</p>
    </div>
  );
}

export { Loading, ErrorMessage, EmptyState };
