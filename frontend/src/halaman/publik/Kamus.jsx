/**
 * @fileoverview Halaman kamus — browse, pencarian, dan daftar kategori
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  cariKamus,
  ambilKategoriKamus,
  ambilEntriPerKategori,
  cariEntriPerTagar,
} from '../../api/apiPublik';
import { useCursorPagination } from '../../hooks/bersama/useCursorPagination';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HasilPencarian from '../../komponen/publik/HasilPencarian';
import KartuKategori from '../../komponen/publik/KartuKategori';
import { EmptyResultText, PesanTidakDitemukan, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { formatLemaHomonim } from '../../utils/formatUtils';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import {
  buildMetaBrowseKamus,
  buildMetaKategoriKamus,
  buildMetaTagarKamus,
  buildMetaPencarianKamus,
  formatAwalKapital,
  NAMA_KATEGORI_BROWSE_KAMUS,
  NAMA_KATEGORI_KAMUS,
  tentukanSlugLabel,
} from '../../utils/metaUtils';

const BARIS_KATEGORI = [
  ['abjad'],
  ['kelas', 'bentuk_gabungan'],
  ['afiks', 'kombinasi'],
  ['klitik', 'reduplikasi'],
  ['ekspresi', 'ragam'],
  ['bidang'],
  ['bahasa'],
];

const URUTAN_KATEGORI_TAGAR = ['prefiks', 'infiks', 'sufiks', 'konfiks', 'kombinasi', 'klitik', 'reduplikasi'];
const KATEGORI_TAGAR_AFIX = ['prefiks', 'infiks', 'sufiks', 'konfiks'];

const OPSI_BENTUK_TAMBAHAN = [
  { kode: 'akronim', nama: 'akronim' },
  { kode: 'kependekan', nama: 'kependekan' },
];

const OPSI_EKSPRESI_TAMBAHAN = [
  { kode: 'kiasan', nama: 'kiasan' },
];

function gabungkanKategoriBentuk(labels = []) {
  const daftar = Array.isArray(labels) ? [...labels] : [];
  const hasil = [];
  const seen = new Set();

  const pushUnik = (item) => {
    const key = String(item?.kode || '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    hasil.push(item);
  };

  daftar.forEach((item) => {
    pushUnik(item);
    if (String(item?.kode || '').trim().toLowerCase() === 'gabungan') {
      OPSI_BENTUK_TAMBAHAN.forEach(pushUnik);
    }
  });

  if (!seen.has('gabungan')) {
    OPSI_BENTUK_TAMBAHAN.forEach(pushUnik);
  }

  return hasil;
}

function gabungkanKategoriEkspresi(labels = []) {
  const daftar = Array.isArray(labels) ? [...labels] : [];
  const hasil = [];
  const seen = new Set();

  const pushUnik = (item) => {
    const key = String(item?.kode || '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    hasil.push(item);
  };

  daftar.forEach((item) => {
    if (String(item?.kode || '').trim().toLowerCase() === 'idiom') {
      OPSI_EKSPRESI_TAMBAHAN.forEach(pushUnik);
    }
    pushUnik(item);
  });

  if (!seen.has('idiom')) {
    OPSI_EKSPRESI_TAMBAHAN.forEach(pushUnik);
  }

  return hasil;
}

function urutkanTagar(daftarTagar = []) {
  const rank = new Map(URUTAN_KATEGORI_TAGAR.map((kategori, index) => [kategori, index]));
  return [...(Array.isArray(daftarTagar) ? daftarTagar : [])].sort((a, b) => {
    const kategoriA = String(a?.kategori || '').trim().toLowerCase();
    const kategoriB = String(b?.kategori || '').trim().toLowerCase();
    const rankA = rank.get(kategoriA) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(kategoriB) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    const urutanA = Number.isFinite(Number(a?.urutan)) ? Number(a.urutan) : Number.MAX_SAFE_INTEGER;
    const urutanB = Number.isFinite(Number(b?.urutan)) ? Number(b.urutan) : Number.MAX_SAFE_INTEGER;
    if (urutanA !== urutanB) return urutanA - urutanB;
    return String(a?.nama || '').localeCompare(String(b?.nama || ''), 'id');
  });
}

function gabungkanKategoriBentukGabungan(bentukLabels = [], unsurTerikatLabels = []) {
  const hasil = [];
  const seen = new Set();
  const gabunganBentuk = gabungkanKategoriBentuk(bentukLabels);

  const pushUnik = (item) => {
    const key = String(item?.kode || '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    hasil.push(item);
  };

  gabunganBentuk.forEach(pushUnik);
  unsurTerikatLabels.forEach(pushUnik);

  return hasil;
}

function ambilTagarPerKategori(daftarTagar = [], daftarKategori = []) {
  const kategoriSet = new Set(
    (Array.isArray(daftarKategori) ? daftarKategori : [])
      .map((kategori) => String(kategori || '').trim().toLowerCase())
      .filter(Boolean)
  );

  return (Array.isArray(daftarTagar) ? daftarTagar : []).filter((item) => {
    const kategori = String(item?.kategori || '').trim().toLowerCase();
    return kategoriSet.has(kategori);
  });
}

export const __private = {
  gabungkanKategoriBentuk,
  gabungkanKategoriBentukGabungan,
  gabungkanKategoriEkspresi,
  ambilTagarPerKategori,
  urutkanTagar,
};

const limit = 100;

function Kamus() {
  const { kata, kategori, kode, kelas, tagar: kodeTagar } = useParams();
  const modeTagar = Boolean(!kata && kodeTagar);
  const kategoriAktif = modeTagar ? 'tagar' : (kategori || (kelas ? 'kelas' : ''));
  const kodeAktif = kodeTagar || kode || kelas || '';
  const { cursorState, handleCursor } = useCursorPagination({
    limit,
    resetOn: `${kata || ''}|${kategoriAktif || ''}|${kodeAktif || ''}`,
  });
  const modePencarian = Boolean(kata);
  const modeKategori = Boolean(!kata && kategoriAktif && kodeAktif);
  const modeKategoriBiasa = modeKategori && !modeTagar;
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
    data: dataTagar,
    isLoading: isLoadingTagar,
    isError: isErrorTagar,
    error: errorTagar,
  } = useQuery({
    queryKey: ['kamus-tagar-entri', kodeAktif, cursorState.cursor, cursorState.direction, cursorState.lastPage],
    queryFn: () => cariEntriPerTagar(kodeAktif, {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    }),
    enabled: modeTagar,
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
    enabled: modeKategoriBiasa,
  });

  const resultsPencarian = dataPencarian?.data || [];
  const totalPencarian = dataPencarian?.total || 0;
  const resultsTagar = dataTagar?.data || [];
  const totalTagar = dataTagar?.total || 0;
  const resultsKategori = dataKategori?.data || [];
  const totalKategori = dataKategori?.total || 0;
  const labelKategori = dataKategori?.label;
  const tagar = dataTagar?.tagar;

  const isLoading = isLoadingPencarian || isLoadingKategori || isLoadingTagar;
  const isError = isErrorPencarian || isErrorKategori || isErrorTagar;
  const error = errorPencarian || errorKategori || errorTagar;

  const activePageInfo = modePencarian
    ? dataPencarian?.pageInfo
    : modeTagar
      ? dataTagar?.pageInfo
      : dataKategori?.pageInfo;
  const activeTotal = modePencarian
    ? totalPencarian
    : modeTagar
      ? totalTagar
      : totalKategori;
  const activeResults = modePencarian
    ? resultsPencarian
    : modeTagar
      ? resultsTagar
      : resultsKategori;
  const activeEmptyState = modePencarian
    ? <PesanTidakDitemukan saran={dataPencarian?.saran || []} />
    : modeTagar
      ? <EmptyResultText text="Tidak ada entri untuk tagar ini." />
      : <EmptyResultText text="Tidak ada entri untuk kategori ini." />;

  const handlePaginasi = (action) => {
    handleCursor(action, {
      pageInfo: activePageInfo,
      total: activeTotal,
    });
  };

  const metaHalaman = modeKategori
    ? modeTagar
      ? buildMetaTagarKamus(
        { nama: tagar?.nama || kodeAktif, kategori: tagar?.kategori || '' },
        totalTagar
      )
      : buildMetaKategoriKamus({
        kategori: kategoriAktif,
        kode: kodeAktif,
        labelNama: labelKategori?.nama,
      })
    : modePencarian
      ? buildMetaPencarianKamus(kata)
      : buildMetaBrowseKamus();

  const judulHalaman = metaHalaman.judul;
  const deskripsiHalaman = metaHalaman.deskripsi;

  const judulNodaPencarian = modePencarian && kata
    ? (
      <>
        Hasil Pencarian &ldquo;
        <Link
          to={buatPathDetailKamus(kata)}
          className="kamus-detail-subentry-link"
        >
          {kata}
        </Link>
        &rdquo; di Kamus
      </>
    )
    : null;

  return (
    <HalamanDasar
      judul={judulHalaman}
      judulNoda={judulNodaPencarian}
      deskripsi={deskripsiHalaman}
    >

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
            const daftarTagar = urutkanTagar(kategoriData.tagar || []);
            const kategoriTerisi = baris
              .map((kat) => {
                let labels = [];
                let kategoriSumber = kat;
                let judul = NAMA_KATEGORI_BROWSE_KAMUS[kat] || NAMA_KATEGORI_KAMUS[kat];

                if (kat === 'kelas') {
                  labels = kategoriData.kelas_kata || [];
                  kategoriSumber = 'kelas_kata';
                  judul = 'Kelas';
                } else if (kat === 'bentuk_gabungan') {
                  labels = gabungkanKategoriBentukGabungan(
                    kategoriData.bentuk || [],
                    kategoriData.unsur_terikat || []
                  );
                  kategoriSumber = 'bentuk';
                  judul = 'Bentuk';
                } else if (kat === 'afiks') {
                  labels = ambilTagarPerKategori(daftarTagar, KATEGORI_TAGAR_AFIX);
                  kategoriSumber = 'tagar';
                  judul = 'Afiks';
                } else if (kat === 'kombinasi') {
                  labels = ambilTagarPerKategori(daftarTagar, ['kombinasi']);
                  kategoriSumber = 'tagar';
                  judul = 'Kombinasi';
                } else if (kat === 'klitik') {
                  labels = ambilTagarPerKategori(daftarTagar, ['klitik']);
                  kategoriSumber = 'tagar';
                  judul = 'Klitik';
                } else if (kat === 'reduplikasi') {
                  labels = ambilTagarPerKategori(daftarTagar, ['reduplikasi']);
                  kategoriSumber = 'tagar';
                  judul = 'Reduplikasi';
                } else {
                  labels = kategoriData[kat] || [];
                  if (kat === 'ekspresi') {
                    labels = gabungkanKategoriEkspresi(labels);
                  }
                }

                return { kat, kategoriSumber, judul, labels };
              })
              .filter((item) => item.labels.length > 0);

            if (kategoriTerisi.length === 0) return null;

            return (
              <div
                key={`baris-${indexBaris}`}
                className={`grid grid-cols-1 ${kategoriTerisi.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}
              >
                {kategoriTerisi.map(({ kat, kategoriSumber, judul, labels }) => (
                  <KartuKategori
                    key={kat}
                    judul={judul}
                    items={labels}
                    getKey={(item) => item.kode}
                    getTo={(item) => {
                      if (kategoriSumber === 'tagar') {
                        return `/kamus/tagar/${encodeURIComponent(item.kode)}`;
                      }
                      const pathKategori = kategoriSumber === 'kelas_kata'
                          ? 'kelas'
                          : kategoriSumber;
                      const slugLabel = tentukanSlugLabel(kategoriSumber, item);
                      return `/kamus/${pathKategori}/${encodeURIComponent(slugLabel)}`;
                    }}
                    getLabel={(item) => (
                      ['bentuk_gabungan', 'ekspresi'].includes(kat)
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
              {formatLemaHomonim(item.entri)}
            </Link>
          ))}
        />
      )}
    </HalamanDasar>
  );
}

export default Kamus;
