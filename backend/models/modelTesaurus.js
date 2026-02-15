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
  static async cari(query, limit = 100, offset = 0) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const baseSql = `
      WITH hasil AS (
        SELECT id, lema, sinonim, antonim,
               CASE WHEN LOWER(lema) = LOWER($1) THEN 0
                    WHEN lema ILIKE $2 THEN 1
                    ELSE 2 END AS prioritas
        FROM tesaurus
        WHERE lema ILIKE $3
          AND (sinonim IS NOT NULL OR antonim IS NOT NULL)
      )`;

    const countResult = await db.query(
      `${baseSql} SELECT COUNT(*) AS total FROM hasil`,
      [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    if (total === 0) {
      return { data: [], total: 0 };
    }

    const dataResult = await db.query(
      `${baseSql}
       SELECT id, lema, sinonim, antonim
       FROM hasil
       ORDER BY prioritas, lema ASC
       LIMIT $4 OFFSET $5`,
      [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`, cappedLimit, safeOffset]
    );

    return { data: dataResult.rows, total };
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
