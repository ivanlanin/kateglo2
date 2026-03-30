/**
 * @fileoverview Deteksi heuristik sisipan (el, em, er, in) dan dwipurwa (R.purwa)
 * dari entri berjenis 'dasar'.
 *
 * Berbeda dengan seed-entri-tagar.js yang bekerja pada entri 'turunan' (induk
 * diketahui dari kolom entri.induk), skrip ini melakukan deteksi terbalik:
 * dari entri berjenis 'dasar', coba tebak apakah bentuknya merupakan hasil
 * sisipan atau dwipurwa dari kata lain yang juga terdaftar sebagai entri.
 *
 * Algoritme per entri:
 *   1. Coba tanpa sufiks dan dengan sufiks (strip satu sufiks terluar).
 *   2. Untuk setiap stem hasil strip:
 *      a. Dwipurwa  : stem = C + 'e' + C_sama + rest  → basis = C + rest
 *      b. Sisipan el: stem = C + 'el' + rest          → basis = C + rest
 *      c. Sisipan em: stem = C + 'em' + rest          → basis = C + rest
 *      d. Sisipan er: stem = C + 'er' + rest          → basis = C + rest
 *      e. Sisipan in: stem = C + 'in' + rest          → basis = C + rest
 *   3. Jika basis kandidat ditemukan di tabel entri (dasar atau jenis lain),
 *      catat sebagai kandidat.
 *
 * Skrip HANYA membaca database; tidak mengubah data apapun.
 *
 * Penggunaan:
 *   node scripts/analisis/deteksi-sisipan-dwipurwa.js              # ringkasan ke konsol
 *   node scripts/analisis/deteksi-sisipan-dwipurwa.js --verbose    # tampilkan semua kandidat
 *   node scripts/analisis/deteksi-sisipan-dwipurwa.js --csv        # simpan CSV ke docs/
 *   node scripts/analisis/deteksi-sisipan-dwipurwa.js --dasar-only # hanya basis berjenis 'dasar'
 *
 * @example
 *   # Preview cepat (ringkasan per pola)
 *   cd backend && node scripts/analisis/deteksi-sisipan-dwipurwa.js
 *
 *   # Detail + simpan CSV
 *   cd backend && node scripts/analisis/deteksi-sisipan-dwipurwa.js --verbose --csv
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const db = require('../../db');
const fs = require('fs');
const path = require('path');

const VERBOSE = process.argv.includes('--verbose');
const CSV_OUT = process.argv.includes('--csv');
const DASAR_ONLY = process.argv.includes('--dasar-only');

// ============================================================
// Konstanta morfologi
// ============================================================

const INFIXES = ['el', 'em', 'er', 'in'];

/**
 * Sufiks yang mungkin menempel di belakang bentuk sisipan/dwipurwa.
 * Diurutkan terpanjang dulu agar strip tidak prematur.
 */
const SUFFIXES_LIST = [
  { str: 'kan', tag: '-kan' },
  { str: 'nya', tag: '-nya' },
  { str: 'kah', tag: '-kah' },
  { str: 'lah', tag: '-lah' },
  { str: 'pun', tag: '-pun' },
  { str: 'tah', tag: '-tah' },
  { str: 'an',  tag: '-an'  },
  { str: 'mu',  tag: '-mu'  },
  { str: 'ku',  tag: '-ku'  },
  { str: 'i',   tag: '-i'   },
];

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

// ============================================================
// Utilitas
// ============================================================

/**
 * Normalisasi kunci pencarian:
 *   - lowercase
 *   - trim
 *   - hapus nomor homonim: "abai (1)" → "abai"
 * @param {string} teks
 * @returns {string}
 */
function normalizeKey(teks) {
  return String(teks || '')
    .toLowerCase()
    .trim()
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim();
}

/**
 * Strip satu sufiks paling kanan (terpanjang yang cocok).
 * Mensyaratkan stem minimal 4 karakter agar deteksi sisipan/dwipurwa valid.
 *
 * @param {string} word - teks sudah dinormalisasi
 * @returns {{ stem: string, sufTag: string|null }}
 */
function stripSuffix(word) {
  const MIN_STEM = 4; // butuh minimal C + infix(2) + 1 char
  for (const { str, tag } of SUFFIXES_LIST) {
    if (word.endsWith(str) && word.length - str.length >= MIN_STEM) {
      return { stem: word.slice(0, -str.length), sufTag: tag };
    }
  }
  return { stem: word, sufTag: null };
}

// ============================================================
// Deteksi pola (arah terbalik: dari entri ke basis kandidat)
// ============================================================

/**
 * Coba deteksi dwipurwa dari stem.
 *
 * Pola: stem = C + 'e' + C_sama + rest
 *   → basis kandidat = C_sama + rest = stem.slice(2)
 *
 * Contoh: "bebatu" → 'b'+'e'+'b'+'atu' → basis = "batu"
 *          "lelaki" → 'l'+'e'+'l'+'aki' → basis = "laki"
 *          "rerumput" → 'r'+'e'+'r'+'umput' → basis = "rumput"
 *
 * @param {string} stem - minimal 4 karakter, sudah lowercase
 * @returns {string|null} basis kandidat atau null jika tidak cocok
 */
function tryDwipurwa(stem) {
  if (stem.length < 4) return null;
  const c0 = stem[0];
  if (VOWELS.has(c0)) return null;   // harus diawali konsonan
  if (stem[1] !== 'e') return null;  // karakter kedua harus 'e'
  if (stem[2] !== c0) return null;   // konsonan ketiga harus sama dengan pertama
  const basis = stem.slice(2);
  if (basis.length < 2) return null;
  return basis;
}

/**
 * Coba deteksi semua kemungkinan sisipan dari stem.
 *
 * Pola: stem = C + infix + rest
 *   → basis kandidat = C + rest = stem[0] + stem.slice(1 + infix.length)
 *
 * Contoh (infix=el): "temali"   → 't'+'el'+'ali' → basis = "tali"
 * Contoh (infix=em): "gemilang" → 'g'+'em'+'ilang' → basis = "gilang"
 * Contoh (infix=er): "seruling" → 's'+'er'+'uling' → basis = "suling"
 * Contoh (infix=in): "kinerja"  → 'k'+'in'+'erja' → basis = "kerja"
 *
 * @param {string} stem - sudah lowercase
 * @returns {{ infix: string, basis: string }[]}
 */
function tryInfiks(stem) {
  const results = [];
  if (stem.length < 4) return results;
  const c0 = stem[0];
  if (VOWELS.has(c0)) return results; // harus diawali konsonan

  for (const infix of INFIXES) {
    // Infix tepat di posisi 1 (setelah konsonan pertama)
    if (stem.slice(1, 1 + infix.length) === infix) {
      const basis = c0 + stem.slice(1 + infix.length);
      if (basis.length >= 2) {
        results.push({ infix, basis });
      }
    }
  }
  return results;
}

// ============================================================
// Main
// ============================================================

async function main() {
  // ── 1. Muat semua entri dasar aktif ──────────────────────────────────────
  const resDasar = await db.query(`
    SELECT id, entri
    FROM entri
    WHERE jenis = 'dasar' AND aktif = 1
    ORDER BY entri
  `);
  const dasarEntries = resDasar.rows;

  // ── 2. Bangun lookup dari seluruh entri aktif ─────────────────────────────
  // key: normalizeKey(entri), value: { id, entri, jenis }
  // Jika ada homonim, simpan yang pertama ditemukan (cukup untuk deteksi keberadaan).
  const resAll = await db.query(`
    SELECT id, entri, jenis
    FROM entri
    WHERE aktif = 1
  `);

  const lookupAll = new Map();
  for (const row of resAll.rows) {
    const key = normalizeKey(row.entri);
    if (!lookupAll.has(key)) {
      lookupAll.set(key, { id: row.id, entri: row.entri, jenis: row.jenis });
    }
  }

  // ── 3. Iterasi setiap entri dasar, coba deteksi ──────────────────────────
  const kandidatList = [];

  for (const row of dasarEntries) {
    const entriNorm = normalizeKey(row.entri);
    if (entriNorm.length < 4) continue; // terlalu pendek untuk pola apapun

    // Coba tanpa sufiks terlebih dahulu, lalu dengan satu sufiks terluar
    const attempts = [
      { stem: entriNorm, sufTag: null },
    ];
    const stripped = stripSuffix(entriNorm);
    if (stripped.sufTag) {
      attempts.push(stripped);
    }

    for (const { stem, sufTag } of attempts) {
      // --- Dwipurwa ---
      const dwiBasis = tryDwipurwa(stem);
      if (dwiBasis) {
        const found = lookupAll.get(dwiBasis);
        if (found && found.id !== row.id) {
          if (!DASAR_ONLY || found.jenis === 'dasar') {
            kandidatList.push({
              entri: row.entri,
              entri_id: row.id,
              pola: 'R.purwa',
              infix: null,
              basis_kandidat: dwiBasis,
              basis_id: found.id,
              basis_jenis: found.jenis,
              sufiks: sufTag,
            });
          }
        }
      }

      // --- Sisipan ---
      for (const { infix, basis } of tryInfiks(stem)) {
        const found = lookupAll.get(basis);
        if (found && found.id !== row.id) {
          if (!DASAR_ONLY || found.jenis === 'dasar') {
            kandidatList.push({
              entri: row.entri,
              entri_id: row.id,
              pola: '-' + infix + '-',
              infix,
              basis_kandidat: basis,
              basis_id: found.id,
              basis_jenis: found.jenis,
              sufiks: sufTag,
            });
          }
        }
      }
    }
  }

  // ── 4. Deduplikasi (entri + pola + basis) ────────────────────────────────
  const seen = new Set();
  const unique = kandidatList.filter((k) => {
    const key = `${k.entri_id}::${k.pola}::${k.basis_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── 5. Hitung statistik ──────────────────────────────────────────────────
  const byPola = {};
  for (const k of unique) {
    byPola[k.pola] = (byPola[k.pola] || 0) + 1;
  }

  const dariDasar = unique.filter((k) => k.basis_jenis === 'dasar');
  const basisLain = unique.filter((k) => k.basis_jenis !== 'dasar');

  // ── 6. Output ringkasan ──────────────────────────────────────────────────
  console.log('\n=== DETEKSI SISIPAN & DWIPURWA DARI ENTRI DASAR ===\n');
  console.log(`Total entri dasar aktif       : ${dasarEntries.length}`);
  console.log(`Kandidat terdeteksi (unik)    : ${unique.length}`);
  console.log(`  - basis jenis 'dasar'       : ${dariDasar.length}`);
  console.log(`  - basis jenis lain          : ${basisLain.length}`);
  if (DASAR_ONLY) {
    console.log('  (mode --dasar-only: basis bukan dasar disaring)');
  }
  console.log('\nPer pola:');
  for (const [pola, n] of Object.entries(byPola).sort()) {
    console.log(`  ${pola.padEnd(10)} : ${n}`);
  }

  // ── 7. Output detail (jika verbose atau hasil sedikit) ───────────────────
  if (VERBOSE || unique.length <= 60) {
    console.log('\nDaftar kandidat:');
    const header = [
      'Entri'.padEnd(28),
      'Pola'.padEnd(10),
      'Basis kandidat'.padEnd(22),
      'Basis jenis',
    ].join('');
    console.log(header);
    console.log('-'.repeat(header.length));

    for (const k of unique) {
      const entriLabel = k.sufiks
        ? `${k.entri} [+${k.sufiks}]`
        : k.entri;
      console.log([
        entriLabel.padEnd(28),
        k.pola.padEnd(10),
        k.basis_kandidat.padEnd(22),
        k.basis_jenis,
      ].join(''));
    }
  } else {
    console.log(`\n(Gunakan --verbose untuk daftar lengkap ${unique.length} kandidat.)`);
  }

  // ── 8. Simpan CSV jika diminta ───────────────────────────────────────────
  if (CSV_OUT) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyymm = `${now.getFullYear()}${pad(now.getMonth() + 1)}`;
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;

    const outDir = path.resolve(__dirname, '../../docs', yyyymm);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outFile = path.join(outDir, `${ts}_kandidat-sisipan-dwipurwa.csv`);
    const lines = [
      'entri,entri_id,pola,basis_kandidat,basis_id,basis_jenis,sufiks',
      ...unique.map((k) =>
        [
          `"${k.entri}"`,
          k.entri_id,
          `"${k.pola}"`,
          `"${k.basis_kandidat}"`,
          k.basis_id,
          `"${k.basis_jenis}"`,
          `"${k.sufiks || ''}"`,
        ].join(',')
      ),
    ];
    fs.writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');
    console.log(`\nCSV disimpan: ${outFile}`);
  }

  await db.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
