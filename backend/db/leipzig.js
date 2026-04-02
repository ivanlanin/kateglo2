/**
 * @fileoverview Shared helpers for Leipzig corpus SQLite access.
 */

const fs = require('fs');
const path = require('path');

const databaseCache = new Map();
let cachedDatabaseSync = null;
let cachedSqliteLoadError = null;
const corpusIdPattern = /^(?<language>[a-z]+)_(?<domain>[a-z]+)_(?<year>\d{4})_(?<size>[A-Za-z0-9]+)$/i;

const domainLabels = {
  news: 'Berita',
  wikipedia: 'Wikipedia',
  web: 'Web',
  newscrawl: 'Newscrawl',
  mixed: 'Campuran',
};

function getRepoRoot() {
  return path.join(__dirname, '..', '..');
}

function resolveConfiguredPath(envValue, fallbackPath) {
  if (!envValue) return fallbackPath;
  return path.isAbsolute(envValue) ? envValue : path.resolve(getRepoRoot(), envValue);
}

function getLeipzigRootDir() {
  return resolveConfiguredPath(
    process.env.LEIPZIG_DATA_DIR,
    path.join(getRepoRoot(), '.data', 'leipzig')
  );
}

function getLeipzigSqliteDir() {
  return resolveConfiguredPath(
    process.env.LEIPZIG_SQLITE_DIR,
    path.join(getLeipzigRootDir(), 'sqlite')
  );
}

function normalizeCorpusId(value) {
  const corpusId = String(value || '').trim();
  if (!/^[A-Za-z0-9_]+$/.test(corpusId)) return '';
  return corpusId;
}

function toTitleCase(value) {
  return String(value || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function describeCorpusId(corpusId) {
  const normalized = normalizeCorpusId(corpusId);
  const match = normalized.match(corpusIdPattern);
  if (!match || !match.groups) {
    return {
      id: normalized,
      label: normalized,
      language: null,
      domain: null,
      year: null,
      size: null,
    };
  }

  const { language, domain, year, size } = match.groups;
  const domainLabel = domainLabels[String(domain).toLowerCase()] || toTitleCase(domain);
  const sizeLabel = String(size).toUpperCase();

  return {
    id: normalized,
    label: `${domainLabel} ${year}`,
    language: String(language).toLowerCase(),
    domain: String(domain).toLowerCase(),
    year: Number.parseInt(year, 10),
    size: sizeLabel,
  };
}

function getCorpusRawDir(corpusId) {
  return path.join(getLeipzigRootDir(), normalizeCorpusId(corpusId));
}

function getCorpusDatabasePath(corpusId) {
  return path.join(getLeipzigSqliteDir(), `${normalizeCorpusId(corpusId)}.sqlite`);
}

function readCorpusMeta(corpusId) {
  const normalized = normalizeCorpusId(corpusId);
  if (!normalized) return null;

  const metaPath = path.join(getCorpusRawDir(normalized), `${normalized}-meta.txt`);
  if (!fs.existsSync(metaPath)) return null;

  const content = fs.readFileSync(metaPath, 'utf8');
  const stats = {};

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [run, attribute, value] = line.split('\t');
    if (!run || !attribute || value == null) continue;

    const attributeKey = String(attribute).trim().toUpperCase();
    if (attributeKey === 'SENTENCES') stats.sentences = Number.parseInt(value, 10) || 0;
    if (attributeKey === 'WORD_TYPES') stats.wordTypes = Number.parseInt(value, 10) || 0;
    if (attributeKey === 'WORD_TOKENS') stats.wordTokens = Number.parseInt(value, 10) || 0;
    if (attributeKey === 'SOURCES') stats.sources = Number.parseInt(value, 10) || 0;
    if (attributeKey === 'BUILD DATE' || attributeKey === 'BUILD_DATE') stats.buildDate = String(value).trim();
  }

  return Object.keys(stats).length > 0 ? stats : null;
}

function listCorpusCandidates() {
  const rootDir = getLeipzigRootDir();
  const sqliteDir = getLeipzigSqliteDir();
  const corpusIds = new Set();

  if (fs.existsSync(rootDir)) {
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'sqlite') continue;
      const normalized = normalizeCorpusId(entry.name);
      if (normalized && corpusIdPattern.test(normalized)) corpusIds.add(normalized);
    }
  }

  if (fs.existsSync(sqliteDir)) {
    for (const entry of fs.readdirSync(sqliteDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.sqlite')) continue;
      const normalized = normalizeCorpusId(entry.name.slice(0, -'.sqlite'.length));
      if (normalized && corpusIdPattern.test(normalized)) corpusIds.add(normalized);
    }
  }

  return Array.from(corpusIds).sort((left, right) => left.localeCompare(right));
}

function listAvailableCorpora() {
  return listCorpusCandidates().map((corpusId) => {
    const rawDir = getCorpusRawDir(corpusId);
    const databasePath = getCorpusDatabasePath(corpusId);

    return {
      ...describeCorpusId(corpusId),
      hasRawFiles: fs.existsSync(rawDir),
      hasSqlite: fs.existsSync(databasePath),
      stats: readCorpusMeta(corpusId),
    };
  });
}

function buildCorpusError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function loadDatabaseSync() {
  if (cachedDatabaseSync) return cachedDatabaseSync;
  if (cachedSqliteLoadError) throw cachedSqliteLoadError;

  try {
    ({ DatabaseSync: cachedDatabaseSync } = require('node:sqlite'));
    return cachedDatabaseSync;
  } catch (error) {
    if (error?.code === 'ERR_UNKNOWN_BUILTIN_MODULE' || error?.code === 'MODULE_NOT_FOUND') {
      cachedSqliteLoadError = buildCorpusError(
        'LEIPZIG_RUNTIME_UNSUPPORTED',
        'Runtime Node.js ini belum mendukung node:sqlite. Gunakan Node 22 atau nonaktifkan fitur Leipzig berbasis SQLite.'
      );
      cachedSqliteLoadError.cause = error;
      throw cachedSqliteLoadError;
    }

    throw error;
  }
}

function openCorpusDatabase(corpusId) {
  const normalized = normalizeCorpusId(corpusId);
  if (!normalized) {
    throw buildCorpusError('LEIPZIG_CORPUS_INVALID', 'ID korpus Leipzig tidak valid');
  }

  const databasePath = getCorpusDatabasePath(normalized);
  if (!fs.existsSync(databasePath)) {
    if (fs.existsSync(getCorpusRawDir(normalized))) {
      throw buildCorpusError(
        'LEIPZIG_CORPUS_NOT_READY',
        'Korpus Leipzig belum diimpor ke SQLite'
      );
    }

    throw buildCorpusError('LEIPZIG_CORPUS_NOT_FOUND', 'Korpus Leipzig tidak ditemukan');
  }

  if (!databaseCache.has(databasePath)) {
    const DatabaseSync = loadDatabaseSync();
    databaseCache.set(databasePath, new DatabaseSync(databasePath, { readOnly: true }));
  }

  return databaseCache.get(databasePath);
}

function closeAllDatabases() {
  for (const database of databaseCache.values()) {
    database.close();
  }
  databaseCache.clear();
}

module.exports = {
  getLeipzigRootDir,
  getLeipzigSqliteDir,
  getCorpusRawDir,
  getCorpusDatabasePath,
  normalizeCorpusId,
  describeCorpusId,
  listAvailableCorpora,
  openCorpusDatabase,
  closeAllDatabases,
  isSqliteRuntimeSupported() {
    try {
      loadDatabaseSync();
      return true;
    } catch (error) {
      if (error?.code === 'LEIPZIG_RUNTIME_UNSUPPORTED') return false;
      throw error;
    }
  },
  __private: {
    resolveConfiguredPath,
    readCorpusMeta,
    listCorpusCandidates,
    loadDatabaseSync,
  },
};