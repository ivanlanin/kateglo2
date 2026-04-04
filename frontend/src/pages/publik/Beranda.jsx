/**
 * @fileoverview Halaman Beranda
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ambilKataHariIni, ambilPencarianPopuler } from '../../api/apiPublik';
import KotakCariPublik from '../../components/formulir/KotakCariPublik';
import KuisKata from '../../components/gim/KuisKata';
import '../../styles/gim.css';
import TombolLafal from '../../components/tombol/TombolLafal';
import { formatLemaHomonim } from '../../utils/formatUtils';
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
    teks: `${daftarKata[0]} …`,
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

function bentukLemaKataHariIni(kataHariIni = null) {
  const entri = String(kataHariIni?.entri || kataHariIni?.indeks || '').trim();
  const homonim = Number(kataHariIni?.homonim);

  if (!entri) {
    return '';
  }

  if (/\(\d+\)\s*$/.test(entri)) {
    return entri;
  }

  if (Number.isFinite(homonim) && homonim > 0) {
    return `${entri} (${homonim})`;
  }

  return entri;
}

function ambilDaftarMaknaKataHariIni(kataHariIni = null) {
  const daftarMakna = Array.isArray(kataHariIni?.daftar_makna)
    ? kataHariIni.daftar_makna
      .map((item) => ({
        makna: String(item?.makna || '').trim(),
        contoh: String(item?.contoh || '').trim(),
      }))
      .filter((item) => item.makna)
    : [];

  if (daftarMakna.length > 0) {
    return daftarMakna;
  }

  const makna = String(kataHariIni?.makna || '').trim();
  if (!makna) {
    return [];
  }

  return [{
    makna,
    contoh: String(kataHariIni?.contoh || '').trim(),
  }];
}

function renderRingkasanMaknaKataHariIni(kataHariIni = null) {
  const daftarMakna = ambilDaftarMaknaKataHariIni(kataHariIni);

  if (daftarMakna.length === 0) {
    return null;
  }

  if (daftarMakna.length === 1) {
    return (
      <>
        {daftarMakna[0].makna}
        {daftarMakna[0].contoh ? (
          <span>
            {': '}
            <span className="kamus-detail-def-sample">{daftarMakna[0].contoh}</span>
          </span>
        ) : null}
      </>
    );
  }

  return daftarMakna.map((item, index) => (
    <span key={`${item.makna}-${index}`}>
      {index > 0 ? '; ' : ''}
      {`(${index + 1}) ${item.makna}`}
      {item.contoh ? (
        <span>
          {': '}
          <span className="kamus-detail-def-sample">{item.contoh}</span>
        </span>
      ) : null}
    </span>
  ));
}

function renderEtimologiKataHariIni(kataHariIni = null) {
  const bahasa = String(kataHariIni?.etimologi?.bahasa || '').trim();
  const kataAsal = String(kataHariIni?.etimologi?.kata_asal || '').trim();

  if (!bahasa && !kataAsal) {
    return null;
  }

  return (
    <>
      Etimologi:{' '}
      {kataAsal ? <em>{kataAsal}</em> : null}
      {kataAsal && bahasa ? ' ' : ''}
      {bahasa ? (kataAsal ? `(${bahasa})` : bahasa) : ''}
    </>
  );
}

function Beranda() {
  const [dataPopuler, setDataPopuler] = useState(null);
  const [kataHariIni, setKataHariIni] = useState(null);
  const [statusKataHariIni, setStatusKataHariIni] = useState('loading');

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
      if (hasilKataHariIni.status === 'fulfilled' && hasilKataHariIni.value) {
        setKataHariIni(hasilKataHariIni.value);
        setStatusKataHariIni('ready');
      } else {
        setKataHariIni(null);
        setStatusKataHariIni('error');
      }
    }

    muatBeranda();

    return () => {
      dibatalkan = true;
    };
  }, []);

  const lemaKataHariIni = bentukLemaKataHariIni(kataHariIni);
  const kataLafalKataHariIni = String(kataHariIni?.entri || kataHariIni?.indeks || '').trim();
  const ringkasanMaknaKataHariIni = renderRingkasanMaknaKataHariIni(kataHariIni);
  const etimologiKataHariIni = renderEtimologiKataHariIni(kataHariIni);

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
        <section className="beranda-sorotan-card beranda-sorotan-card-kata" aria-label="Kata Hari Ini" aria-busy={statusKataHariIni === 'loading'}>
          <div className="beranda-sorotan-header">
            <div className="beranda-sorotan-heading">
              <p className="beranda-sorotan-kicker">Kata Hari Ini</p>
              <div className="beranda-sorotan-title-row">
                {statusKataHariIni === 'ready' && lemaKataHariIni ? (
                  <h2 className="beranda-sorotan-title">
                    {kataHariIni?.url ? (
                      <Link to={kataHariIni.url} className="beranda-stats-link">
                        {formatLemaHomonim(lemaKataHariIni)}
                      </Link>
                    ) : (
                      formatLemaHomonim(lemaKataHariIni)
                    )}
                  </h2>
                ) : (
                  <div className="beranda-sorotan-placeholder-title" aria-hidden="true" />
                )}
                {statusKataHariIni === 'ready' && kataLafalKataHariIni ? (
                  <TombolLafal kata={kataLafalKataHariIni} size="large" />
                ) : null}
              </div>
            </div>

            <div className="beranda-sorotan-actions">
              <a href="/kamus/acak" className="alat-link-primary beranda-sorotan-action-button">
                Entri acak
              </a>
            </div>
          </div>

          {statusKataHariIni === 'ready' && ringkasanMaknaKataHariIni ? (
            <p className="beranda-sorotan-body">{ringkasanMaknaKataHariIni}</p>
          ) : null}

          {statusKataHariIni === 'loading' ? (
            <div className="beranda-sorotan-placeholder" aria-hidden="true">
              <span className="beranda-sorotan-placeholder-line beranda-sorotan-placeholder-line-wide" />
              <span className="beranda-sorotan-placeholder-line" />
              <span className="beranda-sorotan-placeholder-line beranda-sorotan-placeholder-line-short" />
            </div>
          ) : null}

          {statusKataHariIni === 'error' ? (
            <p className="beranda-sorotan-meta">Data kata hari ini belum tersedia.</p>
          ) : null}

          {statusKataHariIni === 'ready' && etimologiKataHariIni ? (
            <p className="beranda-sorotan-footnote">{etimologiKataHariIni}</p>
          ) : null}
        </section>

        <section className="beranda-sorotan-card beranda-sorotan-card-kuis" aria-label="Kuis Kata">
          <div className="beranda-sorotan-header">
            <p className="beranda-sorotan-kicker">Kuis Kata</p>
          </div>
          <KuisKata />
        </section>
      </div>
    </div>
  );
}

export default Beranda;
