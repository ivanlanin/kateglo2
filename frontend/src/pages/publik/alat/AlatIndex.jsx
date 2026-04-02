/**
 * @fileoverview Halaman indeks alat publik Kateglo.
 */

import { Link } from 'react-router-dom';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import { useAuthOptional } from '../../../context/authContext';
import { ambilDaftarAlat } from '../../../constants/katalogFitur';

function AlatIndex() {
  const auth = useAuthOptional();
  const bolehLihatInternal = Boolean(auth?.adalahRedaksi || auth?.adalahAdmin);
  const daftarAlat = ambilDaftarAlat(bolehLihatInternal);

  return (
    <HalamanPublik
      judul="Alat"
      deskripsi="Kumpulan alat bahasa Indonesia di Kateglo. Saat ini tersedia Analisis Teks dan halaman ini siap menampung alat berikutnya."
    >
      <div className="alat-page">
        <section className="alat-list-grid" aria-label="Daftar alat">
          {daftarAlat.map((alat) => (
            <article key={alat.slug} className="alat-card">
              <div className="alat-card-title-row">
                <h2 className="alat-card-title">{alat.judul}</h2>
                {bolehLihatInternal && alat.tampilPublik === false && (
                  <span className="alat-card-status">Internal</span>
                )}
              </div>
              <p className="alat-card-description">{alat.deskripsi}</p>
              <div className="alat-card-actions">
                <Link to={alat.href} className="alat-link-primary">
                  Buka alat
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </HalamanPublik>
  );
}

export default AlatIndex;