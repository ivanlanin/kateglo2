/**
 * @fileoverview Halaman Glosarium — browse dan cari istilah teknis bilingual
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCursorPagination } from '../../hooks/bersama/useCursorPagination';
import {
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HasilPencarian from '../../komponen/publik/HasilPencarian';
import KartuKategori from '../../komponen/publik/KartuKategori';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import { formatNamaBidang, renderEntriGlosariumTertaut } from '../../utils/formatUtils';
import { useAuthOptional } from '../../context/authContext';
import {
  buildMetaBidangGlosarium,
  buildMetaBrowseGlosarium,
  buildMetaPencarianGlosarium,
  buildMetaSumberGlosarium,
} from '../../utils/metaUtils';

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
  const namaBidang = resolveKategoriNama(bidang, bidangList, ['nama', 'bidang'], ['kode']);
  const namaSumber = resolveKategoriNama(sumber, sumberList, ['nama', 'sumber'], ['kode']);

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
    <Link
      key={`${item.id}-${part}-${info.partIndex}-${info.tokenIndex}`}
      to={buatPathDetailKamus(part)}
      className="kamus-kategori-grid-link"
    >
      {part}
    </Link>
  ));

  const renderAdminEditLink = (item) => {
    if (!adalahAdmin || !item?.id || !item?.asing || !item?.indonesia) return null;
    return (
      <>
        {' '}
        <Link
          to={`/redaksi/glosarium/${item.id}`}
          className="glosarium-edit-link-inline"
          aria-label="Sunting entri glosarium di Redaksi"
          title="Sunting entri glosarium di Redaksi"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          <span className="sr-only">Sunting</span>
        </Link>
      </>
    );
  };

  return (
    <HalamanDasar
      judul={metaHalaman.judul}
      judulNoda={judulNodaPencarian}
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
              getTo={(item) => `/glosarium/bidang/${encodeURIComponent(item.kode || item.bidang || item.nama)}`}
              getLabel={(item) => formatNamaBidang(item.nama || item.bidang || '')}
            />
          )}
          {sumberList?.length > 0 && (
            <KartuKategori
              judul="Sumber"
              items={sumberList}
              getKey={(item) => item.kode || item.sumber || item.nama}
              getTo={(item) => `/glosarium/sumber/${encodeURIComponent(item.kode || item.sumber || item.nama)}`}
              getLabel={(item) => item.nama || item.sumber}
            />
          )}
        </div>
      )}

      {sedangMencari && !isLoading && !isError && (
        <HasilPencarian
          results={results}
          emptyState={<EmptyResultText text="Tidak ada entri glosarium yang ditemukan." />}
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
    </HalamanDasar>
  );
}

export default Glosarium;
