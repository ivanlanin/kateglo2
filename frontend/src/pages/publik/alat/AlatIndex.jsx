/**
 * @fileoverview Halaman indeks alat publik Kateglo.
 */

import { Link } from 'react-router-dom';
import HalamanPublik from '../../../components/publik/HalamanPublik';

const daftarAlat = [
  {
    slug: 'penganalisis-teks',
    judul: 'Penganalisis Teks',
    deskripsi: 'Hitung jumlah paragraf, kalimat, dan kata dari teks bahasa Indonesia secara cepat.',
  },
  {
    slug: 'penghitung-huruf',
    judul: 'Penghitung Huruf',
    deskripsi: 'Hitung frekuensi huruf a-z, tampilkan tabel persentase, dan lihat grafik batang distribusinya.',
  },
];

function AlatIndex() {
  return (
    <HalamanPublik
      judul="Alat"
      deskripsi="Kumpulan alat bahasa Indonesia di Kateglo. Saat ini tersedia Penganalisis Teks dan halaman ini siap menampung alat berikutnya."
      tampilkanJudul={false}
    >
      <div className="alat-page">
        <h1 className="alat-title">Alat</h1>

        <section className="alat-list-grid" aria-label="Daftar alat">
          {daftarAlat.map((alat) => (
            <article key={alat.slug} className="alat-card">
              <h2 className="alat-card-title">{alat.judul}</h2>
              <p className="alat-card-description">{alat.deskripsi}</p>
              <div className="alat-card-actions">
                <Link to={`/alat/${alat.slug}`} className="alat-link-primary">
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