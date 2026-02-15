/**
 * @fileoverview Model untuk glosarium (istilah teknis bilingual)
 */

const db = require('../db');

class ModelGlosarium {
  static async autocomplete(query, limit = 8) {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

    const result = await db.query(
      `SELECT DISTINCT indonesia, asing
       FROM glosarium
       WHERE indonesia ILIKE $1 OR asing ILIKE $1
       ORDER BY indonesia ASC
       LIMIT $2`,
      [`${trimmed}%`, cappedLimit]
    );

    return result.rows.map((row) => ({
      value: row.indonesia,
      asing: row.asing || null,
    }));
  }

  /**
   * Cari glosarium dengan filter
   * @param {Object} params - Parameter pencarian
   * @param {string} params.q - Kata pencarian
  * @param {string} params.bidang - Filter bidang
  * @param {string} params.sumber - Filter sumber
   * @param {string} params.bahasa - Filter bahasa (id/en/semua)
   * @param {number} params.limit - Batas hasil
   * @param {number} params.offset - Offset untuk pagination
   * @returns {Promise<Object>} { data, total }
   */
  static async cari({ q = '', bidang = '', sumber = '', bahasa = '', limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`(g.indonesia ILIKE $${idx} OR g.asing ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    if (bidang) {
      conditions.push(`g.bidang = $${idx}`);
      params.push(bidang);
      idx++;
    }

    if (sumber) {
      conditions.push(`g.sumber = $${idx}`);
      params.push(sumber);
      idx++;
    }

    if (bahasa === 'id') {
      conditions.push(`g.bahasa = 'id'`);
    } else if (bahasa === 'en') {
      conditions.push(`g.bahasa = 'en'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM glosarium g ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT g.id, g.indonesia, g.asing, g.bidang, g.bahasa, g.sumber
       FROM glosarium g
       ${whereClause}
       ORDER BY g.indonesia ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  /**
  * Ambil daftar bidang yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarBidang() {
    const result = await db.query(
      `SELECT bidang, COUNT(*) as jumlah
        FROM glosarium
       WHERE bidang IS NOT NULL AND bidang != ''
       GROUP BY bidang
       ORDER BY bidang`
    );
    return result.rows;
  }

  /**
   * Ambil daftar sumber yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarSumber() {
    const result = await db.query(
      `SELECT sumber, COUNT(*) as jumlah
       FROM glosarium
       WHERE sumber IS NOT NULL AND sumber != ''
       GROUP BY sumber
       ORDER BY sumber`
    );
    return result.rows;
  }

  /**
  * Ambil entri glosarium yang mengandung kata utuh pada kolom indonesia
   * @param {string} kata - Kata target (word boundary)
   * @param {number} limit - Batas hasil
  * @returns {Promise<Array>} Daftar indonesia + asing
   */
  static async cariFrasaMengandungKataUtuh(kata, limit = 50) {
    const trimmed = (kata || '').trim();
    if (!trimmed) return [];

    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const result = await db.query(
      `SELECT DISTINCT g.indonesia, g.asing
       FROM glosarium g
       WHERE LOWER(g.indonesia) LIKE ('%' || LOWER($1) || '%')
         AND LOWER(g.indonesia) ~ (
         '(^|[^[:alnum:]_])' ||
         regexp_replace(LOWER($1), '([.^$|()\\[\\]{}*+?\\\\-])', '\\\\\\1', 'g') ||
         '([^[:alnum:]_]|$)'
       )
       ORDER BY g.indonesia ASC, g.asing ASC
       LIMIT $2`,
      [trimmed, cappedLimit]
    );

    return result.rows;
  }
}

module.exports = ModelGlosarium;
