/**
 * @fileoverview Model untuk singkatan dan akronim
 */

const db = require('../db');

class ModelSingkatan {
  /**
   * Cari singkatan/akronim dengan filter
   * @param {Object} params - Parameter pencarian
   * @param {string} params.q - Pencarian umum (key + ID + EN)
   * @param {string} params.kependekan - Filter kependekan
   * @param {string} params.tag - Filter tag
   * @param {number} params.limit - Batas hasil
   * @param {number} params.offset - Offset untuk pagination
   * @returns {Promise<Object>} { data, total }
   */
  static async cari({ q = '', kependekan = '', tag = '', limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(
        `(abbr_key ILIKE $${idx} OR abbr_id ILIKE $${idx} OR abbr_en ILIKE $${idx})`
      );
      params.push(`%${q}%`);
      idx++;
    }

    if (kependekan) {
      conditions.push(`abbr_key ILIKE $${idx}`);
      params.push(`%${kependekan}%`);
      idx++;
    }

    if (tag) {
      conditions.push(`abbr_type ILIKE $${idx}`);
      params.push(`%${tag}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM abbr_entry ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT abbr_idx, abbr_key, abbr_id, abbr_en, abbr_type,
              redirect_to, source, url, notes
       FROM abbr_entry
       ${whereClause}
       ORDER BY abbr_key ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }
}

module.exports = ModelSingkatan;
