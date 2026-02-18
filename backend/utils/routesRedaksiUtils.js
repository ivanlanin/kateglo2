/**
 * @fileoverview Utilitas bersama untuk route redaksi
 */

function parsePagination(query = {}, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
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
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
};
