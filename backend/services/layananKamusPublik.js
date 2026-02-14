/**
 * @fileoverview Layanan kamus publik — business logic untuk pencarian dan detail kamus
 */

const ModelFrasa = require('../models/modelFrasa');

function normalizeLimit(value, fallback = 20, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function kelompokkanRelasi(relations) {
  return relations.reduce((acc, row) => {
    const key = row.rel_type;
    if (!acc[key]) {
      acc[key] = { nama: row.rel_type_name || key, daftar: [] };
    }
    acc[key].daftar.push(row.related_phrase);
    return acc;
  }, {});
}

async function cariKamus(query, limit) {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];
  const safeLimit = normalizeLimit(limit, 20, 50);
  return ModelFrasa.cariKamus(trimmed, safeLimit);
}

async function ambilDetailKamus(slug) {
  const decodedSlug = decodeURIComponent((slug || '').trim());
  if (!decodedSlug) return null;

  const entry = await ModelFrasa.ambilFrasa(decodedSlug);
  if (!entry) return null;

  const canonicalPhrase = entry.actual_phrase || entry.phrase;
  const [definisi, relasi, peribahasa, terjemahan, tautan, kataDasar] = await Promise.all([
    ModelFrasa.ambilDefinisi(canonicalPhrase),
    ModelFrasa.ambilRelasi(canonicalPhrase),
    ModelFrasa.ambilPeribahasa(canonicalPhrase),
    ModelFrasa.ambilTerjemahan(canonicalPhrase),
    ModelFrasa.ambilTautan(canonicalPhrase),
    ModelFrasa.ambilKataDasar(canonicalPhrase),
  ]);

  return {
    frasa: entry.phrase,
    frasaAktual: entry.actual_phrase,
    kelasLeksikal: entry.lex_class,
    namaKelasLeksikal: entry.lex_class_name,
    tipeFrasa: entry.phrase_type,
    namaTipeFrasa: entry.phrase_type_name,
    pelafalan: entry.pronounciation,
    etimologi: entry.etymology,
    info: entry.info,
    catatan: entry.notes,
    sumber: entry.ref_source,
    namaSumber: entry.ref_source_name,
    definisi,
    relasi: kelompokkanRelasi(relasi),
    peribahasa,
    terjemahan,
    tautan,
    kataDasar,
  };
}

module.exports = { cariKamus, ambilDetailKamus };
