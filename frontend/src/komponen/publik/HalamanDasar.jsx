/**
 * @fileoverview Komponen layout dasar halaman konten
 */

import { useEffect } from 'react';

function HalamanDasar({ judul, breadcrumb, children }) {
  useEffect(() => {
    document.title = judul
      ? `${judul} — Kateglo`
      : 'Kateglo — Kamus, Tesaurus, dan Glosarium Bahasa Indonesia';
  }, [judul]);

  return (
    <div className="container mx-auto px-4 py-8">
      {breadcrumb}
      {judul && <h1 className="page-title">{judul}</h1>}
      {children}
    </div>
  );
}

export default HalamanDasar;
