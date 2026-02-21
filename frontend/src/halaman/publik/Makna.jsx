/**
 * @fileoverview Halaman kamus terbalik — cari kata berdasarkan makna
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariMakna } from '../../api/apiPublik';
import { useCursorPagination } from '../../hooks/bersama/useCursorPagination';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HasilPencarian from '../../komponen/publik/HasilPencarian';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { formatLemaHomonim } from '../../utils/formatUtils';
import { buatPathDetailKamus } from '../../utils/paramUtils';

function amanDecode(teks = '') {
  try {
    return decodeURIComponent(String(teks || ''));
  } catch {
    return String(teks || '');
  }
}

function stripMarkdown(teks = '') {
  return String(teks || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1');
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

  const results = data?.data || [];
  const total = data?.total || 0;
  const pageInfo = data?.pageInfo;

  const judulHalaman = kataAman
    ? `Hasil Pencarian Makna "${kataAman}"`
    : 'Pencarian Makna';
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

      {kataAman && !isLoading && !isError && (
        <HasilPencarian
          results={results}
          emptyState={
            <EmptyResultText text={`Tidak ada kata yang maknanya mengandung "${kataAman}".`} />
          }
          total={total}
          limit={limit}
          pageInfo={pageInfo}
          currentPage={cursorState.page}
          onNavigateCursor={(action) => handleCursor(action, { pageInfo, total })}
          containerClassName="tesaurus-result-grid"
          renderItems={(items) => items.map((item) => {
            const makna = item.makna_cocok?.[0];
            return (
              <div key={item.id} className="tesaurus-result-row">
                <Link
                  to={buatPathDetailKamus(item.indeks || item.entri)}
                  className="kamus-kategori-grid-link"
                >
                  {formatLemaHomonim(item.entri)}
                </Link>
                {makna && (
                  <span className="tesaurus-result-relasi">
                    {makna.kelas_kata && (
                      <> <span className="tesaurus-result-badge">{makna.kelas_kata}</span></>
                    )}
                    {' '}{stripMarkdown(makna.makna)}
                  </span>
                )}
              </div>
            );
          })}
        />
      )}
    </HalamanDasar>
  );
}

export default Makna;
