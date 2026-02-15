/**
 * @fileoverview Halaman pencarian/browse kamus — path-based: /kamus/cari/:kata
 */

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus, ambilKategoriKamus } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';
import { updateSearchParamsWithOffset } from '../utils/searchParams';

const NAMA_KATEGORI = {
  abjad: 'Abjad',
  jenis: 'Jenis',
  kelas_kata: 'Kelas Kata',
  ragam: 'Ragam',
  bahasa: 'Bahasa',
  bidang: 'Bidang',
};

const URUTAN_KATEGORI = ['abjad', 'jenis', 'kelas_kata', 'ragam', 'bahasa', 'bidang'];

const limit = 100;

function Kamus() {
  const { kata } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cari-kamus', kata, offsetParam],
    queryFn: () => cariKamus(kata, { limit, offset: offsetParam }),
    enabled: Boolean(kata),
  });

  const { data: kategoriData } = useQuery({
    queryKey: ['kamus-kategori'],
    queryFn: ambilKategoriKamus,
    staleTime: 5 * 60 * 1000,
    enabled: !kata,
  });

  const results = data?.data || [];
  const total = data?.total || 0;

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {}, newOffset);
  };

  const judulHalaman = kata
    ? `Hasil Pencarian \u201c${decodeURIComponent(kata)}\u201d`
    : 'Kamus';

  const breadcrumbPencarian = kata ? (
    <div className="kamus-detail-breadcrumb">
      <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
      {' › '}
      <span className="kamus-detail-breadcrumb-current">Pencarian</span>
    </div>
  ) : null;

  return (
    <HalamanDasar judul={judulHalaman} breadcrumb={breadcrumbPencarian}>

      {/* Pesan loading / error */}
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data …"
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian — browse kategori */}
      {!kata && !isLoading && kategoriData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {URUTAN_KATEGORI.map((kat) => {
            const labels = kategoriData[kat];
            if (!labels || labels.length === 0) return null;
            return (
              <div key={kat} className="beranda-feature-card text-center">
                <h3 className="beranda-info-title">{NAMA_KATEGORI[kat] || kat}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {labels.map((l) => (
                    <Link
                      key={l.kode}
                      to={`/kamus/${kat}/${encodeURIComponent(l.kode)}`}
                      className="beranda-tag-link"
                    >
                      {l.nama}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hasil pencarian */}
      {kata && !isLoading && !isError && (
        <>
          {results.length === 0 && <EmptyResultText text="Lema yang dicari tidak ditemukan. Coba kata lain?" />}

          {results.length > 0 && (
            <>
              <div className="kamus-kategori-grid">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    to={`/kamus/detail/${encodeURIComponent(item.lema)}`}
                    className="kamus-kategori-grid-link"
                  >
                    {item.lema}
                  </Link>
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

export default Kamus;
