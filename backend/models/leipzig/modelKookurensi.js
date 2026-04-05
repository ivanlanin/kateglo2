/**
 * @fileoverview Query kookurensi dari korpus Leipzig.
 */

const LeipzigDb = require('../../db/leipzig');
const {
  normalizeSearchWord,
  parseLimit,
  parseOffset,
  buildPlaceholders,
  listMatchedForms,
  aggregateWordRows,
  pilihLabelAgregat,
  bersihkanTokenAgregat,
} = require('./utilsLeipzig');

const RELASI_KONTEKS = [
  { table: 'co_s', jenis: 'kalimat' },
  { table: 'co_n', jenis: 'tetangga' },
];

function buildEmptyResult(kata = '', limit = 25, offset = 0) {
  return {
    kata,
    total: 0,
    limit,
    offset,
    data: [],
  };
}

function buildEmptyTetangga(kata = '', limit = 25) {
  return {
    kata,
    limit,
    kiri: [],
    kanan: [],
  };
}

function buildEmptyMiripKonteks(kata = '', limit = 12, minimumKonteksSama = 3) {
  return {
    kata,
    limit,
    minimumKonteksSama,
    jumlahKonteksAcuan: 0,
    total: 0,
    data: [],
  };
}

function normalizeGraphEdgeKey(source = '', target = '') {
  return [String(source).toLowerCase(), String(target).toLowerCase()].sort().join('::');
}

function escapeSqlString(value = '') {
  return String(value || '').replace(/'/g, "''");
}

function escapeRegExp(value = '') {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function memuatKataUtuh(teks = '', kata = '') {
  const teksBersih = bersihkanTokenAgregat(teks).toLowerCase();
  const kataBersih = bersihkanTokenAgregat(kata).toLowerCase();

  if (!teksBersih || !kataBersih) return false;

  const pola = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(kataBersih)}(?=$|[^\\p{L}\\p{N}])`, 'u');
  return pola.test(teksBersih);
}

function buildValuesCte(rows = [], columns = []) {
  if (!rows.length || !columns.length) {
    return `SELECT ${columns.map((column) => `NULL AS ${column}`).join(', ')} WHERE 0`;
  }

  return rows.map((row, index) => {
    const selectColumns = columns.map((column) => {
      const value = row[column];
      if (value == null) return `NULL AS ${column}`;
      if (typeof value === 'number') return `${value} AS ${column}`;
      return `'${escapeSqlString(value)}' AS ${column}`;
    }).join(', ');

    return index === 0 ? `SELECT ${selectColumns}` : `UNION ALL SELECT ${selectColumns}`;
  }).join(' ');
}

function ambilBarisRelasiSignifikan(database, tableName, wordIds = [], jenis = '') {
  if (!wordIds.length) return [];

  const placeholders = buildPlaceholders(wordIds);

  return database.prepare(`
    SELECT related.w_id AS wordId, related.word AS kata, relation.freq AS frekuensi, relation.sig AS signifikansi
    FROM ${tableName} relation
    JOIN words related ON related.w_id = relation.w2_id
    WHERE relation.w1_id IN (${placeholders})
    UNION ALL
    SELECT related.w_id AS wordId, related.word AS kata, relation.freq AS frekuensi, relation.sig AS signifikansi
    FROM ${tableName} relation
    JOIN words related ON related.w_id = relation.w1_id
    WHERE relation.w2_id IN (${placeholders})
  `).all(...wordIds, ...wordIds).map((row) => ({
    ...row,
    jenis,
  }));
}

function agregasiFiturKonteks(rows = [], excludedWords = []) {
  const excluded = new Set(excludedWords.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean));
  const aggregated = new Map();

  rows.forEach((row) => {
    const kata = String(row.kata || '').trim();
    const jenis = String(row.jenis || '').trim();
    if (!kata || !jenis) return;

    const normalized = kata.toLowerCase();
    if (excluded.has(normalized)) return;

    const key = `${jenis}:${normalized}`;
    const previous = aggregated.get(key);
    const labelTerpilih = pilihLabelAgregat(previous, kata, row.frekuensi);
    const current = previous || {
      featureKey: key,
      jenis,
      kata,
      frekuensi: 0,
      signifikansi: Number(row.signifikansi) || 0,
      wordIds: new Set(),
      preferHurufKecil: false,
      frekuensiLabel: 0,
    };

    const frekuensi = Number(row.frekuensi) || 0;
    const signifikansi = Number(row.signifikansi) || 0;

    current.kata = labelTerpilih.kata;
    current.preferHurufKecil = labelTerpilih.preferHurufKecil;
    current.frekuensiLabel = labelTerpilih.frekuensiLabel;
    current.frekuensi += frekuensi;
    current.signifikansi = Math.max(current.signifikansi, signifikansi);
    if (row.wordId) current.wordIds.add(Number(row.wordId) || 0);
    aggregated.set(key, current);
  });

  return Array.from(aggregated.values())
    .map(({ preferHurufKecil: _preferHurufKecil, frekuensiLabel: _frekuensiLabel, ...item }) => ({
      ...item,
      wordIds: Array.from(item.wordIds).filter(Boolean),
    }))
    .sort((left, right) => {
      if (right.signifikansi === left.signifikansi) {
        if (right.frekuensi === left.frekuensi) {
          return left.kata.localeCompare(right.kata, 'id');
        }
        return right.frekuensi - left.frekuensi;
      }
      return right.signifikansi - left.signifikansi;
    });
}

function ambilFiturKonteks(database, wordIds = [], excludedWords = [], options = {}) {
  const featureLimit = Number.isFinite(options.featureLimit) ? Math.max(Number(options.featureLimit) || 0, 1) : null;
  const rows = RELASI_KONTEKS.flatMap((relation) => ambilBarisRelasiSignifikan(database, relation.table, wordIds, relation.jenis));
  const aggregated = agregasiFiturKonteks(rows, excludedWords);

  return featureLimit ? aggregated.slice(0, featureLimit) : aggregated;
}

function kumpulkanKandidatMirip(database, targetFeatures = [], targetWordIds = [], kataTarget = '', options = {}) {
  const candidatePoolLimit = Math.min(Math.max(Number(options.candidatePoolLimit) || 60, 20), 240);
  const targetWordIdSet = new Set(targetWordIds.map((item) => Number(item) || 0).filter(Boolean));
  const kataTargetLower = String(kataTarget || '').trim().toLowerCase();
  const targetFeatureMap = new Map(targetFeatures.map((item) => [item.featureKey, item]));
  const groupedFeatures = RELASI_KONTEKS.map((relation) => ({
    ...relation,
    features: targetFeatures.filter((item) => item.jenis === relation.jenis && item.wordIds.length > 0),
  })).filter((item) => item.features.length > 0);

  const candidates = new Map();

  groupedFeatures.forEach((group) => {
    const cteRows = group.features.flatMap((feature) => feature.wordIds.map((wordId) => ({
      featureId: wordId,
      featureKey: feature.featureKey,
    })));

    const cteSql = buildValuesCte(cteRows, ['featureId', 'featureKey']);
    const rows = database.prepare(`
      WITH target_features AS (${cteSql})
      SELECT candidate.w_id AS wordId, candidate.word AS kata, candidate.freq AS frekuensi, target_features.featureKey AS featureKey
      FROM ${group.table} relation
      JOIN target_features ON relation.w1_id = target_features.featureId
      JOIN words candidate ON candidate.w_id = relation.w2_id
      UNION ALL
      SELECT candidate.w_id AS wordId, candidate.word AS kata, candidate.freq AS frekuensi, target_features.featureKey AS featureKey
      FROM ${group.table} relation
      JOIN target_features ON relation.w2_id = target_features.featureId
      JOIN words candidate ON candidate.w_id = relation.w1_id
    `).all();

    rows.forEach((row) => {
      const wordId = Number(row.wordId) || 0;
      const kata = String(row.kata || '').trim();
      if (!wordId || !kata || targetWordIdSet.has(wordId)) return;

      const normalized = kata.toLowerCase();
      if (!normalized || normalized === kataTargetLower) return;

      const featureKey = String(row.featureKey || '').trim();
      if (!targetFeatureMap.has(featureKey)) return;

      const previous = candidates.get(normalized);
      const labelTerpilih = pilihLabelAgregat(previous, kata, row.frekuensi);
      const current = previous || {
        kata,
        frekuensi: Number(row.frekuensi) || 0,
        wordIds: new Set(),
        commonFeatureKeys: new Set(),
        preferHurufKecil: false,
        frekuensiLabel: 0,
      };

      const frekuensi = Number(row.frekuensi) || 0;
      current.kata = labelTerpilih.kata;
      current.preferHurufKecil = labelTerpilih.preferHurufKecil;
      current.frekuensiLabel = labelTerpilih.frekuensiLabel;
      current.frekuensi = Math.max(current.frekuensi, frekuensi);
      current.wordIds.add(wordId);
      current.commonFeatureKeys.add(featureKey);
      candidates.set(normalized, current);
    });
  });

  return Array.from(candidates.values())
    .map(({ preferHurufKecil: _preferHurufKecil, frekuensiLabel: _frekuensiLabel, ...item }) => item)
    .sort((left, right) => {
      if (right.commonFeatureKeys.size === left.commonFeatureKeys.size) {
        if (right.frekuensi === left.frekuensi) {
          return left.kata.localeCompare(right.kata, 'id');
        }
        return right.frekuensi - left.frekuensi;
      }
      return right.commonFeatureKeys.size - left.commonFeatureKeys.size;
    })
    .slice(0, candidatePoolLimit)
    .map((item) => ({
      ...item,
      wordIds: Array.from(item.wordIds),
      commonFeatureKeys: Array.from(item.commonFeatureKeys),
    }));
}

function hitungDiceCoefficient(targetFeatureKeys = [], candidateFeatureKeys = []) {
  if (!targetFeatureKeys.length || !candidateFeatureKeys.length) return 0;

  const targetSet = new Set(targetFeatureKeys);
  const candidateSet = new Set(candidateFeatureKeys);
  let common = 0;

  targetSet.forEach((key) => {
    if (candidateSet.has(key)) common += 1;
  });

  if (!common) return 0;
  return (2 * common) / (targetSet.size + candidateSet.size);
}

function compareSharedContext(left, right) {
  if (right.signifikansi === left.signifikansi) {
    if (right.frekuensi === left.frekuensi) {
      return left.kata.localeCompare(right.kata, 'id');
    }
    return right.frekuensi - left.frekuensi;
  }
  return right.signifikansi - left.signifikansi;
}

function compareMiripKonteksRank(left, right) {
  if (right.skorDice === left.skorDice) {
    if (right.jumlahKonteksSama === left.jumlahKonteksSama) {
      if (right.frekuensi === left.frekuensi) {
        return left.kata.localeCompare(right.kata, 'id');
      }
      return right.frekuensi - left.frekuensi;
    }
    return right.jumlahKonteksSama - left.jumlahKonteksSama;
  }
  return right.skorDice - left.skorDice;
}

class ModelKookurensi {
  static async ambilSekalimat(corpusId, kata, options = {}) {
    const kataAman = normalizeSearchWord(kata);
    const limit = parseLimit(options.limit, { fallback: 25, max: 100 });
    const offset = parseOffset(options.offset);

    if (!kataAman) return buildEmptyResult('', limit, offset);

    const database = LeipzigDb.openCorpusDatabase(corpusId);
    const matchedForms = listMatchedForms(database, kataAman);
    if (matchedForms.length === 0) return buildEmptyResult(kataAman, limit, offset);

    const wordIds = matchedForms.map((row) => row.wordId).filter(Boolean);
    const placeholders = buildPlaceholders(wordIds);
    const rows = database.prepare(`
      SELECT related.w_id AS wordId, related.word AS kata, relation.freq AS frekuensi, relation.sig AS signifikansi
      FROM co_s relation
      JOIN words related ON related.w_id = relation.w2_id
      WHERE relation.w1_id IN (${placeholders})
      UNION ALL
      SELECT related.w_id AS wordId, related.word AS kata, relation.freq AS frekuensi, relation.sig AS signifikansi
      FROM co_s relation
      JOIN words related ON related.w_id = relation.w1_id
      WHERE relation.w2_id IN (${placeholders})
    `).all(...wordIds, ...wordIds);

    const aggregated = aggregateWordRows(rows, kataAman);
    const paged = aggregated.slice(offset, offset + limit);

    return {
      kata: kataAman,
      total: aggregated.length,
      limit,
      offset,
      data: paged.map((row) => ({
        kata: row.kata,
        frekuensi: row.frekuensi,
        signifikansi: row.signifikansi,
      })),
    };
  }

  static async ambilTetangga(corpusId, kata, options = {}) {
    const kataAman = normalizeSearchWord(kata);
    const limit = parseLimit(options.limit, { fallback: 25, max: 100 });

    if (!kataAman) return buildEmptyTetangga('', limit);

    const database = LeipzigDb.openCorpusDatabase(corpusId);
    const matchedForms = listMatchedForms(database, kataAman);
    if (matchedForms.length === 0) return buildEmptyTetangga(kataAman, limit);

    const wordIds = matchedForms.map((row) => row.wordId).filter(Boolean);
    const placeholders = buildPlaceholders(wordIds);

    const kiriRows = database.prepare(`
      SELECT related.w_id AS wordId, related.word AS kata, COUNT(*) AS frekuensi
      FROM inv_w base
      JOIN inv_w other ON other.s_id = base.s_id AND other.pos = base.pos - 1
      JOIN words related ON related.w_id = other.w_id
      WHERE base.w_id IN (${placeholders})
      GROUP BY related.w_id, related.word
      ORDER BY frekuensi DESC, related.word ASC
      LIMIT ?
    `).all(...wordIds, limit);

    const kananRows = database.prepare(`
      SELECT related.w_id AS wordId, related.word AS kata, COUNT(*) AS frekuensi
      FROM inv_w base
      JOIN inv_w other ON other.s_id = base.s_id AND other.pos = base.pos + 1
      JOIN words related ON related.w_id = other.w_id
      WHERE base.w_id IN (${placeholders})
      GROUP BY related.w_id, related.word
      ORDER BY frekuensi DESC, related.word ASC
      LIMIT ?
    `).all(...wordIds, limit);

    const filterTetangga = (rows = []) => rows.filter((row) => !memuatKataUtuh(row.kata, kataAman));

    return {
      kata: kataAman,
      limit,
      kiri: filterTetangga(aggregateWordRows(kiriRows, kataAman)).map((row) => ({
        kata: row.kata,
        frekuensi: row.frekuensi,
      })),
      kanan: filterTetangga(aggregateWordRows(kananRows, kataAman)).map((row) => ({
        kata: row.kata,
        frekuensi: row.frekuensi,
      })),
    };
  }

  static async ambilGraf(corpusId, kata, options = {}) {
    const kataAman = normalizeSearchWord(kata);
    const limit = parseLimit(options.limit, { fallback: 12, max: 24 });

    if (!kataAman) {
      return {
        kata: '',
        nodes: [],
        edges: [],
      };
    }

    const database = LeipzigDb.openCorpusDatabase(corpusId);
    const matchedForms = listMatchedForms(database, kataAman);
    if (matchedForms.length === 0) {
      return {
        kata: kataAman,
        nodes: [],
        edges: [],
      };
    }

    const sameSentence = await this.ambilSekalimat(corpusId, kataAman, { limit, offset: 0 });
    const candidateNodes = sameSentence.data.slice(0, limit);
    if (candidateNodes.length === 0) {
      return {
        kata: kataAman,
        nodes: [{ id: kataAman.toLowerCase(), label: kataAman, weight: 1, isCenter: true }],
        edges: [],
      };
    }

    const nodeIds = candidateNodes.map((row) => row.kata.toLowerCase());
    const placeholders = buildPlaceholders(nodeIds);
    const rawEdges = database.prepare(`
      SELECT source.word AS sourceWord, target.word AS targetWord, relation.freq AS frekuensi
      FROM co_s relation
      JOIN words source ON source.w_id = relation.w1_id
      JOIN words target ON target.w_id = relation.w2_id
      WHERE LOWER(source.word) IN (${placeholders})
        AND LOWER(target.word) IN (${placeholders})
    `).all(...nodeIds, ...nodeIds);

    const edgeMap = new Map();
    rawEdges.forEach((row) => {
      const source = String(row.sourceWord || '').trim();
      const target = String(row.targetWord || '').trim();
      if (!source || !target) return;

      const key = normalizeGraphEdgeKey(source, target);
      const previous = edgeMap.get(key) || {
        source,
        target,
        weight: 0,
      };

      edgeMap.set(key, {
        source: previous.source,
        target: previous.target,
        weight: previous.weight + (Number(row.frekuensi) || 0),
      });
    });

    const centerNode = {
      id: kataAman.toLowerCase(),
      label: kataAman,
      weight: Math.max(...candidateNodes.map((row) => row.frekuensi), 1),
      isCenter: true,
    };
    const nodes = [
      centerNode,
      ...candidateNodes.map((row) => ({
        id: row.kata.toLowerCase(),
        label: row.kata,
        weight: row.frekuensi,
        isCenter: false,
      })),
    ];
    const edges = [
      ...candidateNodes.map((row) => ({
        source: centerNode.id,
        target: row.kata.toLowerCase(),
        weight: row.frekuensi,
      })),
      ...Array.from(edgeMap.values()).map((row) => ({
        source: row.source.toLowerCase(),
        target: row.target.toLowerCase(),
        weight: row.weight,
      })),
    ];

    return {
      kata: kataAman,
      nodes,
      edges,
    };
  }

  static async ambilMiripKonteks(corpusId, kata, options = {}) {
    const kataAman = normalizeSearchWord(kata);
    const limit = parseLimit(options.limit, { fallback: 12, max: 50 });
    const minimumKonteksSama = Math.min(Math.max(Number.parseInt(options.minimumKonteksSama, 10) || 3, 1), 20);
    const featureLimit = Math.min(Math.max(Number.parseInt(options.featureLimit, 10) || 80, 10), 240);
    const candidatePoolLimit = Math.min(Math.max(Number.parseInt(options.candidatePoolLimit, 10) || (limit * 6), limit), 240);

    if (!kataAman) return buildEmptyMiripKonteks('', limit, minimumKonteksSama);

    const database = LeipzigDb.openCorpusDatabase(corpusId);
    const matchedForms = listMatchedForms(database, kataAman);
    if (matchedForms.length === 0) return buildEmptyMiripKonteks(kataAman, limit, minimumKonteksSama);

    const targetWordIds = matchedForms.map((row) => row.wordId).filter(Boolean);
    const targetFeatures = ambilFiturKonteks(
      database,
      targetWordIds,
      matchedForms.map((row) => row.word),
      { featureLimit },
    );

    if (!targetFeatures.length) {
      return {
        ...buildEmptyMiripKonteks(kataAman, limit, minimumKonteksSama),
        jumlahKonteksAcuan: 0,
      };
    }

    const candidatePool = kumpulkanKandidatMirip(database, targetFeatures, targetWordIds, kataAman, { candidatePoolLimit });
    const targetFeatureKeys = targetFeatures.map((item) => item.featureKey);
    const targetFeatureMap = new Map(targetFeatures.map((item) => [item.featureKey, item]));
    const eligibleCandidates = candidatePool.filter((candidate) => candidate.commonFeatureKeys.length >= minimumKonteksSama);

    const ranked = eligibleCandidates.map((candidate) => {
      const candidateFeatures = ambilFiturKonteks(database, candidate.wordIds, [candidate.kata], { featureLimit });
      const candidateFeatureKeys = candidateFeatures.map((item) => item.featureKey);
      const commonFeatureKeys = candidate.commonFeatureKeys.filter((key) => targetFeatureMap.has(key));
      const skorDice = hitungDiceCoefficient(targetFeatureKeys, candidateFeatureKeys);

      return {
        kata: candidate.kata,
        frekuensi: candidate.frekuensi,
        skorDice,
        jumlahKonteksSama: commonFeatureKeys.length,
        konteksBersama: commonFeatureKeys
          .map((key) => targetFeatureMap.get(key))
          .filter(Boolean)
          .sort(compareSharedContext)
          .slice(0, 5)
          .map((item) => ({
            kata: item.kata,
            jenis: item.jenis,
            frekuensi: item.frekuensi,
            signifikansi: item.signifikansi,
          })),
      };
    }).filter((item) => item.jumlahKonteksSama >= minimumKonteksSama && item.skorDice > 0)
      .sort(compareMiripKonteksRank);

    return {
      kata: kataAman,
      limit,
      minimumKonteksSama,
      jumlahKonteksAcuan: targetFeatures.length,
      total: ranked.length,
      data: ranked.slice(0, limit),
    };
  }
}

module.exports = ModelKookurensi;
module.exports.__private = {
  buildEmptyResult,
  buildEmptyTetangga,
  buildEmptyMiripKonteks,
  normalizeGraphEdgeKey,
  escapeSqlString,
  escapeRegExp,
  memuatKataUtuh,
  buildValuesCte,
  ambilBarisRelasiSignifikan,
  agregasiFiturKonteks,
  ambilFiturKonteks,
  kumpulkanKandidatMirip,
  hitungDiceCoefficient,
  compareSharedContext,
  compareMiripKonteksRank,
};