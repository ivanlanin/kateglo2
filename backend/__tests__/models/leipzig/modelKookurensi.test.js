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
    jest.unmock('../../../db/leipzig');
    jest.unmock('../../../models/leipzig/utilsLeipzig');
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
    expect(ModelKookurensi.__private.escapeSqlString("o'reilly")).toBe("o''reilly");
    expect(ModelKookurensi.__private.escapeRegExp('a.b[c]')).toBe('a\\.b\\[c\\]');
    expect(ModelKookurensi.__private.hitungDiceCoefficient(['a', 'b'], ['b', 'c'])).toBeCloseTo(0.5, 5);
    expect(ModelKookurensi.__private.hitungDiceCoefficient([], ['a'])).toBe(0);
    expect(ModelKookurensi.__private.hitungDiceCoefficient(['a'], ['z'])).toBe(0);
    expect(ModelKookurensi.__private.buildEmptyMiripKonteks()).toEqual({
      kata: '',
      limit: 12,
      minimumKonteksSama: 3,
      jumlahKonteksAcuan: 0,
      total: 0,
      data: [],
    });
    expect(ModelKookurensi.__private.memuatKataUtuh('Republik Indonesia', 'Indonesia')).toBe(true);
    expect(ModelKookurensi.__private.memuatKataUtuh('Indonesiaku', 'Indonesia')).toBe(false);
    expect(ModelKookurensi.__private.buildValuesCte([], ['featureId', 'featureKey'])).toBe('SELECT NULL AS featureId, NULL AS featureKey WHERE 0');
    expect(ModelKookurensi.__private.ambilBarisRelasiSignifikan({ prepare: jest.fn() }, 'co_s', [], 'kalimat')).toEqual([]);
  });

  it('helper agregasi fitur dan kandidat mirip memakai tie-break alfabetis saat nilai sama', () => {
    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const fitur = ModelKookurensi.__private.agregasiFiturKonteks([
      { wordId: 1, kata: 'beta', jenis: 'kalimat', frekuensi: 5, signifikansi: 0.8 },
      { wordId: 2, kata: 'alfa', jenis: 'kalimat', frekuensi: 5, signifikansi: 0.8 },
    ]);

    expect(fitur.map((item) => item.kata)).toEqual(['alfa', 'beta']);

    const database = {
      prepare: jest.fn(() => ({
        all: jest.fn(() => [
          { wordId: 11, kata: 'beta', frekuensi: 5, featureKey: 'kalimat:fitur' },
          { wordId: 12, kata: 'alfa', frekuensi: 5, featureKey: 'kalimat:fitur' },
        ]),
      })),
    };

    const kandidat = ModelKookurensi.__private.kumpulkanKandidatMirip(
      database,
      [{ featureKey: 'kalimat:fitur', jenis: 'kalimat', kata: 'fitur', wordIds: [1], frekuensi: 1, signifikansi: 0.5 }],
      [],
      'pusat',
      { candidatePoolLimit: 20 },
    );

    expect(kandidat.map((item) => item.kata)).toEqual(['alfa', 'beta']);
    const kandidatTersaring = ModelKookurensi.__private.kumpulkanKandidatMirip(
      {
        prepare: jest.fn(() => ({
          all: jest.fn(() => [
            { wordId: 0, kata: 'nol', frekuensi: 1, featureKey: 'kalimat:fitur' },
            { wordId: 20, kata: 'pusat', frekuensi: 1, featureKey: 'kalimat:fitur' },
            { wordId: 21, kata: 'valid', frekuensi: 2, featureKey: '' },
            { wordId: 22, kata: 'valid', frekuensi: 3, featureKey: 'kalimat:fitur' },
            { wordId: 23, kata: 'Valid', frekuensi: 4, featureKey: 'kalimat:fitur' },
          ]),
        })),
      },
      [{ featureKey: 'kalimat:fitur', jenis: 'kalimat', kata: 'fitur', wordIds: [1], frekuensi: 1, signifikansi: 0.5 }],
      [20],
      'pusat',
      { candidatePoolLimit: 20 },
    );

    expect(kandidatTersaring).toEqual([
      expect.objectContaining({
        kata: 'valid',
        frekuensi: 4,
        commonFeatureKeys: ['kalimat:fitur'],
        wordIds: [22, 23],
      }),
    ]);
    expect(ModelKookurensi.__private.compareSharedContext(
      { kata: 'alfa', frekuensi: 3, signifikansi: 0.8 },
      { kata: 'beta', frekuensi: 5, signifikansi: 0.8 },
    )).toBeGreaterThan(0);
    expect(ModelKookurensi.__private.compareSharedContext(
      { kata: 'alfa', frekuensi: 5, signifikansi: 0.8 },
      { kata: 'beta', frekuensi: 5, signifikansi: 0.8 },
    )).toBeLessThan(0);
    expect(ModelKookurensi.__private.compareMiripKonteksRank(
      { kata: 'alfa', skorDice: 0.7, jumlahKonteksSama: 2, frekuensi: 4 },
      { kata: 'beta', skorDice: 0.7, jumlahKonteksSama: 3, frekuensi: 4 },
    )).toBeGreaterThan(0);
    expect(ModelKookurensi.__private.compareMiripKonteksRank(
      { kata: 'alfa', skorDice: 0.7, jumlahKonteksSama: 3, frekuensi: 4 },
      { kata: 'beta', skorDice: 0.7, jumlahKonteksSama: 3, frekuensi: 5 },
    )).toBeGreaterThan(0);
    expect(ModelKookurensi.__private.compareMiripKonteksRank(
      { kata: 'alfa', skorDice: 0.7, jumlahKonteksSama: 3, frekuensi: 5 },
      { kata: 'beta', skorDice: 0.7, jumlahKonteksSama: 3, frekuensi: 5 },
    )).toBeLessThan(0);
  });

  it('helper agregasi menormalkan entri campuran dan values cte berisi union', () => {
    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');

    const sql = ModelKookurensi.__private.buildValuesCte([
      { featureId: 1, featureKey: "kalimat:o'reilly" },
      { featureId: null, featureKey: 'kalimat:x.y' },
    ], ['featureId', 'featureKey']);

    expect(sql).toContain("SELECT 1 AS featureId, 'kalimat:o''reilly' AS featureKey");
    expect(sql).toContain("UNION ALL SELECT NULL AS featureId, 'kalimat:x.y' AS featureKey");

    const fitur = ModelKookurensi.__private.agregasiFiturKonteks([
      { wordId: 1, kata: '', jenis: 'kalimat', frekuensi: 3, signifikansi: 0.2 },
      { wordId: 2, kata: 'abaikan', jenis: '', frekuensi: 3, signifikansi: 0.2 },
      { wordId: 3, kata: 'Larangan', jenis: 'kalimat', frekuensi: 4, signifikansi: 0.4 },
      { wordId: 4, kata: 'uji', jenis: 'kalimat', frekuensi: 2, signifikansi: 0.3 },
      { wordId: 5, kata: 'Uji', jenis: 'kalimat', frekuensi: 5, signifikansi: 0.8 },
    ], ['larangan']);

    expect(fitur).toEqual([
      {
        featureKey: 'kalimat:uji',
        jenis: 'kalimat',
        kata: 'uji',
        frekuensi: 7,
        signifikansi: 0.8,
        wordIds: [4, 5],
      },
    ]);
    expect(fitur[0].preferHurufKecil).toBeUndefined();
    expect(fitur[0].frekuensiLabel).toBeUndefined();
  });

  it('helper private mendukung default argument dan short-circuit dasar', () => {
    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const database = { prepare: jest.fn(() => ({ all: jest.fn(() => []) })) };

    expect(ModelKookurensi.__private.buildEmptyResult()).toEqual({
      kata: '',
      total: 0,
      limit: 25,
      offset: 0,
      data: [],
    });
    expect(ModelKookurensi.__private.buildEmptyTetangga()).toEqual({
      kata: '',
      limit: 25,
      kiri: [],
      kanan: [],
    });
    expect(ModelKookurensi.__private.buildEmptyMiripKonteks()).toEqual({
      kata: '',
      limit: 12,
      minimumKonteksSama: 3,
      jumlahKonteksAcuan: 0,
      total: 0,
      data: [],
    });
    expect(ModelKookurensi.__private.normalizeGraphEdgeKey()).toBe('::');
    expect(ModelKookurensi.__private.escapeSqlString()).toBe('');
    expect(ModelKookurensi.__private.escapeRegExp()).toBe('');
    expect(ModelKookurensi.__private.memuatKataUtuh()).toBe(false);
    expect(ModelKookurensi.__private.buildValuesCte()).toBe('SELECT  WHERE 0');
    expect(ModelKookurensi.__private.ambilBarisRelasiSignifikan(database, 'co_s')).toEqual([]);
    expect(ModelKookurensi.__private.agregasiFiturKonteks()).toEqual([]);
    expect(ModelKookurensi.__private.ambilFiturKonteks(database)).toEqual([]);
    expect(ModelKookurensi.__private.ambilFiturKonteks(database, [], [], { featureLimit: Number.NaN })).toEqual([]);
    expect(ModelKookurensi.__private.kumpulkanKandidatMirip(database)).toEqual([]);
    expect(ModelKookurensi.__private.hitungDiceCoefficient()).toBe(0);
    expect(ModelKookurensi.__private.compareSharedContext(
      { kata: 'rendah', frekuensi: 1, signifikansi: 0.1 },
      { kata: 'tinggi', frekuensi: 1, signifikansi: 0.9 },
    )).toBeGreaterThan(0);
    expect(ModelKookurensi.__private.compareMiripKonteksRank(
      { kata: 'rendah', skorDice: 0.1, jumlahKonteksSama: 2, frekuensi: 1 },
      { kata: 'tinggi', skorDice: 0.9, jumlahKonteksSama: 2, frekuensi: 1 },
    )).toBeGreaterThan(0);
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
    expect(await ModelKookurensi.ambilSekalimat('ind_news_2024_10K', 'tidak-ada', { limit: 0, offset: -2 })).toEqual({
      kata: 'tidak-ada',
      total: 0,
      limit: 1,
      offset: 0,
      data: [],
    });
  });

  it('mengembalikan tetangga kosong saat kata kosong', async () => {
    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');

    await expect(ModelKookurensi.ambilTetangga('ind_news_2024_10K', '   ')).resolves.toEqual({
      kata: '',
      limit: 25,
      kiri: [],
      kanan: [],
    });
  });

  it('menangani hasil agregasi tetangga yang kosong atau undefined', async () => {
    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({
        prepare: jest.fn(() => ({
          all: jest.fn(() => [
            { wordId: 2, kata: 'tetap', frekuensi: 1 },
            { wordId: 3, kata: 'Indonesia Raya', frekuensi: 3 },
          ]),
        })),
      })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'indonesia'),
      parseLimit: jest.fn(() => 2),
      parseOffset: jest.fn(() => 0),
      buildPlaceholders: jest.fn(() => '?'),
      listMatchedForms: jest.fn(() => [{ wordId: 1, word: 'indonesia' }]),
      aggregateWordRows: jest.fn()
        .mockImplementationOnce(() => undefined)
        .mockImplementationOnce(() => [
          { kata: 'tetap', frekuensi: 1 },
          { kata: 'Indonesia Raya', frekuensi: 3 },
        ]),
      pilihLabelAgregat: jest.fn((previous, kata, frekuensi) => previous || { kata, preferHurufKecil: false, frekuensiLabel: Number(frekuensi) || 0 }),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');

    await expect(ModelKookurensi.ambilTetangga('ind_news_2024_10K', 'indonesia', { limit: 2 })).resolves.toEqual({
      kata: 'indonesia',
      limit: 2,
      kiri: [],
      kanan: [{ kata: 'tetap', frekuensi: 1 }],
    });
  });

  it('menutup cabang helper fitur dan kandidat yang memakai fallback nilai', () => {
    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const databaseFitur = {
      prepare: jest.fn(() => ({
        all: jest.fn(() => [
          { wordId: 14, kata: 'asing', frekuensi: 1, signifikansi: null },
        ]),
      })),
    };

    expect(ModelKookurensi.__private.agregasiFiturKonteks([
      { wordId: 0, kata: '  ', jenis: 'kalimat', frekuensi: 'abc', signifikansi: '' },
      { wordId: 0, kata: 'Saring', jenis: 'kalimat', frekuensi: 1, signifikansi: 0.2 },
      { wordId: 0, kata: 'fitur', jenis: 'kalimat', frekuensi: 0, signifikansi: 0 },
      { wordId: 9, kata: 'fitur', jenis: 'kalimat', frekuensi: 'bukan-angka', signifikansi: undefined },
      { wordId: 'abc', kata: 'fitur', jenis: 'kalimat', frekuensi: 1, signifikansi: 0.1 },
    ], [null, ' saring '])).toEqual([
      {
        featureKey: 'kalimat:fitur',
        jenis: 'kalimat',
        kata: 'fitur',
        frekuensi: 1,
        signifikansi: 0.1,
        wordIds: [9],
      },
    ]);

    expect(ModelKookurensi.__private.ambilFiturKonteks(databaseFitur, [1], [], { featureLimit: 0 })).toEqual([
      {
        featureKey: 'kalimat:asing',
        jenis: 'kalimat',
        kata: 'asing',
        frekuensi: 1,
        signifikansi: 0,
        wordIds: [14],
      },
    ]);

    const databaseKandidat = {
      prepare: jest.fn(() => ({
        all: jest.fn(() => [
          { wordId: 0, kata: 'kosong-id', frekuensi: 1, featureKey: 'kalimat:fitur' },
          { wordId: 12, kata: '', frekuensi: 1, featureKey: 'kalimat:fitur' },
          { wordId: 13, kata: 'pusat', frekuensi: 1, featureKey: 'kalimat:fitur' },
          { wordId: 16, kata: 'pusat', frekuensi: 1, featureKey: 'kalimat:fitur' },
          { wordId: 14, kata: 'asing', frekuensi: 1, featureKey: 'kalimat:tak-cocok' },
          { wordId: 15, kata: 'valid', frekuensi: 'abc', featureKey: 'kalimat:fitur' },
        ]),
      })),
    };

    expect(ModelKookurensi.__private.kumpulkanKandidatMirip(
      databaseKandidat,
      [{ featureKey: 'kalimat:fitur', jenis: 'kalimat', kata: 'fitur', wordIds: [1], frekuensi: 1, signifikansi: 0.5 }],
      ['13', null],
      'pusat',
      { candidatePoolLimit: 0 },
    )).toEqual([
      {
        kata: 'valid',
        frekuensi: 0,
        wordIds: [15],
        commonFeatureKeys: ['kalimat:fitur'],
      },
    ]);
    expect(databaseFitur.prepare).toHaveBeenCalled();
    expect(databaseKandidat.prepare).toHaveBeenCalled();
  });

  it('mengembalikan graf kosong saat kata kosong dan node pusat saja saat sekalimat kosong', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const LeipzigDb = require('../../../db/leipzig');
    const originalAmbilSekalimat = ModelKookurensi.ambilSekalimat;

    await expect(ModelKookurensi.ambilGraf('ind_news_2024_10K', '   ')).resolves.toEqual({
      kata: '',
      nodes: [],
      edges: [],
    });

    ModelKookurensi.ambilSekalimat = jest.fn().mockResolvedValue({ data: [] });
    await expect(ModelKookurensi.ambilGraf('ind_news_2024_10K', 'indonesia', { limit: 4 })).resolves.toEqual({
      kata: 'indonesia',
      nodes: [{ id: 'indonesia', label: 'indonesia', weight: 1, isCenter: true }],
      edges: [],
    });

    ModelKookurensi.ambilSekalimat = originalAmbilSekalimat;
    LeipzigDb.closeAllDatabases();
  });

  it('mengagregasi edge graf duplikat dan mengabaikan edge tidak valid', async () => {
    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({
        prepare: jest.fn(() => ({
          all: jest.fn(() => [
            { sourceWord: 'MajU', targetWord: 'RaKyaT', frekuensi: 1 },
            { sourceWord: 'rakyat', targetWord: 'MAJU', frekuensi: 2 },
            { sourceWord: 'rakyat', targetWord: 'maju', frekuensi: null },
            { sourceWord: null, targetWord: 'abaikan', frekuensi: 9 },
            { sourceWord: 'maju', targetWord: '', frekuensi: 9 },
          ]),
        })),
      })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'indonesia'),
      parseLimit: jest.fn(() => 4),
      parseOffset: jest.fn(() => 0),
      buildPlaceholders: jest.fn(() => '?, ?'),
      listMatchedForms: jest.fn(() => [{ wordId: 1, word: 'indonesia' }]),
      aggregateWordRows: jest.fn((rows) => rows),
      pilihLabelAgregat: jest.fn((previous, kata, frekuensi) => previous || { kata, preferHurufKecil: false, frekuensiLabel: Number(frekuensi) || 0 }),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const originalAmbilSekalimat = ModelKookurensi.ambilSekalimat;

    ModelKookurensi.ambilSekalimat = jest.fn().mockResolvedValue({
      data: [
        { kata: 'MajU', frekuensi: 5 },
        { kata: 'RaKyaT', frekuensi: 3 },
      ],
    });

    await expect(ModelKookurensi.ambilGraf('ind_news_2024_10K', 'indonesia', { limit: 4 })).resolves.toEqual({
      kata: 'indonesia',
      nodes: [
        { id: 'indonesia', label: 'indonesia', weight: 5, isCenter: true },
        { id: 'maju', label: 'MajU', weight: 5, isCenter: false },
        { id: 'rakyat', label: 'RaKyaT', weight: 3, isCenter: false },
      ],
      edges: [
        { source: 'indonesia', target: 'maju', weight: 5 },
        { source: 'indonesia', target: 'rakyat', weight: 3 },
        { source: 'maju', target: 'rakyat', weight: 3 },
      ],
    });

    ModelKookurensi.ambilSekalimat = originalAmbilSekalimat;
  });

  it('mengembalikan mirip konteks kosong saat fitur target tidak ada', async () => {
    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({
        prepare: jest.fn(() => ({ all: jest.fn(() => []), get: jest.fn(() => undefined) })),
      })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'uji'),
      parseLimit: jest.fn(() => 12),
      parseOffset: jest.fn(() => 0),
      buildPlaceholders: jest.fn(() => '?'),
      listMatchedForms: jest.fn(() => [{ wordId: 1, word: 'uji' }]),
      aggregateWordRows: jest.fn((rows) => rows),
      pilihLabelAgregat: jest.fn((previous, kata, frekuensi) => previous || { kata, preferHurufKecil: false, frekuensiLabel: Number(frekuensi) || 0 }),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');

    await expect(ModelKookurensi.ambilMiripKonteks('ind_news_2024_10K', 'uji')).resolves.toEqual({
      kata: 'uji',
      limit: 12,
      minimumKonteksSama: 3,
      jumlahKonteksAcuan: 0,
      total: 0,
      data: [],
    });
  });

  it('mengembalikan mirip konteks kosong untuk kata kosong atau tidak ditemukan', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');

    await expect(ModelKookurensi.ambilMiripKonteks('ind_news_2024_10K', '   ', { candidatePoolLimit: 1 })).resolves.toEqual({
      kata: '',
      limit: 12,
      minimumKonteksSama: 3,
      jumlahKonteksAcuan: 0,
      total: 0,
      data: [],
    });
    await expect(ModelKookurensi.ambilMiripKonteks('ind_news_2024_10K', 'tidak-ada', { limit: 1, minimumKonteksSama: 0 })).resolves.toEqual({
      kata: 'tidak-ada',
      limit: 1,
      minimumKonteksSama: 3,
      jumlahKonteksAcuan: 0,
      total: 0,
      data: [],
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

  it('menyaring kandidat mirip konteks yang tidak lolos skor atau minimum dan membatasi konteks bersama', async () => {
    const targetFeatureRows = [
      { wordId: 101, kata: 'fita', frekuensi: 10, signifikansi: 0.9 },
      { wordId: 102, kata: 'fitb', frekuensi: 9, signifikansi: 0.85 },
      { wordId: 103, kata: 'fitc', frekuensi: 8, signifikansi: 0.8 },
      { wordId: 104, kata: 'fitd', frekuensi: 7, signifikansi: 0.75 },
      { wordId: 105, kata: 'fite', frekuensi: 6, signifikansi: 0.7 },
      { wordId: 106, kata: 'fitf', frekuensi: 5, signifikansi: 0.65 },
    ];

    const database = {
      prepare: jest.fn((sql) => ({
        all: jest.fn((...args) => {
          if (sql.includes('WITH target_features')) {
            return [
              { wordId: 21, kata: 'baik', frekuensi: 9, featureKey: 'kalimat:fita' },
              { wordId: 21, kata: 'baik', frekuensi: 9, featureKey: 'kalimat:fitb' },
              { wordId: 21, kata: 'baik', frekuensi: 9, featureKey: 'kalimat:fitc' },
              { wordId: 21, kata: 'baik', frekuensi: 9, featureKey: 'kalimat:fitd' },
              { wordId: 21, kata: 'baik', frekuensi: 9, featureKey: 'kalimat:fite' },
              { wordId: 21, kata: 'baik', frekuensi: 9, featureKey: 'kalimat:fitf' },
              { wordId: 22, kata: 'nol', frekuensi: 7, featureKey: 'kalimat:fita' },
              { wordId: 22, kata: 'nol', frekuensi: 7, featureKey: 'kalimat:fitb' },
              { wordId: 23, kata: 'sedikit', frekuensi: 6, featureKey: 'kalimat:fita' },
            ];
          }

          if (sql.includes('FROM co_s relation') && args[0] === 1) return targetFeatureRows;
          if (sql.includes('FROM co_n relation') && args[0] === 1) return [];

          if (sql.includes('FROM co_s relation') && args[0] === 21) return targetFeatureRows;
          if (sql.includes('FROM co_n relation') && args[0] === 21) return [];

          if (sql.includes('FROM co_s relation') && args[0] === 22) return [];
          if (sql.includes('FROM co_n relation') && args[0] === 22) return [];

          if (sql.includes('FROM co_s relation') && args[0] === 23) {
            return [{ wordId: 101, kata: 'fita', frekuensi: 10, signifikansi: 0.9 }];
          }
          if (sql.includes('FROM co_n relation') && args[0] === 23) return [];

          return [];
        }),
      })),
    };

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => database),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'target'),
      parseLimit: jest.fn(() => 3),
      parseOffset: jest.fn(() => 0),
      buildPlaceholders: jest.fn(() => '?'),
      listMatchedForms: jest.fn(() => [{ wordId: 1, word: 'target' }]),
      aggregateWordRows: jest.fn((rows) => rows),
      pilihLabelAgregat: jest.fn((previous, kata, frekuensi) => previous || { kata, preferHurufKecil: false, frekuensiLabel: Number(frekuensi) || 0 }),
      bersihkanTokenAgregat: jest.fn((value) => value),
    }));

    const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
    const hasil = await ModelKookurensi.ambilMiripKonteks('ind_news_2024_10K', 'target', {
      limit: 3,
      minimumKonteksSama: 2,
      featureLimit: 10,
      candidatePoolLimit: 20,
    });

    expect(hasil).toEqual({
      kata: 'target',
      limit: 3,
      minimumKonteksSama: 2,
      jumlahKonteksAcuan: 6,
      total: 1,
      data: [
        {
          kata: 'baik',
          frekuensi: 9,
          skorDice: 1,
          jumlahKonteksSama: 6,
          konteksBersama: [
            { kata: 'fita', jenis: 'kalimat', frekuensi: 10, signifikansi: 0.9 },
            { kata: 'fitb', jenis: 'kalimat', frekuensi: 9, signifikansi: 0.85 },
            { kata: 'fitc', jenis: 'kalimat', frekuensi: 8, signifikansi: 0.8 },
            { kata: 'fitd', jenis: 'kalimat', frekuensi: 7, signifikansi: 0.75 },
            { kata: 'fite', jenis: 'kalimat', frekuensi: 6, signifikansi: 0.7 },
          ],
        },
      ],
    });
  });
});