import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemes, filterSets } from '../utils/api';
import SetCard from '../components/SetCard';
import Pagination from '../components/Pagination';
import { Loading, ErrorMessage, EmptyState } from '../components/Loading';

function BrowsePage() {
  const { t } = useLanguage();
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [results, setResults] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [themesLoading, setThemesLoading] = useState(true);
  const [error, setError] = useState(null);

  const PAGE_SIZE = 20;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function loadThemes() {
      try {
        const data = await getThemes(1, 1000);
        const parentThemes = data.results.filter((th) => !th.parent_id);
        setThemes(parentThemes);
      } catch (err) {
        console.error('Theme load failed:', err);
      } finally {
        setThemesLoading(false);
      }
    }
    loadThemes();
  }, []);

  const doFilter = useCallback(async (filterPage) => {
    setLoading(true);
    setError(null);
    try {
      const data = await filterSets({
        themeId: selectedTheme || undefined,
        minYear: minYear || undefined,
        maxYear: maxYear || undefined,
        page: filterPage,
        pageSize: PAGE_SIZE,
      });
      setResults(data);
    } catch (err) {
      setError(t('filterError'));
    } finally {
      setLoading(false);
    }
  }, [selectedTheme, minYear, maxYear, t]);

  const handleFilter = () => {
    setPage(1);
    doFilter(1);
  };

  const handleReset = () => {
    setSelectedTheme('');
    setMinYear('');
    setMaxYear('');
    setResults(null);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    doFilter(newPage);
    window.scrollTo(0, 0);
  };

  const yearOptions = [];
  for (let y = currentYear; y >= 1950; y--) {
    yearOptions.push(y);
  }

  return (
    <div>
      <div className="filter-section">
        <div className="filter-group">
          <label>{t('theme')}</label>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            disabled={themesLoading}
          >
            <option value="">{t('allThemes')}</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{t('startYear')}</label>
          <select value={minYear} onChange={(e) => setMinYear(e.target.value)}>
            <option value="">{t('all')}</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}{t('yearSuffix')}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{t('endYear')}</label>
          <select value={maxYear} onChange={(e) => setMaxYear(e.target.value)}>
            <option value="">{t('all')}</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}{t('yearSuffix')}</option>
            ))}
          </select>
        </div>

        <button className="filter-btn" onClick={handleFilter} disabled={loading}>
          {loading ? t('searching') : t('applyFilter')}
        </button>
        <button className="filter-reset" onClick={handleReset}>{t('reset')}</button>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={() => doFilter(page)} />}

      {!loading && !error && results && results.results?.length > 0 && (
        <>
          <div className="set-grid">
            {results.results.map((set) => (
              <SetCard key={set.set_num} set={set} />
            ))}
          </div>
          <Pagination page={page} totalCount={results.count} pageSize={PAGE_SIZE} onPageChange={handlePageChange} />
        </>
      )}

      {!loading && !error && results && results.results?.length === 0 && (
        <EmptyState title={t('noResults2')} message={t('noFilterResults')} />
      )}

      {!results && !loading && (
        <div className="empty-state">
          <h3>{t('browseTitle')}</h3>
          <p>{t('browseDesc')}</p>
        </div>
      )}
    </div>
  );
}

export default BrowsePage;
