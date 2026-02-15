/**
 * @fileoverview Navbar navigasi utama dengan pencarian global
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import KotakCari from './KotakCari';

const menuItems = [
  { path: '/kamus', label: 'Kamus' },
  { path: '/tesaurus', label: 'Tesaurus' },
  { path: '/glosarium', label: 'Glosarium' },
];

function Navbar() {
  const [menuTerbuka, setMenuTerbuka] = useState(false);

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
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
