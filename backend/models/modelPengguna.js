/**
 * @fileoverview Model untuk pengelolaan pengguna dan otorisasi
 */

const db = require('../db');
const { parseCount } = require('../utils/modelUtils');

class ModelPengguna {
  /**
   * Upsert pengguna saat login Google.
   * Insert baru atau update data yang ada berdasarkan google_id.
   * @param {{ googleId: string, email: string, nama: string, foto: string }} data
   * @returns {Promise<Object>} Baris pengguna dari database
   */
  static async upsertDariGoogle({ googleId, email, nama, foto }) {
    const result = await db.query(
      `INSERT INTO pengguna (google_id, surel, nama, foto, login_terakhir)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (google_id) DO UPDATE SET
         surel = EXCLUDED.surel,
         nama = EXCLUDED.nama,
         foto = EXCLUDED.foto,
        login_terakhir = NOW()
       RETURNING *`,
      [googleId, email, nama, foto]
    );
    return result.rows[0];
  }

  /**
   * Ambil kode peran berdasarkan ID
   * @param {number} peranId
   * @returns {Promise<string>}
   */
  static async ambilKodePeran(peranId) {
    const result = await db.query(
      'SELECT kode FROM peran WHERE id = $1',
      [peranId]
    );
    return result.rows[0]?.kode || 'pengguna';
  }

  /**
   * Ambil daftar kode izin berdasarkan peran_id
   * @param {number} peranId
   * @returns {Promise<string[]>}
   */
  static async ambilIzin(peranId) {
    const result = await db.query(
      `SELECT i.kode FROM izin i
       JOIN peran_izin pi ON pi.izin_id = i.id
       WHERE pi.peran_id = $1
       ORDER BY i.kode`,
      [peranId]
    );
    return result.rows.map((r) => r.kode);
  }

  /**
   * Ambil pengguna berdasarkan ID, lengkap dengan kode peran
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      `SELECT p.*, r.kode AS peran_kode, r.nama AS peran_nama
       FROM pengguna p
       JOIN peran r ON r.id = p.peran_id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Daftar semua pengguna (untuk panel admin)
   * @param {{ limit?: number, offset?: number }} options
   * @returns {Promise<{ data: Array, total: number }>}
   */
  static async daftarPengguna({ limit = 50, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const countResult = await db.query('SELECT COUNT(*) AS total FROM pengguna');
    const total = parseCount(countResult.rows[0]?.total);

    const dataResult = await db.query(
      `SELECT p.id, p.google_id, p.surel, p.nama, p.foto, p.aktif,
              p.login_terakhir, p.created_at,
              r.kode AS peran_kode, r.nama AS peran_nama
       FROM pengguna p
       JOIN peran r ON r.id = p.peran_id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [cappedLimit, safeOffset]
    );

    return { data: dataResult.rows, total };
  }

  /**
   * Ubah peran pengguna
   * @param {number} penggunaId
   * @param {number} peranId
   * @returns {Promise<Object|null>}
   */
  static async ubahPeran(penggunaId, peranId) {
    const result = await db.query(
      `UPDATE pengguna SET peran_id = $1
       WHERE id = $2
       RETURNING *`,
      [peranId, penggunaId]
    );
    return result.rows[0] || null;
  }

  /**
   * Daftar semua peran yang tersedia
   * @returns {Promise<Array>}
   */
  static async daftarPeran() {
    const result = await db.query(
      'SELECT id, kode, nama, keterangan FROM peran ORDER BY id'
    );
    return result.rows;
  }

  /**
   * Bootstrap admin: jika email ada di ADMIN_EMAILS, set peran = admin
   * @param {Object} pengguna - Baris pengguna dari database
   * @returns {Promise<Object>} Pengguna (mungkin sudah diperbarui peran_id-nya)
   */
  /**
   * Hitung total pengguna
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM pengguna');
    return parseCount(result.rows[0]?.total);
  }

  /**
   * Update pengguna (nama, aktif, peran_id) — untuk panel admin
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  static async simpanPengguna(id, { nama, aktif, peran_id }) {
    const result = await db.query(
      `UPDATE pengguna SET nama = COALESCE($1, nama),
              aktif = COALESCE($2, aktif),
              peran_id = COALESCE($3, peran_id)
       WHERE id = $4
       RETURNING *`,
      [nama, aktif, peran_id, id]
    );
    return result.rows[0] || null;
  }

  static async bootstrapAdmin(pengguna) {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(pengguna.surel.toLowerCase())) {
      return pengguna;
    }

    const result = await db.query(
      'SELECT id FROM peran WHERE kode = $1',
      ['admin']
    );
    const adminPeranId = result.rows[0]?.id;

    if (adminPeranId && pengguna.peran_id !== adminPeranId) {
      await db.query(
        'UPDATE pengguna SET peran_id = $1 WHERE id = $2',
        [adminPeranId, pengguna.id]
      );
      pengguna.peran_id = adminPeranId;
    }

    return pengguna;
  }
}

module.exports = ModelPengguna;
