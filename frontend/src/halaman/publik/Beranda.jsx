/**
 * @fileoverview Halaman Beranda
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ambilPencarianPopuler } from '../../api/apiPublik';
import KotakCari from '../../komponen/publik/KotakCari';

const daftarDomain = [
  { key: 'kamus', path: '/kamus/cari/' },
  { key: 'tesaurus', path: '/tesaurus/cari/' },
  { key: 'glosarium', path: '/glosarium/cari/' },
  { key: 'makna', path: '/makna/cari/' },
  { key: 'rima', path: '/rima/cari/' },
];

function tanggalLokalBrowser() {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, '0');
  const tanggal = String(now.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${tanggal}`;
}

function Beranda() {
  const [dataPopuler, setDataPopuler] = useState(null);

  useEffect(() => {
    document.title = 'Kateglo';
  }, []);

  useEffect(() => {
    let dibatalkan = false;

    async function muatPopuler() {
      try {
        const result = await ambilPencarianPopuler({ tanggal: tanggalLokalBrowser() });
        if (!dibatalkan) {
          setDataPopuler(result?.data || null);
        }
      } catch {
        if (!dibatalkan) {
          setDataPopuler(null);
        }
      }
    }

    muatPopuler();

    return () => {
      dibatalkan = true;
    };
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
        <div className="beranda-populer-wrapper" aria-label="Pencarian populer">
          <span className="beranda-populer-label">Populer:</span>
          <div className="beranda-populer-list">
            {daftarDomain.map((item) => {
              const kata = dataPopuler?.[item.key];
              if (!kata) {
                return (
                  <span key={item.key} className="beranda-populer-placeholder">{item.key}</span>
                );
              }

              return (
                <Link
                  key={item.key}
                  to={`${item.path}${encodeURIComponent(kata)}`}
                  className="beranda-tag-link"
                >
                  {kata}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Beranda;
