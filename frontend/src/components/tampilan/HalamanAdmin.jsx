/**
 * @fileoverview Halaman redaksi untuk admin dan KADI
 */

import { useEffect } from 'react';
import { Suspense, lazy } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import HalamanDasar from './HalamanDasar';
import KepalaAdmin from './KepalaAdmin';

const NavbarAdmin = lazy(() => import('../navigasi/NavbarAdmin'));

function HalamanAdmin({ judul, aksiJudul = null, children }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    document.title = judul
      ? `${judul} — Redaksi Kateglo`
      : 'Redaksi Kateglo';
  }, [judul]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (navigationType === 'POP' || location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.hash, location.pathname, location.search, navigationType]);

  return (
    <HalamanDasar
      mode="admin"
      navbar={(
        <Suspense fallback={null}>
          <NavbarAdmin />
        </Suspense>
      )}
      konten={(
        <main className="halaman-dasar-container flex-1">
          <KepalaAdmin judul={judul} aksi={aksiJudul} />
          {children}
        </main>
      )}
    />
  );
}

export default HalamanAdmin;