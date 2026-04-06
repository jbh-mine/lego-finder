import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function Header() {
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={() => setMenuOpen(false)}>
          LEGO<span> Finder</span>
        </Link>

        <div className="header-right">
          <div className="lang-selector">
            <button
              className={`lang-btn ${lang === 'ko' ? 'lang-active' : ''}`}
              onClick={() => setLang('ko')}
            >
              \uD55C\uAD6D\uC5B4
            </button>
            <button
              className={`lang-btn ${lang === 'en' ? 'lang-active' : ''}`}
              onClick={() => setLang('en')}
            >
              \uC601\uC5B4
            </button>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        <nav className={`header-nav ${menuOpen ? 'nav-open' : ''}`}>
          <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>
            {t('search')}
          </Link>
          <Link to="/browse" className={isActive('/browse')} onClick={() => setMenuOpen(false)}>
            {t('browse')}
          </Link>
          <Link to="/collection" className={isActive('/collection')} onClick={() => setMenuOpen(false)}>
            {t('myCollection')}
          </Link>
          <a
            href={process.env.PUBLIC_URL + '/guide.html'}
            download="LEGO_Finder_Guide.html"
            className="nav-guide-link"
            onClick={() => setMenuOpen(false)}
          >
            {t('downloadGuide')}
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
