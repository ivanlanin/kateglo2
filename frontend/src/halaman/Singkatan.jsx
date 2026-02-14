/**
 * @fileoverview Halaman Singkatan — cari singkatan dan akronim bahasa Indonesia
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariSingkatan } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyInfoCard, QueryFeedback, TableResultCard } from '../komponen/StatusKonten';
import { updateSearchParams, updateSearchParamsWithOffset } from '../utils/searchParams';

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
    updateSearchParams(setSearchParams, {
      q: inputQuery,
      kependekan: inputKependekan,
    });
  };

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {
      q: qParam,
      kependekan: kependekanParam,
    }, newOffset);
  };

  const results = data?.data || [];
  const total = data?.total || 0;

  return (
    <HalamanDasar judul="Singkatan & Akronim">

      {/* Panel pencarian */}
      <form onSubmit={handleCari} className="content-card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="abbr-q" className="form-label">Singkatan</label>
            <input
              id="abbr-q"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Mis. BUMN, UNESCO..."
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="abbr-kepanjangan" className="form-label">Kepanjangan</label>
            <input
              id="abbr-kepanjangan"
              type="text"
              value={inputKependekan}
              onChange={(e) => setInputKependekan(e.target.value)}
              placeholder="Cari dalam kepanjangan..."
              className="form-input"
            />
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
        loadingText="Mencari singkatan..."
        errorText="Gagal mengambil data."
      />

      {!sedangMencari && !isLoading && (
        <EmptyInfoCard text="Gunakan kolom pencarian di atas untuk mencari singkatan atau akronim." />
      )}

      {sedangMencari && !isLoading && !isError && (
        <TableResultCard
          isEmpty={results.length === 0}
          emptyText="Tidak ada singkatan yang ditemukan."
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
                      <th className="px-4 py-3 font-medium">Singkatan</th>
                      <th className="px-4 py-3 font-medium">Kepanjangan (ID)</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Kepanjangan (EN)</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Jenis</th>
                    </tr>
                  </thead>
                  <tbody className="data-table-body">
                    {results.map((item) => (
                      <tr key={item.abbr_idx} className="data-table-row">
                        <td className="px-4 py-3 cell-primary">{item.abbr_key}</td>
                        <td className="px-4 py-3 cell-text">{item.abbr_id || '-'}</td>
                        <td className="px-4 py-3 cell-muted hidden md:table-cell">{item.abbr_en || '-'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {item.abbr_type && (
                            <span className="tag-subtle">
                              {item.abbr_type}
                            </span>
                          )}
                        </td>
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

export default Singkatan;
