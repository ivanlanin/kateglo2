/**
 * @fileoverview Query kalimat contoh dari korpus Leipzig.
 */

const LeipzigDb = require('../../db/leipzig');
const {
  normalizeSearchWord,
  parseLimit,
  parseOffset,
  listMatchedForms,
  summarizeMatchedForms,
} = require('./utilsLeipzig');

class ModelKalimat {
  static async cariContohKata(corpusId, kata, options = {}) {
    const kataAman = normalizeSearchWord(kata);
    const limit = parseLimit(options.limit, { fallback: 10, max: 50 });
    const offset = parseOffset(options.offset);

    if (!kataAman) {
      return {
        kata: '',
        frekuensi: 0,
        total: 0,
        limit,
        offset,
        bentuk: [],
        data: [],
      };
    }

    const database = LeipzigDb.openCorpusDatabase(corpusId);
    const matchedForms = listMatchedForms(database, kataAman);

    if (matchedForms.length === 0) {
      return {
        kata: kataAman,
        frekuensi: 0,
        total: 0,
        limit,
        offset,
        bentuk: [],
        data: [],
      };
    }

    const totalRow = database.prepare(`
      SELECT COUNT(DISTINCT iw.s_id) AS total
      FROM words w
      JOIN inv_w iw ON iw.w_id = w.w_id
      WHERE w.word = ? COLLATE NOCASE
    `).get(kataAman);

    const rows = database.prepare(`
      SELECT
        s.s_id AS sentenceId,
        s.sentence AS sentence,
        src.source AS sourceUrl,
        src.date AS sourceDate,
        MIN(iw.pos) AS firstPosition,
        COUNT(*) AS matchCount
      FROM words w
      JOIN inv_w iw ON iw.w_id = w.w_id
      JOIN sentences s ON s.s_id = iw.s_id
      LEFT JOIN inv_so iso ON iso.s_id = s.s_id
      LEFT JOIN sources src ON src.so_id = iso.so_id
      WHERE w.word = ? COLLATE NOCASE
      GROUP BY s.s_id, s.sentence, src.source, src.date
      ORDER BY src.date DESC, s.s_id ASC
      LIMIT ? OFFSET ?
    `).all(kataAman, limit, offset);

    return {
      kata: kataAman,
      frekuensi: matchedForms.reduce((total, row) => total + row.freq, 0),
      total: Number(totalRow?.total) || 0,
      limit,
      offset,
      bentuk: summarizeMatchedForms(matchedForms),
      data: rows.map((row) => ({
        sentenceId: Number(row.sentenceId) || 0,
        sentence: row.sentence,
        sourceUrl: row.sourceUrl || null,
        sourceDate: row.sourceDate || null,
        firstPosition: Number(row.firstPosition) || 0,
        matchCount: Number(row.matchCount) || 0,
      })),
    };
  }
}

module.exports = ModelKalimat;
module.exports.__private = {
  parseLimit,
  parseOffset,
};