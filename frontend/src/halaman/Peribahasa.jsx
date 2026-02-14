/**
 * @fileoverview Halaman Peribahasa — cari dan telusuri peribahasa bahasa Indonesia
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariPeribahasa } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyInfoCard, EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';
import { updateSearchParams, updateSearchParamsWithOffset } from '../utils/searchParams';

function Peribahasa() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 20;

  const [inputQuery, setInputQuery] = useState(qParam);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['peribahasa', qParam, offsetParam],
    queryFn: () => cariPeribahasa({ q: qParam, limit, offset: offsetParam }),
    enabled: Boolean(qParam),
  });

  const handleCari = (e) => {
    e.preventDefault();
    const trimmed = inputQuery.trim();
    if (!trimmed) return;
    updateSearchParams(setSearchParams, { q: trimmed });
  };

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, { q: qParam }, newOffset);
  };

  const results = data?.data || [];
  const total = data?.total || 0;

  return (
    <HalamanDasar judul="Peribahasa">

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Cari peribahasa..."
          className="peribahasa-search-input flex-1"
        />
        <button
          type="submit"
          className="peribahasa-search-button"
        >
          Cari
        </button>
      </form>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari peribahasa..."
        errorText="Gagal mengambil data."
      />

      {!qParam && !isLoading && (
        <EmptyInfoCard text="Gunakan kolom pencarian di atas untuk mencari peribahasa." />
      )}

      {qParam && !isLoading && !isError && (
        <div className="space-y-3">
          {results.length === 0 && <EmptyResultText text="Tidak ada peribahasa yang ditemukan." />}
          {results.map((item) => (
            <div key={item.prv_uid} className="content-card p-4">
              <p className="peribahasa-title">{item.proverb}</p>
              {item.meaning && (
                <p className="peribahasa-meaning">
                  <span className="peribahasa-meaning-label">Makna:&nbsp;</span>
                  {item.meaning}
                </p>
              )}
              {item.prv_type && (
                <span className="peribahasa-type-tag">
                  {item.prv_type}
                </span>
              )}
            </div>
          ))}

          {total > limit && (
            <Paginasi total={total} limit={limit} offset={offsetParam} onChange={handleOffset} />
          )}
        </div>
      )}
    </HalamanDasar>
  );
}

export default Peribahasa;
