/**
 * @fileoverview Halaman Beranda — statistik, lema acak, salah eja, kata populer
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDataBeranda } from '../api/apiPublik';

function Beranda() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['beranda'],
    queryFn: ambilDataBeranda,
    staleTime: 60 * 1000,
  });

  const handleCari = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/kamus?q=${encodeURIComponent(trimmed)}`);
  };

  const statistik = data?.statistik;
  const lemaAcak = data?.lemaAcak || [];
  const salahEja = data?.salahEja || [];
  const populer = data?.populer || [];

  return (
    <div className="beranda-container">
      {/* Hero / Jumbotron */}
      <div className="beranda-hero">
        <h1 className="beranda-title">Kateglo</h1>
        <p className="beranda-subtitle">
          Kamus, tesaurus, dan glosarium bahasa Indonesia
        </p>
        {statistik && (
          <p className="beranda-stats">
            <Link to="/kamus" className="beranda-stats-link">{statistik.kamus.toLocaleString('id-ID')} lema</Link>,{' '}
            <Link to="/glosarium" className="beranda-stats-link">{statistik.glosarium.toLocaleString('id-ID')} glosarium</Link>,{' '}
            <Link to="/peribahasa" className="beranda-stats-link">{statistik.peribahasa.toLocaleString('id-ID')} peribahasa</Link>,{' '}
            <Link to="/singkatan" className="beranda-stats-link">{statistik.singkatan.toLocaleString('id-ID')} singkatan</Link>
          </p>
        )}

        {/* Pencarian Utama */}
        <form onSubmit={handleCari} className="beranda-search-form">
          <input
            type="text"
            placeholder="Cari kata dalam kamus..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="beranda-search-input"
          />
          <button
            type="submit"
            className="beranda-search-button"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Kartu fitur */}
      <div className="beranda-feature-grid">
        <Link to="/kamus" className="beranda-feature-card">
          <div className="beranda-feature-icon">📖</div>
          <h3 className="beranda-feature-title">Kamus</h3>
          <p className="beranda-feature-desc">Definisi dan makna kata</p>
        </Link>
        <Link to="/kamus" className="beranda-feature-card">
          <div className="beranda-feature-icon">🔗</div>
          <h3 className="beranda-feature-title">Tesaurus</h3>
          <p className="beranda-feature-desc">Sinonim, antonim, dan relasi kata</p>
        </Link>
        <Link to="/glosarium" className="beranda-feature-card">
          <div className="beranda-feature-icon">🌐</div>
          <h3 className="beranda-feature-title">Glosarium</h3>
          <p className="beranda-feature-desc">Istilah teknis dari berbagai bidang</p>
        </Link>
        <Link to="/peribahasa" className="beranda-feature-card">
          <div className="beranda-feature-icon">💬</div>
          <h3 className="beranda-feature-title">Peribahasa</h3>
          <p className="beranda-feature-desc">Pepatah dan peribahasa Indonesia</p>
        </Link>
      </div>

      {/* Lema Acak & Info */}
      {!isLoading && (
        <div className="beranda-info-grid">
          {/* Lema Acak */}
          {lemaAcak.length > 0 && (
            <div className="beranda-info-card">
              <h3 className="beranda-info-title">Lema Acak</h3>
              <div className="beranda-tag-list">
                {lemaAcak.map((item) => (
                  <Link
                    key={item.phrase}
                    to={`/kamus/${encodeURIComponent(item.phrase)}`}
                    className="beranda-tag-link"
                  >
                    {item.phrase}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Salah Eja */}
          {salahEja.length > 0 && (
            <div className="beranda-info-card">
              <h3 className="beranda-info-title">Salah Eja</h3>
              <ul className="beranda-list">
                {salahEja.map((item) => (
                  <li key={item.phrase} className="beranda-list-item">
                    <Link
                      to={`/kamus/${encodeURIComponent(item.actual_phrase)}`}
                      className="beranda-correct-link"
                    >
                      ✓ {item.actual_phrase}
                    </Link>
                    <span className="beranda-list-separator">bukan</span>
                    <span className="beranda-wrong-text">{item.phrase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Kata Populer */}
          {populer.length > 0 && (
            <div className="beranda-info-card">
              <h3 className="beranda-info-title">Paling Dicari</h3>
              <ol className="beranda-ordered-list">
                {populer.map((item) => (
                  <li key={item.phrase}>
                    <Link
                      to={`/kamus/${encodeURIComponent(item.phrase)}`}
                      className="beranda-popular-link"
                    >
                      {item.phrase}
                    </Link>
                    <span className="beranda-list-separator">({item.search_count.toLocaleString('id-ID')}×)</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Beranda;
