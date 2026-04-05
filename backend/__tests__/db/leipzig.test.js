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

function writeEmptySqlite(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec(`
    CREATE TABLE words (w_id INTEGER PRIMARY KEY, word TEXT, freq INTEGER);
    CREATE TABLE sentences (s_id INTEGER PRIMARY KEY, sentence TEXT);
    CREATE TABLE sources (so_id INTEGER PRIMARY KEY, source TEXT, date TEXT);
  `);
  database.close();
}

describe('db/leipzig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('mendaftar korpus dari raw dir dan sqlite sambil membaca metadata dan fallback SQLite', () => {
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
        stats: expect.objectContaining({
          sentences: 2,
          wordTypes: 2,
          wordTokens: 35,
          sources: 1,
        }),
      }),
    ]);
  });

  it('menggabungkan metadata file dengan fallback SQLite untuk field yang hilang', () => {
    const rootDir = makeTempDir();
    const rawDir = path.join(rootDir, 'ind_news_2024_10K');
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(rawDir, { recursive: true });
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(
      path.join(rawDir, 'ind_news_2024_10K-meta.txt'),
      ['1\tbuild date\t2025-02-13', '2\tSENTENCES\t10000'].join('\n')
    );
    writeSqlite(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const LeipzigDb = require('../../db/leipzig');
    const corpora = LeipzigDb.listAvailableCorpora();

    expect(corpora[0].stats).toEqual({
      buildDate: '2025-02-13',
      sentences: 10000,
      wordTypes: 2,
      wordTokens: 35,
      sources: 1,
    });
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

  it('helper deskripsi korpus menangani ID invalid dan title case fallback', () => {
    const LeipzigDb = require('../../db/leipzig');

    expect(LeipzigDb.describeCorpusId('bad/id')).toEqual({
      id: '',
      label: '',
      language: null,
      domain: null,
      year: null,
      size: null,
    });
    expect(LeipzigDb.describeCorpusId('ind_blog_2024_10K')).toEqual(expect.objectContaining({
      label: 'Blog 2024',
      domain: 'blog',
    }));
    expect(LeipzigDb.__private.toTitleCase('open_data corpus')).toBe('Open Data Corpus');
  });

  it('helper path dan normalisasi korpus menangani fallback, path relatif, dan path absolut', () => {
    const rootDir = makeTempDir();
    process.env.LEIPZIG_DATA_DIR = 'custom/leipzig';
    process.env.LEIPZIG_SQLITE_DIR = path.join(rootDir, 'sqlite-absolute');

    const LeipzigDb = require('../../db/leipzig');

    expect(LeipzigDb.__private.resolveConfiguredPath('', 'fallback')).toBe('fallback');
    expect(LeipzigDb.getLeipzigRootDir()).toBe(path.resolve(path.join(__dirname, '..', '..', '..'), 'custom/leipzig'));
    expect(LeipzigDb.getLeipzigSqliteDir()).toBe(path.join(rootDir, 'sqlite-absolute'));
    expect(LeipzigDb.normalizeCorpusId()).toBe('');
    expect(LeipzigDb.normalizeCorpusId(' ind_news_2024_10K ')).toBe('ind_news_2024_10K');
    expect(LeipzigDb.normalizeCorpusId('bad/id')).toBe('');
    expect(LeipzigDb.__private.toTitleCase()).toBe('');
  });

  it('helper metadata, stats kosong, dan penggabungan stats menangani data minim', () => {
    const rootDir = makeTempDir();
    const rawDir = path.join(rootDir, 'ind_news_2024_10K');
    const rawBlogDir = path.join(rootDir, 'ind_blog_2024_10K');
    const rawWebDir = path.join(rootDir, 'ind_web_2024_10K');
    const rawZeroDir = path.join(rootDir, 'ind_zero_2024_10K');
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(rawDir, { recursive: true });
    fs.mkdirSync(rawBlogDir, { recursive: true });
    fs.mkdirSync(rawWebDir, { recursive: true });
    fs.mkdirSync(rawZeroDir, { recursive: true });
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(
      path.join(rawDir, 'ind_news_2024_10K-meta.txt'),
      [' ', '1\tbuild_date\t2025-02-13', '2\tSENTENCES\t7', '3\tWORD_TYPES\t12', '4\tWORD_TOKENS\t35', '5\tSOURCES\t2', 'invalid-line'].join('\n')
    );
    writeEmptySqlite(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const LeipzigDb = require('../../db/leipzig');

    expect(LeipzigDb.__private.readCorpusMeta('bad/id')).toBeNull();
    expect(LeipzigDb.__private.readCorpusMeta('ind_missing_2024_10K')).toBeNull();
    fs.writeFileSync(path.join(rawBlogDir, 'ind_blog_2024_10K-meta.txt'), 'invalid-line');
    fs.writeFileSync(
      path.join(rawWebDir, 'ind_web_2024_10K-meta.txt'),
      ['1\tSENTENCES\t1', '2\tWORD_TYPES\t0', '3\tWORD_TOKENS\t0', '4\tSOURCES\t0'].join('\n')
    );
    fs.writeFileSync(path.join(rawZeroDir, 'ind_zero_2024_10K-meta.txt'), '1\tSENTENCES\t0');
    expect(LeipzigDb.__private.readCorpusMeta('ind_news_2024_10K')).toEqual({
      buildDate: '2025-02-13',
      sentences: 7,
      wordTypes: 12,
      wordTokens: 35,
      sources: 2,
    });
    expect(LeipzigDb.__private.readCorpusMeta('ind_blog_2024_10K')).toBeNull();
    expect(LeipzigDb.__private.readCorpusMeta('ind_web_2024_10K')).toEqual({
      sentences: 1,
      wordTypes: 0,
      wordTokens: 0,
      sources: 0,
    });
    expect(LeipzigDb.__private.readCorpusMeta('ind_zero_2024_10K')).toEqual({ sentences: 0 });
    expect(LeipzigDb.__private.readCorpusStatsFromSqlite('ind_news_2024_10K')).toBeNull();
    expect(LeipzigDb.__private.gabungkanCorpusStats()).toBeNull();
    expect(LeipzigDb.__private.gabungkanCorpusStats(null, null)).toBeNull();
    expect(LeipzigDb.__private.gabungkanCorpusStats('bad', 42)).toBeNull();
    expect(LeipzigDb.__private.gabungkanCorpusStats({ buildDate: 'x' }, null)).toEqual({ buildDate: 'x' });
    expect(LeipzigDb.__private.gabungkanCorpusStats(null, { sentences: 1 })).toEqual({ sentences: 1 });
    expect(LeipzigDb.__private.gabungkanCorpusStats({ buildDate: 'x' }, { sentences: 1 })).toEqual({
      sentences: 1,
      buildDate: 'x',
    });
  });

  it('readCorpusStatsFromSqlite mengembalikan stats campuran nol dan non-nol', () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'), Buffer.from('dummy'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    jest.doMock('node:sqlite', () => ({
      DatabaseSync: class DatabaseSyncMock {
        prepare() {
          return {
            get() {
              return {
                sentences: 0,
                word_types: 1,
                word_tokens: 0,
                sources: 0,
              };
            },
          };
        }

        close() {}
      },
    }));

    let LeipzigDb;
    jest.isolateModules(() => {
      LeipzigDb = require('../../db/leipzig');
    });

    expect(LeipzigDb.__private.readCorpusStatsFromSqlite('ind_news_2024_10K')).toEqual({
      sentences: 0,
      wordTypes: 1,
      wordTokens: 0,
      sources: 0,
    });
  });

  it('readCorpusStatsFromSqlite tetap mengembalikan objek saat hanya sentences bernilai non-zero', () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'), Buffer.from('dummy'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    jest.doMock('node:sqlite', () => ({
      DatabaseSync: class DatabaseSyncMock {
        prepare() {
          return {
            get() {
              return {
                sentences: 1,
                word_types: 0,
                word_tokens: 0,
                sources: 0,
              };
            },
          };
        }

        close() {}
      },
    }));

    let LeipzigDb;
    jest.isolateModules(() => {
      LeipzigDb = require('../../db/leipzig');
    });

    expect(LeipzigDb.__private.readCorpusStatsFromSqlite('ind_news_2024_10K')).toEqual({
      sentences: 1,
      wordTypes: 0,
      wordTokens: 0,
      sources: 0,
    });
  });

  it('readCorpusStatsFromSqlite mengembalikan null saat query stats tidak menghasilkan row', () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'), Buffer.from('dummy'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    jest.doMock('node:sqlite', () => ({
      DatabaseSync: class DatabaseSyncMock {
        prepare() {
          return {
            get() {
              return undefined;
            },
          };
        }

        close() {}
      },
    }));

    let LeipzigDb;
    jest.isolateModules(() => {
      LeipzigDb = require('../../db/leipzig');
    });

    expect(LeipzigDb.__private.readCorpusStatsFromSqlite('ind_news_2024_10K')).toBeNull();
  });

  it('listCorpusCandidates hanya mengembalikan kandidat valid yang unik dan terurut', () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(path.join(rootDir, 'ind_news_2024_10K'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'bad/id'), { recursive: true });
    fs.mkdirSync(sqliteDir, { recursive: true });
    writeSqlite(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    writeSqlite(path.join(sqliteDir, 'ind_blog_2024_10K.sqlite'));
    writeSqlite(path.join(sqliteDir, 'invalid.sqlite'));
    fs.writeFileSync(path.join(sqliteDir, 'bukan-sqlite.txt'), 'x');

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const LeipzigDb = require('../../db/leipzig');

    expect(LeipzigDb.__private.listCorpusCandidates()).toEqual([
      'ind_blog_2024_10K',
      'ind_news_2024_10K',
    ]);
  });

  it('listCorpusCandidates mengembalikan kosong saat direktori korpus belum ada', () => {
    const rootDir = makeTempDir();

    process.env.LEIPZIG_DATA_DIR = path.join(rootDir, 'missing-root');
    process.env.LEIPZIG_SQLITE_DIR = path.join(rootDir, 'missing-sqlite');

    const LeipzigDb = require('../../db/leipzig');

    expect(LeipzigDb.__private.listCorpusCandidates()).toEqual([]);
  });

  it('readCorpusStatsFromSqlite mengembalikan null untuk korpus not-ready dan not-found, serta runtime unsupported', () => {
    const rootDir = makeTempDir();
    const rawDir = path.join(rootDir, 'ind_news_2024_10K');
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(rawDir, { recursive: true });
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(path.join(sqliteDir, 'ind_web_2024_10K.sqlite'), Buffer.from('dummy'));

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

    expect(LeipzigDb.__private.readCorpusStatsFromSqlite('ind_news_2024_10K')).toBeNull();
    expect(LeipzigDb.__private.readCorpusStatsFromSqlite('ind_missing_2024_10K')).toBeNull();
    expect(LeipzigDb.__private.readCorpusStatsFromSqlite('ind_web_2024_10K')).toBeNull();
  });

  it('readCorpusStatsFromSqlite dan isSqliteRuntimeSupported melempar error tak dikenal', () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'), Buffer.from('dummy'));

    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    jest.doMock('node:sqlite', () => {
      const error = new Error('boom');
      error.code = 'EOTHER';
      throw error;
    });

    let LeipzigDb;
    jest.isolateModules(() => {
      LeipzigDb = require('../../db/leipzig');
    });

    expect(() => LeipzigDb.__private.readCorpusStatsFromSqlite('ind_news_2024_10K')).toThrow('boom');
    expect(() => LeipzigDb.isSqliteRuntimeSupported()).toThrow('boom');
  });

  it('isSqliteRuntimeSupported mengembalikan true pada runtime normal', () => {
    jest.resetModules();
    jest.unmock('node:sqlite');
    const LeipzigDb = require('../../db/leipzig');

    expect(LeipzigDb.isSqliteRuntimeSupported()).toBe(true);
  });
});