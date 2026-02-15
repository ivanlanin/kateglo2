/**
 * @fileoverview Halaman Beranda
 */

import { Link } from 'react-router-dom';
import KotakCari from '../komponen/KotakCari';

function Beranda() {
  return (
    <div className="beranda-container">
      {/* Hero / Jumbotron */}
      <div className="beranda-hero">
        <h1 className="beranda-title">Kateglo</h1>
        <p className="beranda-subtitle">
          Kamus, tesaurus, dan glosarium bahasa Indonesia
        </p>
        {/* Pencarian Utama */}
        <KotakCari varian="beranda" />
      </div>

      {/* Kartu fitur */}
      <div className="beranda-feature-grid">
        <Link to="/kamus" className="beranda-feature-card">
          <div className="beranda-feature-icon">📖</div>
          <h3 className="beranda-feature-title">Kamus</h3>
          <p className="beranda-feature-desc">Definisi dan makna kata</p>
        </Link>
        <Link to="/tesaurus" className="beranda-feature-card">
          <div className="beranda-feature-icon">🔗</div>
          <h3 className="beranda-feature-title">Tesaurus</h3>
          <p className="beranda-feature-desc">Sinonim, antonim, dan relasi kata</p>
        </Link>
        <Link to="/glosarium" className="beranda-feature-card">
          <div className="beranda-feature-icon">🌐</div>
          <h3 className="beranda-feature-title">Glosarium</h3>
          <p className="beranda-feature-desc">Istilah teknis dari berbagai bidang</p>
        </Link>
      </div>
    </div>
  );
}

export default Beranda;
