/**
 * @fileoverview Test helper db Leipzig.
 * @tested_in backend/db/leipzig.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kateglo-leipzig-db-'));
}

function writeSqlite(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec('CREATE TABLE words (w_id INTEGER PRIMARY KEY, word TEXT, freq INTEGER);');
  database.close();
}

describe('db/leipzig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('mendaftar korpus dari raw dir dan sqlite sambil membaca metadata', () => {
    const rootDir = makeTempDir();
    const rawDir = path.join(rootDir, 'ind_news_2024_10K');
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(rawDir, { recursive: true });
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(
      path.join(rawDir, 'ind_news_2024_10K-meta.txt'),
      ['1\tbuild date\t2025-02-13', '2\tSENTENCES\t10000', '3\tWORD_TYPES\t28450'].join('\n')
    );
    writeSqlite(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    writeSqlite(path.join(sqliteDir, 'ind_wikipedia_2021_1M.sqlite'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const LeipzigDb = require('../../db/leipzig');
    const corpora = LeipzigDb.listAvailableCorpora();

    expect(corpora).toEqual([
      expect.objectContaining({
        id: 'ind_news_2024_10K',
        label: 'Berita 2024',
        hasRawFiles: true,
        hasSqlite: true,
        stats: expect.objectContaining({ sentences: 10000, wordTypes: 28450, buildDate: '2025-02-13' }),
      }),
      expect.objectContaining({
        id: 'ind_wikipedia_2021_1M',
        label: 'Wikipedia 2021',
        hasRawFiles: false,
        hasSqlite: true,
        stats: null,
      }),
    ]);
  });

  it('membuka database read-only dan memakai cache koneksi', () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const databasePath = path.join(sqliteDir, 'ind_news_2024_10K.sqlite');
    writeSqlite(databasePath);

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const LeipzigDb = require('../../db/leipzig');
    const first = LeipzigDb.openCorpusDatabase('ind_news_2024_10K');
    const second = LeipzigDb.openCorpusDatabase('ind_news_2024_10K');

    expect(first).toBe(second);
    LeipzigDb.closeAllDatabases();
  });

  it('melempar error invalid, not ready, dan not found', () => {
    const rootDir = makeTempDir();
    const rawDir = path.join(rootDir, 'ind_news_2024_10K');
    fs.mkdirSync(rawDir, { recursive: true });
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = path.join(rootDir, 'sqlite');

    const LeipzigDb = require('../../db/leipzig');

    expect(() => LeipzigDb.openCorpusDatabase('bad/id')).toThrow(expect.objectContaining({ code: 'LEIPZIG_CORPUS_INVALID' }));
    expect(() => LeipzigDb.openCorpusDatabase('ind_news_2024_10K')).toThrow(expect.objectContaining({ code: 'LEIPZIG_CORPUS_NOT_READY' }));
    expect(() => LeipzigDb.openCorpusDatabase('ind_web_2024_10K')).toThrow(expect.objectContaining({ code: 'LEIPZIG_CORPUS_NOT_FOUND' }));
  });

  it('tidak gagal saat module di-load jika node:sqlite belum tersedia', () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'), Buffer.from('dummy'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    jest.doMock('node:sqlite', () => {
      const error = new Error('No such built-in module: node:sqlite');
      error.code = 'ERR_UNKNOWN_BUILTIN_MODULE';
      throw error;
    });

    let LeipzigDb;
    jest.isolateModules(() => {
      LeipzigDb = require('../../db/leipzig');
    });

    expect(LeipzigDb.isSqliteRuntimeSupported()).toBe(false);
    expect(() => LeipzigDb.openCorpusDatabase('ind_news_2024_10K')).toThrow(
      expect.objectContaining({ code: 'LEIPZIG_RUNTIME_UNSUPPORTED' })
    );
  });
});