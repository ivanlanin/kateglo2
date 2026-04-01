/**
 * @fileoverview Utilitas query bersama untuk model Leipzig.
 */

function normalizeSearchWord(value = '') {
  return String(value || '').trim();
}

function parseLimit(value, { fallback = 10, min = 1, max = 50 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function parseOffset(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(parsed, 0);
}

function buildPlaceholders(values = []) {
  return values.map(() => '?').join(', ');
}

function listMatchedForms(database, kata) {
  const kataAman = normalizeSearchWord(kata);
  if (!kataAman) return [];

  return database.prepare(`
    SELECT w_id AS wordId, word, freq
    FROM words
    WHERE word = ? COLLATE NOCASE
    ORDER BY (word = ?) DESC, freq DESC, word ASC
  `).all(kataAman, kataAman).map((row) => ({
    wordId: Number(row.wordId) || 0,
    word: row.word,
    freq: Number(row.freq) || 0,
  }));
}

function summarizeMatchedForms(rows = []) {
  return rows.map((row) => ({
    kata: row.word,
    frekuensi: Number(row.freq) || 0,
    wordId: Number(row.wordId) || 0,
  }));
}

function aggregateWordRows(rows = [], excludedWord = '') {
  const excluded = String(excludedWord || '').trim().toLowerCase();
  const aggregated = new Map();

  rows.forEach((row) => {
    const kata = String(row.kata || row.word || '').trim();
    if (!kata) return;

    const normalized = kata.toLowerCase();
    if (excluded && normalized === excluded) return;

    const previous = aggregated.get(normalized) || {
      kata,
      frekuensi: 0,
      signifikansi: null,
      wordId: Number(row.wordId) || 0,
    };

    const frekuensiSaatIni = Number(row.frekuensi) || 0;
    const frekuensiBaru = previous.frekuensi + frekuensiSaatIni;
    const signifikansiSaatIni = Number(row.signifikansi) || 0;
    const signifikansiSebelumnya = previous.signifikansi ?? signifikansiSaatIni;
    const signifikansiBaru = row.signifikansi == null
      ? previous.signifikansi
      : Math.max(signifikansiSebelumnya, signifikansiSaatIni);

    aggregated.set(normalized, {
      kata: previous.frekuensi >= frekuensiSaatIni ? previous.kata : kata,
      frekuensi: frekuensiBaru,
      signifikansi: signifikansiBaru,
      wordId: previous.frekuensi >= frekuensiSaatIni
        ? previous.wordId
        : (Number(row.wordId) || previous.wordId || 0),
    });
  });

  return Array.from(aggregated.values())
    .sort((left, right) => {
      if (right.frekuensi === left.frekuensi) {
        return left.kata.localeCompare(right.kata, 'id');
      }
      return right.frekuensi - left.frekuensi;
    });
}

module.exports = {
  normalizeSearchWord,
  parseLimit,
  parseOffset,
  buildPlaceholders,
  listMatchedForms,
  summarizeMatchedForms,
  aggregateWordRows,
};