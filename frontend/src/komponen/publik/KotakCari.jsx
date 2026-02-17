/**
 * @fileoverview Komponen kotak pencarian yang dipakai bersama di Beranda dan Navbar
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { autocomplete } from '../../api/apiPublik';
import { buatPathDetailKamus } from '../../utils/kamusIndex';

const opsiKategori = [
  { value: 'kamus', label: 'Kamus', placeholder: 'Cari kata \u2026' },
  { value: 'tesaurus', label: 'Tesaurus', placeholder: 'Cari relasi \u2026' },
  { value: 'glosarium', label: 'Glosarium', placeholder: 'Cari istilah \u2026' },
];

function deteksiKategori(pathname) {
  if (pathname.startsWith('/tesaurus')) return 'tesaurus';
  if (pathname.startsWith('/glosarium')) return 'glosarium';
  return 'kamus';
}

function ekstrakQuery(pathname) {
  const match = pathname.match(/^\/(kamus|tesaurus|glosarium)\/cari\/(.+)$/);
  if (match) return decodeURIComponent(match[2]);
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
  navigate(`/${kategori}/cari/${encodeURIComponent(kata)}`);
}

function navigasiSaranSpesifik(navigate, kategori, kata) {
  if (kategori === 'kamus') {
    navigate(buatPathDetailKamus(kata));
    return;
  }
  navigasiCari(navigate, kategori, kata);
}

function KotakCari({ varian = 'navbar', autoFocus = true }) {
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

  useEffect(() => {
    setKategori(deteksiKategori(location.pathname));
    setQuery(ekstrakQuery(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const id = setTimeout(() => inputRef.current.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [autoFocus]);

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

  useEffect(() => () => {
    isMountedRef.current = false;
    clearTimeout(timerRef.current);
  }, []);

  const ambilSaran = useCallback(async (kata, kat) => {
    if (kata.length < 2) {
      setSaran([]);
      setTampilSaran(false);
      return;
    }
    try {
      const hasil = await autocomplete(kat, kata);
      /* c8 ignore next */
      if (!isMountedRef.current) return;
      setSaran(hasil);
      setTampilSaran(hasil.length > 0);
      setIndeksAktif(-1);
    } catch {
      /* c8 ignore next */
      if (!isMountedRef.current) return;
      setSaran([]);
      setTampilSaran(false);
    }
  }, []);

  const handleChange = (e) => {
    const nilai = e.target.value;
    setQuery(nilai);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => ambilSaran(nilai.trim(), kategori), 300);
  };

  const handleHapus = () => {
    setQuery('');
    setSaran([]);
    setTampilSaran(false);
    setIndeksAktif(-1);
  };

  const handlePilihSaran = (item) => {
    setQuery(item.value);
    setSaran([]);
    setTampilSaran(false);
    setIndeksAktif(-1);
    navigasiSaranSpesifik(navigate, kategori, item.value);
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
    if (query.trim().length >= 2) {
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
                key={item.value}
                role="option"
                aria-selected={idx === indeksAktif}
                className={`kotak-cari-saran-item${idx === indeksAktif ? ' kotak-cari-saran-item-aktif' : ''}`}
                onMouseDown={() => handlePilihSaran(item)}
                onMouseEnter={() => setIndeksAktif(idx)}
              >
                <SorotTeks teks={item.value} query={query} />
                {item.asing && (
                  <> (<SorotTeks teks={item.asing} query={query} italic />)</>
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

export default KotakCari;
