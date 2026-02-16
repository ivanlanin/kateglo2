/**
 * @fileoverview Model untuk tabel label dan kategori kamus
 * (ragam, kelas_kata, bahasa, bidang, abjad, jenis)
 */

const db = require('../db');

/**
 * Ekspresi SQL untuk mengekstrak huruf pertama Latin dari entri.
 * Lewati karakter non-Latin di awal (tanda hubung, spasi, dll.),
 * lalu ambil huruf Latin pertama dan ubah ke huruf besar.
 */
const SQL_ABJAD = `UPPER(SUBSTRING(REGEXP_REPLACE(entri, '^[^a-zA-Z]*', ''), 1, 1))`;

class ModelLabel {
  /**
  * Ambil semua kategori beserta daftar label per kategori dan jumlah entri.
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
  * Cari entri berdasarkan kategori dan kode label.
   * Mendukung kategori dari tabel label (ragam, kelas_kata, bahasa, bidang)
   * serta kategori virtual (abjad, jenis).
   * @param {string} kategori - Kategori
   * @param {string} kode - Kode label / huruf / jenis
   * @param {number} limit - Batas hasil
   * @param {number} offset - Offset untuk paginasi
   * @returns {Promise<{data: Array, total: number, label: Object|null}>}
   */
  static async cariEntriPerLabel(kategori, kode, limit = 20, offset = 0) {
    if (kategori === 'abjad') {
      return this._cariEntriPerAbjad(kode, limit, offset);
    }
    if (kategori === 'jenis') {
      return this._cariEntriPerJenis(kode, limit, offset);
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
      FROM entri l
      JOIN makna m ON m.entri_id = l.id
       WHERE m.${kolom} = ANY($1::text[]) AND l.aktif = 1`,
      [nilaiCocok]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT DISTINCT ON (l.entri) l.id, l.entri, l.jenis, l.jenis_rujuk, l.lema_rujuk AS entri_rujuk,
              m.kelas_kata AS preview_kelas_kata, m.makna AS preview_makna
       FROM entri l
       JOIN makna m ON m.entri_id = l.id
       WHERE m.${kolom} = ANY($1::text[]) AND l.aktif = 1
       ORDER BY l.entri, m.urutan ASC, m.id ASC
       LIMIT $2 OFFSET $3`,
      [nilaiCocok, limit, offset]
    );

    return { data: dataResult.rows, total, label };
  }

  /**
  * Cari entri berdasarkan huruf pertama Latin.
   */
  static async _cariEntriPerAbjad(huruf, limit, offset) {
    const h = huruf.toUpperCase();
    if (!/^[A-Z]$/.test(h)) {
      return { data: [], total: 0, label: null };
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
        FROM entri
       WHERE aktif = 1 AND ${SQL_ABJAD} = $1`,
      [h]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT l.id, l.entri, l.jenis, l.jenis_rujuk, l.lema_rujuk AS entri_rujuk,
              m.kelas_kata AS preview_kelas_kata, m.makna AS preview_makna
       FROM entri l
       LEFT JOIN LATERAL (
         SELECT kelas_kata, makna FROM makna WHERE entri_id = l.id ORDER BY urutan LIMIT 1
       ) m ON true
       WHERE l.aktif = 1 AND ${SQL_ABJAD} = $1
       ORDER BY l.entri
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
  * Cari entri berdasarkan jenis (dasar, berimbuhan, gabungan, idiom, peribahasa, varian).
   */
  static async _cariEntriPerJenis(jenis, limit, offset) {
    const validJenis = ['dasar', 'berimbuhan', 'gabungan', 'idiom', 'peribahasa', 'varian'];
    if (!validJenis.includes(jenis)) {
      return { data: [], total: 0, label: null };
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM entri WHERE aktif = 1 AND jenis = $1`,
      [jenis]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT l.id, l.entri, l.jenis, l.jenis_rujuk, l.lema_rujuk AS entri_rujuk,
              m.kelas_kata AS preview_kelas_kata, m.makna AS preview_makna
       FROM entri l
       LEFT JOIN LATERAL (
         SELECT kelas_kata, makna FROM makna WHERE entri_id = l.id ORDER BY urutan LIMIT 1
       ) m ON true
       WHERE l.aktif = 1 AND l.jenis = $1
       ORDER BY l.entri
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
