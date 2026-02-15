/**
 * @fileoverview Model untuk tesaurus (sinonim, antonim, relasi kata)
 */

const db = require('../db');
const autocomplete = require('../db/autocomplete');

class ModelTesaurus {
  static async autocomplete(query, limit = 8) {
    return autocomplete('tesaurus', 'lema', query, { limit });
  }

  /**
   * Cari tesaurus berdasarkan kata
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
   * @returns {Promise<Array>} Daftar entri tesaurus
   */
  static async cari(query, limit = 20) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const prefixRows = await db.query(
      `SELECT id, lema, sinonim, antonim
       FROM tesaurus
       WHERE lema ILIKE $1
       ORDER BY
         CASE WHEN LOWER(lema) = LOWER($2) THEN 0 ELSE 1 END,
         lema ASC
       LIMIT $3`,
      [`${normalizedQuery}%`, normalizedQuery, cappedLimit]
    );

    let combinedRows = prefixRows.rows;

    if (combinedRows.length < cappedLimit) {
      const remaining = cappedLimit - combinedRows.length;
      const containsRows = await db.query(
        `SELECT id, lema, sinonim, antonim
         FROM tesaurus
         WHERE lema ILIKE $1
           AND lema NOT ILIKE $2
         ORDER BY lema ASC
         LIMIT $3`,
        [`%${normalizedQuery}%`, `${normalizedQuery}%`, remaining]
      );
      combinedRows = combinedRows.concat(containsRows.rows);
    }

    return combinedRows;
  }

  /**
   * Ambil detail tesaurus untuk sebuah kata
   * @param {string} kata - Kata yang dicari
   * @returns {Promise<Object|null>} Data tesaurus lengkap
   */
  static async ambilDetail(kata) {
    const result = await db.query(
      `SELECT id, lema, sinonim, antonim, turunan, gabungan, berkaitan
       FROM tesaurus
       WHERE LOWER(lema) = LOWER($1)
       LIMIT 1`,
      [kata]
    );
    return result.rows[0] || null;
  }
}

module.exports = ModelTesaurus;
