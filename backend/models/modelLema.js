/**
 * @fileoverview Model untuk entri kamus (lema, makna, contoh)
 * Menggunakan tabel baru: lema, makna, contoh, label
 */

const db = require('../db');

class ModelLema {
  /**
   * Cari lema di kamus dengan strategi prefix-first + contains-fallback
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
   * @returns {Promise<Array>} Daftar lema dengan preview makna
   */
  static async cariLema(query, limit = 20) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const prefixRows = await db.query(
      `SELECT id, lema, jenis, lafal, jenis_rujuk, lema_rujuk
       FROM lema
       WHERE lema ILIKE $1 AND aktif = 1
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
        `SELECT id, lema, jenis, lafal, jenis_rujuk, lema_rujuk
         FROM lema
         WHERE lema ILIKE $1
           AND lema NOT ILIKE $2
           AND aktif = 1
         ORDER BY lema ASC
         LIMIT $3`,
        [`%${normalizedQuery}%`, `${normalizedQuery}%`, remaining]
      );
      combinedRows = combinedRows.concat(containsRows.rows);
    }

    if (combinedRows.length === 0) {
      return [];
    }

    // Ambil preview makna pertama untuk setiap lema
    const lemaIds = combinedRows.map((row) => row.id);
    const maknaRows = await db.query(
      `SELECT DISTINCT ON (lema_id) lema_id, makna, kelas_kata
       FROM makna
       WHERE lema_id = ANY($1::int[])
       ORDER BY lema_id, urutan ASC, id ASC`,
      [lemaIds]
    );

    const previewByLema = new Map(
      maknaRows.rows.map((row) => [row.lema_id, { makna: row.makna, kelas_kata: row.kelas_kata }])
    );

    return combinedRows.map((row) => ({
      ...row,
      preview_makna: previewByLema.get(row.id)?.makna || null,
      preview_kelas_kata: previewByLema.get(row.id)?.kelas_kata || null,
    }));
  }

  /**
   * Ambil lema berdasarkan teks (case-insensitive)
   * @param {string} teks - Teks lema
   * @returns {Promise<Object|null>} Data lema
   */
  static async ambilLema(teks) {
    const result = await db.query(
      `SELECT id, legacy_eid, lema, jenis, induk, pemenggalan, lafal, varian,
              jenis_rujuk, lema_rujuk, aktif
       FROM lema
       WHERE LOWER(lema) = LOWER($1)
       LIMIT 1`,
      [teks]
    );
    return result.rows[0] || null;
  }

  /**
   * Ambil semua makna untuk sebuah lema
   * @param {number} lemaId - ID lema
   * @returns {Promise<Array>} Daftar makna dengan contoh
   */
  static async ambilMakna(lemaId) {
    const result = await db.query(
      `SELECT id, polisem, urutan, makna, ragam, ragam_varian,
              kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat,
              ilmiah, kimia
       FROM makna
       WHERE lema_id = $1
       ORDER BY urutan ASC, id ASC`,
      [lemaId]
    );
    return result.rows;
  }

  /**
   * Ambil contoh untuk satu atau lebih makna
   * @param {number[]} maknaIds - Daftar ID makna
   * @returns {Promise<Array>} Daftar contoh
   */
  static async ambilContoh(maknaIds) {
    if (!maknaIds.length) return [];
    const result = await db.query(
      `SELECT id, makna_id, urutan, contoh, ragam, bahasa, bidang,
              kiasan, makna_contoh
       FROM contoh
       WHERE makna_id = ANY($1::int[])
       ORDER BY makna_id, urutan ASC, id ASC`,
      [maknaIds]
    );
    return result.rows;
  }

  /**
   * Ambil sublema (berimbuhan, gabungan, idiom, peribahasa) dari lema induk
   * @param {number} indukId - ID lema induk
   * @returns {Promise<Array>} Daftar sublema
   */
  static async ambilSublema(indukId) {
    const result = await db.query(
      `SELECT id, lema, jenis, lafal
       FROM lema
       WHERE induk = $1 AND aktif = 1
       ORDER BY jenis, lema`,
      [indukId]
    );
    return result.rows;
  }

  /**
   * Ambil lema induk
   * @param {number} indukId - ID lema induk
   * @returns {Promise<Object|null>} Data lema induk
   */
  static async ambilInduk(indukId) {
    if (!indukId) return null;
    const result = await db.query(
      `SELECT id, lema, jenis
       FROM lema
       WHERE id = $1`,
      [indukId]
    );
    return result.rows[0] || null;
  }

  /**
   * Ambil terjemahan terkait lema
   * @param {string} lema - Teks lema
   * @returns {Promise<Array>} Daftar terjemahan
   */
  static async ambilTerjemahan(lema) {
    const result = await db.query(
      `SELECT lemma, ref_source, translation
       FROM translation
       WHERE LOWER(lemma) = LOWER($1)`,
      [lema]
    );
    return result.rows;
  }
}

module.exports = ModelLema;
