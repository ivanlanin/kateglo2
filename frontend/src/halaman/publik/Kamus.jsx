/**
 * @fileoverview Halaman kamus — browse, pencarian, dan daftar kategori
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus, ambilKategoriKamus, ambilEntriPerKategori } from '../../api/apiPublik';
import Paginasi from '../../komponen/bersama/Paginasi';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import TeksLema from '../../komponen/publik/TeksLema';
import { EmptyResultText, PesanTidakDitemukan, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/kamusIndex';
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
  const [cursorState, setCursorState] = useState({
    cursor: null,
    direction: 'next',
    lastPage: false,
    page: 1,
  });
  const modePencarian = Boolean(kata);
  const modeKategori = Boolean(!kata && kategoriAktif && kodeAktif);
  const modeBrowse = !modePencarian && !modeKategori;

  useEffect(() => {
    setCursorState({ cursor: null, direction: 'next', lastPage: false, page: 1 });
  }, [kata, kategoriAktif, kodeAktif]);

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

  const handleCursor = (action) => {
    if (action === 'first') {
      setCursorState({ cursor: null, direction: 'next', lastPage: false, page: 1 });
      return;
    }

    if (action === 'last') {
      const targetPage = Math.max(1, Math.ceil((activeTotal || 0) / limit));
      setCursorState({ cursor: null, direction: 'next', lastPage: true, page: targetPage });
      return;
    }

    if (action === 'next' && activePageInfo?.hasNext && activePageInfo?.nextCursor) {
      setCursorState((prev) => ({
        cursor: activePageInfo.nextCursor,
        direction: 'next',
        lastPage: false,
        page: prev.page + 1,
      }));
      return;
    }

    if (action === 'prev' && activePageInfo?.hasPrev && activePageInfo?.prevCursor) {
      setCursorState((prev) => ({
        cursor: activePageInfo.prevCursor,
        direction: 'prev',
        lastPage: false,
        page: Math.max(1, prev.page - 1),
      }));
    }
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
                  <div key={kat} className="beranda-feature-card text-center">
                    <h3 className="beranda-info-title">{NAMA_KATEGORI_BROWSE_KAMUS[kat] || NAMA_KATEGORI_KAMUS[kat]}</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {labels.map((l) => {
                        const pathKategori = kat === 'unsur_terikat'
                          ? 'bentuk'
                          : kat === 'kelas_kata'
                            ? 'kelas'
                            : kat;
                        const slugLabel = tentukanSlugLabel(kat, l);
                        return (
                          <Link
                            key={l.kode}
                            to={`/kamus/${pathKategori}/${encodeURIComponent(slugLabel)}`}
                            className="beranda-tag-link"
                          >
                            {['bentuk', 'unsur_terikat', 'ekspresi'].includes(kat) ? formatAwalKapital(l.nama) : l.nama}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {modePencarian && !isLoading && !isError && (
        <>
          {resultsPencarian.length === 0 && <PesanTidakDitemukan saran={dataPencarian?.saran || []} />}

          {resultsPencarian.length > 0 && (
            <>
              <div className="mb-4">
                <Paginasi
                  total={totalPencarian}
                  limit={limit}
                  pageInfo={dataPencarian?.pageInfo}
                  currentPage={cursorState.page}
                  onNavigateCursor={handleCursor}
                />
              </div>
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
                <Paginasi
                  total={totalPencarian}
                  limit={limit}
                  pageInfo={dataPencarian?.pageInfo}
                  currentPage={cursorState.page}
                  onNavigateCursor={handleCursor}
                />
              </div>
            </>
          )}
        </>
      )}

      {modeKategori && !isLoading && !isError && (
        <>
          {resultsKategori.length === 0 && <EmptyResultText text="Tidak ada entri untuk kategori ini." />}

          {resultsKategori.length > 0 && (
            <>
              <div className="mb-4">
                <Paginasi
                  total={totalKategori}
                  limit={limit}
                  pageInfo={dataKategori?.pageInfo}
                  currentPage={cursorState.page}
                  onNavigateCursor={handleCursor}
                />
              </div>
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
                <Paginasi
                  total={totalKategori}
                  limit={limit}
                  pageInfo={dataKategori?.pageInfo}
                  currentPage={cursorState.page}
                  onNavigateCursor={handleCursor}
                />
              </div>
            </>
          )}
        </>
      )}
    </HalamanDasar>
  );
}

export default Kamus;
