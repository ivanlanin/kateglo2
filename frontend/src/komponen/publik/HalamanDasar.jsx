/**
 * @fileoverview Komponen layout dasar halaman konten
 */

import { useEffect } from 'react';

function HalamanDasar({ judul, children }) {
  useEffect(() => {
    document.title = judul
      ? `${judul} — Kateglo`
      : 'Kateglo — Kamus, Tesaurus, dan Glosarium Bahasa Indonesia';
  }, [judul]);

  return (
    <div className="halaman-dasar-container">
      {judul && <h1 className="page-title">{judul}</h1>}
      {children}
    </div>
  );
}

export default HalamanDasar;
