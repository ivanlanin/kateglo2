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
    status: 'Tersedia',
  },
  {
    slug: 'penghitung-huruf',
    judul: 'Penghitung Huruf',
    deskripsi: 'Hitung frekuensi huruf a-z, tampilkan tabel persentase, dan lihat grafik batang distribusinya.',
    status: 'Tersedia',
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
        <section className="alat-hero">
          <p className="alat-kicker">Alat Bahasa</p>
          <h1 className="alat-title">Kumpulan alat bantu bahasa Indonesia</h1>
          <p className="alat-description">
            Halaman ini disiapkan sebagai tempat untuk menampung berbagai alat yang nanti akan ditambahkan.
            Untuk sementara baru tersedia satu alat yang sudah dipindahkan ke implementasi lokal Kateglo.
          </p>
        </section>

        <section className="alat-list-grid" aria-label="Daftar alat">
          {daftarAlat.map((alat) => (
            <article key={alat.slug} className="alat-card">
              <div className="alat-card-top">
                <span className="alat-card-status">{alat.status}</span>
              </div>
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