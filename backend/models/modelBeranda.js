/**
 * @fileoverview Model untuk data beranda (statistik, lema acak, salah eja, populer)
 */

const db = require('../db');

class ModelBeranda {
  /**
   * Ambil statistik jumlah entri
   * @returns {Promise<Object>} Statistik { kamus, glosarium, peribahasa, singkatan }
   */
  static async ambilStatistik() {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM lema WHERE aktif = 1) AS kamus,
        (SELECT COUNT(*) FROM glosarium) AS glosarium,
        (SELECT COUNT(*) FROM tesaurus) AS tesaurus
    `);
    const row = result.rows[0];
    return {
      kamus: parseInt(row.kamus, 10),
      glosarium: parseInt(row.glosarium, 10),
      tesaurus: parseInt(row.tesaurus, 10),
    };
  }

  /**
   * Ambil lema acak (10 kata random yang valid)
   * @param {number} jumlah - Jumlah lema acak
   * @returns {Promise<Array>} Daftar { phrase, lex_class }
   */
  static async ambilLemaAcak(jumlah = 10) {
    const result = await db.query(
      `SELECT l.id, l.lema, m.kelas_kata
       FROM lema l
       LEFT JOIN LATERAL (
         SELECT kelas_kata FROM makna WHERE lema_id = l.id ORDER BY urutan LIMIT 1
       ) m ON true
       WHERE l.aktif = 1
         AND l.jenis = 'dasar'
         AND l.jenis_rujuk IS NULL
         AND l.lema NOT LIKE '% %'
       ORDER BY RANDOM()
       LIMIT $1`,
      [jumlah]
    );
    return result.rows;
  }

  /**
   * Ambil contoh salah eja (kata yang merupakan variasi/redirect)
   * @param {number} jumlah - Jumlah contoh
   * @returns {Promise<Array>} Daftar { phrase, actual_phrase }
   */
  static async ambilRujukan(jumlah = 5) {
    const result = await db.query(
      `SELECT lema, lema_rujuk
       FROM lema
       WHERE jenis_rujuk IS NOT NULL
         AND lema_rujuk IS NOT NULL
         AND aktif = 1
       ORDER BY RANDOM()
       LIMIT $1`,
      [jumlah]
    );
    return result.rows;
  }

  /**
   * Ambil kata terpopuler berdasarkan jumlah pencarian
   * @param {number} jumlah - Jumlah kata
   * @returns {Promise<Array>} Daftar { phrase, search_count }
   */
  static async ambilPopuler(jumlah = 5) {
    const result = await db.query(
      `SELECT phrase, search_count
       FROM searched_phrase
       ORDER BY search_count DESC
       LIMIT $1`,
      [jumlah]
    );
    return result.rows;
  }
}

module.exports = ModelBeranda;
