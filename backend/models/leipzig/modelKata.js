/**
 * @fileoverview Query informasi kata dari korpus Leipzig.
 */

const LeipzigDb = require('../../db/leipzig');
const {
  normalizeSearchWord,
  listMatchedForms,
  summarizeMatchedForms,
  parseLimit,
  parseOffset,
  bersihkanTokenAgregat,
} = require('./utilsLeipzig');

function hitungKelasFrekuensi(freqTertinggi = 0, freqKata = 0) {
  if (!freqTertinggi || !freqKata) return null;
  return Math.floor(Math.log2(freqTertinggi / freqKata));
}

function ambilFrekuensiTertinggi(database) {
  const klausulFilter = getKlausulFilterTokenPeringkat();
  const row = database.prepare(`
    SELECT total
    FROM (
      SELECT LOWER(word) AS normalized_word, SUM(freq) AS total
      FROM words
      GROUP BY LOWER(word)
    ) aggregated
    ${klausulFilter}
    ORDER BY total DESC
    LIMIT 1
  `).get();

  return Number(row?.total) || 0;
}

function getKlausulFilterTokenPeringkat() {
  return "WHERE aggregated.normalized_word GLOB '*[0-9A-Za-z]*'";
}

function hasRankedWordsTable(database) {
  const row = database.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'ranked_words'
    LIMIT 1
  `).get();

  return Boolean(row?.name);
}

function ambilInfoRankingLangsung(database, kata) {
  if (!hasRankedWordsTable(database)) return null;

  const kataAman = normalizeSearchWord(kata).toLowerCase();
  if (!kataAman) return null;

  const row = database.prepare(`
    SELECT
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM words lower_variant
          WHERE LOWER(lower_variant.word) = ranked_words.normalized_word
            AND lower_variant.word = ranked_words.normalized_word
        ) THEN ranked_words.normalized_word
        ELSE ranked_words.display_word
      END AS kata,
      freq_total AS frekuensi,
      rank,
      frequency_class AS kelasFrekuensi
    FROM ranked_words
    WHERE normalized_word = ?
    LIMIT 1
  `).get(kataAman);

  return row ? {
    kata: bersihkanTokenAgregat(row.kata),
    frekuensi: Number(row.frekuensi) || 0,
    rank: Number(row.rank) || null,
    kelasFrekuensi: row.kelasFrekuensi == null ? null : Number(row.kelasFrekuensi),
  } : null;
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
    const infoRanking = ambilInfoRankingLangsung(database, kataAman);

    if (infoRanking && infoRanking.frekuensi === totalFrequency) {
      return {
        kata: matchedForms[0]?.word || infoRanking.kata || kataAman,
        frekuensi: totalFrequency,
        rank: infoRanking.rank,
        kelasFrekuensi: infoRanking.kelasFrekuensi,
        bentuk: summarizeMatchedForms(matchedForms),
      };
    }

    const topFrequency = ambilFrekuensiTertinggi(database);
    const klausulFilter = getKlausulFilterTokenPeringkat();
    const rankRow = database.prepare(`
      SELECT COUNT(*) + 1 AS rank
      FROM (
        SELECT LOWER(word) AS normalized_word, SUM(freq) AS total
        FROM words
        GROUP BY LOWER(word)
      ) aggregated
      ${klausulFilter}
      AND aggregated.total > ?
    `).get(totalFrequency);

    return {
      kata: matchedForms[0]?.word || kataAman,
      frekuensi: totalFrequency,
      rank: Number(rankRow?.rank) || 1,
      kelasFrekuensi: hitungKelasFrekuensi(topFrequency, totalFrequency),
      bentuk: summarizeMatchedForms(matchedForms),
    };
  }

  static async ambilPeringkat(corpusId, query = {}) {
    const limit = parseLimit(query?.limit, { fallback: 25, min: 1, max: 100 });
    const offset = parseOffset(query?.offset);
    const database = LeipzigDb.openCorpusDatabase(corpusId);
    if (hasRankedWordsTable(database)) {
      const totalRow = database.prepare('SELECT COUNT(*) AS total FROM ranked_words').get();
      const rows = database.prepare(`
        SELECT
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM words lower_variant
              WHERE LOWER(lower_variant.word) = ranked_words.normalized_word
                AND lower_variant.word = ranked_words.normalized_word
            ) THEN ranked_words.normalized_word
            ELSE ranked_words.display_word
          END AS kata,
          freq_total AS frekuensi,
          rank,
          frequency_class AS kelasFrekuensi
        FROM ranked_words
        ORDER BY rank ASC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      return {
        total: Number(totalRow?.total) || 0,
        limit,
        offset,
        hasMore: offset + rows.length < (Number(totalRow?.total) || 0),
        data: rows.map((row) => ({
          kata: bersihkanTokenAgregat(row.kata),
          frekuensi: Number(row.frekuensi) || 0,
          rank: Number(row.rank) || 0,
          kelasFrekuensi: row.kelasFrekuensi == null ? null : Number(row.kelasFrekuensi),
        })),
      };
    }

    const frekuensiTertinggi = ambilFrekuensiTertinggi(database);
    const klausulFilter = getKlausulFilterTokenPeringkat();
    const totalRow = database.prepare(`
      SELECT COUNT(*) AS total
      FROM (
        SELECT LOWER(word) AS normalized_word
        FROM words
        GROUP BY LOWER(word)
      ) aggregated
      ${klausulFilter}
    `).get();
    const rows = database.prepare(`
      WITH ranked_variants AS (
        SELECT
          LOWER(word) AS normalized_word,
          word,
          freq,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(word)
            ORDER BY CASE WHEN word = LOWER(word) THEN 0 ELSE 1 END, freq DESC, word ASC
          ) AS variant_rank
        FROM words
      ),
      aggregated AS (
        SELECT LOWER(word) AS normalized_word, SUM(freq) AS total
        FROM words
        GROUP BY LOWER(word)
      )
      SELECT
        aggregated.normalized_word AS normalizedWord,
        aggregated.total AS frekuensi,
        ranked_variants.word AS kata
      FROM aggregated
      JOIN ranked_variants
        ON ranked_variants.normalized_word = aggregated.normalized_word
        AND ranked_variants.variant_rank = 1
      ${klausulFilter}
      ORDER BY aggregated.total DESC, aggregated.normalized_word ASC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const data = rows.map((row, index) => ({
      kata: bersihkanTokenAgregat(row.kata || row.normalizedWord),
      frekuensi: Number(row.frekuensi) || 0,
      rank: offset + index + 1,
      kelasFrekuensi: hitungKelasFrekuensi(frekuensiTertinggi, Number(row.frekuensi) || 0),
    }));
    const total = Number(totalRow?.total) || 0;

    return {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
      data,
    };
  }
}

module.exports = ModelKata;
module.exports.__private = {
  hitungKelasFrekuensi,
  ambilFrekuensiTertinggi,
  getKlausulFilterTokenPeringkat,
  hasRankedWordsTable,
  ambilInfoRankingLangsung,
};