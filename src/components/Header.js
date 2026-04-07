import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

function Header() {
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const clearSearchState = () => {
    try { sessionStorage.removeItem('lego_search_state'); } catch(e) {}
    window.dispatchEvent(new Event('resetSearch'));
    setMenuOpen(false);
  };

  const isDark = theme === 'dark';
  const themeBtnTitle = isDark ? t('themeToLight') : t('themeToDark');

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={clearSearchState}>
          LEGO<span> Finder</span>
        </Link>

        <div className="header-right">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={themeBtnTitle}
            title={themeBtnTitle}
          >
            <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
          </button>

          <div className="lang-selector">
            <button
              className={'lang-btn' + (lang === 'ko' ? ' lang-active' : '')}
              onClick={() => setLang('ko')}
            >
              {t('langKo')}
            </button>
            <button
              className={'lang-btn' + (lang === 'en' ? ' lang-active' : '')}
              onClick={() => setLang('en')}
            >
              {t('langEn')}
            </button>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t('menuLabel')}
          >
            <span className={'hamburger' + (menuOpen ? ' open' : '')}></span>
          </button>
        </div>

        <nav className={'header-nav' + (menuOpen ? ' nav-open' : '')}>
          <Link to="/" className={isActive('/')} onClick={clearSearchState}>
            {t('search')}
          </Link>
          <Link to="/parts" className={isActive('/parts')} onClick={() => setMenuOpen(false)}>
            {t('partsSearch')}
          </Link>
          <Link to="/browse" className={isActive('/browse')} onClick={() => setMenuOpen(false)}>
            {t('browse')}
          </Link>
          <Link to="/new" className={isActive('/new')} onClick={() => setMenuOpen(false)}>
            {t('newProducts')}
          </Link>
          <Link to="/funding" className={isActive('/funding')} onClick={() => setMenuOpen(false)}>
            {t('fundingProducts')}
          </Link>
          <Link to="/mocs" className={isActive('/mocs')} onClick={() => setMenuOpen(false)}>
            {t('mocs')}
          </Link>
          <Link to="/scarcity" className={isActive('/scarcity')} onClick={() => setMenuOpen(false)}>
            {t('scarcityNavLabel')}
          </Link>
          <Link to="/collection" className={isActive('/collection')} onClick={() => setMenuOpen(false)}>
            {t('myCollection')}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
