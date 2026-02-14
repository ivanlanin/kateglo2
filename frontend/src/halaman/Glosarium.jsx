/**
 * @fileoverview Halaman Glosarium — browse dan cari istilah teknis bilingual
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariGlosarium, ambilDaftarBidang, ambilDaftarSumber } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { QueryFeedback, TableResultCard } from '../komponen/StatusKonten';
import { updateSearchParams, updateSearchParamsWithOffset } from '../utils/searchParams';

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
    updateSearchParams(setSearchParams, {
      q: inputQuery,
      bidang: inputBidang,
      sumber: inputSumber,
    });
  };

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {
      q: qParam,
      bidang: bidangParam,
      sumber: sumberParam,
    }, newOffset);
  };

  const results = data?.data || [];
  const total = data?.total || 0;

  return (
    <HalamanDasar judul="Glosarium">

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="content-card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label htmlFor="glo-q" className="form-label">Lema</label>
            <input
              id="glo-q"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Cari istilah..."
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="glo-bidang" className="form-label">Bidang</label>
            <select
              id="glo-bidang"
              value={inputBidang}
              onChange={(e) => setInputBidang(e.target.value)}
              className="form-input"
            >
              <option value="">Semua</option>
              {(bidangList || []).map((b) => (
                <option key={b.discipline} value={b.discipline}>{b.discipline_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="glo-sumber" className="form-label">Sumber</label>
            <select
              id="glo-sumber"
              value={inputSumber}
              onChange={(e) => setInputSumber(e.target.value)}
              className="form-input"
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
              className="btn-primary w-full"
            >
              Cari
            </button>
          </div>
        </div>
      </form>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data..."
        errorText="Gagal mengambil data."
      />

      {/* Browse index */}
      {!sedangMencari && !isLoading && (
        <div className="content-card p-6 space-y-4">
          {bidangList?.length > 0 && (
            <div>
              <h3 className="section-heading">Menurut bidang:</h3>
              <div className="flex flex-wrap gap-2">
                {bidangList.map((b) => (
                  <Link
                    key={b.discipline}
                    to={`/glosarium?bidang=${encodeURIComponent(b.discipline)}`}
                    className="glosarium-browse-link"
                  >
                    {b.discipline_name} ({b.glossary_count})
                  </Link>
                ))}
              </div>
            </div>
          )}
          {sumberList?.length > 0 && (
            <div>
              <h3 className="section-heading">Menurut sumber:</h3>
              <div className="flex flex-wrap gap-2">
                {sumberList.map((s) => (
                  <Link
                    key={s.ref_source}
                    to={`/glosarium?sumber=${encodeURIComponent(s.ref_source)}`}
                    className="glosarium-browse-link"
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
        <TableResultCard
          isEmpty={results.length === 0}
          emptyText="Tidak ada entri glosarium yang ditemukan."
          footer={(
            <div className="px-4 pb-4">
              <Paginasi total={total} limit={limit} offset={offsetParam} onChange={handleOffset} />
            </div>
          )}
        >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="data-table-head">
                    <tr>
                      <th className="px-4 py-3 font-medium">Bahasa Indonesia</th>
                      <th className="px-4 py-3 font-medium">Bahasa Asing</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Bidang</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Sumber</th>
                    </tr>
                  </thead>
                  <tbody className="data-table-body">
                    {results.map((item) => (
                      <tr key={item.glo_uid} className="data-table-row">
                        <td className="px-4 py-3">
                          <Link
                            to={`/kamus/${encodeURIComponent(item.phrase)}`}
                            className="link-primary"
                          >
                            {item.phrase}
                          </Link>
                        </td>
                        <td className="px-4 py-3 cell-text">{item.original}</td>
                        <td className="px-4 py-3 cell-muted hidden md:table-cell">{item.discipline_name || '-'}</td>
                        <td className="px-4 py-3 cell-muted hidden lg:table-cell">{item.ref_source_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        </TableResultCard>
      )}
    </HalamanDasar>
  );
}

export default Glosarium;
