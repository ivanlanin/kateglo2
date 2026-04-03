/**
 * @fileoverview Import korpus Leipzig TSV ke SQLite untuk query read-only.
 *
 * Penggunaan:
 *   node scripts/leipzig/imporKorpus.js ind_news_2024_10K
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { DatabaseSync } = require('node:sqlite');
const LeipzigDb = require('../../db/leipzig');

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} tidak ditemukan: ${filePath}`);
  }
}

async function readTsvFile(filePath, onRow) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let totalRows = 0;

  for await (const line of reader) {
    if (!line.trim()) continue;
    totalRows += 1;
    await onRow(line.split('\t'), totalRows);
  }

  return totalRows;
}

function openWritableDatabase(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

  const database = new DatabaseSync(outputPath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE words (
      w_id INTEGER PRIMARY KEY,
      word TEXT NOT NULL,
      freq INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE sentences (
      s_id INTEGER PRIMARY KEY,
      sentence TEXT NOT NULL
    );

    CREATE TABLE sources (
      so_id INTEGER PRIMARY KEY,
      source TEXT,
      date TEXT
    );

    CREATE TABLE inv_w (
      w_id INTEGER NOT NULL,
      s_id INTEGER NOT NULL,
      pos INTEGER NOT NULL
    );

    CREATE TABLE inv_so (
      so_id INTEGER NOT NULL,
      s_id INTEGER NOT NULL
    );

    CREATE TABLE co_n (
      w1_id INTEGER NOT NULL,
      w2_id INTEGER NOT NULL,
      freq INTEGER NOT NULL,
      sig REAL NOT NULL
    );

    CREATE TABLE co_s (
      w1_id INTEGER NOT NULL,
      w2_id INTEGER NOT NULL,
      freq INTEGER NOT NULL,
      sig REAL NOT NULL
    );

    CREATE TABLE meta (
      run INTEGER,
      attribute TEXT,
      value TEXT
    );

    CREATE TABLE ranked_words (
      normalized_word TEXT PRIMARY KEY,
      display_word TEXT NOT NULL,
      freq_total INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      frequency_class INTEGER
    );
  `);

  return database;
}

function hitungKelasFrekuensi(freqTertinggi = 0, freqKata = 0) {
  if (!freqTertinggi || !freqKata) return null;
  return Math.floor(Math.log2(freqTertinggi / freqKata));
}

function bangunRankingKata(database) {
  console.log('  Menyusun ranking kata...');
  const rows = database.prepare(`
    WITH ranked_variants AS (
      SELECT
        LOWER(word) AS normalized_word,
        word,
        freq,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(word)
          ORDER BY freq DESC, word ASC
        ) AS variant_rank
      FROM words
    ),
    aggregated AS (
      SELECT LOWER(word) AS normalized_word, SUM(freq) AS total
      FROM words
      GROUP BY LOWER(word)
    )
    SELECT
      aggregated.normalized_word AS normalizedWord,
      aggregated.total AS frekuensi,
      ranked_variants.word AS kata
    FROM aggregated
    JOIN ranked_variants
      ON ranked_variants.normalized_word = aggregated.normalized_word
      AND ranked_variants.variant_rank = 1
    WHERE aggregated.normalized_word GLOB '*[0-9A-Za-z]*'
    ORDER BY aggregated.total DESC, aggregated.normalized_word ASC
  `).all();
  const insert = database.prepare(`
    INSERT INTO ranked_words (normalized_word, display_word, freq_total, rank, frequency_class)
    VALUES (?, ?, ?, ?, ?)
  `);
  const frekuensiTertinggi = Number(rows[0]?.frekuensi) || 0;

  database.exec('BEGIN');
  try {
    rows.forEach((row, index) => {
      insert.run(
        row.normalizedWord,
        row.kata || row.normalizedWord,
        Number(row.frekuensi) || 0,
        index + 1,
        hitungKelasFrekuensi(frekuensiTertinggi, Number(row.frekuensi) || 0),
      );
    });
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  console.log(`  ranking: selesai ${rows.length.toLocaleString('id-ID')} baris`);
}

async function importTable({ database, filePath, label, statementSql, mapColumns }) {
  const insert = database.prepare(statementSql);
  let processed = 0;

  database.exec('BEGIN');
  try {
    await readTsvFile(filePath, async (columns) => {
      insert.run(...mapColumns(columns));
      processed += 1;

      if (processed % 50000 === 0) {
        database.exec('COMMIT');
        database.exec('BEGIN');
        console.log(`  ${label}: ${processed.toLocaleString('id-ID')} baris`);
      }
    });
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  console.log(`  ${label}: selesai ${processed.toLocaleString('id-ID')} baris`);
}

async function importCorpus(corpusId) {
  const normalized = LeipzigDb.normalizeCorpusId(corpusId);
  if (!normalized) throw new Error('ID korpus Leipzig tidak valid');

  const rawDir = LeipzigDb.getCorpusRawDir(normalized);
  if (!fs.existsSync(rawDir)) {
    throw new Error(`Folder korpus tidak ditemukan: ${rawDir}`);
  }

  const outputPath = LeipzigDb.getCorpusDatabasePath(normalized);
  const database = openWritableDatabase(outputPath);

  const files = {
    words: path.join(rawDir, `${normalized}-words.txt`),
    sentences: path.join(rawDir, `${normalized}-sentences.txt`),
    sources: path.join(rawDir, `${normalized}-sources.txt`),
    coN: path.join(rawDir, `${normalized}-co_n.txt`),
    coS: path.join(rawDir, `${normalized}-co_s.txt`),
    invW: path.join(rawDir, `${normalized}-inv_w.txt`),
    invSo: path.join(rawDir, `${normalized}-inv_so.txt`),
    meta: path.join(rawDir, `${normalized}-meta.txt`),
  };

  ensureFileExists(files.words, 'File words');
  ensureFileExists(files.sentences, 'File sentences');
  ensureFileExists(files.sources, 'File sources');
  ensureFileExists(files.invW, 'File inv_w');
  ensureFileExists(files.invSo, 'File inv_so');

  console.log(`\n=== Impor korpus Leipzig: ${normalized} ===`);
  console.log(`Output: ${outputPath}`);

  try {
    await importTable({
      database,
      filePath: files.words,
      label: 'words',
      statementSql: 'INSERT INTO words (w_id, word, freq) VALUES (?, ?, ?)',
      mapColumns: ([wId, word, freq]) => [Number.parseInt(wId, 10) || 0, word || '', Number.parseInt(freq, 10) || 0],
    });

    await importTable({
      database,
      filePath: files.sentences,
      label: 'sentences',
      statementSql: 'INSERT INTO sentences (s_id, sentence) VALUES (?, ?)',
      mapColumns: ([sentenceId, sentence]) => [Number.parseInt(sentenceId, 10) || 0, sentence || ''],
    });

    await importTable({
      database,
      filePath: files.sources,
      label: 'sources',
      statementSql: 'INSERT INTO sources (so_id, source, date) VALUES (?, ?, ?)',
      mapColumns: ([sourceId, source, date]) => [Number.parseInt(sourceId, 10) || 0, source || null, date || null],
    });

    if (fs.existsSync(files.coN)) {
      await importTable({
        database,
        filePath: files.coN,
        label: 'co_n',
        statementSql: 'INSERT INTO co_n (w1_id, w2_id, freq, sig) VALUES (?, ?, ?, ?)',
        mapColumns: ([wordIdLeft, wordIdRight, freq, sig]) => [
          Number.parseInt(wordIdLeft, 10) || 0,
          Number.parseInt(wordIdRight, 10) || 0,
          Number.parseInt(freq, 10) || 0,
          Number.parseFloat(sig) || 0,
        ],
      });
    }

    if (fs.existsSync(files.coS)) {
      await importTable({
        database,
        filePath: files.coS,
        label: 'co_s',
        statementSql: 'INSERT INTO co_s (w1_id, w2_id, freq, sig) VALUES (?, ?, ?, ?)',
        mapColumns: ([wordIdLeft, wordIdRight, freq, sig]) => [
          Number.parseInt(wordIdLeft, 10) || 0,
          Number.parseInt(wordIdRight, 10) || 0,
          Number.parseInt(freq, 10) || 0,
          Number.parseFloat(sig) || 0,
        ],
      });
    }

    await importTable({
      database,
      filePath: files.invW,
      label: 'inv_w',
      statementSql: 'INSERT INTO inv_w (w_id, s_id, pos) VALUES (?, ?, ?)',
      mapColumns: ([wId, sentenceId, pos]) => [
        Number.parseInt(wId, 10) || 0,
        Number.parseInt(sentenceId, 10) || 0,
        Number.parseInt(pos, 10) || 0,
      ],
    });

    await importTable({
      database,
      filePath: files.invSo,
      label: 'inv_so',
      statementSql: 'INSERT INTO inv_so (so_id, s_id) VALUES (?, ?)',
      mapColumns: ([sourceId, sentenceId]) => [
        Number.parseInt(sourceId, 10) || 0,
        Number.parseInt(sentenceId, 10) || 0,
      ],
    });

    if (fs.existsSync(files.meta)) {
      await importTable({
        database,
        filePath: files.meta,
        label: 'meta',
        statementSql: 'INSERT INTO meta (run, attribute, value) VALUES (?, ?, ?)',
        mapColumns: ([run, attribute, value]) => [Number.parseInt(run, 10) || 0, attribute || '', value || ''],
      });
    }

    bangunRankingKata(database);

    console.log('  Membuat indeks SQLite...');
    database.exec(`
      CREATE INDEX idx_words_word_nocase ON words(word COLLATE NOCASE);
      CREATE INDEX idx_ranked_words_rank ON ranked_words(rank);
      CREATE INDEX idx_ranked_words_freq ON ranked_words(freq_total DESC);
      CREATE INDEX idx_co_n_w1 ON co_n(w1_id, freq DESC);
      CREATE INDEX idx_co_n_w2 ON co_n(w2_id, freq DESC);
      CREATE INDEX idx_co_s_w1 ON co_s(w1_id, freq DESC);
      CREATE INDEX idx_co_s_w2 ON co_s(w2_id, freq DESC);
      CREATE INDEX idx_inv_w_word_sentence ON inv_w(w_id, s_id);
      CREATE INDEX idx_inv_w_sentence_pos ON inv_w(s_id, pos);
      CREATE INDEX idx_inv_w_sentence ON inv_w(s_id);
      CREATE INDEX idx_inv_so_sentence ON inv_so(s_id);
    `);
  } finally {
    database.close();
  }

  console.log('Impor selesai.');
}

async function main() {
  const corpusId = process.argv[2];
  if (!corpusId) {
    throw new Error('Gunakan: node scripts/leipzig/imporKorpus.js <korpusId>');
  }

  await importCorpus(corpusId);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = {
  __private: {
    hitungKelasFrekuensi,
    bangunRankingKata,
  },
};