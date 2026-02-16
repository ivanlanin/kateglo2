/**
 * @fileoverview Halaman Beranda
 */

import { useEffect } from 'react';
import KotakCari from '../komponen/KotakCari';
import MenuUtama from '../komponen/MenuUtama';

function Beranda() {
  useEffect(() => {
    document.title = 'Kateglo — Kamus, Tesaurus, dan Glosarium Bahasa Indonesia';
  }, []);

  return (
    <div className="beranda-container">
      <MenuUtama
        containerClassName="beranda-top-menu"
        linkClassName="beranda-top-menu-link"
        loadingClassName="beranda-top-menu-loading"
      />

      {/* Hero / Jumbotron */}
      <div className="beranda-hero">
        <h1 className="beranda-title">Kateglo</h1>
        <p className="beranda-subtitle">
          Kamus, tesaurus, dan glosarium bahasa Indonesia
        </p>
        {/* Pencarian Utama */}
        <KotakCari varian="beranda" autoFocus />
      </div>
    </div>
  );
}

export default Beranda;
