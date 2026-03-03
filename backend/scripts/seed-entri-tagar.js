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

const CONFIX_TAGAR_DEFINITIONS = [
  {
    kode: 'ber--an',
    nama: 'ber--an',
    kategori: 'prakategorial',
    deskripsi: 'Konfiks ber--an (kombinasi ber- + -an)',
    urutan: 50,
  },
  {
    kode: 'ke--an',
    nama: 'ke--an',
    kategori: 'prakategorial',
    deskripsi: 'Konfiks ke--an (kombinasi ke- + -an)',
    urutan: 51,
  },
  {
    kode: 'per--an',
    nama: 'per--an',
    kategori: 'prakategorial',
    deskripsi: 'Konfiks per--an (kombinasi per- + -an)',
    urutan: 52,
  },
  {
    kode: 'peng--an',
    nama: 'peng--an',
    kategori: 'prakategorial',
    deskripsi: 'Konfiks peng--an (kombinasi peng- + -an)',
    urutan: 53,
  },
];

const CONFIX_RULES = [
  { confixKode: 'ber--an', requiredCodes: ['ber-', '-an'] },
  { confixKode: 'ke--an', requiredCodes: ['ke-', '-an'] },
  { confixKode: 'per--an', requiredCodes: ['per-', '-an'] },
  { confixKode: 'peng--an', requiredCodes: ['peng-', '-an'] },
];

const COMBINATION_TAGAR_DEFINITIONS = [
  {
    kode: 'meng--kan',
    nama: 'meng--kan',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi meng- + -kan',
    urutan: 60,
  },
  {
    kode: 'meng--i',
    nama: 'meng--i',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi meng- + -i',
    urutan: 61,
  },
  {
    kode: 'ber--kan',
    nama: 'ber--kan',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi ber- + -kan',
    urutan: 62,
  },
  {
    kode: 'ber--i',
    nama: 'ber--i',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi ber- + -i',
    urutan: 63,
  },
  {
    kode: 'di--kan',
    nama: 'di--kan',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi di- + -kan',
    urutan: 64,
  },
  {
    kode: 'di--i',
    nama: 'di--i',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi di- + -i',
    urutan: 65,
  },
  {
    kode: 'ter--kan',
    nama: 'ter--kan',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi ter- + -kan',
    urutan: 66,
  },
  {
    kode: 'memper-',
    nama: 'memper-',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi memper- (meng- + per-)',
    urutan: 67,
  },
  {
    kode: 'memper--kan',
    nama: 'memper--kan',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi memper--kan (meng- + per- + -kan)',
    urutan: 68,
  },
  {
    kode: 'memper--i',
    nama: 'memper--i',
    kategori: 'kombinasi',
    deskripsi: 'Kombinasi memper--i (meng- + per- + -i)',
    urutan: 69,
  },
];

const COMBINATION_RULES = [
  { combinationKode: 'meng--kan', requiredCodes: ['meng-', '-kan'] },
  { combinationKode: 'meng--i', requiredCodes: ['meng-', '-i'] },
  { combinationKode: 'ber--kan', requiredCodes: ['ber-', '-kan'] },
  { combinationKode: 'ber--i', requiredCodes: ['ber-', '-i'] },
  { combinationKode: 'di--kan', requiredCodes: ['di-', '-kan'] },
  { combinationKode: 'di--i', requiredCodes: ['di-', '-i'] },
  { combinationKode: 'ter--kan', requiredCodes: ['ter-', '-kan'] },
  { combinationKode: 'memper-', requiredCodes: ['meng-', 'per-'] },
  { combinationKode: 'memper--kan', requiredCodes: ['meng-', 'per-', '-kan'] },
  { combinationKode: 'memper--i', requiredCodes: ['meng-', 'per-', '-i'] },
];

async function ensureAuditTagarPermission() {
  await db.query(
    `INSERT INTO izin (kode, nama, kelompok)
     VALUES ('audit_tagar', 'Audit cakupan tagar entri', 'audit')
     ON CONFLICT (kode)
     DO UPDATE SET nama = EXCLUDED.nama, kelompok = EXCLUDED.kelompok`
  );

  await db.query(
    `INSERT INTO peran_izin (peran_id, izin_id)
     SELECT p.id, i.id
     FROM peran p, izin i
     WHERE i.kode = 'audit_tagar'
       AND p.akses_redaksi = TRUE
     ON CONFLICT DO NOTHING`
  );
}

async function ensureConfixTagarDefinitions() {
  for (const def of CONFIX_TAGAR_DEFINITIONS) {
    await db.query(
      `INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (kode)
       DO UPDATE SET
         nama = EXCLUDED.nama,
         kategori = EXCLUDED.kategori,
         deskripsi = EXCLUDED.deskripsi,
         urutan = EXCLUDED.urutan,
         aktif = TRUE`,
      [def.kode, def.nama, def.kategori, def.deskripsi, def.urutan]
    );
  }
}

async function ensureCombinationTagarDefinitions() {
  for (const def of COMBINATION_TAGAR_DEFINITIONS) {
    await db.query(
      `INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (kode)
       DO UPDATE SET
         nama = EXCLUDED.nama,
         kategori = EXCLUDED.kategori,
         deskripsi = EXCLUDED.deskripsi,
         urutan = EXCLUDED.urutan,
         aktif = TRUE`,
      [def.kode, def.nama, def.kategori, def.deskripsi, def.urutan]
    );
  }
}

function buildRequiredTagClauses(requiredCodes, startParam = 2) {
  return requiredCodes
    .map((_, idx) => (
      `EXISTS (
           SELECT 1
           FROM entri_tagar et_req_${idx}
           JOIN tagar t_req_${idx}
             ON t_req_${idx}.id = et_req_${idx}.tagar_id
          WHERE et_req_${idx}.entri_id = e.id
            AND t_req_${idx}.aktif = TRUE
            AND t_req_${idx}.kode = $${startParam + idx}
         )`
    ))
    .join('\n         AND ');
}

async function applyConfixTags({ dryRun = false } = {}) {
  const summary = [];

  for (const { confixKode, requiredCodes } of CONFIX_RULES) {
    const [kodeA, kodeB] = requiredCodes;

    if (dryRun) {
      const preview = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM entri e
         JOIN tagar t_conf ON t_conf.kode = $1 AND t_conf.aktif = TRUE
         JOIN tagar t_a ON t_a.kode = $2 AND t_a.aktif = TRUE
         JOIN tagar t_b ON t_b.kode = $3 AND t_b.aktif = TRUE
         JOIN entri_tagar et_a ON et_a.entri_id = e.id AND et_a.tagar_id = t_a.id
         JOIN entri_tagar et_b ON et_b.entri_id = e.id AND et_b.tagar_id = t_b.id
         LEFT JOIN entri_tagar et_conf ON et_conf.entri_id = e.id AND et_conf.tagar_id = t_conf.id
         WHERE e.jenis = 'turunan'
           AND e.aktif = 1
           AND et_conf.entri_id IS NULL`,
        [confixKode, kodeA, kodeB]
      );

      summary.push({
        confixKode,
        inserted: 0,
        potential: preview.rows[0].total,
      });
      continue;
    }

    const inserted = await db.query(
      `INSERT INTO entri_tagar (entri_id, tagar_id)
       SELECT DISTINCT e.id, t_conf.id
       FROM entri e
       JOIN tagar t_conf ON t_conf.kode = $1 AND t_conf.aktif = TRUE
       JOIN tagar t_a ON t_a.kode = $2 AND t_a.aktif = TRUE
       JOIN tagar t_b ON t_b.kode = $3 AND t_b.aktif = TRUE
       JOIN entri_tagar et_a ON et_a.entri_id = e.id AND et_a.tagar_id = t_a.id
       JOIN entri_tagar et_b ON et_b.entri_id = e.id AND et_b.tagar_id = t_b.id
       WHERE e.jenis = 'turunan'
         AND e.aktif = 1
       ON CONFLICT DO NOTHING`,
      [confixKode, kodeA, kodeB]
    );

    summary.push({
      confixKode,
      inserted: inserted.rowCount || 0,
      potential: inserted.rowCount || 0,
    });
  }

  return summary;
}

async function applyCombinationTags({ dryRun = false } = {}) {
  const summary = [];

  for (const { combinationKode, requiredCodes } of COMBINATION_RULES) {
    const requiredClauses = buildRequiredTagClauses(requiredCodes, 2);
    const params = [combinationKode, ...requiredCodes];

    if (dryRun) {
      const preview = await db.query(
        `SELECT COUNT(*)::int AS total
           FROM entri e
           JOIN tagar t_comb ON t_comb.kode = $1 AND t_comb.aktif = TRUE
           LEFT JOIN entri_tagar et_comb ON et_comb.entri_id = e.id AND et_comb.tagar_id = t_comb.id
          WHERE e.jenis = 'turunan'
            AND e.aktif = 1
            AND et_comb.entri_id IS NULL
            AND ${requiredClauses}`,
        params
      );

      summary.push({
        combinationKode,
        inserted: 0,
        potential: preview.rows[0].total,
      });
      continue;
    }

    const inserted = await db.query(
      `INSERT INTO entri_tagar (entri_id, tagar_id)
       SELECT DISTINCT e.id, t_comb.id
         FROM entri e
         JOIN tagar t_comb ON t_comb.kode = $1 AND t_comb.aktif = TRUE
        WHERE e.jenis = 'turunan'
          AND e.aktif = 1
          AND ${requiredClauses}
       ON CONFLICT DO NOTHING`,
      params
    );

    summary.push({
      combinationKode,
      inserted: inserted.rowCount || 0,
      potential: inserted.rowCount || 0,
    });
  }

  return summary;
}

// ============================================================
// Konfigurasi pola imbuhan
// Diurutkan dari terpanjang ke terpendek agar startsWith tidak
// cocok sebelum waktunya (mis. 'mem' vs 'memper').
// ============================================================

const PREFIXES = [
  { str: 'memper', tags: ['meng-', 'per-']  },
  { str: 'pemer',  tags: ['peng-', 'per-']  },
  { str: 'pemel',  tags: ['peng-', 'per-']  },
  { str: 'kepen',  tags: ['ke-', 'peng-']   },
  { str: 'sepem',  tags: ['se-', 'peng-']   },
  { str: 'diper',  tags: ['di-', 'per-']    },
  { str: 'mempe',  tags: ['meng-', 'peng-'] },
  { str: 'menge',  tags: ['meng-']          },
  { str: 'menye',  tags: ['meng-']          },
  { str: 'penge',  tags: ['peng-']          },
  { str: 'terpe',  tags: ['ter-', 'peng-']  },
  { str: 'berpe',  tags: ['ber-', 'peng-']  },
  { str: 'bersi',  tags: ['bersi-']         },
  { str: 'sepe',   tags: ['se-', 'peng-']   },
  { str: 'meng',   tags: ['meng-'] },
  { str: 'meny',   tags: ['meng-'] },
  { str: 'peng',   tags: ['peng-'] },
  { str: 'peny',   tags: ['peng-'] },
  { str: 'mem',    tags: ['meng-'] },
  { str: 'men',    tags: ['meng-'] },
  { str: 'pem',    tags: ['peng-'] },
  { str: 'pen',    tags: ['peng-'] },
  { str: 'bel',    tags: ['ber-']  },
  { str: 'pel',    tags: ['per-']  },
  { str: 'be',     tags: ['ber-']  },
  { str: 'ber',    tags: ['ber-']  },
  { str: 'ter',    tags: ['ter-']  },
  { str: 'te',     tags: ['ter-']  },
  { str: 'per',    tags: ['per-']  },
  { str: 'me',     tags: ['meng-'] },
  { str: 'pe',     tags: ['peng-'] },
  { str: 'di',     tags: ['di-']   },
  { str: 'ke',     tags: ['ke-']   },
  { str: 'se',     tags: ['se-']   },
];

// Diurutkan dari terpanjang ke terpendek
const SUFFIXES = [
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

const PREFIXES_NASAL = new Set(['me', 'mem', 'men', 'meng', 'meny', 'menye', 'pe', 'pem', 'pen', 'peng', 'peny', 'kepen', 'sepem']);
const HURUF_PELULUHAN_KPST = new Set(['k', 'p', 's', 't']);

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

function normalizeHomonimSuffix(teks) {
  return String(teks || '')
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

/**
 * Cek apakah prefiks termasuk keluarga nasal meN-/peN-.
 * @param {string} pre
 * @returns {boolean}
 */
function isPrefiksNasal(pre) {
  return PREFIXES_NASAL.has(pre);
}

/**
 * Cek kecocokan peluluhan KPST.
 * Contoh: kenal→enal, pakai→akai, siram→iram, tukar→ukar.
 * @param {string} induk
 * @param {string} kandidat
 * @returns {boolean}
 */
function isPeluluhanKPST(induk, kandidat) {
  if (!induk || induk.length < 2) return false;
  if (!kandidat) return false;
  return HURUF_PELULUHAN_KPST.has(induk[0]) && induk.slice(1) === kandidat;
}

/**
 * Perkiraan sederhana jumlah suku kata berbasis kelompok vokal.
 * Digunakan untuk aturan alomorf menge- (dasar monosuku kata).
 * @param {string} kata
 * @returns {boolean}
 */
function isMonosukuKata(kata) {
  if (!kata) return false;
  const normalized = kata
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  if (!normalized) return false;
  const vokalGroups = normalized.match(/[aiueo]+/g) || [];
  return vokalGroups.length === 1;
}

function commonPrefix(a, b) {
  let idx = 0;
  while (idx < a.length && idx < b.length && a[idx] === b[idx]) idx += 1;
  return a.slice(0, idx);
}

function commonSuffix(a, b) {
  let idx = 0;
  while (
    idx < a.length
    && idx < b.length
    && a[a.length - 1 - idx] === b[b.length - 1 - idx]
  ) idx += 1;
  return a.slice(a.length - idx);
}

function detectReduplikasiSubtype(left, right) {
  const leftNorm = normalizeHomonimSuffix(left);
  const rightNorm = normalizeHomonimSuffix(right);
  if (!leftNorm || !rightNorm) return null;
  if (leftNorm === rightNorm) return null;

  const sameLen = leftNorm.length === rightNorm.length;
  const prefix = commonPrefix(leftNorm, rightNorm);
  const suffix = commonSuffix(leftNorm, rightNorm);

  if (sameLen && prefix.length >= 2 && suffix.length >= 1) return 'R.salin';
  if (suffix.length >= 3 && prefix.length <= 1) return 'R.wasana';
  if (prefix.length >= 3 && suffix.length <= 1) return 'R.purwa';
  return 'R.salin';
}

/**
 * Prefiks alomorf khusus yang hanya valid untuk dasar monosuku kata.
 * @param {string} pre
 * @returns {boolean}
 */
function isPrefiksKhususMonosuku(pre) {
  return pre === 'menge' || pre === 'penge';
}

function isAlomorfBeUntukBer(induk) {
  const akar = String(induk || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!akar) return false;
  if (akar.startsWith('r')) return true;
  return /^[^aiueo]*er([^aiueo]|$)/.test(akar);
}

function isAlomorfKhususAjar(pre, induk) {
  const akar = String(induk || '').toLowerCase().replace(/[^a-z]/g, '');
  if (pre === 'bel' || pre === 'pel') return akar === 'ajar';
  return true;
}

function cocokPolaMenyeDenganSe(preStr, indukVar, kandidat) {
  if (preStr !== 'menye') return false;
  if (!indukVar || !indukVar.startsWith('se') || indukVar.length <= 2) return false;
  return indukVar.slice(2) === kandidat;
}

function bolehGunakanTagLayered(preStr, extraTags = []) {
  if (!Array.isArray(extraTags) || extraTags.length === 0) return true;
  if (['menye', 'penye', 'meny', 'peny'].includes(preStr)) {
    return !extraTags.some((tag) => tag === 'ke' || tag === 'di');
  }
  return true;
}

function buildIndukCandidates(indukVariants) {
  const map = new Map();

  for (const indukVar of indukVariants) {
    const baseKey = `${indukVar}::`;
    if (!map.has(baseKey)) {
      map.set(baseKey, { value: indukVar, extraTags: [] });
    }

    const layeredOptions = [
      { str: 'ke', tag: 'ke' },
      { str: 'di', tag: 'di' },
      { str: 'se', tag: 'se-' },
    ];

    for (const { str: layered, tag } of layeredOptions) {
      const layeredValue = `${layered}${indukVar}`;
      const layeredKey = `${layeredValue}::${tag}`;
      if (!map.has(layeredKey)) {
        map.set(layeredKey, { value: layeredValue, extraTags: [tag] });
      }
    }
  }

  return [...map.values()];
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
  // Variasi induk untuk pencocokan string:
  // - bentuk asli
  // - tanpa spasi (alih aksara -> alihaksara)
  // - tanpa spasi dan tanda hubung (desas-desus -> desasdesus)
  const indukVariants = Array.from(new Set([
    induk,
    induk.replace(/\s+/g, ''),
    induk.replace(/[\s-]+/g, ''),
  ].filter(Boolean)));
  const indukCandidates = buildIndukCandidates(indukVariants);

  // --- Strategi 1: induk sebagai substring langsung ---
  for (const { value: indukVar, extraTags } of indukCandidates) {
    const idx = entri.indexOf(indukVar);
    if (idx < 0) continue;

    const pre = entri.slice(0, idx);
    const suf = entri.slice(idx + indukVar.length);

    if (isPrefiksKhususMonosuku(pre) && !isMonosukuKata(indukVar)) continue;

    // Tidak ada imbuhan sama sekali → entri == induk (lewati)
    if (!pre && !suf) return [];

    const prefixTags = mapPrefix(pre);
    if (prefixTags === null) continue; // prefiks tidak dikenali, coba varian lain
    if (pre === 'be' && !isAlomorfBeUntukBer(indukVar)) continue;
    if (!isAlomorfKhususAjar(pre, indukVar)) continue;

    const suffixTag = suf ? mapSuffix(suf) : null;
    if (suf && suffixTag === null) continue; // sufiks tidak dikenali, coba varian lain

    const tagSet = new Set(prefixTags);
    extraTags.forEach((tag) => tagSet.add(tag));
    if (pre === 'menye' && extraTags.length === 0) {
      tagSet.add('se-');
    }
    if (suffixTag) tagSet.add(suffixTag);
    if (tagSet.size > 0) return [...tagSet];
  }

  // --- Strategi 2: alomorf (konsonan awal induk mengalami perubahan) ---
  // Contoh: menulis (induk=tulis) → men+ulis, induk.slice(1)='ulis' == remainder
  for (const { str: preStr, tags: preTags } of PREFIXES) {
    if (!entri.startsWith(preStr)) continue;
    const afterPre = entri.slice(preStr.length);
    const allowPeluluhan = isPrefiksNasal(preStr);

    // Coba dengan sufiks
    for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
      if (!afterPre.endsWith(sufStr)) continue;
      const middle = afterPre.slice(0, -sufStr.length);

      const cocokAkar = indukCandidates.find(({ value: indukVar, extraTags }) => (
        bolehGunakanTagLayered(preStr, extraTags)
        &&
        isAlomorfKhususAjar(preStr, indukVar)
        &&
        (preStr !== 'be' || isAlomorfBeUntukBer(indukVar))
        &&
        (!isPrefiksKhususMonosuku(preStr) || isMonosukuKata(indukVar))
        && (
          middle === indukVar ||
          (allowPeluluhan && isPeluluhanKPST(indukVar, middle)) ||
          cocokPolaMenyeDenganSe(preStr, indukVar, middle)
        )
      ));

      if (cocokAkar) {
        const tagSet = new Set(preTags);
        cocokAkar.extraTags.forEach((tag) => tagSet.add(tag));
        tagSet.add(sufTag);
        return [...tagSet];
      }
    }

    // Coba tanpa sufiks
    const cocokTanpaSufiks = indukCandidates.find(({ value: indukVar, extraTags }) => (
      bolehGunakanTagLayered(preStr, extraTags)
      &&
      isAlomorfKhususAjar(preStr, indukVar)
      &&
      (preStr !== 'be' || isAlomorfBeUntukBer(indukVar))
      &&
      (!isPrefiksKhususMonosuku(preStr) || isMonosukuKata(indukVar))
      && (
        afterPre === indukVar ||
        (allowPeluluhan && isPeluluhanKPST(indukVar, afterPre)) ||
        cocokPolaMenyeDenganSe(preStr, indukVar, afterPre)
      )
    ));

    if (cocokTanpaSufiks) {
      const tagSet = new Set(preTags);
      cocokTanpaSufiks.extraTags.forEach((tag) => tagSet.add(tag));
      return [...tagSet];
    }
  }

  // --- Strategi 3: sufiks/klitik saja (tanpa prefiks) ---
  for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
    if (indukVariants.some((indukVar) => entri === indukVar + sufStr)) return [sufTag];
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
 *   X-X           → R.penuh
 *   X-Xan         → R.penuh + -an
 *   X-Xkan        → R.penuh + -kan
 *   X-Xnya        → R.penuh + -nya
 *   X-preX        → R.penuh + prefix  (right = pre + left, contoh: adik-beradik)
 *   preX-X        → R.penuh + prefix  (left = pre + right, contoh: berbelit-belit)
 *   preX-Xalomorf → R.penuh + prefix  (right alomorf dari left, contoh: bahu-membahu)
 *
 * @param {string} entri
 * @param {string} _induk - tidak digunakan untuk reduplikasi saat ini
 * @returns {string[]|null}
 */
function detectReduplikasi(entri, _induk) {
  const induk = normalizeHomonimSuffix(_induk);
  const entriNorm = normalizeHomonimSuffix(entri);

  const partsForTri = entriNorm.split('-').filter(Boolean);
  if (partsForTri.length >= 3) {
    return ['R.tri'];
  }

  if (induk) {
    const indukVariants = Array.from(new Set([
      induk,
      induk.replace(/\s+/g, ''),
      induk.replace(/[\s-]+/g, ''),
    ].filter(Boolean)));

    // Pola: prefiks + induk(berhubung/majemuk) + (opsional) sufiks
    // Contoh: mendesas-desuskan (men + desas-desus + kan), mengagak-agihkan (meng + agak-agih + kan)
    for (const { str: preStr, tags: preTags } of PREFIXES) {
      if (!entri.startsWith(preStr)) continue;
      const afterPre = entri.slice(preStr.length);

      for (const indukVar of indukVariants) {
        if (afterPre === indukVar) return [...preTags];

        for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
          if (afterPre === indukVar + sufStr) {
            const tagSet = new Set(preTags);
            tagSet.add(sufTag);
            return [...tagSet];
          }
        }
      }
    }
  }

  const firstHyphen = entriNorm.indexOf('-');
  if (firstHyphen < 0) return null;

  const left = entriNorm.slice(0, firstHyphen);
  const right = entriNorm.slice(firstHyphen + 1);

  // Pola murni: X-X
  if (left === right) return ['R.penuh'];

  // Pola R.penuh + sufiks: X-Xsuf
  for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
    if (right === left + sufStr) {
      return ['R.penuh', sufTag];
    }
  }

  // Pola R.penuh + prefiks (right = preStr + left, alomorf diterima)
  for (const { str: preStr, tags: preTags } of PREFIXES) {
    // right = prefix + left  (adik-beradik: right='beradik'='ber'+'adik'=prefix+left)
    if (right === preStr + left) return ['R.penuh', ...preTags];

    // left = prefix + right  (berbelit-belit: left='berbelit'='ber'+'belit'=prefix+right)
    if (left === preStr + right) return ['R.penuh', ...preTags];

    // right = prefix + alomorf(left)  (bahu-membahu: right='membahu'='mem'+'bahu', left='bahu')
    if (right.startsWith(preStr)) {
      const rightAfterPre = right.slice(preStr.length);
      if (
        rightAfterPre === left ||
        (left.length > 1 && left.slice(1) === rightAfterPre)
      ) {
        return ['R.penuh', ...preTags];
      }
    }

    // left = prefix + alomorf(right)
    if (left.startsWith(preStr)) {
      const leftAfterPre = left.slice(preStr.length);
      if (
        leftAfterPre === right ||
        (right.length > 1 && right.slice(1) === leftAfterPre)
      ) {
        return ['R.penuh', ...preTags];
      }
    }
  }

  // Pola prefiks + reduplikasi dasar: preX-X atau preX-X+suf
  // Contoh:
  // - berhadap-hadapan   => ber + R.penuh + -an
  // - bergagah-gagahan   => ber + R.penuh + -an
  // - bergembar-gembor   => ber + R.penuh (reduplikasi variasi bunyi)
  for (const { str: preStr, tags: preTags } of PREFIXES) {
    if (!left.startsWith(preStr)) continue;
    const leftRoot = left.slice(preStr.length);
    if (!leftRoot) continue;

    const kandidatAkar = [leftRoot];
    if (preStr === 'ber' && /^[aiueo]/.test(leftRoot)) {
      kandidatAkar.push(`r${leftRoot}`);
    }

    // preX-X
    if (kandidatAkar.some((akar) => right === akar)) return [...preTags, 'R.penuh'];

    // preX-X+suf
    for (const { str: sufStr, tag: sufTag } of SUFFIXES) {
      if (kandidatAkar.some((akar) => right === akar + sufStr)) {
        return [...preTags, 'R.penuh', sufTag];
      }
    }

    // preX-Y (reduplikasi variasi bunyi / dwilingga salin suara) dengan kemiripan kuat
    // Contoh: bergembar-gembor
    if (
      right.length === leftRoot.length &&
      right.length >= 4 &&
      right.slice(0, 4) === leftRoot.slice(0, 4)
    ) {
      let beda = 0;
      for (let i = 0; i < right.length; i += 1) {
        if (right[i] !== leftRoot[i]) beda += 1;
      }
      if (beda > 0 && beda <= 2) {
        const subtype = detectReduplikasiSubtype(leftRoot, right);
        return [...preTags, subtype || 'R.penuh'];
      }
    }
  }

  const subtypeGlobal = detectReduplikasiSubtype(left, right);
  if (subtypeGlobal) {
    return [subtypeGlobal];
  }

  return null; // pola reduplikasi kompleks — tidak terdeteksi
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log(`Seeder entri_tagar${DRY_RUN ? ' [DRY RUN]' : ''}`);
  console.log('--------------------------------------------------');

  await ensureAuditTagarPermission();
  console.log('Izin audit_tagar dipastikan tersedia untuk peran redaksi.');
  await ensureConfixTagarDefinitions();
  console.log('Tagar konfiks dipastikan tersedia.');
  await ensureCombinationTagarDefinitions();
  console.log('Tagar kombinasi dipastikan tersedia.');

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
    const entriNorm = normalizeHomonimSuffix(entri);
    const indukNorm = normalizeInduk(induk);
    const tagCodes = entriNorm.includes('-')
      ? detectReduplikasi(entriNorm, indukNorm)
      : detectNonReduplikasi(entriNorm, indukNorm);

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
    const confixPreview = await applyConfixTags({ dryRun: true });
    console.log('\nPreview konfiks (berdasarkan data saat ini):');
    confixPreview.forEach(({ confixKode, potential }) => {
      console.log(`  ${confixKode}: +${potential}`);
    });

    const combinationPreview = await applyCombinationTags({ dryRun: true });
    console.log('\nPreview kombinasi (berdasarkan data saat ini):');
    combinationPreview.forEach(({ combinationKode, potential }) => {
      console.log(`  ${combinationKode}: +${potential}`);
    });

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

  const confixInserted = await applyConfixTags({ dryRun: false });
  console.log('\nPenambahan tagar konfiks:');
  confixInserted.forEach(({ confixKode, inserted }) => {
    console.log(`  ${confixKode}: +${inserted}`);
  });

  const combinationInserted = await applyCombinationTags({ dryRun: false });
  console.log('\nPenambahan tagar kombinasi:');
  combinationInserted.forEach(({ combinationKode, inserted }) => {
    console.log(`  ${combinationKode}: +${inserted}`);
  });

  console.log('\nSelesai!');
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  })
  .finally(() => db.close());
