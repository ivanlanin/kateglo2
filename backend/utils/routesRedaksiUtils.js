/**
 * @fileoverview Utilitas bersama untuk route redaksi
 */

const { encodeCursor, decodeCursor } = require('./cursorPagination');

function parsePagination(query = {}, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const cursor = typeof query.cursor === 'string' && query.cursor.trim()
    ? query.cursor.trim()
    : null;
  const direction = query.direction === 'prev' ? 'prev' : 'next';
  const lastPage = query.lastPage === '1' || query.lastPage === 'true';

  let offset = 0;
  let mode = 'cursor';

  if (cursor) {
    const cursorPayload = decodeCursor(cursor);
    const cursorOffset = Math.max(Number(cursorPayload?.offset) || 0, 0);
    const cursorTotal = Math.max(Number(cursorPayload?.total) || 0, 0);

    if (lastPage) {
      const totalHalaman = Math.max(1, Math.ceil(cursorTotal / limit));
      offset = Math.max((totalHalaman - 1) * limit, 0);
    } else {
      offset = cursorOffset;
    }
  }

  return { limit, offset, cursor, direction, lastPage, mode };
}

function buildPaginationMeta({ limit, offset, total, dataLength }) {
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const safeTotal = Math.max(Number(total) || 0, 0);
  const safeLength = Math.max(Number(dataLength) || 0, 0);

  const hasPrev = safeOffset > 0;
  const hasNext = safeOffset + safeLength < safeTotal;
  const prevOffset = Math.max(safeOffset - safeLimit, 0);
  const nextOffset = safeOffset + safeLimit;

  return {
    hasPrev,
    hasNext,
    prevCursor: hasPrev ? encodeCursor({ offset: prevOffset, total: safeTotal }) : null,
    nextCursor: hasNext ? encodeCursor({ offset: nextOffset, total: safeTotal }) : null,
  };
}

function buildPaginatedResult({ data = [], total = 0, pagination = {}, pageInfo } = {}) {
  const meta = pageInfo || buildPaginationMeta({
    limit: pagination.limit,
    offset: pagination.offset,
    total,
    dataLength: Array.isArray(data) ? data.length : 0,
  });

  return {
    data,
    total,
    limit: pagination.limit,
    offset: pagination.offset,
    pageInfo: {
      hasPrev: meta.hasPrev,
      hasNext: meta.hasNext,
      prevCursor: meta.prevCursor || null,
      nextCursor: meta.nextCursor || null,
    },
  };
}

function parseSearchQuery(value) {
  return String(value || '').trim();
}

function parseIdParam(value) {
  return Number(value);
}

function parseTrimmedString(value) {
  return String(value ?? '').trim();
}

module.exports = {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
};
