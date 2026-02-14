/**
 * @fileoverview Halaman Peribahasa — cari dan telusuri peribahasa bahasa Indonesia
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariPeribahasa } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';

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
    const q = inputQuery.trim();
    if (q) {
      setSearchParams({ q });
    }
  };

  const handleOffset = (newOffset) => {
    const params = { q: qParam };
    if (newOffset > 0) params.offset = String(newOffset);
    setSearchParams(params);
  };

  const results = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Peribahasa</h1>

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Cari peribahasa..."
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Cari
        </button>
      </form>

      {isLoading && <p className="text-gray-600">Mencari peribahasa...</p>}
      {isError && <p className="text-red-600">Gagal mengambil data.</p>}

      {!qParam && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500">Gunakan kolom pencarian di atas untuk mencari peribahasa.</p>
        </div>
      )}

      {qParam && !isLoading && !isError && (
        <div className="space-y-3">
          {results.length === 0 && (
            <p className="text-gray-500">Tidak ada peribahasa yang ditemukan.</p>
          )}
          {results.map((item) => (
            <div key={item.prv_uid} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-base font-semibold text-gray-900 mb-1">{item.proverb}</p>
              {item.meaning && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-500">Makna:&nbsp;</span>
                  {item.meaning}
                </p>
              )}
              {item.prv_type && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
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
    </div>
  );
}

export default Peribahasa;
