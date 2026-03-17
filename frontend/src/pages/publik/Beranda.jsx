/**
 * @fileoverview Halaman Beranda
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ambilPencarianPopuler } from '../../api/apiPublik';
import KotakCariPublik from '../../components/formulir/KotakCariPublik';
import KuisKata from '../../components/gim/KuisKata';
import { buatPathDetailKamus } from '../../utils/paramUtils';

const daftarDomain = [
  { key: 'kamus', buildPath: (kata) => buatPathDetailKamus(kata) },
  { key: 'tesaurus', path: '/tesaurus/cari/' },
  { key: 'glosarium', buildPath: (kata) => `/glosarium/detail/${encodeURIComponent(kata)}` },
  { key: 'makna', path: '/makna/cari/' },
  { key: 'rima', path: '/rima/cari/' },
];

function buatPathPopuler(item, kata) {
  if (typeof item.buildPath === 'function') {
    return item.buildPath(kata);
  }
  return `${item.path}${encodeURIComponent(kata)}`;
}

function formatLabelPopuler(kata) {
  const kataAman = String(kata).trim();
  const daftarKata = kataAman.split(/\s+/).filter(Boolean);

  if (daftarKata.length <= 2) {
    return {
      teks: kataAman,
      judul: undefined,
    };
  }

  return {
    teks: `${daftarKata[0]} ...`,
    judul: kataAman,
  };
}

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
        <KotakCariPublik varian="beranda" autoFocus />
        <div className="beranda-populer-wrapper" aria-label="Pencarian populer">
          <span className="beranda-populer-label">Populer:</span>
          {daftarDomain.map((item) => {
            const kata = dataPopuler?.[item.key];
            if (!kata) {
              return (
                <span key={item.key} className="beranda-populer-placeholder">{item.key}</span>
              );
            }

            const label = formatLabelPopuler(kata);

            return (
              <Link
                key={item.key}
                to={buatPathPopuler(item, kata)}
                className="beranda-tag-link"
                title={label.judul}
                aria-label={label.judul || kata}
              >
                {label.teks}
              </Link>
            );
          })}
        </div>
      </div>
      <KuisKata />
    </div>
  );
}

export default Beranda;
