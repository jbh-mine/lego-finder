import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function Header() {
  const location = useLocation();
  const { t, toggleLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={() => setMenuOpen(false)}>
          LEGO<span> Finder</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
        </button>

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
          <button className="lang-toggle" onClick={() => { toggleLang(); setMenuOpen(false); }}>
            {t('langToggle')}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
