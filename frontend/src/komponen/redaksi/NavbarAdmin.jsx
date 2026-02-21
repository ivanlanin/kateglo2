/**
 * @fileoverview Navbar admin/redaksi bersama
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const menuAdmin = [
  { path: '/redaksi/kamus', label: 'Kamus', izin: 'lihat_entri' },
  { path: '/redaksi/tesaurus', label: 'Tesaurus', izin: 'lihat_tesaurus' },
  { path: '/redaksi/glosarium', label: 'Glosarium', izin: 'lihat_glosarium' },
  { path: '/redaksi/glosarium/bidang', label: 'Bidang', izin: 'kelola_bidang' },
  { path: '/redaksi/glosarium/sumber', label: 'Sumber', izin: 'kelola_sumber' },
  { path: '/redaksi/komentar', label: 'Komentar', izin: 'kelola_komentar' },
  { path: '/redaksi/label', label: 'Label', izin: 'kelola_label' },
  { path: '/redaksi/peran', label: 'Peran', izin: 'kelola_peran' },
  { path: '/redaksi/izin', label: 'Izin', izin: 'kelola_peran' },
  { path: '/redaksi/pengguna', label: 'Pengguna', izin: 'kelola_pengguna' },
];

function NavbarAdmin() {
  const { logout, punyaIzin, user } = useAuth();
  const izinPengguna = Array.isArray(user?.izin) ? user.izin : [];
  const hasIzin = (izin) => {
    if (typeof punyaIzin === 'function') return punyaIzin(izin);
    return izinPengguna.includes(izin);
  };
  const menuTampil = menuAdmin.filter((item) => hasIzin(item.izin));
  const navigate = useNavigate();
  const location = useLocation();
  const [menuTerbuka, setMenuTerbuka] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isActive = (item) => location.pathname.startsWith(item.path);

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        <div className="navbar-inner">
          <div className="flex items-center gap-1">
            <Link to="/redaksi" className="navbar-logo">Redaksi</Link>
            <Link to="/" className="navbar-logo">Kateglo</Link>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            {menuTampil.map((item) => (
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
              {menuTampil.map((item) => (
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
  );
}

export default NavbarAdmin;
