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
        (SELECT COUNT(*) FROM phrase) AS kamus,
        (SELECT COUNT(*) FROM glossary) AS glosarium,
        (SELECT COUNT(*) FROM proverb) AS peribahasa,
        (SELECT COUNT(*) FROM abbr_entry) AS singkatan
    `);
    const row = result.rows[0];
    return {
      kamus: parseInt(row.kamus, 10),
      glosarium: parseInt(row.glosarium, 10),
      peribahasa: parseInt(row.peribahasa, 10),
      singkatan: parseInt(row.singkatan, 10),
    };
  }

  /**
   * Ambil lema acak (10 kata random yang valid)
   * @param {number} jumlah - Jumlah lema acak
   * @returns {Promise<Array>} Daftar { phrase, lex_class }
   */
  static async ambilLemaAcak(jumlah = 10) {
    const result = await db.query(
      `SELECT phrase, lex_class
       FROM phrase
       WHERE updated IS NOT NULL
         AND lex_class IS NOT NULL
         AND lex_class != ''
         AND phrase NOT LIKE '% %'
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
  static async ambilSalahEja(jumlah = 5) {
    const result = await db.query(
      `SELECT phrase, actual_phrase
       FROM phrase
       WHERE actual_phrase IS NOT NULL
         AND actual_phrase != ''
         AND phrase != actual_phrase
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
