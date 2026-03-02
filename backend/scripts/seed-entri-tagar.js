/**
 * @fileoverview Seeder otomatis entri_tagar dari entri turunan.
 *
 * Algoritme: bandingkan string entri vs string induk (JOIN) untuk mendeteksi
 * imbuhan (prefiks, sufiks, klitik, reduplikasi) secara heuristik.
 *
 * Cakupan estimasi: ~89% dari 24.607 entri turunan.
 * Sisanya (~11%) perlu pengisian manual via antarmuka admin.
 *
 * Penggunaan:
 *   node scripts/seed-entri-tagar.js --dry-run          # Preview tanpa tulis
 *   node scripts/seed-entri-tagar.js --dry-run --verbose # + daftar tidak terdeteksi
 *   node scripts/seed-entri-tagar.js                    # Jalankan sebenarnya
 */

require('dotenv').config({ path: '.env' });
const db = require('../db');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const BATCH_SIZE = 500;

// ============================================================
// Konfigurasi pola imbuhan
// Diurutkan dari terpanjang ke terpendek agar startsWith tidak
// cocok sebelum waktunya (mis. 'mem' vs 'memper').
// ============================================================

const PREFIXES = [
  { str: 'memper', tags: ['me', 'per'] },
  { str: 'diper',  tags: ['di', 'per'] },
  { str: 'mempe',  tags: ['me', 'pe']  },
  { str: 'terpe',  tags: ['ter', 'pe'] },
  { str: 'berpe',  tags: ['ber', 'pe'] },
  { str: 'sepe',   tags: ['se', 'pe']  },
  { str: 'meng',   tags: ['me'] },
  { str: 'meny',   tags: ['me'] },
  { str: 'peng',   tags: ['pe'] },
  { str: 'peny',   tags: ['pe'] },
  { str: 'mem',    tags: ['me'] },
  { str: 'men',    tags: ['me'] },
  { str: 'pem',    tags: ['pe'] },
  { str: 'pen',    tags: ['pe'] },
  { str: 'ber',    tags: ['ber'] },
  { str: 'ter',    tags: ['ter'] },
  { str: 'per',    tags: ['per'] },
  { str: 'me',     tags: ['me'] },
  { str: 'pe',     tags: ['pe'] },
  { str: 'di',     tags: ['di'] },
  { str: 'ke',     tags: ['ke'] },
  { str: 'se',     tags: ['se'] },
];

// Diurutkan dari terpanjang ke terpendek
const SUFFIXES = [
  { str: 'kan', tag: 'kan' },
  { str: 'nya', tag: 'nya' },
  { str: 'kah', tag: 'kah' },
  { str: 'lah', tag: 'lah' },
  { str: 'pun', tag: 'pun' },
  { str: 'tah', tag: 'tah' },
  { str: 'an',  tag: 'an'  },
  { str: 'mu',  tag: 'mu'  },
  { str: 'ku',  tag: 'ku'  },
  { str: 'i',   tag: 'i'   },
];

// ============================================================
// Utilitas: normalisasi teks induk
// ============================================================

/**
 * Normalisasi teks induk dari DB:
 *   - Buang nomor homonim: "abai (1)" → "abai"
 *   - Lowercase: "Agustus" → "agustus"
 * @param {string} induk
 * @returns {string}
 */
function normalizeInduk(induk) {
  return induk
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim()
    .toLowerCase();
}

// ============================================================
// Utilitas: petakan string prefiks ke kode tagar
// ============================================================

/**
 * Petakan string prefiks (mis. 'memper', 'meng') ke array kode tagar.
 * Kembalikan null jika tidak dikenali.
 * @param {string} pre
 * @returns {string[]|null}
 */
function mapPrefix(pre) {
  if (!pre) return [];
  const found = PREFIXES.find((p) => p.str === pre);
  if (found) return found.tags;

  // Coba sebagai gabungan dua prefiks (mis. 'berse' = 'ber'+'se')
  for (const p of PREFIXES) {
    if (pre.startsWith(p.str)) {
      const rest = pre.slice(p.str.length);
      const p2 = PREFIXES.find((q) => q.str === rest);
      if (p2) return [...p.tags, ...p2.tags];
    }
  }

  return null; // tidak dikenali
}

/**
 * Petakan string sufiks ke kode tagar.
 * Kembalikan null jika tidak dikenali.
 * @param {string} suf
 * @returns {string|null}
 */
function mapSuffix(suf) {
  if (!suf) return null;
  const found = SUFFIXES.find((s) => s.str === suf);
  return found ? found.tag : null;
}

// ============================================================
// Deteksi entri non-reduplikasi
// ============================================================

/**
 * Deteksi tagar untuk entri yang tidak mengandung tanda hubung.
 *
 * Strategi:
 * 1. Cari induk sebagai substring dalam entri → prefix + suffix langsung.
 * 2. Jika tidak ditemukan (alomorf), coba cocokkan prefix lalu cek middle
 *    vs induk dengan toleransi alomorf (consonant drop: induk[1:] == middle).
 *
 * @param {string} entri
 * @param {string} induk - teks entri induk (sudah dinormalisasi: lowercase, tanpa nomor homonim)
 * @returns {string[]|null} array kode tagar, atau null jika tidak terdeteksi
 */
function detectNonReduplikasi(entri, induk) {
  // Jika induk multi-kata (mis. "alih aksara"), coba juga versi tanpa spasi ("alihaksara")
  const indukVariants = [induk];
  if (induk.includes(' ')) indukVariants.push(induk.replace(/\s+/g, ''));

  // --- Strategi 1: induk sebagai substring langsung ---
  for (const indukVar of indukVariants) {
    const idx = entri.indexOf(indukVar);
    if (idx < 0) continue;

    const pre = entri.slice(0, idx);
    const suf = entri.slice(idx + indukVar.length);

    // Tidak ada imbuhan sama sekali → entri == induk (lewati)
    if (!pre && !suf) return [];

    const prefixTags = mapPrefix(pre);
    if (prefixTags === null) continue; // prefiks tidak dikenali, coba varian lain

    const suffixTag = suf ? mapSuffix(suf) : null;
    if (suf && suffixTag === null) continue; // sufiks tidak dikenali, coba varian lain

    const tagSet = new Set(prefixTags);
    if (suffixTag) tagSet.add(suffixTag);
    if (tagSet.size > 0) return [...tagSet];
  }

  // --- Strategi 2: alomorf (konsonan awal induk mengalami perubahan) ---
  // Contoh: menulis (induk=tulis) → men+ulis, induk.slice(1)='ulis' == remainder
  for (const { str: preStr, tags: preTags } of PREFIXES) {
    if (!entri.startsWith(preStr)) continue;
    const afterPre = entri.slice(preStr.length);

    // Coba dengan sufiks
    for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
      if (!afterPre.endsWith(sufStr)) continue;
      const middle = afterPre.slice(0, -sufStr.length);

      if (
        middle === induk ||
        (induk.length > 1 && induk.slice(1) === middle)
      ) {
        const tagSet = new Set(preTags);
        tagSet.add(sufTag);
        return [...tagSet];
      }
    }

    // Coba tanpa sufiks
    if (
      afterPre === induk ||
      (induk.length > 1 && induk.slice(1) === afterPre)
    ) {
      return [...preTags];
    }
  }

  // --- Strategi 3: sufiks/klitik saja (tanpa prefiks) ---
  for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
    if (entri === induk + sufStr) return [sufTag];
  }

  return null; // tidak terdeteksi
}

// ============================================================
// Deteksi entri reduplikasi (mengandung tanda hubung)
// ============================================================

/**
 * Deteksi tagar untuk entri yang mengandung tanda hubung (reduplikasi).
 *
 * Pola yang ditangani:
 *   X-X           → R
 *   X-Xan         → R-an
 *   X-Xkan        → R-kan
 *   X-Xnya        → R-nya
 *   X-preX        → R + prefix  (right = pre + left, contoh: adik-beradik)
 *   preX-X        → R + prefix  (left = pre + right, contoh: berbelit-belit)
 *   preX-Xalomorf → R + prefix  (right alomorf dari left, contoh: bahu-membahu)
 *
 * @param {string} entri
 * @param {string} _induk - tidak digunakan untuk reduplikasi saat ini
 * @returns {string[]|null}
 */
function detectReduplikasi(entri, _induk) {
  const firstHyphen = entri.indexOf('-');
  if (firstHyphen < 0) return null;

  const left = entri.slice(0, firstHyphen);
  const right = entri.slice(firstHyphen + 1);

  // Pola murni: X-X
  if (left === right) return ['R'];

  // Pola R + sufiks: X-Xsuf
  for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
    if (right === left + sufStr) {
      // R + sufiks → untuk R-an, R-kan, R-nya gunakan kode gabungan jika ada
      const combined = `R-${sufStr}`;
      // Kode gabungan yang tersedia dalam tagar: R-an, R-kan, R-nya
      if (['R-an', 'R-kan', 'R-nya'].includes(combined)) return [combined];
      // Lainnya → R + sufiks terpisah
      return ['R', sufTag];
    }
  }

  // Pola R + prefiks (right = preStr + left, alomorf diterima)
  for (const { str: preStr, tags: preTags } of PREFIXES) {
    // right = prefix + left  (adik-beradik: right='beradik'='ber'+'adik'=prefix+left)
    if (right === preStr + left) return ['R', ...preTags];

    // left = prefix + right  (berbelit-belit: left='berbelit'='ber'+'belit'=prefix+right)
    if (left === preStr + right) return ['R', ...preTags];

    // right = prefix + alomorf(left)  (bahu-membahu: right='membahu'='mem'+'bahu', left='bahu')
    if (right.startsWith(preStr)) {
      const rightAfterPre = right.slice(preStr.length);
      if (
        rightAfterPre === left ||
        (left.length > 1 && left.slice(1) === rightAfterPre)
      ) {
        return ['R', ...preTags];
      }
    }

    // left = prefix + alomorf(right)
    if (left.startsWith(preStr)) {
      const leftAfterPre = left.slice(preStr.length);
      if (
        leftAfterPre === right ||
        (right.length > 1 && right.slice(1) === leftAfterPre)
      ) {
        return ['R', ...preTags];
      }
    }
  }

  return null; // pola reduplikasi kompleks — tidak terdeteksi
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log(`Seeder entri_tagar${DRY_RUN ? ' [DRY RUN]' : ''}`);
  console.log('--------------------------------------------------');

  // Muat semua tagar aktif (kode → id)
  const tagarResult = await db.query(
    'SELECT id, kode FROM tagar WHERE aktif = TRUE ORDER BY id'
  );
  const tagarByKode = {};
  tagarResult.rows.forEach((r) => {
    tagarByKode[r.kode] = r.id;
  });
  console.log(`Tagar tersedia: ${tagarResult.rows.length}`);
  console.log(`  Kode: ${Object.keys(tagarByKode).join(', ')}`);

  // Muat semua entri turunan aktif beserta teks induknya
  const entriesResult = await db.query(`
    SELECT e.id, e.entri, i.entri AS induk_entri
    FROM entri e
    JOIN entri i ON i.id = e.induk
    WHERE e.jenis = 'turunan' AND e.aktif = 1
    ORDER BY e.id
  `);
  const entries = entriesResult.rows;
  console.log(`\nEntri turunan aktif: ${entries.length}`);

  // Proses deteksi
  let cntDetected = 0;
  let cntSkipped = 0;
  let cntUndetected = 0;
  const toInsert = []; // [[entri_id, tagar_id], ...]
  const undetectedExamples = [];

  for (const { id, entri, induk_entri: induk } of entries) {
    const indukNorm = normalizeInduk(induk);
    const tagCodes = entri.includes('-')
      ? detectReduplikasi(entri, indukNorm)
      : detectNonReduplikasi(entri, indukNorm);

    if (tagCodes === null) {
      cntUndetected++;
      if (VERBOSE && undetectedExamples.length < 100) {
        undetectedExamples.push({ entri, induk });
      }
      continue;
    }

    if (tagCodes.length === 0) {
      cntSkipped++; // entri === induk, tidak ada imbuhan
      continue;
    }

    // Validasi kode tagar
    const unknownCodes = tagCodes.filter((c) => !tagarByKode[c]);
    if (unknownCodes.length > 0) {
      if (VERBOSE) {
        console.warn(
          `  [WARN] Kode tagar tidak dikenal: ${unknownCodes.join(',')} ` +
          `untuk "${entri}" (induk="${induk}")`
        );
      }
      cntUndetected++;
      continue;
    }

    cntDetected++;
    for (const code of tagCodes) {
      toInsert.push([id, tagarByKode[code]]);
    }
  }

  // Ringkasan
  const pct = ((cntDetected / entries.length) * 100).toFixed(1);
  console.log(`\nHasil deteksi:`);
  console.log(`  Terdeteksi  : ${cntDetected} (${pct}%)`);
  console.log(`  Dilewati    : ${cntSkipped} (entri = induk, tidak ada imbuhan)`);
  console.log(`  Tidak terdet: ${cntUndetected}`);
  console.log(`  Baris entri_tagar: ${toInsert.length}`);

  if (VERBOSE && undetectedExamples.length > 0) {
    console.log(`\nContoh tidak terdeteksi (${undetectedExamples.length}):`);
    undetectedExamples.forEach(({ entri: e, induk: i }) => {
      console.log(`  "${e}" (induk: "${i}")`);
    });
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Tidak ada data yang ditulis ke database.');
    return;
  }

  // Tulis ke database
  console.log(`\nMenyimpan ${toInsert.length} baris ke entri_tagar...`);
  let saved = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const values = batch.map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2})`).join(', ');
    const params = batch.flat();

    await db.query(
      `INSERT INTO entri_tagar (entri_id, tagar_id) VALUES ${values} ON CONFLICT DO NOTHING`,
      params
    );

    saved += batch.length;
    if (saved % 5000 < BATCH_SIZE || saved >= toInsert.length) {
      console.log(`  Tersimpan: ${saved}/${toInsert.length}`);
    }
  }

  console.log('\nSelesai!');
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  })
  .finally(() => db.close());
