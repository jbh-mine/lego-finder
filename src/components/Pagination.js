import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Pagination(props) {
  var t = useLanguage().t;
  var page = props.page;
  var totalCount = props.totalCount;
  var pageSize = props.pageSize;
  var onPageChange = props.onPageChange;
  var totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  return React.createElement('div', { className: 'pagination' },
    React.createElement('button', {
      disabled: page <= 1,
      onClick: function() { onPageChange(page - 1); }
    }, t('prev')),
    React.createElement('span', { className: 'page-info' },
      page + ' / ' + totalPages + ' ' + t('page') + ' (' + t('total') + ' ' + (totalCount ? totalCount.toLocaleString() : 0) + t('count') + ')'
    ),
    React.createElement('button', {
      disabled: page >= totalPages,
      onClick: function() { onPageChange(page + 1); }
    }, t('next'))
  );
}

export default Pagination;
