/**
 * @fileoverview Hook state pencarian dan paginasi untuk halaman admin
 */

import { useState } from 'react';
import { useCursorPagination } from './useCursorPagination';

function usePencarianAdmin(batasPerHalaman = 50) {
  const [cari, setCari] = useState('');
  const [q, setQ] = useState('');
  const {
    cursorState,
    handleCursor,
  } = useCursorPagination({
    limit: batasPerHalaman,
    resetOn: q,
  });

  const setOffset = (value, { pageInfo, total } = {}) => {
    if (typeof value === 'number') {
      if (value <= 0) {
        handleCursor('first', { pageInfo, total });
      }
      return;
    }

    if (typeof value === 'string') {
      handleCursor(value, { pageInfo, total });
    }
  };

  const kirimCari = (nilai) => {
    const val = nilai ?? cari;
    setQ(val);
    setOffset(0);
  };

  const hapusCari = () => {
    setCari('');
    setQ('');
    setOffset(0);
  };

  return {
    cari,
    setCari,
    q,
    offset: Math.max((cursorState.page - 1) * batasPerHalaman, 0),
    setOffset,
    kirimCari,
    hapusCari,
    limit: batasPerHalaman,
    currentPage: cursorState.page,
    cursor: cursorState.cursor,
    direction: cursorState.direction,
    lastPage: cursorState.lastPage,
  };
}

export default usePencarianAdmin;