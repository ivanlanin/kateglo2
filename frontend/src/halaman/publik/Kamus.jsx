/**
 * @fileoverview Halaman kamus — browse, pencarian, dan daftar kategori
 */

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus, ambilKategoriKamus, ambilEntriPerKategori } from '../../api/apiPublik';
import Paginasi from '../../komponen/bersama/Paginasi';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import TeksLema from '../../komponen/publik/TeksLema';
import { EmptyResultText, PesanTidakDitemukan, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/kamusIndex';
import { updateSearchParamsWithOffset } from '../../utils/searchParams';

const NAMA_KATEGORI = {
  abjad: 'Abjad',
  bentuk: 'Bentuk',
  kelas_kata: 'Kelas Kata',
  ragam: 'Ragam',
  ekspresi: 'Ekspresi',
  bahasa: 'Asal Bahasa',
  bidang: 'Bidang',
  jenis: 'Jenis',
};

const BARIS_KATEGORI = [
  ['abjad', 'kelas_kata'],
  ['bentuk', 'ragam', 'ekspresi'],
  ['bahasa', 'bidang'],
];

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
    error: errorPencarian,
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
    error: errorKategori,
  } = useQuery({
    queryKey: ['kamus-kategori-entri', kategori, kode, offsetParam],
    queryFn: () => ambilEntriPerKategori(kategori, kode, { limit, offset: offsetParam }),
    enabled: modeKategori,
  });

  const resultsPencarian = dataPencarian?.data || [];
  const totalPencarian = dataPencarian?.total || 0;
  const resultsKategori = dataKategori?.data || [];
  const totalKategori = dataKategori?.total || 0;
  const labelKategori = dataKategori?.label;

  const isLoading = isLoadingPencarian || isLoadingKategori;
  const isError = isErrorPencarian || isErrorKategori;
  const error = errorPencarian || errorKategori;

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

  return (
    <HalamanDasar judul={judulHalaman}>

      {/* Pesan loading / error */}
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText={modeKategori ? 'Memuat data …' : 'Mencari data …'}
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian — browse kategori */}
      {modeBrowse && !isLoading && kategoriData && (
        <div className="space-y-4 mb-6">
          {BARIS_KATEGORI.map((baris, indexBaris) => {
            const kategoriTerisi = baris
              .map((kat) => ({ kat, labels: kategoriData[kat] || [] }))
              .filter((item) => item.labels.length > 0);

            if (kategoriTerisi.length === 0) return null;

            return (
              <div
                key={`baris-${indexBaris}`}
                className={`grid grid-cols-1 ${kategoriTerisi.length > 1 ? 'md:grid-cols-2' : ''} ${kategoriTerisi.length > 2 ? 'lg:grid-cols-3' : ''} gap-4`}
              >
                {kategoriTerisi.map(({ kat, labels }) => (
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
                ))}
                </div>
            );
          })}
        </div>
      )}

      {/* Hasil pencarian */}
      {modePencarian && !isLoading && !isError && (
        <>
          {resultsPencarian.length === 0 && <PesanTidakDitemukan saran={dataPencarian?.saran || []} />}

          {resultsPencarian.length > 0 && (
            <>
              <div className="kamus-kategori-grid">
                {resultsPencarian.map((item) => (
                  <Link
                    key={item.id}
                    to={buatPathDetailKamus(item.indeks || item.entri)}
                    className="kamus-kategori-grid-link"
                  >
                    <TeksLema lema={item.entri} />
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
                    to={buatPathDetailKamus(item.indeks || item.entri)}
                    className="kamus-kategori-grid-link"
                  >
                    <TeksLema lema={item.entri} />
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
