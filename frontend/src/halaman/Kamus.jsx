/**
 * @fileoverview Halaman pencarian/browse kamus — hasil pencarian dari query string ?q=
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus } from '../api/apiPublik';

function Kamus() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const [inputQuery, setInputQuery] = useState(qParam);

  useEffect(() => {
    setInputQuery(qParam);
  }, [qParam]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cari-kamus', qParam],
    queryFn: () => cariKamus(qParam, 50),
    enabled: Boolean(qParam),
  });

  const handleCari = (e) => {
    e.preventDefault();
    const trimmed = inputQuery.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
  };

  const results = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kamus</h1>

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="pencarian-kamus" className="text-sm font-medium text-gray-700 shrink-0">
            Lema
          </label>
          <input
            id="pencarian-kamus"
            type="text"
            placeholder="Ketik kata yang dicari..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shrink-0"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Pesan loading / error */}
      {isLoading && <p className="text-gray-600">Mencari data...</p>}
      {isError && <p className="text-red-600">Gagal mengambil data. Coba lagi.</p>}

      {/* Tanpa pencarian — browse index */}
      {!qParam && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 mb-4">Gunakan kolom pencarian di atas untuk mencari kata dalam kamus.</p>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Menurut abjad:</h3>
            <div className="flex flex-wrap gap-1">
              {'-ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((huruf) => (
                <Link
                  key={huruf}
                  to={`/kamus?q=${huruf === '-' ? '-' : huruf.toLowerCase()}`}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {huruf}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hasil pencarian */}
      {qParam && !isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">
            Hasil pencarian &ldquo;{qParam}&rdquo; — {results.length} entri
          </h2>

          {results.length === 0 && (
            <p className="text-gray-500">Frasa yang dicari tidak ditemukan. Coba kata lain?</p>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-gray-100">
              {results.map((item) => (
                <div key={item.phrase} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-2">
                    <Link
                      to={`/kamus/${encodeURIComponent(item.phrase)}`}
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      {item.phrase}
                    </Link>
                    {item.lex_class && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {item.lex_class}
                      </span>
                    )}
                    {item.actual_phrase && item.actual_phrase !== item.phrase && (
                      <span className="text-xs text-gray-500">
                        → {item.actual_phrase}
                      </span>
                    )}
                  </div>
                  {item.definition_preview && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.definition_preview}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Kamus;
