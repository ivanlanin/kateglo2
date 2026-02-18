/**
 * @fileoverview Model untuk tesaurus (sinonim, antonim, relasi kata)
 */

const db = require('../db');
const autocomplete = require('../db/autocomplete');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');

class ModelTesaurus {
  static async autocomplete(query, limit = 8) {
    return autocomplete('tesaurus', 'lema', query, { limit, extraWhere: 'aktif = TRUE' });
  }

  /**
   * Cari tesaurus berdasarkan kata
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
   * @returns {Promise<Array>} Daftar entri tesaurus
   */
  static async cari(query, limit = 100, offset = 0, hitungTotal = true) {
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
          AND aktif = TRUE
          AND (sinonim IS NOT NULL OR antonim IS NOT NULL)
      )`;

    if (hitungTotal) {
      const countResult = await db.query(
        `${baseSql} SELECT COUNT(*) AS total FROM hasil`,
        [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`]
      );
      const total = parseCount(countResult.rows[0]?.total);

      if (total === 0) {
        return { data: [], total: 0, hasNext: false };
      }

      const dataResult = await db.query(
        `${baseSql}
      SELECT id, lema, sinonim, antonim
       FROM hasil
       ORDER BY prioritas, lema ASC
       LIMIT $4 OFFSET $5`,
        [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`, cappedLimit, safeOffset]
      );

      return {
        data: dataResult.rows,
        total,
        hasNext: safeOffset + dataResult.rows.length < total,
      };
    }

    const dataResult = await db.query(
      `${baseSql}
      SELECT id, lema, sinonim, antonim
       FROM hasil
       ORDER BY prioritas, lema ASC
       LIMIT $4 OFFSET $5`,
      [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`, cappedLimit + 1, safeOffset]
    );

    const hasNext = dataResult.rows.length > cappedLimit;
    const data = hasNext ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    const total = hasNext
      ? safeOffset + cappedLimit + 1
      : safeOffset + data.length;

    return { data, total, hasNext };
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
         AND aktif = TRUE
       LIMIT 1`,
      [kata]
    );
    return result.rows[0] || null;
  }

  /**
   * Daftar tesaurus untuk panel admin (dengan pencarian opsional)
   * @param {{ limit?: number, offset?: number, q?: string }} options
   * @returns {Promise<{ data: Array, total: number }>}
   */
  static async daftarAdmin({ limit = 50, offset = 0, q = '' } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`lema ILIKE $${idx}`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM tesaurus ${where}`,
      params
    );
    const total = parseCount(countResult.rows[0]?.total);

    const dataResult = await db.query(
      `SELECT id, lema, sinonim, antonim, turunan, gabungan, berkaitan, aktif
       FROM tesaurus ${where}
       ORDER BY lema ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  /**
   * Hitung total tesaurus
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM tesaurus');
    return parseCount(result.rows[0]?.total);
  }

  /**
   * Ambil tesaurus berdasarkan ID (untuk admin)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      'SELECT id, lema, sinonim, antonim, turunan, gabungan, berkaitan, aktif FROM tesaurus WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Simpan (insert atau update) tesaurus
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async simpan({ id, lema, sinonim, antonim, turunan, gabungan, berkaitan, aktif }) {
    const nilaiAktif = normalizeBoolean(aktif, true);
    if (id) {
      const result = await db.query(
        `UPDATE tesaurus SET lema = $1, sinonim = $2, antonim = $3,
                turunan = $4, gabungan = $5, berkaitan = $6, aktif = $7
         WHERE id = $8 RETURNING *`,
        [lema, sinonim || null, antonim || null, turunan || null,
         gabungan || null, berkaitan || null, nilaiAktif, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO tesaurus (lema, sinonim, antonim, turunan, gabungan, berkaitan, aktif)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [lema, sinonim || null, antonim || null, turunan || null,
       gabungan || null, berkaitan || null, nilaiAktif]
    );
    return result.rows[0];
  }

  /**
   * Hapus tesaurus berdasarkan ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query('DELETE FROM tesaurus WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
}

module.exports = ModelTesaurus;
module.exports.__private = {
  normalizeBoolean,
};
