/**
 * @fileoverview Model untuk entri kamus (lema, makna, contoh)
 * Menggunakan tabel baru: lema, makna, contoh, label
 */

const db = require('../db');
const autocomplete = require('../db/autocomplete');

class ModelLema {
  static async autocomplete(query, limit = 8) {
    return autocomplete('lema', 'lema', query, { limit, extraWhere: 'aktif = 1' });
  }

  /**
   * Cari lema di kamus dengan strategi prefix-first + contains-fallback
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
   * @returns {Promise<Array>} Daftar lema dengan preview makna
   */
  static async cariLema(query, limit = 100, offset = 0) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    // Gunakan UNION untuk menggabungkan prefix dan contains dengan urutan stabil
    const baseSql = `
      WITH hasil AS (
        SELECT id, lema, jenis, lafal, jenis_rujuk, lema_rujuk,
               CASE WHEN LOWER(lema) = LOWER($1) THEN 0
                    WHEN lema ILIKE $2 THEN 1
                    ELSE 2 END AS prioritas
        FROM lema
        WHERE lema ILIKE $3 AND aktif = 1
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
       SELECT id, lema, jenis, lafal, jenis_rujuk, lema_rujuk
       FROM hasil
       ORDER BY prioritas, lema ASC
       LIMIT $4 OFFSET $5`,
      [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`, cappedLimit, safeOffset]
    );

    return { data: dataResult.rows, total };
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

}

module.exports = ModelLema;
