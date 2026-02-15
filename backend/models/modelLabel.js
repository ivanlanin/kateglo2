/**
 * @fileoverview Model untuk tabel label dan kategori kamus
 * (ragam, kelas_kata, bahasa, bidang, abjad, jenis)
 */

const db = require('../db');

/**
 * Ekspresi SQL untuk mengekstrak huruf pertama Latin dari lema.
 * Lewati karakter non-Latin di awal (tanda hubung, spasi, dll.),
 * lalu ambil huruf Latin pertama dan ubah ke huruf besar.
 */
const SQL_ABJAD = `UPPER(SUBSTRING(REGEXP_REPLACE(lema, '^[^a-zA-Z]*', ''), 1, 1))`;

class ModelLabel {
  /**
   * Ambil semua kategori beserta daftar label per kategori dan jumlah lema.
   * Kolom makna bisa menyimpan kode atau nama label, jadi pencocokan
   * dilakukan terhadap kedua nilai.
   * @returns {Promise<Object>} { kategori: [{ kode, nama, jumlah }] }
   */
  static async ambilSemuaKategori() {
    // Label dari tabel label (ragam, kelas_kata, bahasa, bidang)
    const result = await db.query(
      `SELECT kategori, kode, nama
       FROM label
       ORDER BY kategori, nama`
    );

    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.kategori]) {
        grouped[row.kategori] = [];
      }
      grouped[row.kategori].push({ kode: row.kode, nama: row.nama });
    }

    // Kategori abjad: huruf A–Z
    grouped.abjad = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((h) => ({
      kode: h,
      nama: h,
    }));

    // Kategori jenis: nilai tetap dari CHECK constraint tabel lema
    const JENIS = ['dasar', 'berimbuhan', 'gabungan', 'idiom', 'peribahasa', 'varian'];
    grouped.jenis = JENIS.map((j) => ({ kode: j, nama: j }));

    return grouped;
  }

  /**
   * Cari lema berdasarkan kategori dan kode label.
   * Mendukung kategori dari tabel label (ragam, kelas_kata, bahasa, bidang)
   * serta kategori virtual (abjad, jenis).
   * @param {string} kategori - Kategori
   * @param {string} kode - Kode label / huruf / jenis
   * @param {number} limit - Batas hasil
   * @param {number} offset - Offset untuk paginasi
   * @returns {Promise<{data: Array, total: number, label: Object|null}>}
   */
  static async cariLemaPerLabel(kategori, kode, limit = 20, offset = 0) {
    if (kategori === 'abjad') {
      return this._cariLemaPerAbjad(kode, limit, offset);
    }
    if (kategori === 'jenis') {
      return this._cariLemaPerJenis(kode, limit, offset);
    }

    const validKategori = ['ragam', 'kelas_kata', 'bahasa', 'bidang'];
    if (!validKategori.includes(kategori)) {
      return { data: [], total: 0, label: null };
    }

    // Ambil info label (kode + nama) untuk pencocokan ganda
    const labelResult = await db.query(
      `SELECT kode, nama, keterangan FROM label WHERE kategori = $1 AND kode = $2 LIMIT 1`,
      [kategori, kode]
    );
    const label = labelResult.rows[0] || null;

    // Kumpulkan nilai yang mungkin tersimpan di kolom makna
    const nilaiCocok = [kode];
    if (label && label.nama !== kode) {
      nilaiCocok.push(label.nama);
    }

    const kolom = kategori;

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT l.id) AS total
       FROM lema l
       JOIN makna m ON m.lema_id = l.id
       WHERE m.${kolom} = ANY($1::text[]) AND l.aktif = 1`,
      [nilaiCocok]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT DISTINCT ON (l.lema) l.id, l.lema, l.jenis, l.jenis_rujuk, l.lema_rujuk,
              m.kelas_kata AS preview_kelas_kata, m.makna AS preview_makna
       FROM lema l
       JOIN makna m ON m.lema_id = l.id
       WHERE m.${kolom} = ANY($1::text[]) AND l.aktif = 1
       ORDER BY l.lema, m.urutan ASC, m.id ASC
       LIMIT $2 OFFSET $3`,
      [nilaiCocok, limit, offset]
    );

    return { data: dataResult.rows, total, label };
  }

  /**
   * Cari lema berdasarkan huruf pertama Latin.
   */
  static async _cariLemaPerAbjad(huruf, limit, offset) {
    const h = huruf.toUpperCase();
    if (!/^[A-Z]$/.test(h)) {
      return { data: [], total: 0, label: null };
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM lema
       WHERE aktif = 1 AND ${SQL_ABJAD} = $1`,
      [h]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT l.id, l.lema, l.jenis, l.jenis_rujuk, l.lema_rujuk,
              m.kelas_kata AS preview_kelas_kata, m.makna AS preview_makna
       FROM lema l
       LEFT JOIN LATERAL (
         SELECT kelas_kata, makna FROM makna WHERE lema_id = l.id ORDER BY urutan LIMIT 1
       ) m ON true
       WHERE l.aktif = 1 AND ${SQL_ABJAD} = $1
       ORDER BY l.lema
       LIMIT $2 OFFSET $3`,
      [h, limit, offset]
    );

    return {
      data: dataResult.rows,
      total,
      label: { kode: h, nama: h },
    };
  }

  /**
   * Cari lema berdasarkan jenis (dasar, berimbuhan, gabungan, idiom, peribahasa, varian).
   */
  static async _cariLemaPerJenis(jenis, limit, offset) {
    const validJenis = ['dasar', 'berimbuhan', 'gabungan', 'idiom', 'peribahasa', 'varian'];
    if (!validJenis.includes(jenis)) {
      return { data: [], total: 0, label: null };
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM lema WHERE aktif = 1 AND jenis = $1`,
      [jenis]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT l.id, l.lema, l.jenis, l.jenis_rujuk, l.lema_rujuk,
              m.kelas_kata AS preview_kelas_kata, m.makna AS preview_makna
       FROM lema l
       LEFT JOIN LATERAL (
         SELECT kelas_kata, makna FROM makna WHERE lema_id = l.id ORDER BY urutan LIMIT 1
       ) m ON true
       WHERE l.aktif = 1 AND l.jenis = $1
       ORDER BY l.lema
       LIMIT $2 OFFSET $3`,
      [jenis, limit, offset]
    );

    return {
      data: dataResult.rows,
      total,
      label: { kode: jenis, nama: jenis },
    };
  }
}

module.exports = ModelLabel;
