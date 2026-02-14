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
    <div className="container mx-auto px-4">
      {/* Hero / Jumbotron */}
      <div className="text-center py-16 md:py-24">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Kateglo</h1>
        <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
          Kamus, tesaurus, dan glosarium bahasa Indonesia
        </p>
        {statistik && (
          <p className="text-sm text-gray-500 mb-8">
            <Link to="/kamus" className="text-blue-600 hover:underline">{statistik.kamus.toLocaleString('id-ID')} lema</Link>,{' '}
            <Link to="/glosarium" className="text-blue-600 hover:underline">{statistik.glosarium.toLocaleString('id-ID')} glosarium</Link>,{' '}
            <Link to="/peribahasa" className="text-blue-600 hover:underline">{statistik.peribahasa.toLocaleString('id-ID')} peribahasa</Link>,{' '}
            <Link to="/singkatan" className="text-blue-600 hover:underline">{statistik.singkatan.toLocaleString('id-ID')} singkatan</Link>
          </p>
        )}

        {/* Pencarian Utama */}
        <form onSubmit={handleCari} className="max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder="Cari kata dalam kamus..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Kartu fitur */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <Link to="/kamus" className="group p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="text-3xl mb-2">📖</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Kamus</h3>
          <p className="text-sm text-gray-500 mt-1">Definisi dan makna kata</p>
        </Link>
        <Link to="/kamus" className="group p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="text-3xl mb-2">🔗</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Tesaurus</h3>
          <p className="text-sm text-gray-500 mt-1">Sinonim, antonim, dan relasi kata</p>
        </Link>
        <Link to="/glosarium" className="group p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="text-3xl mb-2">🌐</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Glosarium</h3>
          <p className="text-sm text-gray-500 mt-1">Istilah teknis dari berbagai bidang</p>
        </Link>
        <Link to="/peribahasa" className="group p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Peribahasa</h3>
          <p className="text-sm text-gray-500 mt-1">Pepatah dan peribahasa Indonesia</p>
        </Link>
      </div>

      {/* Lema Acak & Info */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Lema Acak */}
          {lemaAcak.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Lema Acak</h3>
              <div className="flex flex-wrap gap-2">
                {lemaAcak.map((item) => (
                  <Link
                    key={item.phrase}
                    to={`/kamus/${encodeURIComponent(item.phrase)}`}
                    className="inline-block px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {item.phrase}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Salah Eja */}
          {salahEja.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Salah Eja</h3>
              <ul className="space-y-2 text-sm">
                {salahEja.map((item) => (
                  <li key={item.phrase} className="flex items-center gap-2">
                    <Link
                      to={`/kamus/${encodeURIComponent(item.actual_phrase)}`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      ✓ {item.actual_phrase}
                    </Link>
                    <span className="text-gray-400">bukan</span>
                    <span className="text-red-600 line-through">{item.phrase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Kata Populer */}
          {populer.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Paling Dicari</h3>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                {populer.map((item) => (
                  <li key={item.phrase}>
                    <Link
                      to={`/kamus/${encodeURIComponent(item.phrase)}`}
                      className="text-blue-700 hover:underline"
                    >
                      {item.phrase}
                    </Link>
                    <span className="text-gray-400 ml-1">({item.search_count.toLocaleString('id-ID')}×)</span>
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
