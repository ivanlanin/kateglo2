/**
 * @fileoverview Model untuk peribahasa
 */

const db = require('../db');

class ModelPeribahasa {
  /**
   * Cari peribahasa dengan pagination
   * @param {Object} params - Parameter pencarian
   * @param {string} params.q - Kata pencarian
   * @param {number} params.limit - Batas hasil
   * @param {number} params.offset - Offset untuk pagination
   * @returns {Promise<Object>} { data, total }
   */
  static async cari({ q = '', limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`(proverb ILIKE $${idx} OR meaning ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM proverb ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT prv_uid, phrase, proverb, meaning, prv_type
       FROM proverb
       ${whereClause}
       ORDER BY proverb ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }
}

module.exports = ModelPeribahasa;
