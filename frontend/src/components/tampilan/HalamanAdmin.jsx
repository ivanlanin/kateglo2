/**
 * @fileoverview Halaman redaksi untuk admin dan KADI
 */

import { useEffect } from 'react';
import { Suspense, lazy } from 'react';
import HalamanDasar from './HalamanDasar';
import KepalaAdmin from './KepalaAdmin';

const NavbarAdmin = lazy(() => import('../navigasi/NavbarAdmin'));

function HalamanAdmin({ judul, aksiJudul = null, children }) {
  useEffect(() => {
    document.title = judul
      ? `${judul} — Redaksi Kateglo`
      : 'Redaksi Kateglo';
  }, [judul]);

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