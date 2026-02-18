/**
 * @fileoverview Utilitas bersama untuk route publik
 */

const publicMaxOffset = Math.max(Number(process.env.PUBLIC_MAX_OFFSET) || 1000, 0);

function parsePagination(query = {}, { defaultLimit = 100, maxLimit = 200 } = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
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
  rejectTooLargeOffset,
  publicMaxOffset,
};
