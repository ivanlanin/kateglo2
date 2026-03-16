/**
 * @fileoverview Halaman indeks gim publik Kateglo.
 */

import { Link } from 'react-router-dom';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';

const daftarGim = [
  {
    slug: 'kuis-kata',
    judul: 'Kuis Kata',
    deskripsi: 'Jawab soal pilihan ganda dari kamus, tesaurus, glosarium, makna, dan rima dalam satu ronde cepat.',
  },
  {
    slug: 'susun-kata',
    judul: 'Susun Kata',
    deskripsi: 'Tebak kata bahasa Indonesia dalam enam percobaan dengan mode harian dan bebas.',
  },
];

function GimIndex() {
  return (
    <HalamanPublik
      judul="Gim"
      deskripsi="Kumpulan gim kata di Kateglo. Saat ini tersedia Kuis Kata dan Susun Kata untuk latihan bahasa Indonesia yang singkat dan interaktif."
      tampilkanJudul={false}
    >
      <div className="gim-page">
        <h1 className="gim-title">Gim</h1>

        <section className="gim-list-grid" aria-label="Daftar gim">
          {daftarGim.map((gim) => (
            <article key={gim.slug} className="gim-card">
              <h2 className="gim-card-title">{gim.judul}</h2>
              <p className="gim-card-description">{gim.deskripsi}</p>
              <div className="gim-card-actions">
                <Link
                  to={gim.slug === 'susun-kata' ? '/gim/susun-kata/harian' : `/gim/${gim.slug}`}
                  className="alat-link-primary"
                >
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