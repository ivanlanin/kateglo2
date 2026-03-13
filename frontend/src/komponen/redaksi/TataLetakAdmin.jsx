/**
 * @fileoverview Tata letak redaksi untuk halaman admin dan KADI
 */

import { useEffect } from 'react';
import { Suspense, lazy } from 'react';
import KerangkaKateglo from '../bersama/KerangkaKateglo';

const NavbarAdmin = lazy(() => import('./NavbarAdmin'));

function TataLetakAdmin({ judul, aksiJudul = null, children }) {
  useEffect(() => {
    document.title = judul
      ? `${judul} — Redaksi Kateglo`
      : 'Redaksi Kateglo';
  }, [judul]);

  return (
    <KerangkaKateglo
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

export default TataLetakAdmin;