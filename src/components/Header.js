import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          LEGO<span> Finder</span>
        </Link>
        <nav className="header-nav">
          <Link to="/" className={isActive('/')}>검색</Link>
          <Link to="/browse" className={isActive('/browse')}>둘러보기</Link>
          <Link to="/collection" className={isActive('/collection')}>내 컬렉션</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
