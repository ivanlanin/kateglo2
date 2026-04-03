/**
 * @fileoverview Generate Leipzig corpus meta files from SQLite stats.
 *
 * Usage:
 *   node scripts/leipzig/generateMeta.js ind_wikipedia_2021_300K
 */

const fs = require('fs');
const path = require('path');
const LeipzigDb = require('../../db/leipzig');

function buildMetaLines(stats = {}) {
  const lines = [];
  let run = 1;

  if (stats.sentences != null) {
    lines.push(`${run}\tSENTENCES\t${stats.sentences}`);
    run += 1;
  }

  if (stats.wordTypes != null) {
    lines.push(`${run}\tWORD_TYPES\t${stats.wordTypes}`);
    run += 1;
  }

  if (stats.wordTokens != null) {
    lines.push(`${run}\tWORD_TOKENS\t${stats.wordTokens}`);
    run += 1;
  }

  if (stats.sources != null) {
    lines.push(`${run}\tSOURCES\t${stats.sources}`);
  }

  return lines;
}

function generateMetaFile(corpusId) {
  const normalized = LeipzigDb.normalizeCorpusId(corpusId);
  if (!normalized) {
    throw new Error('ID korpus Leipzig tidak valid');
  }

  const rawDir = LeipzigDb.getCorpusRawDir(normalized);
  const metaPath = path.join(rawDir, `${normalized}-meta.txt`);
  const stats = LeipzigDb.__private.readCorpusStatsFromSqlite(normalized);

  if (!stats) {
    throw new Error(`Statistik SQLite untuk ${normalized} tidak tersedia`);
  }

  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(metaPath, `${buildMetaLines(stats).join('\n')}\n`, 'utf8');

  return { corpusId: normalized, metaPath, stats };
}

function main() {
  const corpusId = process.argv[2];
  if (!corpusId) {
    throw new Error('Gunakan: node scripts/leipzig/generateMeta.js <korpusId>');
  }

  const result = generateMetaFile(corpusId);
  console.log(`Meta berhasil dibuat: ${result.metaPath}`);
  console.log(JSON.stringify(result.stats, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  buildMetaLines,
  generateMetaFile,
};