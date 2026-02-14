/**
 * @fileoverview Model untuk glosarium (istilah teknis bilingual)
 */

const db = require('../db');

class ModelGlosarium {
  /**
   * Cari glosarium dengan filter
   * @param {Object} params - Parameter pencarian
   * @param {string} params.q - Kata pencarian
   * @param {string} params.bidang - Filter bidang/discipline
   * @param {string} params.sumber - Filter sumber/ref_source
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
      conditions.push(`(g.phrase ILIKE $${idx} OR g.original ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    if (bidang) {
      conditions.push(`g.discipline = $${idx}`);
      params.push(bidang);
      idx++;
    }

    if (sumber) {
      conditions.push(`g.ref_source = $${idx}`);
      params.push(sumber);
      idx++;
    }

    if (bahasa === 'id') {
      conditions.push(`g.lang = 'id'`);
    } else if (bahasa === 'en') {
      conditions.push(`g.lang = 'en'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM glossary g ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT g.glo_uid, g.phrase, g.original, g.discipline, g.lang, g.ref_source
       FROM glossary g
       ${whereClause}
       ORDER BY g.phrase ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  /**
   * Ambil daftar bidang/discipline yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarBidang() {
    const result = await db.query(
      `SELECT discipline, COUNT(*) as jumlah
       FROM glossary
       WHERE discipline IS NOT NULL AND discipline != ''
       GROUP BY discipline
       ORDER BY discipline`
    );
    return result.rows;
  }

  /**
   * Ambil daftar sumber yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarSumber() {
    const result = await db.query(
      `SELECT ref_source, COUNT(*) as jumlah
       FROM glossary
       WHERE ref_source IS NOT NULL AND ref_source != ''
       GROUP BY ref_source
       ORDER BY ref_source`
    );
    return result.rows;
  }
}

module.exports = ModelGlosarium;
