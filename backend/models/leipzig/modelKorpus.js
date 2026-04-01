/**
 * @fileoverview Model korpus Leipzig yang tersedia.
 */

const LeipzigDb = require('../../db/leipzig');

class ModelKorpus {
  static async ambilDaftarTersedia() {
    return LeipzigDb.listAvailableCorpora();
  }

  static async ambilDetail(corpusId) {
    const normalized = LeipzigDb.normalizeCorpusId(corpusId);
    if (!normalized) return null;

    return LeipzigDb.listAvailableCorpora().find((corpus) => corpus.id === normalized) || null;
  }
}

module.exports = ModelKorpus;