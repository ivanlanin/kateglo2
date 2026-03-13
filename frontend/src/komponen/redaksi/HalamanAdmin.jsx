/**
 * @fileoverview Halaman redaksi untuk admin dan KADI
 */

import { useEffect } from 'react';
import { Suspense, lazy } from 'react';
import HalamanDasar from '../bersama/HalamanDasar';

const NavbarAdmin = lazy(() => import('./NavbarAdmin'));

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
          {judul && (
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{judul}</h2>
              {aksiJudul}
            </div>
          )}
          {children}
        </main>
      )}
    />
  );
}

export default HalamanAdmin;