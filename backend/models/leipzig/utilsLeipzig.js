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

function bersihkanTokenAgregat(kata = '') {
  return String(kata || '').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function adalahVarianHurufKecil(kata = '') {
  const teks = bersihkanTokenAgregat(kata);
  if (!teks) return false;
  return teks === teks.toLowerCase();
}

function pilihLabelAgregat(previous, kata, frekuensi) {
  const kataBersih = bersihkanTokenAgregat(kata);
  const frekuensiAman = Number(frekuensi) || 0;
  const memakaiHurufKecil = adalahVarianHurufKecil(kataBersih);

  if (!kataBersih) return previous || null;

  if (!previous) {
    return {
      kata: kataBersih,
      wordId: 0,
      preferHurufKecil: memakaiHurufKecil,
      frekuensiLabel: frekuensiAman,
    };
  }

  if (memakaiHurufKecil && !previous.preferHurufKecil) {
    return {
      ...previous,
      kata: kataBersih,
      preferHurufKecil: true,
      frekuensiLabel: frekuensiAman,
    };
  }

  if (memakaiHurufKecil === previous.preferHurufKecil) {
    if (frekuensiAman > previous.frekuensiLabel) {
      return {
        ...previous,
        kata: kataBersih,
        frekuensiLabel: frekuensiAman,
      };
    }

    if (frekuensiAman === previous.frekuensiLabel && kataBersih.localeCompare(previous.kata, 'id') < 0) {
      return {
        ...previous,
        kata: kataBersih,
      };
    }
  }

  return previous;
}

function aggregateWordRows(rows = [], excludedWord = '') {
  const excluded = bersihkanTokenAgregat(excludedWord).toLowerCase();
  const aggregated = new Map();

  rows.forEach((row) => {
    const kata = bersihkanTokenAgregat(row.kata || row.word || '');
    if (!kata) return;

    const normalized = kata.toLowerCase();
    if (excluded && normalized === excluded) return;

    const previous = aggregated.get(normalized);
    const labelTerpilih = pilihLabelAgregat(previous, kata, row.frekuensi);
    if (!labelTerpilih) return;

    const frekuensiSaatIni = Number(row.frekuensi) || 0;
    const frekuensiBaru = Number(previous?.frekuensi) || 0;
    const signifikansiSaatIni = Number(row.signifikansi) || 0;
    const signifikansiSebelumnya = previous?.signifikansi ?? signifikansiSaatIni;
    const signifikansiBaru = row.signifikansi == null
      ? previous?.signifikansi ?? null
      : Math.max(signifikansiSebelumnya, signifikansiSaatIni);

    aggregated.set(normalized, {
      ...labelTerpilih,
      frekuensi: frekuensiBaru + frekuensiSaatIni,
      signifikansi: signifikansiBaru,
      wordId: labelTerpilih.frekuensiLabel === frekuensiSaatIni
        && labelTerpilih.kata === kata
        ? (Number(row.wordId) || previous?.wordId || 0)
        : (previous?.wordId || 0),
    });
  });

  return Array.from(aggregated.values())
    .map(({ preferHurufKecil: _preferHurufKecil, frekuensiLabel: _frekuensiLabel, ...item }) => item)
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
  bersihkanTokenAgregat,
  adalahVarianHurufKecil,
  pilihLabelAgregat,
};