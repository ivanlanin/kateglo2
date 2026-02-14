const PhraseModel = require('../models/PhraseModel');

function normalizeLimit(value, fallback = 20, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function groupRelations(relations) {
  return relations.reduce((acc, row) => {
    if (!acc[row.rel_type]) {
      acc[row.rel_type] = [];
    }

    acc[row.rel_type].push(row.related_phrase);
    return acc;
  }, {});
}

async function searchDictionary(query, limit) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [];
  }

  const safeLimit = normalizeLimit(limit, 20, 50);
  return PhraseModel.searchDictionary(trimmed, safeLimit);
}

async function getDictionaryDetail(slug) {
  const decodedSlug = decodeURIComponent((slug || '').trim());
  if (!decodedSlug) {
    return null;
  }

  const entry = await PhraseModel.getPhraseBySlug(decodedSlug);
  if (!entry) {
    return null;
  }

  const canonicalPhrase = entry.actual_phrase || entry.phrase;
  const [definitions, relations] = await Promise.all([
    PhraseModel.getDefinitions(canonicalPhrase),
    PhraseModel.getRelations(canonicalPhrase)
  ]);

  return {
    phrase: entry.phrase,
    actualPhrase: entry.actual_phrase,
    lexClass: entry.lex_class,
    info: entry.info,
    definitions,
    relations: groupRelations(relations)
  };
}

module.exports = {
  searchDictionary,
  getDictionaryDetail
};
