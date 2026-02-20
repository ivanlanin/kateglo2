/**
 * @fileoverview Halaman kamus — browse, pencarian, dan daftar kategori
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus, ambilKategoriKamus, ambilEntriPerKategori } from '../../api/apiPublik';
import { useCursorPagination } from '../../hooks/bersama/useCursorPagination';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HasilPencarian from '../../komponen/publik/HasilPencarian';
import KartuKategori from '../../komponen/publik/KartuKategori';
import TeksLema from '../../komponen/publik/TeksLema';
import { EmptyResultText, PesanTidakDitemukan, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import {
  buildMetaBrowseKamus,
  buildMetaKategoriKamus,
  buildMetaPencarianKamus,
  formatAwalKapital,
  NAMA_KATEGORI_BROWSE_KAMUS,
  NAMA_KATEGORI_KAMUS,
  tentukanSlugLabel,
} from '../../utils/metaUtils';

const BARIS_KATEGORI = [
  ['abjad', 'kelas_kata'],
  ['bentuk', 'unsur_terikat'],
  ['ekspresi', 'ragam'],
  ['bahasa', 'bidang'],
];

const limit = 100;

function Kamus() {
  const { kata, kategori, kode, kelas } = useParams();
  const kategoriAktif = kategori || (kelas ? 'kelas' : '');
  const kodeAktif = kode || kelas || '';
  const { cursorState, handleCursor } = useCursorPagination({
    limit,
    resetOn: `${kata || ''}|${kategoriAktif || ''}|${kodeAktif || ''}`,
  });
  const modePencarian = Boolean(kata);
  const modeKategori = Boolean(!kata && kategoriAktif && kodeAktif);
  const modeBrowse = !modePencarian && !modeKategori;

  const {
    data: dataPencarian,
    isLoading: isLoadingPencarian,
    isError: isErrorPencarian,
    error: errorPencarian,
  } = useQuery({
    queryKey: ['cari-kamus', kata, cursorState.cursor, cursorState.direction, cursorState.lastPage],
    queryFn: () => cariKamus(kata, {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    }),
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
    queryKey: ['kamus-kategori-entri', kategoriAktif, kodeAktif, cursorState.cursor, cursorState.direction, cursorState.lastPage],
    queryFn: () => ambilEntriPerKategori(kategoriAktif, kodeAktif, {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    }),
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

  const activePageInfo = modePencarian ? dataPencarian?.pageInfo : dataKategori?.pageInfo;
  const activeTotal = modePencarian ? totalPencarian : totalKategori;
  const activeResults = modePencarian ? resultsPencarian : resultsKategori;
  const activeEmptyState = modePencarian
    ? <PesanTidakDitemukan saran={dataPencarian?.saran || []} />
    : <EmptyResultText text="Tidak ada entri untuk kategori ini." />;

  const handlePaginasi = (action) => {
    handleCursor(action, {
      pageInfo: activePageInfo,
      total: activeTotal,
    });
  };

  const metaHalaman = modeKategori
    ? buildMetaKategoriKamus({
      kategori: kategoriAktif,
      kode: kodeAktif,
      labelNama: labelKategori?.nama,
    })
    : modePencarian
      ? buildMetaPencarianKamus(kata)
      : buildMetaBrowseKamus();

  const judulHalaman = metaHalaman.judul;
  const deskripsiHalaman = metaHalaman.deskripsi;

  return (
    <HalamanDasar judul={judulHalaman} deskripsi={deskripsiHalaman}>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText={modeKategori ? 'Memuat data …' : 'Mencari data …'}
        errorText="Gagal mengambil data. Coba lagi."
      />

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
                className={`grid grid-cols-1 ${kategoriTerisi.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}
              >
                {kategoriTerisi.map(({ kat, labels }) => (
                  <KartuKategori
                    key={kat}
                    judul={NAMA_KATEGORI_BROWSE_KAMUS[kat] || NAMA_KATEGORI_KAMUS[kat]}
                    items={labels}
                    getKey={(item) => item.kode}
                    getTo={(item) => {
                      const pathKategori = kat === 'unsur_terikat'
                        ? 'bentuk'
                        : kat === 'kelas_kata'
                          ? 'kelas'
                          : kat;
                      const slugLabel = tentukanSlugLabel(kat, item);
                      return `/kamus/${pathKategori}/${encodeURIComponent(slugLabel)}`;
                    }}
                    getLabel={(item) => (
                      ['bentuk', 'unsur_terikat', 'ekspresi'].includes(kat)
                        ? formatAwalKapital(item.nama)
                        : item.nama
                    )}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {(modePencarian || modeKategori) && !isLoading && !isError && (
        <HasilPencarian
          results={activeResults}
          emptyState={activeEmptyState}
          total={activeTotal}
          limit={limit}
          pageInfo={activePageInfo}
          currentPage={cursorState.page}
          onNavigateCursor={handlePaginasi}
          containerClassName="kamus-kategori-grid"
          renderItems={(items) => items.map((item) => (
            <Link
              key={item.id}
              to={buatPathDetailKamus(item.indeks || item.entri)}
              className="kamus-kategori-grid-link"
            >
              <TeksLema lema={item.entri} />
            </Link>
          ))}
        />
      )}
    </HalamanDasar>
  );
}

export default Kamus;
