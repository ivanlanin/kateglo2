/**
 * @fileoverview Model untuk entri kamus (frasa, definisi, relasi)
 * Port dari PhraseModel.js dengan penamaan Indonesia
 */

const db = require('../db');

class ModelFrasa {
  /**
   * Cari frasa di kamus dengan strategi prefix-first + contains-fallback
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
   * @returns {Promise<Array>} Daftar frasa dengan preview definisi
   */
  static async cariKamus(query, limit = 20) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const prefixRows = await db.query(
      `SELECT phrase, actual_phrase, lex_class, info
       FROM phrase
       WHERE phrase ILIKE $1
       ORDER BY
         CASE WHEN LOWER(phrase) = LOWER($2) THEN 0 ELSE 1 END,
         phrase ASC
       LIMIT $3`,
      [`${normalizedQuery}%`, normalizedQuery, cappedLimit]
    );

    let combinedRows = prefixRows.rows;

    if (combinedRows.length < cappedLimit) {
      const remaining = cappedLimit - combinedRows.length;
      const containsRows = await db.query(
        `SELECT phrase, actual_phrase, lex_class, info
         FROM phrase
         WHERE phrase ILIKE $1
           AND phrase NOT ILIKE $2
         ORDER BY phrase ASC
         LIMIT $3`,
        [`%${normalizedQuery}%`, `${normalizedQuery}%`, remaining]
      );
      combinedRows = combinedRows.concat(containsRows.rows);
    }

    if (combinedRows.length === 0) {
      return [];
    }

    const phraseKeys = combinedRows.map((row) => row.phrase.toLowerCase());
    const definitionRows = await db.query(
      `SELECT DISTINCT ON (LOWER(phrase))
         LOWER(phrase) AS phrase_key, def_text
       FROM definition
       WHERE LOWER(phrase) = ANY($1::text[])
       ORDER BY LOWER(phrase), def_num NULLS FIRST, def_uid ASC`,
      [phraseKeys]
    );

    const previewByPhrase = new Map(
      definitionRows.rows.map((row) => [row.phrase_key, row.def_text])
    );

    return combinedRows.map((row) => ({
      ...row,
      definition_preview: previewByPhrase.get(row.phrase.toLowerCase()) || null,
    }));
  }

  /**
   * Ambil frasa berdasarkan slug (case-insensitive)
   * @param {string} slug - Nama frasa
   * @returns {Promise<Object|null>} Data frasa lengkap
   */
  static async ambilFrasa(slug) {
    const result = await db.query(
      `SELECT p.phrase, p.actual_phrase, p.lex_class, p.phrase_type, p.info,
              p.pronounciation, p.etymology, p.notes, p.ref_source,
              lc.lex_class_name, pt.phrase_type_name, rs.ref_source_name
       FROM phrase p
       LEFT JOIN lexical_class lc ON p.lex_class = lc.lex_class
       LEFT JOIN phrase_type pt ON p.phrase_type = pt.phrase_type
       LEFT JOIN ref_source rs ON p.ref_source = rs.ref_source
       WHERE LOWER(p.phrase) = LOWER($1)
       LIMIT 1`,
      [slug]
    );
    return result.rows[0] || null;
  }

  /**
   * Ambil semua definisi untuk sebuah frasa
   * @param {string} phrase - Nama frasa
   * @returns {Promise<Array>} Daftar definisi
   */
  static async ambilDefinisi(phrase) {
    const result = await db.query(
      `SELECT d.def_uid, d.phrase, d.def_num, d.def_text, d.lex_class,
              d.discipline, d.sample, d.see,
              lc.lex_class_name, disc.discipline_name
       FROM definition d
       LEFT JOIN lexical_class lc ON d.lex_class = lc.lex_class
       LEFT JOIN discipline disc ON d.discipline = disc.discipline
       WHERE LOWER(d.phrase) = LOWER($1)
       ORDER BY d.def_num NULLS FIRST, d.def_uid ASC`,
      [phrase]
    );
    return result.rows;
  }

  /**
   * Ambil relasi kata (sinonim, antonim, dll.)
   * @param {string} rootPhrase - Frasa induk
   * @returns {Promise<Array>} Daftar relasi
   */
  static async ambilRelasi(rootPhrase) {
    const result = await db.query(
      `SELECT r.rel_type, r.related_phrase, rt.rel_type_name
       FROM relation r
       LEFT JOIN relation_type rt ON r.rel_type = rt.rel_type
       WHERE LOWER(r.root_phrase) = LOWER($1)
       ORDER BY rt.sort_order, r.related_phrase`,
      [rootPhrase]
    );
    return result.rows;
  }

  /**
   * Ambil peribahasa terkait frasa
   * @param {string} phrase - Nama frasa
   * @returns {Promise<Array>} Daftar peribahasa
   */
  static async ambilPeribahasa(phrase) {
    const result = await db.query(
      `SELECT prv_uid, proverb, meaning
       FROM proverb
       WHERE LOWER(phrase) = LOWER($1)
       ORDER BY prv_uid`,
      [phrase]
    );
    return result.rows;
  }

  /**
   * Ambil terjemahan terkait frasa
   * @param {string} phrase - Nama frasa
   * @returns {Promise<Array>} Daftar terjemahan
   */
  static async ambilTerjemahan(phrase) {
    const result = await db.query(
      `SELECT t.lemma, t.ref_source, t.translation, rs.ref_source_name
       FROM translation t
       LEFT JOIN ref_source rs ON t.ref_source = rs.ref_source
       WHERE LOWER(t.lemma) = LOWER($1)`,
      [phrase]
    );
    return result.rows;
  }

  /**
   * Ambil tautan luar terkait frasa
   * @param {string} phrase - Nama frasa
   * @returns {Promise<Array>} Daftar tautan
   */
  static async ambilTautan(phrase) {
    const result = await db.query(
      `SELECT ext_uid, label, url
       FROM external_ref
       WHERE LOWER(phrase) = LOWER($1)
       ORDER BY ext_uid`,
      [phrase]
    );
    return result.rows;
  }

  /**
   * Ambil kata dasar (root words) — frasa yang merupakan turunan dari frasa lain
   * @param {string} phrase - Nama frasa
   * @returns {Promise<Array>} Daftar kata dasar
   */
  static async ambilKataDasar(phrase) {
    const result = await db.query(
      `SELECT DISTINCT related_phrase
       FROM relation
       WHERE LOWER(root_phrase) = LOWER($1) AND rel_type = 'r'
       ORDER BY related_phrase`,
      [phrase]
    );
    return result.rows.map((r) => r.related_phrase);
  }
}

module.exports = ModelFrasa;
