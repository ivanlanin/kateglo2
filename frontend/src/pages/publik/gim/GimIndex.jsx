/**
 * @fileoverview Halaman indeks gim publik Kateglo.
 */

import { Link } from 'react-router-dom';
import '../../../styles/gim.css';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import { useAuthOptional } from '../../../context/authContext';
import { ambilDaftarGim } from '../../../constants/katalogFitur';

function GimIndex() {
  const auth = useAuthOptional();
  const bolehLihatInternal = Boolean(auth?.adalahRedaksi || auth?.adalahAdmin);
  const daftarGim = ambilDaftarGim(bolehLihatInternal);

  return (
    <HalamanPublik
      judul="Gim"
      deskripsi="Kumpulan gim kata di Kateglo. Saat ini tersedia Kuis Kata dan Susun Kata untuk latihan bahasa Indonesia yang singkat dan interaktif."
    >
      <div className="gim-page">
        <section className="gim-list-grid" aria-label="Daftar gim">
          {daftarGim.map((gim) => (
            <article key={gim.slug} className="gim-card">
              <div className="gim-card-title-row">
                <h2 className="gim-card-title">{gim.judul}</h2>
                {bolehLihatInternal && gim.tampilPublik === false && (
                  <span className="gim-card-status">Internal</span>
                )}
              </div>
              <p className="gim-card-description">{gim.deskripsi}</p>
              <div className="gim-card-actions">
                <Link to={gim.href} className="alat-link-primary">
                  Buka gim
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </HalamanPublik>
  );
}

export default GimIndex;