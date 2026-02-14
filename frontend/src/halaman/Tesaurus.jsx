/**
 * @fileoverview Halaman pencarian tesaurus — path-based: /tesaurus/cari/:kata
 */

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariTesaurus } from '../api/apiPublik';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';

function Tesaurus() {
  const { kata } = useParams();
  const navigate = useNavigate();
  const [inputQuery, setInputQuery] = useState(kata || '');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cari-tesaurus', kata],
    queryFn: () => cariTesaurus(kata),
    enabled: Boolean(kata),
  });

  const handleCari = (e) => {
    e.preventDefault();
    const trimmed = inputQuery.trim();
    if (!trimmed) return;
    navigate(`/tesaurus/cari/${encodeURIComponent(trimmed)}`);
  };

  const results = data?.data || [];

  return (
    <HalamanDasar judul="Tesaurus">

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="content-card p-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="pencarian-tesaurus" className="kamus-search-label">
            Kata
          </label>
          <input
            id="pencarian-tesaurus"
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

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data..."
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian */}
      {!kata && !isLoading && (
        <div className="content-card p-6">
          <p className="secondary-text">Gunakan kolom pencarian di atas untuk mencari sinonim, antonim, dan relasi kata.</p>
        </div>
      )}

      {/* Hasil pencarian */}
      {kata && !isLoading && !isError && (
        <div className="content-card p-4">
          <h2 className="kamus-result-heading">
            Hasil pencarian &ldquo;{kata}&rdquo; — {results.length} entri
          </h2>

          {results.length === 0 && <EmptyResultText text="Kata tidak ditemukan di tesaurus. Coba kata lain?" />}

          {results.length > 0 && (
            <div className="result-divider">
              {results.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/tesaurus/${encodeURIComponent(item.lema)}`}
                    className="kamus-result-link"
                  >
                    {item.lema}
                  </Link>
                  {item.sinonim && (
                    <p className="kamus-result-preview">
                      Sinonim: {item.sinonim.split(';').slice(0, 5).join('; ')}
                      {item.sinonim.split(';').length > 5 && ' ...'}
                    </p>
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

export default Tesaurus;
