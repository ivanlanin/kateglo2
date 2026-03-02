/**
 * @fileoverview Navbar admin/redaksi bersama
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const kelompokMenuAdmin = [
  {
    judul: 'Leksikon',
    items: [
      { path: '/redaksi/kamus', label: 'Kamus', izin: 'lihat_entri' },
      { path: '/redaksi/tesaurus', label: 'Tesaurus', izin: 'lihat_tesaurus' },
      { path: '/redaksi/glosarium', label: 'Glosarium', izin: 'lihat_glosarium' },
      { path: '/redaksi/etimologi', label: 'Etimologi', izin: 'kelola_etimologi' },
      { path: '/redaksi/tagar', label: 'Tagar', izin: 'kelola_tagar' },
    ],
  },
  {
    judul: 'Gim',
    items: [{ path: '/redaksi/susun-kata', label: 'Susun Kata', izin: 'kelola_susun_kata' }],
  },
  {
    judul: 'Interaksi',
    items: [
      { path: '/redaksi/komentar', label: 'Komentar', izin: 'kelola_komentar' },
      { path: '/redaksi/pencarian', label: 'Pencarian', izin: 'lihat_pencarian' },
    ],
  },
  {
    judul: 'Audit',
    items: [
      { path: '/redaksi/audit-makna', label: 'Makna', izin: 'audit_makna' },
      { path: '/redaksi/audit-tagar', label: 'Audit Tagar', izin: 'audit_tagar' },
    ],
  },
  {
    judul: 'Master',
    items: [
      { path: '/redaksi/label', label: 'Label', izin: 'kelola_label' },
      { path: '/redaksi/bidang', label: 'Bidang', izin: 'kelola_bidang' },
      { path: '/redaksi/sumber', label: 'Sumber', izin: 'kelola_sumber' },
    ],
  },
  {
    judul: 'Akses',
    items: [
      { path: '/redaksi/peran', label: 'Peran', izin: 'kelola_peran' },
      { path: '/redaksi/izin', label: 'Izin', izin: 'kelola_peran' },
      { path: '/redaksi/pengguna', label: 'Pengguna', izin: 'kelola_pengguna' },
    ],
  },
];

function NavbarAdmin() {
  const { logout, punyaIzin, user } = useAuth();
  const izinPengguna = Array.isArray(user?.izin) ? user.izin : [];
  const hasIzin = (izin) => {
    if (typeof punyaIzin === 'function') return punyaIzin(izin);
    return izinPengguna.includes(izin);
  };
  const menuTampil = kelompokMenuAdmin
    .map((kelompok) => ({
      ...kelompok,
      items: kelompok.items.filter((item) => hasIzin(item.izin)),
    }))
    .filter((kelompok) => kelompok.items.length > 0);
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
      <div className="navbar-container relative">
        <div className="navbar-inner">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuTerbuka((v) => !v)}
              className="navbar-toggle md:inline-flex"
              aria-label="Buka menu redaksi"
              aria-expanded={menuTerbuka}
            >
              <svg className="navbar-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuTerbuka ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <Link to="/redaksi" className="navbar-logo">Redaksi</Link>
            <Link to="/" className="navbar-logo">Kateglo</Link>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="navbar-menu-link"
          >
            Keluar
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${menuTerbuka ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!menuTerbuka}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          aria-label="Tutup menu redaksi"
          onClick={() => setMenuTerbuka(false)}
        />
        <aside
          className={`relative h-full w-[18rem] max-w-[85vw] border-r border-gray-200 bg-gray-50 p-3 shadow-sm transition-transform duration-200 dark:border-dark-border dark:bg-dark-bg-elevated ${menuTerbuka ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="mb-2 flex items-center justify-between px-2 pt-1">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text">Menu Redaksi</h2>
            <button
              type="button"
              onClick={() => setMenuTerbuka(false)}
              className="navbar-toggle md:inline-flex"
              aria-label="Tutup panel menu"
            >
              <svg className="navbar-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[calc(100vh-4rem)] overflow-auto space-y-3">
            {menuTampil.map((kelompok) => (
              <section key={kelompok.judul}>
                <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-text-muted">
                  {kelompok.judul}
                </h3>
                {kelompok.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`navbar-mobile-link ${isActive(item) ? 'navbar-menu-link-active' : ''}`}
                    onClick={() => setMenuTerbuka(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </section>
            ))}
          </div>
        </aside>
      </div>
    </header>
  );
}

export default NavbarAdmin;
