/**
 * @fileoverview Test model kalimat Leipzig.
 * @tested_in backend/models/leipzig/modelKalimat.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kateglo-leipzig-model-'));
}

function seedCorpusDatabase(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath);
  database.exec(`
    CREATE TABLE words (w_id INTEGER PRIMARY KEY, word TEXT NOT NULL, freq INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE sentences (s_id INTEGER PRIMARY KEY, sentence TEXT NOT NULL);
    CREATE TABLE sources (so_id INTEGER PRIMARY KEY, source TEXT, date TEXT);
    CREATE TABLE inv_w (w_id INTEGER NOT NULL, s_id INTEGER NOT NULL, pos INTEGER NOT NULL);
    CREATE TABLE inv_so (so_id INTEGER NOT NULL, s_id INTEGER NOT NULL);

    INSERT INTO words (w_id, word, freq) VALUES (1, 'Indonesia', 8), (2, 'indonesia', 5), (3, 'kata', 2);
    INSERT INTO sentences (s_id, sentence) VALUES
      (10, 'Indonesia menyiapkan korpus baru.'),
      (11, 'Negara indonesia sedang dibahas.'),
      (12, 'Kata lain tidak relevan.');
    INSERT INTO sources (so_id, source, date) VALUES
      (100, 'https://example.com/a', '2024-03-05'),
      (101, 'https://example.com/b', '2024-03-04');
    INSERT INTO inv_w (w_id, s_id, pos) VALUES
      (1, 10, 0),
      (2, 11, 1),
      (3, 12, 0);
    INSERT INTO inv_so (so_id, s_id) VALUES (100, 10), (101, 11);
  `);
  database.close();
}

describe('models/leipzig/modelKalimat', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('mengembalikan kosong jika kata tidak diisi', async () => {
    const ModelKalimat = require('../../../models/leipzig/modelKalimat');
    const result = await ModelKalimat.cariContohKata('ind_news_2024_10K', '   ');

    expect(result).toEqual({
      kata: '',
      frekuensi: 0,
      total: 0,
      limit: 10,
      offset: 0,
      bentuk: [],
      data: [],
    });
  });

  it('mengembalikan contoh kalimat case-insensitive beserta bentuk kata', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKalimat = require('../../../models/leipzig/modelKalimat');
    const LeipzigDb = require('../../../db/leipzig');
    const result = await ModelKalimat.cariContohKata('ind_news_2024_10K', 'indonesia', { limit: 5, offset: 0 });

    expect(result.frekuensi).toBe(13);
    expect(result.total).toBe(2);
    expect(result.bentuk).toEqual([
      { kata: 'indonesia', frekuensi: 5, wordId: 2 },
      { kata: 'Indonesia', frekuensi: 8, wordId: 1 },
    ]);
    expect(result.data).toEqual([
      expect.objectContaining({ sentenceId: 10, sourceUrl: 'https://example.com/a', sourceDate: '2024-03-05' }),
      expect.objectContaining({ sentenceId: 11, sourceUrl: 'https://example.com/b', sourceDate: '2024-03-04' }),
    ]);
    LeipzigDb.closeAllDatabases();
  });

  it('memakai clamp limit dan offset serta mengembalikan kosong saat kata tidak ditemukan', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    seedCorpusDatabase(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'));
    process.env.LEIPZIG_DATA_DIR = rootDir;
    process.env.LEIPZIG_SQLITE_DIR = sqliteDir;

    const ModelKalimat = require('../../../models/leipzig/modelKalimat');
    const LeipzigDb = require('../../../db/leipzig');
    const missing = await ModelKalimat.cariContohKata('ind_news_2024_10K', 'tidak-ada', { limit: 0, offset: -5 });
    const sliced = await ModelKalimat.cariContohKata('ind_news_2024_10K', 'indonesia', { limit: 99, offset: 1 });

    expect(missing).toEqual({
      kata: 'tidak-ada',
      frekuensi: 0,
      total: 0,
      limit: 1,
      offset: 0,
      bentuk: [],
      data: [],
    });
    expect(sliced.limit).toBe(50);
    expect(sliced.offset).toBe(1);
    expect(sliced.data).toHaveLength(1);
    expect(sliced.data[0].sentenceId).toBe(11);
    LeipzigDb.closeAllDatabases();
  });

  it('memakai fallback numerik dan null saat metadata contoh tidak lengkap', async () => {
    const prepare = jest.fn()
      .mockReturnValueOnce({ get: jest.fn(() => undefined) })
      .mockReturnValueOnce({
        all: jest.fn(() => [{
          sentenceId: null,
          sentence: 'Kalimat tanpa metadata sumber.',
          sourceUrl: '',
          sourceDate: '',
          firstPosition: null,
          matchCount: null,
        }]),
      });

    jest.doMock('../../../db/leipzig', () => ({
      openCorpusDatabase: jest.fn(() => ({ prepare })),
    }));
    jest.doMock('../../../models/leipzig/utilsLeipzig', () => ({
      normalizeSearchWord: jest.fn(() => 'indonesia'),
      parseLimit: jest.fn(() => 10),
      parseOffset: jest.fn(() => 0),
      listMatchedForms: jest.fn(() => [{ wordId: 1, kata: 'indonesia', freq: 0 }]),
      summarizeMatchedForms: jest.fn(() => [{ kata: 'indonesia', frekuensi: 0, wordId: 1 }]),
    }));

    const ModelKalimat = require('../../../models/leipzig/modelKalimat');
    const result = await ModelKalimat.cariContohKata('ind_news_2024_10K', 'indonesia');

    expect(result.total).toBe(0);
    expect(result.data).toEqual([
      {
        sentenceId: 0,
        sentence: 'Kalimat tanpa metadata sumber.',
        sourceUrl: null,
        sourceDate: null,
        firstPosition: 0,
        matchCount: 0,
      },
    ]);
  });
});