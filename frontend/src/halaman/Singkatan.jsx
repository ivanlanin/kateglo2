/**
 * @fileoverview Halaman Singkatan — cari singkatan dan akronim bahasa Indonesia
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariSingkatan } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';

function Singkatan() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const kependekanParam = searchParams.get('kependekan') || '';
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 20;

  const [inputQuery, setInputQuery] = useState(qParam);
  const [inputKependekan, setInputKependekan] = useState(kependekanParam);

  const sedangMencari = Boolean(qParam || kependekanParam);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['singkatan', qParam, kependekanParam, offsetParam],
    queryFn: () => cariSingkatan({ q: qParam, kependekan: kependekanParam, limit, offset: offsetParam }),
    enabled: sedangMencari,
  });

  const handleCari = (e) => {
    e.preventDefault();
    const params = {};
    if (inputQuery.trim()) params.q = inputQuery.trim();
    if (inputKependekan.trim()) params.kependekan = inputKependekan.trim();
    setSearchParams(params);
  };

  const handleOffset = (newOffset) => {
    const params = {};
    if (qParam) params.q = qParam;
    if (kependekanParam) params.kependekan = kependekanParam;
    if (newOffset > 0) params.offset = String(newOffset);
    setSearchParams(params);
  };

  const results = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Singkatan &amp; Akronim</h1>

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="abbr-q" className="block text-xs font-medium text-gray-600 mb-1">Singkatan</label>
            <input
              id="abbr-q"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Mis. BUMN, UNESCO..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="abbr-kepanjangan" className="block text-xs font-medium text-gray-600 mb-1">Kepanjangan</label>
            <input
              id="abbr-kepanjangan"
              type="text"
              value={inputKependekan}
              onChange={(e) => setInputKependekan(e.target.value)}
              placeholder="Cari dalam kepanjangan..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Cari
            </button>
          </div>
        </div>
      </form>

      {isLoading && <p className="text-gray-600">Mencari singkatan...</p>}
      {isError && <p className="text-red-600">Gagal mengambil data.</p>}

      {!sedangMencari && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500">Gunakan kolom pencarian di atas untuk mencari singkatan atau akronim.</p>
        </div>
      )}

      {sedangMencari && !isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {results.length === 0 && (
            <p className="p-4 text-gray-500">Tidak ada singkatan yang ditemukan.</p>
          )}
          {results.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Singkatan</th>
                      <th className="px-4 py-3 font-medium">Kepanjangan (ID)</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Kepanjangan (EN)</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Jenis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((item) => (
                      <tr key={item.abbr_idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.abbr_key}</td>
                        <td className="px-4 py-3 text-gray-700">{item.abbr_id || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.abbr_en || '-'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {item.abbr_type && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              {item.abbr_type}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <Paginasi total={total} limit={limit} offset={offsetParam} onChange={handleOffset} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Singkatan;
