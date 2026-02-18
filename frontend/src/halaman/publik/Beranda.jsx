/**
 * @fileoverview Halaman Beranda
 */

import { useEffect } from 'react';
import KotakCari from '../../komponen/publik/KotakCari';

function Beranda() {
  useEffect(() => {
    document.title = 'Kateglo';
  }, []);

  return (
    <div className="beranda-container">
      {/* Hero / Jumbotron */}
      <div className="beranda-hero">
        <h1 className="beranda-title">Kateglo</h1>
        <p className="beranda-subtitle">
          Kamus, Tesaurus, dan Glosarium Bahasa Indonesia
        </p>
        {/* Pencarian Utama */}
        <KotakCari varian="beranda" autoFocus />
      </div>
    </div>
  );
}

export default Beranda;
