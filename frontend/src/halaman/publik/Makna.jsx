/**
 * @fileoverview Halaman kamus terbalik — cari kata berdasarkan makna
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariMakna, ambilContohMakna } from '../../api/apiPublik';
import { useCursorPagination } from '../../hooks/bersama/useCursorPagination';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HasilPencarian from '../../komponen/publik/HasilPencarian';
import { QueryFeedback } from '../../komponen/publik/StatusKonten';
import { formatLemaHomonim } from '../../utils/formatUtils';
import { buatPathDetailKamus } from '../../utils/paramUtils';

export function amanDecode(teks = '') {
  const raw = teks == null ? '' : String(teks);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function stripMarkdown(teks = '') {
  return String(teks || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1');
}

function TebalkanKataKunci({ teks, query }) {
  if (!query || !teks) return <span>{teks}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bagian = teks.split(new RegExp(`(${escaped})`, 'gi'));
  const queryLower = query.toLowerCase();
  return (
    <span>
      {bagian.map((bagian, i) =>
        bagian.toLowerCase() === queryLower
          ? <strong key={i} className="font-semibold text-gray-500 dark:text-gray-400">{bagian}</strong>
          : bagian
      )}
    </span>
  );
}

const limit = 50;

function Makna() {
  const { kata } = useParams();
  const kataAman = amanDecode(kata);

  const { cursorState, handleCursor } = useCursorPagination({
    limit,
    resetOn: kataAman,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cari-makna', kataAman, cursorState.cursor, cursorState.direction, cursorState.lastPage],
    queryFn: () => cariMakna(kataAman, {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    }),
    enabled: Boolean(kataAman),
  });

  const { data: dataContoh } = useQuery({
    queryKey: ['makna-contoh'],
    queryFn: ambilContohMakna,
    enabled: !kataAman,
    staleTime: 5 * 60 * 1000,
  });

  const results = data?.data || [];
  const total = data?.total || 0;
  const pageInfo = data?.pageInfo;

  const contoh = dataContoh?.data || [];

  const judulHalaman = kataAman
    ? `Hasil Pencarian Makna "${kataAman}"`
    : 'Makna';
  const deskripsiHalaman = kataAman
    ? `Kata-kata yang maknanya mengandung "${kataAman}" di kamus Kateglo.`
    : 'Cari kata berdasarkan makna di kamus Kateglo.';

  return (
    <HalamanDasar judul={judulHalaman} deskripsi={deskripsiHalaman}>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Mencari makna …"
        errorText="Gagal mengambil data. Coba lagi."
      />

      {!kataAman && !isLoading && (
        <p className="secondary-text">
          Gunakan kolom pencarian di atas untuk mencari kata berdasarkan makna
          {contoh.length > 0 && (
            <>, misalnya{' '}
              {contoh.map((indeks, i) => (
                <span key={indeks}>
                  <Link to={`/makna/cari/${encodeURIComponent(indeks)}`} className="link-action">
                    {indeks}
                  </Link>
                  {i < contoh.length - 2 && ', '}
                  {i === contoh.length - 2 && ', atau '}
                </span>
              ))}
            </>
          )}
          .
        </p>
      )}

      {kataAman && !isLoading && !isError && (
        <HasilPencarian
          results={results}
          emptyState={
            <p className="muted-text">
              Tidak ada kata yang maknanya mengandung &quot;{kataAman}&quot;. Mau cari{' '}
              <Link to={`/kamus/cari/${encodeURIComponent(kataAman)}`} className="link-action">
                kata itu di kamus
              </Link>
              ?
            </p>
          }
          total={total}
          limit={limit}
          pageInfo={pageInfo}
          currentPage={cursorState.page}
          onNavigateCursor={(action) => handleCursor(action, { pageInfo, total })}
          containerClassName=""
          renderItems={(items) => (
            <div className="space-y-2">
              {items.map((item) => {
                const makna = item.makna_cocok?.[0];
                return (
                  <p key={item.id} className="leading-relaxed">
                    <Link
                      to={buatPathDetailKamus(item.indeks || item.entri)}
                      className="link-action font-bold"
                    >
                      {formatLemaHomonim(item.entri)}
                    </Link>
                    {makna && (
                      <span className="tesaurus-result-relasi">
                        {makna.kelas_kata && (
                          <> <span className="tesaurus-result-badge">{makna.kelas_kata}</span></>
                        )}
                        {' '}<TebalkanKataKunci teks={stripMarkdown(makna.makna)} query={kataAman} />
                      </span>
                    )}
                  </p>
                );
              })}
            </div>
          )}
        />
      )}
    </HalamanDasar>
  );
}

export default Makna;
