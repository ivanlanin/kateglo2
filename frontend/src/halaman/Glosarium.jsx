/**
 * @fileoverview Halaman Glosarium — browse dan cari istilah teknis bilingual
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariGlosarium, ambilDaftarBidang, ambilDaftarSumber } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';

function Glosarium() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const bidangParam = searchParams.get('bidang') || '';
  const sumberParam = searchParams.get('sumber') || '';
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 20;

  const [inputQuery, setInputQuery] = useState(qParam);
  const [inputBidang, setInputBidang] = useState(bidangParam);
  const [inputSumber, setInputSumber] = useState(sumberParam);

  const sedangMencari = Boolean(qParam || bidangParam || sumberParam);

  const { data: bidangList } = useQuery({
    queryKey: ['glosarium-bidang'],
    queryFn: ambilDaftarBidang,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sumberList } = useQuery({
    queryKey: ['glosarium-sumber'],
    queryFn: ambilDaftarSumber,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['glosarium', qParam, bidangParam, sumberParam, offsetParam],
    queryFn: () => cariGlosarium({ q: qParam, bidang: bidangParam, sumber: sumberParam, limit, offset: offsetParam }),
    enabled: sedangMencari,
  });

  const handleCari = (e) => {
    e.preventDefault();
    const params = {};
    if (inputQuery.trim()) params.q = inputQuery.trim();
    if (inputBidang) params.bidang = inputBidang;
    if (inputSumber) params.sumber = inputSumber;
    setSearchParams(params);
  };

  const handleOffset = (newOffset) => {
    const params = {};
    if (qParam) params.q = qParam;
    if (bidangParam) params.bidang = bidangParam;
    if (sumberParam) params.sumber = sumberParam;
    if (newOffset > 0) params.offset = String(newOffset);
    setSearchParams(params);
  };

  const results = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Glosarium</h1>

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label htmlFor="glo-q" className="block text-xs font-medium text-gray-600 mb-1">Lema</label>
            <input
              id="glo-q"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Cari istilah..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="glo-bidang" className="block text-xs font-medium text-gray-600 mb-1">Bidang</label>
            <select
              id="glo-bidang"
              value={inputBidang}
              onChange={(e) => setInputBidang(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua</option>
              {(bidangList || []).map((b) => (
                <option key={b.discipline} value={b.discipline}>{b.discipline_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="glo-sumber" className="block text-xs font-medium text-gray-600 mb-1">Sumber</label>
            <select
              id="glo-sumber"
              value={inputSumber}
              onChange={(e) => setInputSumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua</option>
              {(sumberList || []).map((s) => (
                <option key={s.ref_source} value={s.ref_source}>{s.ref_source_name}</option>
              ))}
            </select>
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

      {isLoading && <p className="text-gray-600">Mencari data...</p>}
      {isError && <p className="text-red-600">Gagal mengambil data.</p>}

      {/* Browse index */}
      {!sedangMencari && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          {bidangList?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Menurut bidang:</h3>
              <div className="flex flex-wrap gap-2">
                {bidangList.map((b) => (
                  <Link
                    key={b.discipline}
                    to={`/glosarium?bidang=${encodeURIComponent(b.discipline)}`}
                    className="text-sm text-blue-700 hover:underline"
                  >
                    {b.discipline_name} ({b.glossary_count})
                  </Link>
                ))}
              </div>
            </div>
          )}
          {sumberList?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Menurut sumber:</h3>
              <div className="flex flex-wrap gap-2">
                {sumberList.map((s) => (
                  <Link
                    key={s.ref_source}
                    to={`/glosarium?sumber=${encodeURIComponent(s.ref_source)}`}
                    className="text-sm text-blue-700 hover:underline"
                  >
                    {s.ref_source_name} ({s.glossary_count})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hasil tabel */}
      {sedangMencari && !isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {results.length === 0 && (
            <p className="p-4 text-gray-500">Tidak ada entri glosarium yang ditemukan.</p>
          )}
          {results.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Bahasa Indonesia</th>
                      <th className="px-4 py-3 font-medium">Bahasa Asing</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Bidang</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Sumber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((item) => (
                      <tr key={item.glo_uid} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/kamus/${encodeURIComponent(item.phrase)}`}
                            className="text-blue-700 hover:underline"
                          >
                            {item.phrase}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.original}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.discipline_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{item.ref_source_name || '-'}</td>
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

export default Glosarium;
