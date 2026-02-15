/**
 * @fileoverview Halaman kamus — browse, pencarian, dan daftar kategori
 */

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus, ambilKategoriKamus, ambilLemaPerKategori } from '../api/apiPublik';
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
  const { kata, kategori, kode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const modePencarian = Boolean(kata);
  const modeKategori = Boolean(!kata && kategori && kode);
  const modeBrowse = !modePencarian && !modeKategori;

  const {
    data: dataPencarian,
    isLoading: isLoadingPencarian,
    isError: isErrorPencarian,
  } = useQuery({
    queryKey: ['cari-kamus', kata, offsetParam],
    queryFn: () => cariKamus(kata, { limit, offset: offsetParam }),
    enabled: modePencarian,
  });

  const { data: kategoriData } = useQuery({
    queryKey: ['kamus-kategori'],
    queryFn: ambilKategoriKamus,
    staleTime: 5 * 60 * 1000,
    enabled: modeBrowse,
  });

  const {
    data: dataKategori,
    isLoading: isLoadingKategori,
    isError: isErrorKategori,
  } = useQuery({
    queryKey: ['kamus-kategori-lema', kategori, kode, offsetParam],
    queryFn: () => ambilLemaPerKategori(kategori, kode, { limit, offset: offsetParam }),
    enabled: modeKategori,
  });

  const resultsPencarian = dataPencarian?.data || [];
  const totalPencarian = dataPencarian?.total || 0;
  const resultsKategori = dataKategori?.data || [];
  const totalKategori = dataKategori?.total || 0;
  const labelKategori = dataKategori?.label;

  const isLoading = isLoadingPencarian || isLoadingKategori;
  const isError = isErrorPencarian || isErrorKategori;

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {}, newOffset);
  };

  const namaKategori = NAMA_KATEGORI[kategori] || kategori;
  const namaLabelRaw = labelKategori?.nama || (kode ? decodeURIComponent(kode) : '');
  const namaLabel = namaLabelRaw
    ? namaLabelRaw.charAt(0).toUpperCase() + namaLabelRaw.slice(1)
    : '';
  const judulKategori = modeKategori ? `${namaKategori} ${namaLabel}` : '';

  const judulHalaman = modePencarian
    ? `Hasil Pencarian “${decodeURIComponent(kata)}”`
    : modeKategori
      ? judulKategori
      : 'Kamus';

  const breadcrumbPencarian = modePencarian ? (
    <div className="kamus-detail-breadcrumb">
      <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
      {' › '}
      <span className="kamus-detail-breadcrumb-current">Pencarian</span>
    </div>
  ) : modeKategori ? (
    <div className="kamus-detail-breadcrumb">
      <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
      {' › '}
      <span className="kamus-detail-breadcrumb-current">{judulKategori}</span>
    </div>
  ) : null;

  return (
    <HalamanDasar judul={judulHalaman} breadcrumb={breadcrumbPencarian}>

      {/* Pesan loading / error */}
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText={modeKategori ? 'Memuat data …' : 'Mencari data …'}
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian — browse kategori */}
      {modeBrowse && !isLoading && kategoriData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {URUTAN_KATEGORI.map((kat) => {
            const labels = kategoriData[kat];
            if (!labels || labels.length === 0) return null;
            return (
              <div key={kat} className="beranda-feature-card text-center">
                <h3 className="beranda-info-title">{NAMA_KATEGORI[kat]}</h3>
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
      {modePencarian && !isLoading && !isError && (
        <>
          {resultsPencarian.length === 0 && <EmptyResultText text="Lema yang dicari tidak ditemukan. Coba kata lain?" />}

          {resultsPencarian.length > 0 && (
            <>
              <div className="kamus-kategori-grid">
                {resultsPencarian.map((item) => (
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
                <Paginasi total={totalPencarian} limit={limit} offset={offsetParam} onChange={handleOffset} />
              </div>
            </>
          )}
        </>
      )}

      {/* Hasil kategori */}
      {modeKategori && !isLoading && !isError && (
        <>
          {resultsKategori.length === 0 && <EmptyResultText text="Tidak ada entri untuk kategori ini." />}

          {resultsKategori.length > 0 && (
            <>
              <div className="kamus-kategori-grid">
                {resultsKategori.map((item) => (
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
                <Paginasi total={totalKategori} limit={limit} offset={offsetParam} onChange={handleOffset} />
              </div>
            </>
          )}
        </>
      )}
    </HalamanDasar>
  );
}

export default Kamus;
