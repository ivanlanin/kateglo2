/**
 * @fileoverview Komponen kotak pencarian yang dipakai bersama di Beranda dan Navbar
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const opsiKategori = [
  { value: 'kamus', label: 'Kamus' },
  { value: 'tesaurus', label: 'Tesaurus' },
  { value: 'glosarium', label: 'Glosarium' },
];

function deteksiKategori(pathname) {
  if (pathname.startsWith('/tesaurus')) return 'tesaurus';
  if (pathname.startsWith('/glosarium')) return 'glosarium';
  return 'kamus';
}

function KotakCari({ varian = 'navbar' }) {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [kategori, setKategori] = useState(() => deteksiKategori(location.pathname));
  const navigate = useNavigate();

  useEffect(() => {
    setKategori(deteksiKategori(location.pathname));
  }, [location.pathname]);

  const handleCari = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (kategori === 'glosarium') {
      navigate(`/glosarium?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(`/${kategori}/cari/${encodeURIComponent(trimmed)}`);
    }
  };

  const adalahBeranda = varian === 'beranda';

  return (
    <form onSubmit={handleCari} className={adalahBeranda ? 'kotak-cari kotak-cari-beranda' : 'kotak-cari kotak-cari-navbar'}>
      <select
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
        className="kotak-cari-select"
      >
        {opsiKategori.map((opsi) => (
          <option key={opsi.value} value={opsi.value}>{opsi.label}</option>
        ))}
      </select>
      <div className="kotak-cari-input-wrapper">
        <input
          type="text"
          placeholder="Cari kata..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="kotak-cari-input"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="kotak-cari-hapus"
            aria-label="Hapus"
          >
            ×
          </button>
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

export default KotakCari;
