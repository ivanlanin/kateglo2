/**
 * @fileoverview Test model kookurensi Leipzig.
 * @tested_in backend/models/leipzig/modelKookurensi.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kateglo-leipzig-kookurensi-'));
}

function seedCorpusDatabase(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec(`
    CREATE TABLE words (w_id INTEGER PRIMARY KEY, word TEXT NOT NULL, freq INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE inv_w (w_id INTEGER NOT NULL, s_id INTEGER NOT NULL, pos INTEGER NOT NULL);
    CREATE TABLE co_n (w1_id INTEGER NOT NULL, w2_id INTEGER NOT NULL, freq INTEGER NOT NULL, sig REAL NOT NULL);
    CREATE TABLE co_s (w1_id INTEGER NOT NULL, w2_id INTEGER NOT NULL, freq INTEGER NOT NULL, sig REAL NOT NULL);

    INSERT INTO words (w_id, word, freq) VALUES
      (1, 'Indonesia', 8),
      (2, 'indonesia', 5),
      (3, 'maju', 9),
      (4, 'rakyat', 6),
      (5, 'Bahasa', 7),
      (6, 'bahasa', 3),
      (7, 'hebat', 5),
      (8, 'Malaysia', 7),
      (9, 'negara', 8),
      (10, 'Asia', 6),
      (11, 'Filipina', 5),
      (12, 'ekonomi', 4),
      (13, 'Republik Indonesia', 4),
      (14, 'Bank Indonesia', 3),
      (15, 'Indonesia Raya', 2);

    INSERT INTO inv_w (w_id, s_id, pos) VALUES
      (1, 10, 0),
      (3, 10, 1),
      (4, 10, 2),
      (5, 11, 0),
      (2, 11, 1),
      (7, 11, 2),
      (13, 12, 0),
      (1, 12, 1),
      (3, 12, 2),
      (14, 13, 0),
      (2, 13, 1),
      (7, 13, 2),
      (9, 14, 0),
      (1, 14, 1),
      (15, 14, 2);

    INSERT INTO co_s (w1_id, w2_id, freq, sig) VALUES
      (1, 3, 20, 0.95),
      (1, 4, 12, 0.82),
      (2, 5, 11, 0.71),
      (2, 6, 7, 0.42),
      (3, 4, 8, 0.55),
      (4, 5, 4, 0.31),
      (8, 3, 18, 0.92),
      (8, 4, 11, 0.8),
      (8, 9, 15, 0.84),
      (8, 10, 10, 0.7),
      (11, 3, 14, 0.86),
      (11, 4, 9, 0.75),
      (11, 9, 13, 0.8),
      (12, 6, 9, 0.66);

    INSERT INTO co_n (w1_id, w2_id, freq, sig) VALUES
      (1, 9, 7, 0.72),
      (2, 10, 5, 0.58),
      (8, 9, 6, 0.7),
      (8, 10, 4, 0.52),
      (11, 9, 5, 0.64),
      (11, 10, 3, 0.44),
      (12, 9, 2, 0.25);
  `);
  database.close();
}

describe('models/leipzig/modelKookurensi', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('mengembalikan sekalimat kosong jika kata kosong atau tidak ditemukan', async () => {
    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    expect(await ModelKookurensi.ambilSekalimat('ind_news_2024_10K', '   ')).toEqual({
      kata: '',
      total: 0,
      limit: 25,
      offset: 0,
      data: [],
    });
    expect(ModelKookurensi.__private.normalizeGraphEdgeKey('B', 'a')).toBe('a::b');
    expect(ModelKookurensi.__private.hitungDiceCoefficient(['a', 'b'], ['b', 'c'])).toBeCloseTo(0.5, 5);
  });

  it('mengembalikan kookurensi sekalimat, tetangga, dan graf', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const LeipzigDb = require('../../../db/leipzig');

    const sekalimat = await ModelKookurensi.ambilSekalimat('ind_news_2024_10K', 'indonesia', { limit: 10, offset: 0 });
    const tetangga = await ModelKookurensi.ambilTetangga('ind_news_2024_10K', 'indonesia', { limit: 10 });
    const graf = await ModelKookurensi.ambilGraf('ind_news_2024_10K', 'indonesia', { limit: 4 });

    expect(sekalimat.total).toBe(3);
    expect(sekalimat.data[0]).toEqual(expect.objectContaining({ kata: 'maju', frekuensi: 20 }));
    expect(sekalimat.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ kata: 'bahasa', frekuensi: 18 }),
    ]));

    expect(tetangga.kiri).toEqual([
      { kata: 'Bahasa', frekuensi: 1 },
      { kata: 'negara', frekuensi: 1 },
    ]);
    expect(tetangga.kanan).toEqual([
      { kata: 'hebat', frekuensi: 2 },
      { kata: 'maju', frekuensi: 2 },
    ]);
    expect(tetangga.kiri).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kata: 'Republik Indonesia' }),
      expect.objectContaining({ kata: 'Bank Indonesia' }),
    ]));
    expect(tetangga.kanan).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kata: 'Indonesia Raya' }),
    ]));

    expect(graf.nodes[0]).toEqual(expect.objectContaining({ label: 'indonesia', isCenter: true }));
    expect(graf.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'maju' }),
      expect.objectContaining({ label: 'bahasa' }),
    ]));
    expect(graf.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'indonesia', target: 'maju', weight: 20 }),
    ]));
    LeipzigDb.closeAllDatabases();
  });

  it('mengembalikan tetangga dan graf kosong saat kata tidak ditemukan', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const tetangga = await ModelKookurensi.ambilTetangga('ind_news_2024_10K', 'tidak-ada', { limit: 0 });
    const graf = await ModelKookurensi.ambilGraf('ind_news_2024_10K', 'tidak-ada', { limit: 1 });

    expect(tetangga).toEqual({
      kata: 'tidak-ada',
      limit: 1,
      kiri: [],
      kanan: [],
    });
    expect(graf).toEqual({
      kata: 'tidak-ada',
      nodes: [],
      edges: [],
    });
  });

  it('mengembalikan kata dengan konteks mirip berdasarkan himpunan kookurensi signifikan', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const hasil = await ModelKookurensi.ambilMiripKonteks('ind_news_2024_10K', 'indonesia', {
      limit: 5,
      minimumKonteksSama: 2,
      featureLimit: 20,
      candidatePoolLimit: 20,
    });

    expect(hasil.total).toBeGreaterThan(0);
    expect(hasil.data[0]).toEqual(expect.objectContaining({
      jumlahKonteksSama: expect.any(Number),
      skorDice: expect.any(Number),
    }));
    expect(hasil.data[0].jumlahKonteksSama).toBeGreaterThanOrEqual(2);
    expect(hasil.data.some((item) => item.kata === 'Malaysia')).toBe(true);
    expect(hasil.data.some((item) => item.kata === 'Filipina')).toBe(true);
    expect(hasil.data[0].konteksBersama).toEqual(expect.arrayContaining([
      expect.objectContaining({ kata: 'maju' }),
      expect.objectContaining({ kata: 'rakyat' }),
    ]));
  });
});