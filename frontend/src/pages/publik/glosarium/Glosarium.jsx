/**
 * @fileoverview Halaman Glosarium — browse dan cari istilah teknis bilingual
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import {
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../../../api/apiPublik';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import HasilPencarian from '../../../components/data/HasilPencarian';
import KartuKategori from '../../../components/data/KartuKategori';
import TombolSunting from '../../../components/tombol/TombolSunting';
import { EmptyResultText, QueryFeedback } from '../../../components/status/StatusKonten';
import { buatPathDetailKamus, buatSlug, normalisasiIndeksKamus } from '../../../utils/paramUtils';
import { formatNamaBidang, renderEntriGlosariumTertaut } from '../../../utils/formatUtils';
import { useAuthOptional } from '../../../context/authContext';
import {
  buildMetaBidangGlosarium,
  buildMetaBrowseGlosarium,
  buildMetaPencarianGlosarium,
  buildMetaSumberGlosarium,
} from '../../../utils/metaUtils';

export function normalizeKategoriKey(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function resolveKategoriNama(param, list, nameKeys, codeKeys) {
  const safeParam = param ?? '';
  const safeNameKeys = Array.isArray(nameKeys) ? nameKeys : [];
  const safeCodeKeys = Array.isArray(codeKeys) ? codeKeys : [];
  const target = normalizeKategoriKey(safeParam);
  const fallback = String(param ?? '').trim();
  if (!target) return fallback;
  if (!Array.isArray(list)) return fallback;
  if (list.length === 0) return fallback;

  const matched = list.find((item) => {
    const byCode = safeCodeKeys.some((key) => normalizeKategoriKey(item?.[key]) === target);
    const byName = safeNameKeys.some((key) => normalizeKategoriKey(item?.[key]) === target);
    return byCode || byName;
  });

  if (!matched) return fallback;
  const nama = safeNameKeys.map((key) => String(matched?.[key] || '').trim()).find(Boolean);
  return nama || fallback;
}

export function resolveKategoriItem(param, list, nameKeys, codeKeys) {
  const safeParam = param ?? '';
  const safeNameKeys = Array.isArray(nameKeys) ? nameKeys : [];
  const safeCodeKeys = Array.isArray(codeKeys) ? codeKeys : [];
  const target = normalizeKategoriKey(safeParam);
  if (!target) return null;
  if (!Array.isArray(list)) return null;
  if (list.length === 0) return null;

  return list.find((item) => {
    const byCode = safeCodeKeys.some((key) => normalizeKategoriKey(item?.[key]) === target);
    const byName = safeNameKeys.some((key) => normalizeKategoriKey(item?.[key]) === target);
    return byCode || byName;
  }) || null;
}

export function resolveNamaSumberSort(item) {
  const nama = String(item?.nama || '').trim();
  if (nama) return nama;
  const sumberNama = String(item?.sumber || '').trim();
  if (sumberNama) return sumberNama;
  return String(item?.kode || '').trim();
}

function normalisasiKunciTautanIndonesia(teks = '') {
  return normalisasiIndeksKamus(teks).trim().toLowerCase();
}

function Glosarium() {
  const { kata, bidang, sumber } = useParams();
  const auth = useAuthOptional();
  const adalahAdmin = Boolean(auth?.adalahAdmin);
  const limit = 100;
  const { cursorState, handleCursor } = useCursorPagination({
    limit,
    resetOn: `${kata || ''}|${bidang || ''}|${sumber || ''}`,
  });

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
    const opts = {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    };
    if (kata) return cariGlosarium(kata, opts);
    if (bidang) return ambilGlosariumPerBidang(bidang, opts);
    if (sumber) return ambilGlosariumPerSumber(sumber, opts);
    return Promise.resolve({ data: [], total: 0, pageInfo: { hasPrev: false, hasNext: false } });
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'glosarium',
      kata || '',
      bidang || '',
      sumber || '',
      cursorState.cursor,
      cursorState.direction,
      cursorState.lastPage,
    ],
    queryFn,
    enabled: sedangMencari,
  });

  const results = data?.data || [];
  const total = data?.total || 0;
  const tautanIndonesiaValidSet = new Set(
    (data?.tautan_indonesia_valid || []).map((item) => normalisasiKunciTautanIndonesia(item)).filter(Boolean)
  );
  const sumberKategoriList = (sumberList || [])
    .filter((item) => Boolean(item?.glosarium))
    .slice()
    .sort((a, b) => {
      const namaA = resolveNamaSumberSort(a);
      const namaB = resolveNamaSumberSort(b);
      return namaA.localeCompare(namaB, 'id', { sensitivity: 'base' });
    });
  const namaBidang = resolveKategoriNama(bidang, bidangList, ['nama', 'bidang'], ['kode', 'slug']);
  const namaSumber = resolveKategoriNama(sumber, sumberList, ['nama', 'sumber'], ['kode', 'slug']);
  const detailSumber = resolveKategoriItem(sumber, sumberList, ['nama', 'sumber'], ['kode', 'slug']);

  const handlePaginasi = (action) => {
    handleCursor(action, {
      pageInfo: data?.pageInfo,
      total,
    });
  };

  const metaHalaman = modeCariKata
    ? buildMetaPencarianGlosarium(kata)
    : bidang
      ? buildMetaBidangGlosarium(namaBidang)
      : sumber
        ? buildMetaSumberGlosarium(namaSumber)
        : buildMetaBrowseGlosarium();

  const judulNodaPencarian = modeCariKata && kata
    ? (
      <>
        Hasil Pencarian &ldquo;
        <Link
          to={`/glosarium/detail/${encodeURIComponent(kata)}`}
          className="kamus-detail-subentry-link"
        >
          {kata}
        </Link>
        &rdquo; di Glosarium
      </>
    )
    : null;

  const judulNodaSumber = sumber && detailSumber?.kode
    ? (
      <span className="inline-flex items-center gap-2">
        {namaSumber}
        <Link
          to={`/sumber#${encodeURIComponent(detailSumber.kode)}`}
          className="badge-sumber"
        >
          {detailSumber.kode}
        </Link>
      </span>
    )
    : null;

  const renderAsing = (item) => renderEntriGlosariumTertaut(item.asing, (part, info) => (
    <Link
      key={`${item.id}-${part}-${info.partIndex}-${info.tokenIndex}`}
      to={`/glosarium/detail/${encodeURIComponent(part)}`}
      className="glosarium-result-original"
    >
      {part}
    </Link>
  ));

  const renderIndonesia = (item) => renderEntriGlosariumTertaut(item.indonesia, (part, info) => (
    tautanIndonesiaValidSet.has(normalisasiKunciTautanIndonesia(part)) ? (
      <Link
        key={`${item.id}-${part}-${info.partIndex}-${info.tokenIndex}`}
        to={buatPathDetailKamus(part)}
        className="glosarium-inline-link"
      >
        {part}
      </Link>
    ) : (
      <span key={`${item.id}-${part}-${info.partIndex}-${info.tokenIndex}`}>{part}</span>
    )
  ));

  const renderAdminEditLink = (item) => {
    if (!adalahAdmin || !item?.id || !item?.asing || !item?.indonesia) return null;
    return <TombolSunting to={`/redaksi/glosarium/${item.id}`} />;
  };

  const emptyState = modeCariKata && kata
    ? (
      <EmptyResultText
        text={(
          <>
            Tidak ada entri glosarium sama persis yang ditemukan. Mau lihat{' '}
            <Link
              to={`/glosarium/detail/${encodeURIComponent(kata)}`}
              className="kamus-detail-subentry-link"
            >
              entri yang mirip
            </Link>
            ?
          </>
        )}
      />
    )
    : <EmptyResultText text="Tidak ada entri glosarium yang ditemukan." />;

  return (
    <HalamanPublik
      judul={metaHalaman.judul}
      judulNoda={judulNodaPencarian || judulNodaSumber}
      deskripsi={metaHalaman.deskripsi}
    >
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Mencari data …"
        errorText="Gagal mengambil data."
      />

      {!sedangMencari && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {bidangList?.length > 0 && (
            <KartuKategori
              judul="Bidang"
              items={bidangList}
              getKey={(item) => item.kode || item.bidang || item.nama}
              getTo={(item) => `/glosarium/bidang/${encodeURIComponent(item.slug || buatSlug(item.nama || item.bidang || '') || item.kode)}`}
              getLabel={(item) => formatNamaBidang(item.nama || item.bidang || '')}
            />
          )}
          {sumberKategoriList.length > 0 && (
            <KartuKategori
              judul="Sumber"
              items={sumberKategoriList}
              getKey={(item) => item.kode || item.sumber || item.nama}
              getTo={(item) => `/glosarium/sumber/${encodeURIComponent(item.slug || buatSlug(item.nama))}`}
              getLabel={(item) => item.nama || item.sumber}
            />
          )}
        </div>
      )}

      {sedangMencari && !isLoading && !isError && (
        <HasilPencarian
          results={results}
          emptyState={emptyState}
          total={total}
          limit={limit}
          pageInfo={data?.pageInfo}
          currentPage={cursorState.page}
          onNavigateCursor={handlePaginasi}
          containerClassName="glosarium-result-grid"
          renderItems={(items) => items.map((item) => (
            <div key={item.id} className="glosarium-result-row">
              {item.asing ? (
                <>
                  <em>{renderAsing(item)}</em>
                  {item.indonesia ? ': ' : ''}
                  {renderIndonesia(item)}
                  {renderAdminEditLink(item)}
                </>
              ) : (
                renderIndonesia(item)
              )}
            </div>
          ))}
        />
      )}
    </HalamanPublik>
  );
}

export default Glosarium;
