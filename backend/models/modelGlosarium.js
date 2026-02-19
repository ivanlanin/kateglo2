/**
 * @fileoverview Model untuk glosarium (istilah teknis bilingual)
 */

const db = require('../db');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');

class ModelGlosarium {
  static async autocomplete(query, limit = 8) {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

    const result = await db.query(
      `SELECT DISTINCT indonesia, asing
       FROM glosarium
       WHERE aktif = TRUE
         AND (indonesia ILIKE $1 OR asing ILIKE $1)
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
  static async cari({
    q = '',
    bidang = '',
    sumber = '',
    bahasa = '',
    aktif = '',
    limit = 20,
    offset = 0,
    aktifSaja = false,
    hitungTotal = true,
  } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (aktifSaja) {
      conditions.push('g.aktif = TRUE');
    }

    if (aktif === '1') {
      conditions.push('g.aktif = TRUE');
    } else if (aktif === '0') {
      conditions.push('g.aktif = FALSE');
    }

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

    if (hitungTotal) {
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM glosarium g ${whereClause}`,
        params
      );
      const total = parseCount(countResult.rows[0]?.total);

      const dataResult = await db.query(
        `SELECT g.id, g.indonesia, g.asing, g.bidang, g.bahasa, g.sumber, g.aktif
         FROM glosarium g
         ${whereClause}
         ORDER BY g.indonesia ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, cappedLimit, safeOffset]
      );

      return { data: dataResult.rows, total, hasNext: safeOffset + dataResult.rows.length < total };
    }

    const dataResult = await db.query(
      `SELECT g.id, g.indonesia, g.asing, g.bidang, g.bahasa, g.sumber, g.aktif
       FROM glosarium g
       ${whereClause}
       ORDER BY g.indonesia ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, cappedLimit + 1, safeOffset]
    );

    const hasNext = dataResult.rows.length > cappedLimit;
    const data = hasNext ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    const total = hasNext
      ? safeOffset + cappedLimit + 1
      : safeOffset + data.length;

    return { data, total, hasNext };
  }

  /**
  * Ambil daftar bidang yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarBidang(aktifSaja = true) {
    const kondisiAktif = aktifSaja ? 'AND aktif = TRUE' : '';
    const result = await db.query(
      `SELECT DISTINCT bidang
        FROM glosarium
       WHERE bidang IS NOT NULL AND bidang != '' ${kondisiAktif}
       ORDER BY bidang`
    );
    return result.rows;
  }

  /**
   * Ambil daftar sumber yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarSumber(aktifSaja = true) {
    const kondisiAktif = aktifSaja ? 'AND aktif = TRUE' : '';
    const result = await db.query(
      `SELECT DISTINCT sumber
       FROM glosarium
       WHERE sumber IS NOT NULL AND sumber != '' ${kondisiAktif}
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
  /**
   * Hitung total glosarium
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM glosarium');
    return parseCount(result.rows[0]?.total);
  }

  /**
   * Ambil glosarium berdasarkan ID (untuk admin)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      'SELECT id, indonesia, asing, bidang, bahasa, sumber, aktif FROM glosarium WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Simpan (insert atau update) glosarium
   * @param {Object} data
   * @param {string} updater - Email penyunting
   * @returns {Promise<Object>}
   */
  static async simpan({ id, indonesia, asing, bidang, bahasa, sumber, aktif }, updater = 'admin') {
    const nilaiAktif = normalizeBoolean(aktif, true);
    if (id) {
      const result = await db.query(
        `UPDATE glosarium SET indonesia = $1, asing = $2, bidang = $3,
                bahasa = $4, sumber = $5, aktif = $6, updater = $7, updated = NOW()
         WHERE id = $8 RETURNING *`,
        [indonesia, asing, bidang || null, bahasa || 'en', sumber || null, nilaiAktif, updater, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO glosarium (indonesia, asing, bidang, bahasa, sumber, aktif, updater, updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [indonesia, asing, bidang || null, bahasa || 'en', sumber || null, nilaiAktif, updater]
    );
    return result.rows[0];
  }

  /**
   * Hapus glosarium berdasarkan ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query('DELETE FROM glosarium WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  static async cariFrasaMengandungKataUtuh(kata, limit = 50) {
    const trimmed = (kata || '').trim();
    if (!trimmed) return [];

    const token = trimmed
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_-]+/gu, '')
      .trim();

    if (token.length < 3) return [];

    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const result = await db.query(
      `SELECT DISTINCT g.indonesia, g.asing
       FROM glosarium g
       WHERE g.aktif = TRUE
         AND LOWER(g.indonesia) LIKE ('%' || LOWER($1) || '%')
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
module.exports.__private = {
  normalizeBoolean,
};
