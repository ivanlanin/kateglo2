/**
 * @fileoverview Halaman Beranda
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ambilKataHariIni, ambilPencarianPopuler } from '../../api/apiPublik';
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

function formatInfoKataHariIni(kataHariIni = null) {
  if (!kataHariIni || typeof kataHariIni !== 'object') {
    return {
      meta: [],
      etimologi: null,
    };
  }

  const meta = [kataHariIni.kelas_kata, kataHariIni.pemenggalan, kataHariIni.lafal]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  const etimologi = [
    String(kataHariIni.etimologi?.bahasa || '').trim(),
    String(kataHariIni.etimologi?.kata_asal || '').trim(),
  ].filter(Boolean).join(': ');

  return {
    meta,
    etimologi: etimologi || null,
  };
}

function Beranda() {
  const [dataPopuler, setDataPopuler] = useState(null);
  const [kataHariIni, setKataHariIni] = useState(null);

  useEffect(() => {
    document.title = 'Kateglo';
  }, []);

  useEffect(() => {
    let dibatalkan = false;

    async function muatBeranda() {
      const [hasilPopuler, hasilKataHariIni] = await Promise.allSettled([
        ambilPencarianPopuler({ tanggal: tanggalLokalBrowser() }),
        ambilKataHariIni(),
      ]);

      if (dibatalkan) {
        return;
      }

      setDataPopuler(hasilPopuler.status === 'fulfilled' ? (hasilPopuler.value?.data || null) : null);
      setKataHariIni(hasilKataHariIni.status === 'fulfilled' ? (hasilKataHariIni.value || null) : null);
    }

    muatBeranda();

    return () => {
      dibatalkan = true;
    };
  }, []);

  const infoKataHariIni = formatInfoKataHariIni(kataHariIni);

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
      <div className="beranda-sorotan-grid">
        {kataHariIni?.indeks && kataHariIni?.url && kataHariIni?.makna ? (
          <section className="beranda-sorotan-card beranda-sorotan-card-kata" aria-label="Kata Hari Ini">
            <div className="beranda-sorotan-header">
              <div>
                <p className="beranda-sorotan-kicker">Kata Hari Ini</p>
                <h2 className="beranda-sorotan-title">{kataHariIni.entri || kataHariIni.indeks}</h2>
              </div>
              <Link to={kataHariIni.url} className="beranda-sorotan-link">
                Lihat entri
              </Link>
            </div>
            {infoKataHariIni.meta.length > 0 ? (
              <p className="beranda-sorotan-meta">{infoKataHariIni.meta.join(' • ')}</p>
            ) : null}
            <p className="beranda-sorotan-body">{kataHariIni.makna}</p>
            {kataHariIni.contoh ? (
              <p className="beranda-sorotan-example">&quot;{kataHariIni.contoh}&quot;</p>
            ) : null}
            {infoKataHariIni.etimologi ? (
              <p className="beranda-sorotan-footnote">Etimologi: {infoKataHariIni.etimologi}</p>
            ) : null}
          </section>
        ) : null}

        <section className="beranda-sorotan-card beranda-sorotan-card-kuis" aria-label="Kuis Kata">
          <div className="beranda-sorotan-header">
            <div>
              <p className="beranda-sorotan-kicker">Gim Hari Ini</p>
              <h2 className="beranda-sorotan-title">Kuis Kata</h2>
            </div>
            <Link to="/gim/kuis-kata" className="beranda-sorotan-link">
              Buka kuis
            </Link>
          </div>
          <p className="beranda-sorotan-meta">Lima soal singkat lintas kamus, tesaurus, glosarium, makna, dan rima.</p>
          <KuisKata variant="beranda" />
        </section>
      </div>
    </div>
  );
}

export default Beranda;
