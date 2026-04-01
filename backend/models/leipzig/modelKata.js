/**
 * @fileoverview Query informasi kata dari korpus Leipzig.
 */

const LeipzigDb = require('../../db/leipzig');
const { normalizeSearchWord, listMatchedForms, summarizeMatchedForms } = require('./utilsLeipzig');

function hitungKelasFrekuensi(freqTertinggi = 0, freqKata = 0) {
  if (!freqTertinggi || !freqKata) return null;
  return Math.floor(Math.log2(freqTertinggi / freqKata));
}

class ModelKata {
  static async ambilInfoKata(corpusId, kata) {
    const kataAman = normalizeSearchWord(kata);
    if (!kataAman) {
      return {
        kata: '',
        frekuensi: 0,
        rank: null,
        kelasFrekuensi: null,
        bentuk: [],
      };
    }

    const database = LeipzigDb.openCorpusDatabase(corpusId);
    const matchedForms = listMatchedForms(database, kataAman);

    if (matchedForms.length === 0) {
      return {
        kata: kataAman,
        frekuensi: 0,
        rank: null,
        kelasFrekuensi: null,
        bentuk: [],
      };
    }

    const totalFrequency = matchedForms.reduce((total, row) => total + row.freq, 0);
    const topFrequencyRow = database.prepare(`
      SELECT total
      FROM (
        SELECT LOWER(word) AS normalized_word, SUM(freq) AS total
        FROM words
        GROUP BY LOWER(word)
      ) aggregated
      ORDER BY total DESC
      LIMIT 1
    `).get();
    const rankRow = database.prepare(`
      SELECT COUNT(*) + 1 AS rank
      FROM (
        SELECT LOWER(word) AS normalized_word, SUM(freq) AS total
        FROM words
        GROUP BY LOWER(word)
      ) aggregated
      WHERE aggregated.total > ?
    `).get(totalFrequency);

    return {
      kata: matchedForms[0]?.word || kataAman,
      frekuensi: totalFrequency,
      rank: Number(rankRow?.rank) || 1,
      kelasFrekuensi: hitungKelasFrekuensi(Number(topFrequencyRow?.total) || 0, totalFrequency),
      bentuk: summarizeMatchedForms(matchedForms),
    };
  }
}

module.exports = ModelKata;
module.exports.__private = {
  hitungKelasFrekuensi,
};