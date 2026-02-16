/**
 * @fileoverview Navbar navigasi utama dengan pencarian global
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import KotakCari from './KotakCari';
import { useAuth } from '../context/authContext';
import { buatUrlLoginGoogle, simpanReturnTo } from '../api/apiAuth';

const menuItems = [
  { path: '/kamus', label: 'Kamus' },
  { path: '/tesaurus', label: 'Tesaurus' },
  { path: '/glosarium', label: 'Glosarium' },
];

function Navbar() {
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const location = useLocation();
  const {
    isLoading,
    isAuthenticated,
    logout,
  } = useAuth();
  const loginUrl = buatUrlLoginGoogle(window.location.origin);

  const handleLoginClick = () => {
    simpanReturnTo(`${location.pathname}${location.search}`);
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
          <div className="navbar-search-desktop">
            <KotakCari varian="navbar" />
          </div>

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

            {isLoading ? (
              <span className="navbar-auth-loading">Memuat...</span>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="navbar-menu-link"
              >
                Keluar
              </button>
            ) : (
              <a
                href={loginUrl}
                onClick={handleLoginClick}
                className="navbar-menu-link"
              >
                Masuk
              </a>
            )}
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
            <div className="navbar-search-mobile">
              <KotakCari varian="navbar" />
            </div>
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

            <div className="navbar-mobile-auth">
              {isLoading ? (
                <span className="navbar-auth-loading">Memuat...</span>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuTerbuka(false);
                  }}
                  className="navbar-mobile-link w-full text-left"
                >
                  Keluar
                </button>
              ) : (
                <a
                  href={loginUrl}
                  onClick={handleLoginClick}
                  className="navbar-mobile-link"
                >
                  Masuk
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
