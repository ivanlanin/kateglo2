/**
 * @fileoverview Test model kata Leipzig.
 * @tested_in backend/models/leipzig/modelKata.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kateglo-leipzig-kata-'));
}

function seedCorpusDatabase(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec(`
    CREATE TABLE words (w_id INTEGER PRIMARY KEY, word TEXT NOT NULL, freq INTEGER NOT NULL DEFAULT 0);
    INSERT INTO words (w_id, word, freq) VALUES
      (1, 'jika', 20),
      (2, 'Indonesia', 8),
      (3, 'indonesia', 5),
      (4, 'bahasa', 4),
      (5, '.', 100),
      (6, ',', 90);
  `);
  database.close();
}

describe('models/leipzig/modelKata', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('mengembalikan info kata kosong jika query kosong', async () => {
    const ModelKata = require('../../../models/leipzig/modelKata');

    await expect(ModelKata.ambilInfoKata('ind_news_2024_10K', '   ')).resolves.toEqual({
      kata: '',
      frekuensi: 0,
      rank: null,
      kelasFrekuensi: null,
      bentuk: [],
    });
  });

  it('mengembalikan frekuensi agregat, rank, dan kelas frekuensi', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKata = require('../../../models/leipzig/modelKata');
    const LeipzigDb = require('../../../db/leipzig');
    const result = await ModelKata.ambilInfoKata('ind_news_2024_10K', 'indonesia');

    expect(result).toEqual({
      kata: 'indonesia',
      frekuensi: 13,
      rank: 2,
      kelasFrekuensi: 0,
      bentuk: [
        { kata: 'indonesia', frekuensi: 5, wordId: 3 },
        { kata: 'Indonesia', frekuensi: 8, wordId: 2 },
      ],
    });
    LeipzigDb.closeAllDatabases();
  });

  it('mengembalikan bentuk kosong saat kata tidak ditemukan dan helper kelas frekuensi aman', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKata = require('../../../models/leipzig/modelKata');
    const result = await ModelKata.ambilInfoKata('ind_news_2024_10K', 'tidak-ada');

    expect(result).toEqual({
      kata: 'tidak-ada',
      frekuensi: 0,
      rank: null,
      kelasFrekuensi: null,
      bentuk: [],
    });
    expect(ModelKata.__private.hitungKelasFrekuensi(0, 10)).toBeNull();
    expect(ModelKata.__private.hitungKelasFrekuensi(20, 0)).toBeNull();
  });

  it('mengembalikan daftar peringkat frekuensi kata', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKata = require('../../../models/leipzig/modelKata');
    const LeipzigDb = require('../../../db/leipzig');
    const result = await ModelKata.ambilPeringkat('ind_news_2024_10K', { limit: '2', offset: '1' });

    expect(result).toEqual({
      total: 3,
      limit: 2,
      offset: 1,
      hasMore: false,
      data: [
        { kata: 'Indonesia', frekuensi: 13, rank: 2, kelasFrekuensi: 0 },
        { kata: 'bahasa', frekuensi: 4, rank: 3, kelasFrekuensi: 2 },
      ],
    });
    LeipzigDb.closeAllDatabases();
  });
});