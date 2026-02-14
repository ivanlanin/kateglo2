/**
 * @fileoverview Halaman pencarian/browse kamus — hasil pencarian dari query string ?q=
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus } from '../api/apiPublik';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';
import { updateSearchParams } from '../utils/searchParams';

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
    updateSearchParams(setSearchParams, { q: trimmed });
  };

  const results = data?.data || [];

  return (
    <HalamanDasar judul="Kamus">

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="content-card p-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="pencarian-kamus" className="kamus-search-label">
            Lema
          </label>
          <input
            id="pencarian-kamus"
            type="text"
            placeholder="Ketik kata yang dicari..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="form-input flex-1"
          />
          <button
            type="submit"
            className="btn-primary shrink-0"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Pesan loading / error */}
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data..."
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian — browse index */}
      {!qParam && !isLoading && (
        <div className="content-card p-6">
          <p className="secondary-text mb-4">Gunakan kolom pencarian di atas untuk mencari kata dalam kamus.</p>
          <div className="mb-4">
            <h3 className="section-heading">Menurut abjad:</h3>
            <div className="flex flex-wrap gap-1">
              {'-ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((huruf) => (
                <Link
                  key={huruf}
                  to={`/kamus?q=${huruf === '-' ? '-' : huruf.toLowerCase()}`}
                  className="kamus-abjad-link"
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
        <div className="content-card p-4">
          <h2 className="kamus-result-heading">
            Hasil pencarian &ldquo;{qParam}&rdquo; — {results.length} entri
          </h2>

          {results.length === 0 && <EmptyResultText text="Frasa yang dicari tidak ditemukan. Coba kata lain?" />}

          {results.length > 0 && (
            <div className="result-divider">
              {results.map((item) => (
                <div key={item.phrase} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-2">
                    <Link
                      to={`/kamus/${encodeURIComponent(item.phrase)}`}
                      className="kamus-result-link"
                    >
                      {item.phrase}
                    </Link>
                    {item.lex_class && (
                      <span className="tag-subtle">
                        {item.lex_class}
                      </span>
                    )}
                    {item.actual_phrase && item.actual_phrase !== item.phrase && (
                      <span className="kamus-result-redirect">
                        → {item.actual_phrase}
                      </span>
                    )}
                  </div>
                  {item.definition_preview && (
                    <p className="kamus-result-preview">{item.definition_preview}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </HalamanDasar>
  );
}

export default Kamus;
