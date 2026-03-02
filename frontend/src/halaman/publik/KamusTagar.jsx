/**
 * @fileoverview Halaman daftar entri per tagar morfologis
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariEntriPerTagar } from '../../api/apiPublik';
import { useCursorPagination } from '../../hooks/bersama/useCursorPagination';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HasilPencarian from '../../komponen/publik/HasilPencarian';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { formatLemaHomonim } from '../../utils/formatUtils';
import { buatPathDetailKamus } from '../../utils/paramUtils';

const limit = 100;

function KamusTagar() {
  const { kode } = useParams();
  const { cursorState, handleCursor } = useCursorPagination({
    limit,
    resetOn: kode || '',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['kamus-tagar-entri', kode, cursorState.cursor, cursorState.direction, cursorState.lastPage],
    queryFn: () => cariEntriPerTagar(kode, {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    }),
    enabled: Boolean(kode),
  });

  const tagar = data?.tagar;
  const results = data?.data || [];
  const total = data?.total || 0;
  const pageInfo = data?.pageInfo;

  const judul = tagar ? `Kata bertagar ${tagar.nama}` : 'Tagar';
  const deskripsi = total > 0
    ? `${total} kata dalam kamus Kateglo bertagar ${tagar?.nama}`
    : undefined;

  const handlePaginasi = (action) => {
    handleCursor(action, { pageInfo, total });
  };

  return (
    <HalamanDasar judul={judul} deskripsi={deskripsi}>
      <QueryFeedback isLoading={isLoading} isError={isError} error={error} loadingText="Memuat data …" />

      {!isLoading && !isError && (
        <HasilPencarian
          results={results}
          emptyState={<EmptyResultText text="Tidak ada entri untuk tagar ini." />}
          total={total}
          limit={limit}
          pageInfo={pageInfo}
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

export default KamusTagar;
