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

function seedCorpusDatabaseWithRankedWords(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec(`
    CREATE TABLE words (w_id INTEGER PRIMARY KEY, word TEXT NOT NULL, freq INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE ranked_words (
      normalized_word TEXT PRIMARY KEY,
      display_word TEXT NOT NULL,
      freq_total INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      frequency_class INTEGER
    );

    INSERT INTO words (w_id, word, freq) VALUES
      (1, 'jika', 20),
      (2, 'Indonesia', 8),
      (3, 'indonesia', 5),
      (4, 'Jakarta', 6);

    INSERT INTO ranked_words (normalized_word, display_word, freq_total, rank, frequency_class) VALUES
      ('jika', 'Jika', 20, 1, 0),
      ('indonesia', 'Indonesia', 13, 2, 0),
      ('jakarta', 'Jakarta', 6, 3, NULL);
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
        { kata: 'indonesia', frekuensi: 13, rank: 2, kelasFrekuensi: 0 },
        { kata: 'bahasa', frekuensi: 4, rank: 3, kelasFrekuensi: 2 },
      ],
    });
    LeipzigDb.closeAllDatabases();
  });

  it('memakai ranked_words untuk info kata saat frekuensi cocok dan helper ranking langsung aman', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabaseWithRankedWords(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKata = require('../../../models/leipzig/modelKata');
    const LeipzigDb = require('../../../db/leipzig');
    const database = LeipzigDb.openCorpusDatabase('ind_news_2024_10K');

    await expect(ModelKata.ambilInfoKata('ind_news_2024_10K', 'indonesia')).resolves.toEqual({
      kata: 'indonesia',
      frekuensi: 13,
      rank: 2,
      kelasFrekuensi: 0,
      bentuk: [
        { kata: 'indonesia', frekuensi: 5, wordId: 3 },
        { kata: 'Indonesia', frekuensi: 8, wordId: 2 },
      ],
    });

    expect(ModelKata.__private.ambilInfoRankingLangsung(database, 'Jakarta')).toEqual({
      kata: 'Jakarta',
      frekuensi: 6,
      rank: 3,
      kelasFrekuensi: null,
    });
    expect(ModelKata.__private.ambilInfoRankingLangsung(database, '   ')).toBeNull();
    LeipzigDb.closeAllDatabases();
  });

  it('memakai ranked_words untuk daftar peringkat bila tabel tersedia', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabaseWithRankedWords(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
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
        { kata: 'indonesia', frekuensi: 13, rank: 2, kelasFrekuensi: 0 },
        { kata: 'Jakarta', frekuensi: 6, rank: 3, kelasFrekuensi: null },
      ],
    });
    LeipzigDb.closeAllDatabases();
  });

  it('helper privat modelKata aman untuk fallback default dan nilai nol', () => {
    const ModelKata = require('../../../models/leipzig/modelKata');

    expect(ModelKata.__private.hitungKelasFrekuensi()).toBeNull();
    expect(ModelKata.__private.hitungKelasFrekuensi(32, 8)).toBe(2);
    expect(ModelKata.__private.getKlausulFilterTokenPeringkat()).toContain('aggregated.normalized_word');
    expect(ModelKata.__private.ambilFrekuensiTertinggi({
      prepare: jest.fn(() => ({ get: jest.fn(() => undefined) })),
    })).toBe(0);
    expect(ModelKata.__private.ambilInfoRankingLangsung({
      prepare: jest.fn()
        .mockReturnValueOnce({ get: jest.fn(() => ({ name: 'ranked_words' })) })
        .mockReturnValueOnce({ get: jest.fn(() => ({ kata: 'uji', frekuensi: 0, rank: 0, kelasFrekuensi: null })) }),
    }, 'uji')).toEqual({
      kata: 'uji',
      frekuensi: 0,
      rank: null,
      kelasFrekuensi: null,
    });
    expect(ModelKata.__private.ambilInfoRankingLangsung({
      prepare: jest.fn()
        .mockReturnValueOnce({ get: jest.fn(() => ({ name: 'ranked_words' })) })
        .mockReturnValueOnce({ get: jest.fn(() => null) }),
    }, 'uji')).toBeNull();
  });

  it('memakai kata dari info ranking saat matched form tidak memiliki word tetapi frekuensi cocok', async () => {
    const prepare = jest.fn()
      .mockReturnValueOnce({ get: jest.fn(() => ({ name: 'ranked_words' })) })
      .mockReturnValueOnce({ get: jest.fn(() => ({ kata: 'ranking-only', frekuensi: 5, rank: 7, kelasFrekuensi: 2 })) });

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({ prepare })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'uji'),
      listMatchedForms: jest.fn(() => [{ freq: 5 }]),
      summarizeMatchedForms: jest.fn(() => ['ringkas']),
      parseLimit: jest.fn(),
      parseOffset: jest.fn(),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKata = require('../../../models/leipzig/modelKata');

    await expect(ModelKata.ambilInfoKata('ind_news_2024_10K', 'uji')).resolves.toEqual({
      kata: 'ranking-only',
      frekuensi: 5,
      rank: 7,
      kelasFrekuensi: 2,
      bentuk: ['ringkas'],
    });
  });

  it('jalur ranked info bisa fallback ke kataAman saat kata ranking juga kosong', async () => {
    const prepare = jest.fn()
      .mockReturnValueOnce({ get: jest.fn(() => ({ name: 'ranked_words' })) })
      .mockReturnValueOnce({ get: jest.fn(() => ({ kata: '', frekuensi: 5, rank: 7, kelasFrekuensi: 2 })) });

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({ prepare })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'uji'),
      listMatchedForms: jest.fn(() => [{ freq: 5 }]),
      summarizeMatchedForms: jest.fn(() => ['ringkas']),
      parseLimit: jest.fn(),
      parseOffset: jest.fn(),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKata = require('../../../models/leipzig/modelKata');

    await expect(ModelKata.ambilInfoKata('ind_news_2024_10K', 'uji')).resolves.toEqual({
      kata: 'uji',
      frekuensi: 5,
      rank: 7,
      kelasFrekuensi: 2,
      bentuk: ['ringkas'],
    });
  });

  it('fallback info kata memakai kataAman dan rank default saat info ranking tidak cocok', async () => {
    const prepare = jest.fn()
      .mockReturnValueOnce({ get: jest.fn(() => ({ name: 'ranked_words' })) })
      .mockReturnValueOnce({ get: jest.fn(() => ({ kata: 'ranking-only', frekuensi: 9, rank: 0, kelasFrekuensi: null })) })
      .mockReturnValueOnce({ get: jest.fn(() => undefined) })
      .mockReturnValueOnce({ get: jest.fn(() => undefined) });

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({ prepare })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'uji'),
      listMatchedForms: jest.fn(() => [{ freq: 2 }]),
      summarizeMatchedForms: jest.fn(() => ['ringkas']),
      parseLimit: jest.fn(),
      parseOffset: jest.fn(),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKata = require('../../../models/leipzig/modelKata');

    await expect(ModelKata.ambilInfoKata('ind_news_2024_10K', 'uji')).resolves.toEqual({
      kata: 'uji',
      frekuensi: 2,
      rank: 1,
      kelasFrekuensi: null,
      bentuk: ['ringkas'],
    });
  });

  it('peringkat ranked_words menghitung hasMore true dan fallback numerik nol', async () => {
    const prepare = jest.fn()
      .mockReturnValueOnce({ get: jest.fn(() => ({ name: 'ranked_words' })) })
      .mockReturnValueOnce({ get: jest.fn(() => ({ total: 3 })) })
      .mockReturnValueOnce({ all: jest.fn(() => [{ kata: 'uji', frekuensi: 0, rank: 0, kelasFrekuensi: null }]) });

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({ prepare })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(),
      listMatchedForms: jest.fn(),
      summarizeMatchedForms: jest.fn(),
      parseLimit: jest.fn(() => 1),
      parseOffset: jest.fn(() => 0),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKata = require('../../../models/leipzig/modelKata');

    await expect(ModelKata.ambilPeringkat('ind_news_2024_10K', { limit: '1', offset: '0' })).resolves.toEqual({
      total: 3,
      limit: 1,
      offset: 0,
      hasMore: true,
      data: [{ kata: 'uji', frekuensi: 0, rank: 0, kelasFrekuensi: null }],
    });
  });

  it('peringkat ranked_words memakai total default saat totalRow tidak ada', async () => {
    const prepare = jest.fn()
      .mockReturnValueOnce({ get: jest.fn(() => ({ name: 'ranked_words' })) })
      .mockReturnValueOnce({ get: jest.fn(() => undefined) })
      .mockReturnValueOnce({ all: jest.fn(() => []) });

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({ prepare })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(),
      listMatchedForms: jest.fn(),
      summarizeMatchedForms: jest.fn(),
      parseLimit: jest.fn(() => 25),
      parseOffset: jest.fn(() => 0),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKata = require('../../../models/leipzig/modelKata');

    await expect(ModelKata.ambilPeringkat('ind_news_2024_10K')).resolves.toEqual({
      total: 0,
      limit: 25,
      offset: 0,
      hasMore: false,
      data: [],
    });
  });

  it('peringkat non-ranked memakai normalizedWord dan total default saat metadata kosong', async () => {
    const prepare = jest.fn()
      .mockReturnValueOnce({ get: jest.fn(() => undefined) })
      .mockReturnValueOnce({ get: jest.fn(() => undefined) })
      .mockReturnValueOnce({ get: jest.fn(() => undefined) })
      .mockReturnValueOnce({ all: jest.fn(() => [{ normalizedWord: 'uji', kata: '', frekuensi: 0 }]) });

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({ prepare })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(),
      listMatchedForms: jest.fn(),
      summarizeMatchedForms: jest.fn(),
      parseLimit: jest.fn(() => 25),
      parseOffset: jest.fn(() => 0),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKata = require('../../../models/leipzig/modelKata');

    await expect(ModelKata.ambilPeringkat('ind_news_2024_10K')).resolves.toEqual({
      total: 0,
      limit: 25,
      offset: 0,
      hasMore: false,
      data: [{ kata: 'uji', frekuensi: 0, rank: 1, kelasFrekuensi: null }],
    });
  });
});