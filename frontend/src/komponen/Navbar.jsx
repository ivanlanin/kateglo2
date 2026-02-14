/**
 * @fileoverview Navbar navigasi utama dengan pencarian global
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const menuItems = [
  { path: '/kamus', label: 'Kamus' },
  { path: '/glosarium', label: 'Glosarium' },
  { path: '/peribahasa', label: 'Peribahasa' },
  { path: '/singkatan', label: 'Singkatan' },
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
    navigate(`/kamus?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-700 shrink-0">
            Kateglo
          </Link>

          {/* Pencarian (desktop) */}
          <form onSubmit={handleCari} className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <input
              type="text"
              placeholder="Cari kata..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-r-md hover:bg-blue-700 shrink-0"
            >
              Cari
            </button>
          </form>

          {/* Menu (desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-blue-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Hamburger (mobile) */}
          <button
            type="button"
            onClick={() => setMenuTerbuka(!menuTerbuka)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="md:hidden pb-4 border-t border-gray-100">
            <form onSubmit={handleCari} className="flex items-center mt-3 mb-2">
              <input
                type="text"
                placeholder="Cari kata..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
              >
                Cari
              </button>
            </form>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuTerbuka(false)}
                className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
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
