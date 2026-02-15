/**
 * @fileoverview Halaman Glosarium — browse dan cari istilah teknis bilingual
 */

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';
import { updateSearchParamsWithOffset } from '../utils/searchParams';

function Glosarium() {
  const { kata, bidang, sumber } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 100;

  const sedangMencari = Boolean(kata || bidang || sumber);
  const modeCariKata = Boolean(kata);

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

  const queryFn = () => {
    const opts = { limit, offset: offsetParam };
    if (kata) return cariGlosarium(kata, opts);
    if (bidang) return ambilGlosariumPerBidang(bidang, opts);
    if (sumber) return ambilGlosariumPerSumber(sumber, opts);
    return Promise.resolve({ data: [], total: 0 });
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['glosarium', kata || '', bidang || '', sumber || '', offsetParam],
    queryFn,
    enabled: sedangMencari,
  });

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {}, newOffset);
  };

  const results = data?.data || [];
  const total = data?.total || 0;

  const kataDekode = kata ? decodeURIComponent(kata) : '';
  const bidangDekode = bidang ? decodeURIComponent(bidang) : '';
  const sumberDekode = sumber ? decodeURIComponent(sumber) : '';

  const judulHalaman = modeCariKata
    ? `Hasil Pencarian “${kataDekode}”`
    : bidangDekode
      ? `Bidang ${bidangDekode}`
      : sumberDekode
        ? `Sumber ${sumberDekode}`
        : 'Glosarium';

  const breadcrumbPencarian = sedangMencari ? (
    <div className="kamus-detail-breadcrumb">
      <Link to="/glosarium" className="kamus-detail-breadcrumb-link">Glosarium</Link>
      {' › '}
      <span className="kamus-detail-breadcrumb-current">
        {modeCariKata ? 'Pencarian' : judulHalaman}
      </span>
    </div>
  ) : null;

  return (
    <HalamanDasar judul={judulHalaman} breadcrumb={breadcrumbPencarian}>

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
                    key={b.bidang}
                    to={`/glosarium/bidang/${encodeURIComponent(b.bidang)}`}
                    className="beranda-tag-link"
                  >
                    {b.bidang}
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
                    key={s.sumber}
                    to={`/glosarium/sumber/${encodeURIComponent(s.sumber)}`}
                    className="beranda-tag-link"
                  >
                    {s.sumber}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hasil pencarian kata */}
      {sedangMencari && !isLoading && !isError && (
        <>
          {results.length === 0 && <EmptyResultText text="Tidak ada entri glosarium yang ditemukan." />}

          {results.length > 0 && (
            <>
              <div className="glosarium-result-grid">
                {results.map((item) => (
                  <div key={item.id} className="glosarium-result-row">
                    <Link
                      to={`/kamus/detail/${encodeURIComponent(item.indonesia)}`}
                      className="kamus-kategori-grid-link"
                    >
                      {item.indonesia}
                    </Link>
                    {item.asing && <span className="glosarium-result-original"> ({item.asing})</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Paginasi total={total} limit={limit} offset={offsetParam} onChange={handleOffset} />
              </div>
            </>
          )}
        </>
      )}
    </HalamanDasar>
  );
}

export default Glosarium;
