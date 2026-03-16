/**
 * @fileoverview Komponen kotak pencarian yang dipakai bersama di Beranda dan Navbar
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { autocomplete } from '../../api/apiPublik';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import {
  daftarAutocompleteEjaan,
  petaAutocompleteEjaan,
  formatJudulEjaanDariSlug,
} from '../../constants/ejaanData';

const opsiKategori = [
  { value: 'kamus', label: 'Kamus', placeholder: 'Cari kata \u2026' },
  { value: 'tesaurus', label: 'Tesaurus', placeholder: 'Cari relasi \u2026' },
  { value: 'glosarium', label: 'Glosarium', placeholder: 'Cari istilah \u2026' },
  { value: 'makna', label: 'Makna', placeholder: 'Cari berdasarkan makna \u2026' },
  { value: 'rima', label: 'Rima', placeholder: 'Cari kata yang berima \u2026' },
  { value: 'ejaan', label: 'Ejaan', placeholder: 'Cari kaidah ejaan \u2026' },
];

function normalisasiPencarianEjaan(teks = '') {
  return String(teks || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function cariAutocompleteEjaan(kata = '') {
  const query = normalisasiPencarianEjaan(kata);
  if (!query) return [];

  return daftarAutocompleteEjaan
    .filter((item) => {
      const nilai = normalisasiPencarianEjaan(item.value);
      return nilai.includes(query) || item.slug.includes(query);
    })
    .slice(0, 8);
}

function cariSlugEjaanDariKata(kata = '') {
  const query = normalisasiPencarianEjaan(kata);
  if (!query) return '';

  const cocokPersis = daftarAutocompleteEjaan.find(
    (item) => normalisasiPencarianEjaan(item.value) === query || item.slug === query
  );

  return cocokPersis?.slug || '';
}

function deteksiKategori(pathname) {
  if (pathname.startsWith('/ejaan')) return 'ejaan';
  if (pathname.startsWith('/makna')) return 'makna';
  if (pathname.startsWith('/rima')) return 'rima';
  if (pathname.startsWith('/tesaurus')) return 'tesaurus';
  if (pathname.startsWith('/glosarium')) return 'glosarium';
  return 'kamus';
}

function ekstrakQuery(pathname) {
  const matchCari = pathname.match(/^\/(kamus|makna|rima|tesaurus|glosarium)\/cari\/(.+)$/);
  if (matchCari) return decodeURIComponent(matchCari[2]);
  const matchEjaan = pathname.match(/^\/ejaan\/([^/]+)$/);
  if (matchEjaan) {
    const slug = decodeURIComponent(matchEjaan[1]);
    return petaAutocompleteEjaan[slug] || formatJudulEjaanDariSlug(slug);
  }
  const matchDetail = pathname.match(/^\/kamus\/detail\/(.+)$/);
  if (matchDetail) return decodeURIComponent(matchDetail[1]);
  const matchGlosariumDetail = pathname.match(/^\/glosarium\/detail\/(.+)$/);
  if (matchGlosariumDetail) return decodeURIComponent(matchGlosariumDetail[1]);
  return '';
}

/**
 * Tebalkan bagian teks yang cocok dengan query pencarian
 */
function SorotTeks({ teks, query, italic = false }) {
  const Tag = italic ? 'em' : 'span';
  if (!query) return <Tag>{teks}</Tag>;

  const idx = teks.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Tag>{teks}</Tag>;

  const sebelum = teks.slice(0, idx);
  const cocok = teks.slice(idx, idx + query.length);
  const sesudah = teks.slice(idx + query.length);

  return (
    <Tag>
      {sebelum}<strong>{cocok}</strong>{sesudah}
    </Tag>
  );
}

function navigasiCari(navigate, kategori, kata) {
  if (kategori === 'ejaan') {
    const slug = cariSlugEjaanDariKata(kata);
    navigate(slug ? `/ejaan/${encodeURIComponent(slug)}` : '/ejaan');
    return;
  }
  navigate(`/${kategori}/cari/${encodeURIComponent(kata)}`);
}

function navigasiSaranSpesifik(navigate, kategori, kata, slug = '') {
  if (kategori === 'kamus') {
    navigate(buatPathDetailKamus(kata));
    return;
  }
  if (kategori === 'ejaan') {
    const slugTarget = String(slug || '').trim() || cariSlugEjaanDariKata(kata);
    navigate(slugTarget ? `/ejaan/${encodeURIComponent(slugTarget)}` : '/ejaan');
    return;
  }
  navigasiCari(navigate, kategori, kata);
}

function KotakCariPublik({ varian = 'navbar', autoFocus = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => ekstrakQuery(location.pathname));
  const [kategori, setKategori] = useState(() => deteksiKategori(location.pathname));
  const [saran, setSaran] = useState([]);
  const [tampilSaran, setTampilSaran] = useState(false);
  const [indeksAktif, setIndeksAktif] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const lewatiSubmitRef = useRef(false);
  const isMountedRef = useRef(true);
  const permintaanTerakhirRef = useRef(0);
  const autoFocusAktif = autoFocus && !location.pathname.startsWith('/gim/susun-kata');

  useEffect(() => {
    setKategori(deteksiKategori(location.pathname));
    setQuery(ekstrakQuery(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (autoFocusAktif && inputRef.current) {
      const id = setTimeout(() => inputRef.current.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [autoFocusAktif]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickLuar(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setTampilSaran(false);
        setIndeksAktif(-1);
      }
    }
    document.addEventListener('mousedown', handleClickLuar);
    return () => document.removeEventListener('mousedown', handleClickLuar);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  const ambilSaran = useCallback(async (kata, kat) => {
    if (kata.length < 1) {
      permintaanTerakhirRef.current += 1;
      setSaran([]);
      setTampilSaran(false);
      return;
    }

    const idPermintaan = ++permintaanTerakhirRef.current;

    try {
      const hasil = kat === 'ejaan'
        ? cariAutocompleteEjaan(kata)
        : await autocomplete(kat, kata);
      if (!isMountedRef.current || idPermintaan !== permintaanTerakhirRef.current) return;
      setSaran(hasil);
      setTampilSaran(hasil.length > 0);
      setIndeksAktif(-1);
    } catch {
      if (!isMountedRef.current || idPermintaan !== permintaanTerakhirRef.current) return;
      setSaran([]);
      setTampilSaran(false);
    }
  }, []);

  const handleChange = (e) => {
    const nilai = e.target.value;
    setQuery(nilai);
    clearTimeout(timerRef.current);
    if (kategori !== 'makna') {
      timerRef.current = setTimeout(() => ambilSaran(nilai.trim(), kategori), 300);
    }
  };

  const handleHapus = () => {
    setQuery('');
    setSaran([]);
    setTampilSaran(false);
    setIndeksAktif(-1);
  };

  const handlePilihSaran = (item) => {
    const nilaiPilihan = (kategori === 'glosarium' && item.asing) ? item.asing : item.value;
    setQuery(nilaiPilihan);
    setSaran([]);
    setTampilSaran(false);
    setIndeksAktif(-1);
    navigasiSaranSpesifik(navigate, kategori, nilaiPilihan, item.slug);
  };

  const handleCari = (e) => {
    e.preventDefault();
    if (lewatiSubmitRef.current) {
      lewatiSubmitRef.current = false;
      return;
    }
    const trimmed = query.trim();
    if (!trimmed) return;
    setTampilSaran(false);
    setIndeksAktif(-1);
    navigasiCari(navigate, kategori, trimmed);
  };

  const handleKeyDown = (e) => {
    if (!tampilSaran || saran.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndeksAktif((prev) => (prev < saran.length - 1 ? prev + 1 : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndeksAktif((prev) => {
        if (prev === -1) return saran.length - 1;
        return prev > 0 ? prev - 1 : -1;
      });
    } else if (e.key === 'Enter' && indeksAktif >= 0) {
      e.preventDefault();
      lewatiSubmitRef.current = true;
      handlePilihSaran(saran[indeksAktif]);
    } else if (e.key === 'Escape') {
      setTampilSaran(false);
      setIndeksAktif(-1);
    }
  };

  const handleGantiKategori = (e) => {
    const kat = e.target.value;
    setKategori(kat);
    setSaran([]);
    setTampilSaran(false);
    clearTimeout(timerRef.current);
    if (query.trim().length >= 1 && kat !== 'makna') {
      timerRef.current = setTimeout(() => ambilSaran(query.trim(), kat), 300);
    }
  };

  const adalahBeranda = varian === 'beranda';
  const placeholder = opsiKategori.find((o) => o.value === kategori)?.placeholder;

  return (
    <form
      ref={wrapperRef}
      onSubmit={handleCari}
      className={adalahBeranda ? 'kotak-cari kotak-cari-beranda' : 'kotak-cari kotak-cari-navbar'}
    >
      <select
        value={kategori}
        onChange={handleGantiKategori}
        className="kotak-cari-select"
      >
        {opsiKategori.map((opsi) => (
          <option key={opsi.value} value={opsi.value}>{opsi.label}</option>
        ))}
      </select>
      <div className="kotak-cari-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => saran.length > 0 && setTampilSaran(true)}
          className="kotak-cari-input"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleHapus}
            className="kotak-cari-hapus"
            aria-label="Hapus"
          >
            ×
          </button>
        )}
        {tampilSaran && saran.length > 0 && (
          <ul className="kotak-cari-saran" role="listbox" onMouseLeave={() => setIndeksAktif(-1)}>
            {saran.map((item, idx) => (
              <li
                key={item.slug || item.value}
                role="option"
                aria-selected={idx === indeksAktif}
                className={`kotak-cari-saran-item${idx === indeksAktif ? ' kotak-cari-saran-item-aktif' : ''}`}
                onMouseDown={() => handlePilihSaran(item)}
                onMouseEnter={() => setIndeksAktif(idx)}
              >
                {kategori === 'glosarium' && item.asing ? (
                  <>
                    <SorotTeks teks={item.asing} query={query} italic />
                    {' ('}
                    <SorotTeks teks={item.value} query={query} />
                    {')'}
                  </>
                ) : (
                  <>
                    <SorotTeks teks={item.value} query={query} />
                    {item.asing && (
                      <> (<SorotTeks teks={item.asing} query={query} italic />)</>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="kotak-cari-tombol" aria-label="Cari">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}

export {
  deteksiKategori,
  ekstrakQuery,
  SorotTeks,
  navigasiCari,
  navigasiSaranSpesifik,
};

export default KotakCariPublik;
