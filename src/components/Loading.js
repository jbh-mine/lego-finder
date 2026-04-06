import React from 'react';

function Loading({ message = '데이터를 불러오는 중...' }) {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
}

function ErrorMessage({ message = '오류가 발생했습니다.', onRetry }) {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ marginTop: 12, padding: '8px 16px' }}>
          다시 시도
        </button>
      )}
    </div>
  );
}

function EmptyState({ title = '결과 없음', message = '검색 결과가 없습니다.' }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export { Loading, ErrorMessage, EmptyState };
