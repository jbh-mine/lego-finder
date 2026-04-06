import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Pagination({ page, totalCount, pageSize, onPageChange }) {
  const { t } = useLanguage();
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t('prev')}
      </button>
      <span className="page-info">
        {page} / {totalPages} {t('page')} ({t('total')} {totalCount?.toLocaleString()}{t('count')})
      </span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        {t('next')}
      </button>
    </div>
  );
}

export default Pagination;
