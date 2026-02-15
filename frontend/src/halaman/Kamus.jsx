/**
 * @fileoverview Halaman pencarian/browse kamus — path-based: /kamus/cari/:kata
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus } from '../api/apiPublik';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';

function Kamus() {
  const { kata } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cari-kamus', kata],
    queryFn: () => cariKamus(kata),
    enabled: Boolean(kata),
  });

  const results = data?.data || [];

  return (
    <HalamanDasar judul={kata ? `Cari "${decodeURIComponent(kata)}" — Kamus` : 'Kamus'}>

      {/* Pesan loading / error */}
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data..."
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian — browse index */}
      {!kata && !isLoading && (
        <div className="content-card p-6">
          <p className="secondary-text mb-4">Gunakan kolom pencarian di atas untuk mencari kata dalam kamus.</p>
          <div className="mb-4">
            <h3 className="section-heading">Menurut abjad:</h3>
            <div className="flex flex-wrap gap-1">
              {'-ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((huruf) => (
                <Link
                  key={huruf}
                  to={`/kamus/cari/${huruf === '-' ? '-' : huruf.toLowerCase()}`}
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
      {kata && !isLoading && !isError && (
        <div className="content-card p-4">
          <h2 className="kamus-result-heading">
            Hasil pencarian &ldquo;{kata}&rdquo; — {results.length} entri
          </h2>

          {results.length === 0 && <EmptyResultText text="Lema yang dicari tidak ditemukan. Coba kata lain?" />}

          {results.length > 0 && (
            <div className="result-divider">
              {results.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-2">
                    <Link
                      to={`/kamus/detail/${encodeURIComponent(item.lema)}`}
                      className="kamus-result-link"
                    >
                      {item.lema}
                    </Link>
                    {item.preview_kelas_kata && (
                      <span className="tag-subtle">
                        {item.preview_kelas_kata}
                      </span>
                    )}
                    {item.jenis !== 'dasar' && (
                      <span className="tag-subtle">
                        {item.jenis}
                      </span>
                    )}
                    {item.jenis_rujuk && item.lema_rujuk && (
                      <span className="kamus-result-redirect">
                        → {item.lema_rujuk}
                      </span>
                    )}
                  </div>
                  {item.preview_makna && (
                    <p className="kamus-result-preview">{item.preview_makna}</p>
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
