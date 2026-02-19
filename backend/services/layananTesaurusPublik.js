/**
 * @fileoverview Layanan tesaurus publik — business logic untuk pencarian tesaurus
 */

const ModelTesaurus = require('../models/modelTesaurus');

function parseRelasi(teks) {
  if (!teks) return [];
  return teks.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

async function cariTesaurus(query, { limit = 100, offset = 0 } = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) return { data: [], total: 0, hasNext: false };
  return ModelTesaurus.cari(trimmed, limit, offset, false);
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
  };
}

module.exports = { cariTesaurus, ambilDetailTesaurus };
