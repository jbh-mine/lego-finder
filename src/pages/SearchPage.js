import React, { useState, useCallback } from 'react';
import { searchSets } from '../utils/api';
import SetCard from '../components/SetCard';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const PAGE_SIZE = 20;

  const doSearch = useCallback(async (searchQuery, searchPage) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchSets(searchQuery.trim(), searchPage, PAGE_SIZE);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? '검색 결과가 없습니다.'
          : 'API 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    doSearch(query, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    doSearch(query, newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <div className="search-section">
        <h2>레고 세트 검색</h2>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제품번호 또는 이름 입력 (예: 10278, Modular, Star Wars)"
          />
          <button type="submit" disabled={loading}>
            {loading ? '검색 중...' : '검색'}
          </button>
        </form>
      </div>

      {loading && <Loading />}

      {error && <ErrorMessage message={error} onRetry={() => doSearch(query, page)} />}

      {!loading && !error && results && results.results?.length > 0 && (
        <>
          <div className="set-grid">
            {results.results.map((set) => (
              <SetCard key={set.set_num} set={set} />
            ))}
          </div>
          <Pagination
            page={page}
            totalCount={results.count}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {!loading && !error && searched && results?.results?.length === 0 && (
        <EmptyState
          title="검색 결과 없음"
          message={`"${query}"에 대한 결과를 찾을 수 없습니다. 다른 키워드를 시도해보세요.`}
        />
      )}

      {!searched && !loading && (
        <div className="empty-state">
          <h3>레고 세트를 검색해보세요!</h3>
          <p>제품번호(예: 10278)나 이름(예: Star Wars)을 입력하면 검색 결과가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
