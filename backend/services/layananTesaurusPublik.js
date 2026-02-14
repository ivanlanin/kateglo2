/**
 * @fileoverview Layanan tesaurus publik — business logic untuk pencarian tesaurus
 */

const ModelTesaurus = require('../models/modelTesaurus');

function normalizeLimit(value, fallback = 20, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseRelasi(teks) {
  if (!teks) return [];
  return teks.split(';').map((s) => s.trim()).filter(Boolean);
}

async function cariTesaurus(query, limit) {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];
  const safeLimit = normalizeLimit(limit, 20, 50);
  return ModelTesaurus.cari(trimmed, safeLimit);
}

async function ambilDetailTesaurus(kata) {
  const decodedKata = decodeURIComponent((kata || '').trim());
  if (!decodedKata) return null;

  const entry = await ModelTesaurus.ambilDetail(decodedKata);
  if (!entry) return null;

  return {
    lema: entry.lema,
    sinonim: parseRelasi(entry.sinonim),
    antonim: parseRelasi(entry.antonim),
    turunan: parseRelasi(entry.turunan),
    gabungan: parseRelasi(entry.gabungan),
    berkaitan: parseRelasi(entry.berkaitan),
  };
}

module.exports = { cariTesaurus, ambilDetailTesaurus };
