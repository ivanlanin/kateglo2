/**
 * @fileoverview Utilitas bersama untuk route publik
 */

const publicMaxOffset = Math.max(Number(process.env.PUBLIC_MAX_OFFSET) || 1000, 0);

function parsePagination(query = {}, { defaultLimit = 100, maxLimit = 200 } = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
}

function parseCursorPagination(query = {}, { defaultLimit = 100, maxLimit = 200 } = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const cursor = typeof query.cursor === 'string' && query.cursor.trim()
    ? query.cursor.trim()
    : null;
  const direction = query.direction === 'prev' ? 'prev' : 'next';
  const lastPage = query.lastPage === '1' || query.lastPage === 'true';
  return { limit, cursor, direction, lastPage };
}

function rejectTooLargeOffset(res, offset, maxOffset = publicMaxOffset) {
  if (offset <= maxOffset) return false;
  res.status(400).json({
    error: 'Invalid Query',
    message: `Offset maksimal adalah ${maxOffset}`,
  });
  return true;
}

module.exports = {
  parsePagination,
  parseCursorPagination,
  rejectTooLargeOffset,
  publicMaxOffset,
};
