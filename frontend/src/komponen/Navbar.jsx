/**
 * @fileoverview Navbar navigasi utama dengan pencarian global
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const menuItems = [
  { path: '/kamus', label: 'Kamus' },
  { path: '/tesaurus', label: 'Tesaurus' },
  { path: '/glosarium', label: 'Glosarium' },
];

function Navbar() {
  const [query, setQuery] = useState('');
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const navigate = useNavigate();

  const handleCari = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setMenuTerbuka(false);
    navigate(`/kamus/cari/${encodeURIComponent(trimmed)}`);
  };

  return (
    <nav className="navbar-root">
      <div className="navbar-container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            Kateglo
          </Link>

          {/* Pencarian (desktop) */}
          <form onSubmit={handleCari} className="navbar-search-desktop">
            <input
              type="text"
              placeholder="Cari kata..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="navbar-search-input"
            />
            <button
              type="submit"
              className="navbar-search-button"
            >
              Cari
            </button>
          </form>

          {/* Menu (desktop) */}
          <div className="navbar-menu-desktop">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="navbar-menu-link"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Hamburger (mobile) */}
          <button
            type="button"
            onClick={() => setMenuTerbuka(!menuTerbuka)}
            className="navbar-toggle"
            aria-label="Toggle menu"
          >
            <svg className="navbar-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuTerbuka ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu mobile */}
        {menuTerbuka && (
          <div className="navbar-mobile-panel">
            <form onSubmit={handleCari} className="navbar-search-mobile">
              <input
                type="text"
                placeholder="Cari kata..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="navbar-search-input"
              />
              <button
                type="submit"
                className="navbar-search-button navbar-search-button-mobile"
              >
                Cari
              </button>
            </form>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuTerbuka(false)}
                className="navbar-mobile-link"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
