import { useCallback, useEffect, useState } from 'react';

const initialCursorState = {
  cursor: null,
  direction: 'next',
  lastPage: false,
  page: 1,
};

const maxPublicOffset = 1000;

/**
 * Hook paginasi bersama untuk mode cursor (publik) dan offset (redaksi).
 * @param {{ limit: number, resetOn?: string, mode?: 'cursor' | 'offset' }} options
 */
function useCursorPagination({ limit, resetOn = '', mode = 'cursor' }) {
  const [cursorState, setCursorState] = useState(initialCursorState);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (mode === 'offset') {
      setOffset(0);
      return;
    }
    setCursorState(initialCursorState);
  }, [mode, resetOn]);

  const handleCursor = useCallback((action, { pageInfo, total } = {}) => {
    if (mode === 'offset') {
      const safeLimit = Math.max(Number(limit) || 1, 1);
      const safeOffset = Math.max(Number(offset) || 0, 0);
      const safeTotal = Math.max(Number(total) || 0, 0);
      const totalPagesData = Math.max(1, Math.ceil(safeTotal / safeLimit));
      const maxPages = Math.floor(maxPublicOffset / safeLimit) + 1;
      const totalPages = Math.min(totalPagesData, maxPages);
      const currentPage = Math.floor(safeOffset / safeLimit) + 1;

      if (action === 'first') {
        setOffset(0);
        return;
      }
      if (action === 'last') {
        setOffset((totalPages - 1) * safeLimit);
        return;
      }
      if (action === 'next') {
        const nextPage = Math.min(totalPages, currentPage + 1);
        setOffset((nextPage - 1) * safeLimit);
        return;
      }
      if (action === 'prev') {
        const prevPage = Math.max(1, currentPage - 1);
        setOffset((prevPage - 1) * safeLimit);
      }
      return;
    }

    if (action === 'first') {
      setCursorState(initialCursorState);
      return;
    }

    if (action === 'last') {
      const cursorForLast = pageInfo?.nextCursor || pageInfo?.prevCursor || null;
      const targetPage = Math.max(1, Math.ceil((Number(total) || 0) / limit));
      setCursorState({
        cursor: cursorForLast,
        direction: 'next',
        lastPage: true,
        page: targetPage,
      });
      return;
    }

    if (action === 'next' && pageInfo?.hasNext && pageInfo?.nextCursor) {
      setCursorState((prev) => ({
        cursor: pageInfo.nextCursor,
        direction: 'next',
        lastPage: false,
        page: prev.page + 1,
      }));
      return;
    }

    if (action === 'prev' && pageInfo?.hasPrev && pageInfo?.prevCursor) {
      setCursorState((prev) => ({
        cursor: pageInfo.prevCursor,
        direction: 'prev',
        lastPage: false,
        page: Math.max(1, prev.page - 1),
      }));
    }
  }, [limit, mode, offset]);

  return {
    cursorState,
    handleCursor,
    offset,
    setOffset,
  };
}

export { useCursorPagination };