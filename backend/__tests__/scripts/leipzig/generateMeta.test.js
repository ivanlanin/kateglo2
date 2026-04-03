/**
 * @fileoverview Test generator meta Leipzig.
 * @tested_in backend/scripts/leipzig/generateMeta.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kateglo-leipzig-meta-'));
}

function writeSqlite(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec(`
    CREATE TABLE words (w_id INTEGER PRIMARY KEY, word TEXT, freq INTEGER);
    CREATE TABLE sentences (s_id INTEGER PRIMARY KEY, sentence TEXT);
    CREATE TABLE sources (so_id INTEGER PRIMARY KEY, source TEXT, date TEXT);
    INSERT INTO words (w_id, word, freq) VALUES (1, 'jika', 20), (2, 'dan', 15);
    INSERT INTO sentences (s_id, sentence) VALUES (1, 'Jika dan hanya jika.'), (2, 'Dan begitu.');
    INSERT INTO sources (so_id, source, date) VALUES (1, 'https://contoh.test', '2024-01-01');
  `);
  database.close();
}

describe('scripts/leipzig/generateMeta', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('membuat file meta dari statistik SQLite', () => {
    const rootDir = makeTempDir();
    const rawDir = path.join(rootDir, 'ind_wikipedia_2021_300K');
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(rawDir, { recursive: true });
    writeSqlite(path.join(sqliteDir, 'ind_wikipedia_2021_300K.sqlite'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const { generateMetaFile } = require('../../../scripts/leipzig/generateMeta');
    const result = generateMetaFile('ind_wikipedia_2021_300K');
    const content = fs.readFileSync(result.metaPath, 'utf8');

    expect(content).toContain('SENTENCES\t2');
    expect(content).toContain('WORD_TYPES\t2');
    expect(content).toContain('WORD_TOKENS\t35');
    expect(content).toContain('SOURCES\t1');
  });
});