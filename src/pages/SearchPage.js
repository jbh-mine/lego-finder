import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { searchSets } from '../utils/api';
import SetCard from '../components/SetCard';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

function SearchPage() {
  const { t } = useLanguage();
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
          ? t('noSearchResults')
          : t('apiError')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        <h2>{t('searchTitle')}</h2>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
          <button type="submit" disabled={loading}>
            {loading ? t('searching') : t('searchBtn')}
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
          title={t('noResults')}
          message={`"${query}"${t('noResultsDesc')}`}
        />
      )}

      {!searched && !loading && (
        <div className="empty-state">
          <h3>{t('searchEmpty')}</h3>
          <p>{t('searchEmptyDesc')}</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
