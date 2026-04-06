import React from 'react';

function Pagination({ page, totalCount, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ← 이전
      </button>
      <span className="page-info">
        {page} / {totalPages} 페이지 (총 {totalCount?.toLocaleString()}개)
      </span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        다음 →
      </button>
    </div>
  );
}

export default Pagination;
