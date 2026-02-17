/**
 * @fileoverview Layout admin bersama — header + navigasi tab + area konten
 */

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const menuAdmin = [
  { path: '/redaksi/kamus', label: 'Kamus' },
  { path: '/redaksi/tesaurus', label: 'Tesaurus' },
  { path: '/redaksi/glosarium', label: 'Glosarium' },
  { path: '/redaksi/label', label: 'Label' },
  { path: '/redaksi/pengguna', label: 'Pengguna' },
  { path: '/redaksi/komentar', label: 'Komentar' },
];

function TataLetakAdmin({ judul, children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const appTimestamp = __APP_TIMESTAMP__;
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [modeGelap, setModeGelap] = useState(() => {
    const tersimpan = localStorage.getItem('kateglo-theme');
    if (tersimpan) return tersimpan === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.title = judul
      ? `${judul} — Redaksi Kateglo`
      : 'Redaksi Kateglo';
  }, [judul]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modeGelap);
    localStorage.setItem('kateglo-theme', modeGelap ? 'dark' : 'light');
  }, [modeGelap]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isActive = (item) => location.pathname.startsWith(item.path);

  return (
    <div className="kateglo-layout-root">
      <header className="navbar-root">
        <div className="navbar-container">
          <div className="navbar-inner">
            <div className="flex items-center gap-1">
              <Link to="/redaksi" className="navbar-logo">Redaksi</Link>
              <Link to="/" className="navbar-logo">Kateglo</Link>
            </div>
            <nav className="hidden md:flex items-center space-x-1">
              {menuAdmin.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`navbar-menu-link ${isActive(item) ? 'navbar-menu-link-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="navbar-menu-link"
              >
                Keluar
              </button>
            </nav>

            <button
              type="button"
              onClick={() => setMenuTerbuka((v) => !v)}
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

          {menuTerbuka && (
            <div className="navbar-mobile-panel">
              <div className="px-3">
                {menuAdmin.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`navbar-mobile-link ${isActive(item) ? 'navbar-menu-link-active' : ''}`}
                    onClick={() => setMenuTerbuka(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMenuTerbuka(false);
                    handleLogout();
                  }}
                  className="navbar-mobile-link w-full text-left"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="halaman-dasar-container">
        {judul && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {judul}
          </h2>
        )}
        {children}
      </main>

      <footer className="kateglo-footer">
        <div className="kateglo-footer-content">
          <span className="kateglo-version-button">Kateglo {appTimestamp}</span>
          <button
            type="button"
            onClick={() => setModeGelap((v) => !v)}
            className="kateglo-theme-toggle"
            title={modeGelap ? 'Mode terang' : 'Mode gelap'}
          >
            {modeGelap ? '☀️' : '🌙'}
          </button>
          <Link to="/kebijakan-privasi" className="link-action text-sm">
            Kebijakan Privasi
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default TataLetakAdmin;
