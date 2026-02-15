/**
 * @fileoverview Halaman Glosarium — browse dan cari istilah teknis bilingual
 */

import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariGlosarium, ambilDaftarBidang, ambilDaftarSumber } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { QueryFeedback, TableResultCard } from '../komponen/StatusKonten';
import { updateSearchParamsWithOffset } from '../utils/searchParams';

function Glosarium() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const bidangParam = searchParams.get('bidang') || '';
  const sumberParam = searchParams.get('sumber') || '';
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 20;

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

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data …"
        errorText="Gagal mengambil data."
      />

      {/* Browse index — dua kotak terpisah */}
      {!sedangMencari && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {bidangList?.length > 0 && (
            <div className="beranda-feature-card text-center">
              <h3 className="beranda-info-title">Bidang</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {bidangList.map((b) => (
                  <Link
                    key={b.discipline}
                    to={`/glosarium?bidang=${encodeURIComponent(b.discipline)}`}
                    className="beranda-tag-link"
                  >
                    {b.discipline}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {sumberList?.length > 0 && (
            <div className="beranda-feature-card text-center">
              <h3 className="beranda-info-title">Sumber</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {sumberList.map((s) => (
                  <Link
                    key={s.ref_source}
                    to={`/glosarium?sumber=${encodeURIComponent(s.ref_source)}`}
                    className="beranda-tag-link"
                  >
                    {s.ref_source}
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
                            to={`/kamus/detail/${encodeURIComponent(item.phrase)}`}
                            className="link-primary"
                          >
                            {item.phrase}
                          </Link>
                        </td>
                        <td className="px-4 py-3 cell-text">{item.original}</td>
                        <td className="px-4 py-3 cell-muted hidden md:table-cell">{item.discipline || '-'}</td>
                        <td className="px-4 py-3 cell-muted hidden lg:table-cell">{item.ref_source || '-'}</td>
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
