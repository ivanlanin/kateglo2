/**
 * @fileoverview Shared autocomplete query — prefix match pada kolom teks
 */

const db = require('./index');

/**
 * Jalankan autocomplete prefix-match pada sebuah tabel
 * @param {string} table - Nama tabel
 * @param {string} column - Nama kolom teks
 * @param {string} query - Kata pencarian
 * @param {Object} [opts]
 * @param {number} [opts.limit=8] - Batas hasil
 * @param {string} [opts.extraWhere] - Kondisi WHERE tambahan (misal "aktif = 1")
 * @returns {Promise<string[]>} Daftar string hasil autocomplete
 */
async function autocomplete(table, column, query, { limit = 8, extraWhere = '' } = {}) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const where = extraWhere ? `AND ${extraWhere}` : '';

  const result = await db.query(
    `SELECT DISTINCT ${column}
     FROM ${table}
     WHERE ${column} ILIKE $1 ${where}
     ORDER BY ${column} ASC
     LIMIT $2`,
    [`${trimmed}%`, cappedLimit]
  );

  return result.rows.map((row) => row[column]);
}

module.exports = autocomplete;
