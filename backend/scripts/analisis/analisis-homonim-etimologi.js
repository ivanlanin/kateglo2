/**
 * @fileoverview Analisis dan auto-kandidat pemetaan homonim etimologi
 *
 * Dua kasus yang ditangani:
 * 1. Orphan (entri_id IS NULL, 156 baris): re-match via indeks
 * 2. Homonim mismatch (233 indeks): cari entri homonim yang definisinya
 *    paling cocok dengan sumber_definisi / arti_asal di etimologi
 *
 * Mode:
 *   node scripts/analisis/analisis-homonim-etimologi.js           -- ringkasan
 *   node scripts/analisis/analisis-homonim-etimologi.js --orphan  -- detail orphan + kandidat
 *   node scripts/analisis/analisis-homonim-etimologi.js --homonim -- detail mismatch + kandidat
 *   node scripts/analisis/analisis-homonim-etimologi.js --csv     -- simpan hasil ke CSV
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const db = require('../../db');

const args = process.argv.slice(2);
const modeOrphan  = args.includes('--orphan');
const modeHomonim = args.includes('--homonim');
const modeCsv     = args.includes('--csv');
const modeAll     = !modeOrphan && !modeHomonim;

// ---------------------------------------------------------------------------
// Utilitas: hitung skor kecocokan teks sederhana
// Tokenisasi kata, hitung irisan / union (Jaccard-like)
// ---------------------------------------------------------------------------
function skorKecocokan(teksA, teksB) {
  if (!teksA || !teksB) return 0;
  const tokenize = (s) => s.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const a = new Set(tokenize(teksA));
  const b = new Set(tokenize(teksB));
  if (a.size === 0 || b.size === 0) return 0;
  let irisan = 0;
  for (const token of a) { if (b.has(token)) irisan++; }
  const gabungan = a.size + b.size - irisan;
  return irisan / gabungan;
}

// ---------------------------------------------------------------------------
// 1. Analisis orphan (entri_id IS NULL)
// ---------------------------------------------------------------------------
async function analisisOrphan() {
  // Orphan: etimologi tanpa entri_id
  const orphan = await db.query(`
    SELECT et.id, et.indeks, et.homonim, et.lafal, et.bahasa,
           et.sumber_definisi, et.arti_asal
    FROM etimologi et
    WHERE et.entri_id IS NULL
    ORDER BY et.indeks ASC, et.id ASC
  `);

  console.log(`\n=== ORPHAN (entri_id IS NULL): ${orphan.rows.length} baris ===`);

  const hasilOrphan = [];

  for (const et of orphan.rows) {
    // Cari kandidat entri berdasarkan indeks (case-insensitive)
    const kandidat = await db.query(`
      SELECT e.id, e.entri, e.indeks, e.homonim, e.lafal
      FROM entri e
      WHERE LOWER(e.indeks) = LOWER($1) AND e.aktif = 1
      ORDER BY e.homonim ASC NULLS LAST, e.id ASC
    `, [et.indeks]);

    let rekomendasiId = null;
    let rekomendasiEntri = null;
    let rekomendasiSkor = 0;
    let catatan = '';

    if (kandidat.rows.length === 0) {
      catatan = 'tidak ada entri dengan indeks ini';
    } else if (kandidat.rows.length === 1) {
      rekomendasiId = kandidat.rows[0].id;
      rekomendasiEntri = kandidat.rows[0].entri;
      catatan = 'satu kandidat unik';
    } else {
      // Coba cocokkan via homonim
      const byHomonim = kandidat.rows.filter(k => k.homonim === et.homonim);
      if (byHomonim.length === 1) {
        rekomendasiId = byHomonim[0].id;
        rekomendasiEntri = byHomonim[0].entri;
        catatan = 'cocok via homonim';
      } else {
        // Coba skor kecocokan definisi
        let skorTertinggi = -1;
        for (const k of kandidat.rows) {
          const defResult = await db.query(`
            SELECT string_agg(makna, ' ') AS def
            FROM makna WHERE entri_id = $1 AND aktif = TRUE
          `, [k.id]);
          const defTeks = defResult.rows[0]?.def || '';
          const haystack = `${et.sumber_definisi || ''} ${et.arti_asal || ''}`;
          const skor = skorKecocokan(haystack, defTeks);
          if (skor > skorTertinggi) {
            skorTertinggi = skor;
            rekomendasiId = k.id;
            rekomendasiEntri = k.entri;
            rekomendasiSkor = skor;
          }
        }
        catatan = skorTertinggi > 0.05
          ? `multi-kandidat, best-match skor ${rekomendasiSkor.toFixed(3)}`
          : 'multi-kandidat, skor rendah — perlu review manual';
        if (skorTertinggi <= 0.05) rekomendasiId = null;
      }
    }

    const baris = {
      etimologi_id: et.id,
      indeks: et.indeks,
      homonim: et.homonim,
      bahasa: et.bahasa,
      arti_asal: (et.arti_asal || '').slice(0, 60),
      jml_kandidat: kandidat.rows.length,
      rekomendasi_entri_id: rekomendasiId,
      rekomendasi_entri: rekomendasiEntri,
      catatan,
    };
    hasilOrphan.push(baris);
  }

  const bisaAutoMatch  = hasilOrphan.filter(h => h.rekomendasi_entri_id && h.catatan !== 'multi-kandidat, skor rendah — perlu review manual');
  const perluManual    = hasilOrphan.filter(h => !h.rekomendasi_entri_id);

  console.log(`  Bisa di-auto-match  : ${bisaAutoMatch.length}`);
  console.log(`  Perlu review manual : ${perluManual.length}`);

  if (modeOrphan || modeAll) {
    console.log('\n--- Detail (20 pertama) ---');
    hasilOrphan.slice(0, 20).forEach(h => {
      const target = h.rekomendasi_entri_id ? `→ entri_id=${h.rekomendasi_entri_id} "${h.rekomendasi_entri}"` : '→ tidak ada rekomendasi';
      console.log(`  [${h.etimologi_id}] ${h.indeks}(hom=${h.homonim}) ${h.bahasa} | ${target} | ${h.catatan}`);
    });
  }

  return hasilOrphan;
}

// ---------------------------------------------------------------------------
// 2. Analisis homonim mismatch
// ---------------------------------------------------------------------------
async function analisisHomonimMismatch() {
  // Cari entri_id yang punya etimologi dengan homonim BERBEDA dari entri terkait
  const mismatch = await db.query(`
    SELECT et.id        AS etim_id,
           et.indeks,
           et.homonim   AS etim_homonim,
           et.bahasa,
           et.sumber_definisi,
           et.arti_asal,
           en.id        AS entri_id,
           en.homonim   AS entri_homonim,
           en.entri
    FROM etimologi et
    JOIN entri en ON en.id = et.entri_id
    WHERE et.homonim IS NOT NULL
      AND et.homonim != COALESCE(en.homonim, 0)
    ORDER BY et.indeks ASC, et.id ASC
    LIMIT 500
  `);

  console.log(`\n=== HOMONIM MISMATCH: ${mismatch.rows.length} baris (maks 500) ===`);

  const hasilMismatch = [];

  for (const et of mismatch.rows) {
    // Cari semua entri aktif dengan indeks yang sama
    const siblingsResult = await db.query(`
      SELECT e.id, e.entri, e.homonim, e.lafal
      FROM entri e
      WHERE LOWER(e.indeks) = LOWER($1) AND e.aktif = 1
      ORDER BY e.homonim ASC NULLS LAST, e.id ASC
    `, [et.indeks]);

    const siblings = siblingsResult.rows;
    let rekomendasiId = et.entri_id; // default: tidak berubah
    let rekomendasiEntri = et.entri;
    let catatan = '';

    // Coba cocokkan homonim etimologi dengan salah satu sibling
    const byHomonim = siblings.filter(s => s.homonim === et.etim_homonim);
    if (byHomonim.length === 1) {
      rekomendasiId = byHomonim[0].id;
      rekomendasiEntri = byHomonim[0].entri;
      catatan = `homonim ${et.etim_homonim} → entri_id=${rekomendasiId}`;
    } else {
      // Skor kecocokan definisi terhadap semua sibling
      let skorTertinggi = -1;
      for (const s of siblings) {
        const defResult = await db.query(`
          SELECT string_agg(makna, ' ') AS def
          FROM makna WHERE entri_id = $1 AND aktif = TRUE
        `, [s.id]);
        const defTeks = defResult.rows[0]?.def || '';
        const haystack = `${et.sumber_definisi || ''} ${et.arti_asal || ''}`;
        const skor = skorKecocokan(haystack, defTeks);
        if (skor > skorTertinggi) {
          skorTertinggi = skor;
          if (skor > 0.05) {
            rekomendasiId = s.id;
            rekomendasiEntri = s.entri;
          }
        }
      }
      catatan = skorTertinggi > 0.05
        ? `skor makna ${skorTertinggi.toFixed(3)} → entri_id=${rekomendasiId}`
        : `skor rendah (${skorTertinggi.toFixed(3)}) — review manual`;
    }

    hasilMismatch.push({
      etim_id: et.etim_id,
      indeks: et.indeks,
      etim_homonim: et.etim_homonim,
      entri_homonim_saat_ini: et.entri_homonim,
      bahasa: et.bahasa,
      arti_asal: (et.arti_asal || '').slice(0, 60),
      rekomendasi_entri_id: rekomendasiId,
      rekomendasi_entri: rekomendasiEntri,
      catatan,
    });
  }

  const adaPerubahan  = hasilMismatch.filter(h => h.rekomendasi_entri_id !== h.entri_id_saat_ini);
  const perluManual   = hasilMismatch.filter(h => h.catatan.includes('review manual'));

  console.log(`  Ada perubahan  : ${adaPerubahan.length}`);
  console.log(`  Perlu manual   : ${perluManual.length}`);

  if (modeHomonim) {
    console.log('\n--- Detail (20 pertama) ---');
    hasilMismatch.slice(0, 20).forEach(h => {
      console.log(`  [${h.etim_id}] ${h.indeks} etim_hom=${h.etim_homonim} vs entri_hom=${h.entri_homonim_saat_ini} | ${h.catatan}`);
    });
  }

  return hasilMismatch;
}

// ---------------------------------------------------------------------------
// Ekspor CSV
// ---------------------------------------------------------------------------
function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = keys.join(',');
  const lines = rows.map(r => keys.map(k => escape(r[k])).join(','));
  return [header, ...lines].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Analisis Pemetaan Homonim Etimologi ===');
  console.log(`Mode: ${modeOrphan ? '--orphan' : ''} ${modeHomonim ? '--homonim' : ''} ${modeCsv ? '--csv' : ''} ${modeAll && !modeOrphan && !modeHomonim ? '(ringkasan)' : ''}`);

  const hasilOrphan   = await analisisOrphan();
  const hasilMismatch = await analisisHomonimMismatch();

  if (modeCsv) {
    const now = new Date();
    const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
    const dirOut = path.join(__dirname, '../../docs/202603');
    fs.mkdirSync(dirOut, { recursive: true });

    const fileOrphan   = path.join(dirOut, `${ts}_kandidat-rematch-orphan-etimologi.csv`);
    const fileMismatch = path.join(dirOut, `${ts}_kandidat-rematch-homonim-etimologi.csv`);

    fs.writeFileSync(fileOrphan,   toCsv(hasilOrphan),   'utf8');
    fs.writeFileSync(fileMismatch, toCsv(hasilMismatch), 'utf8');

    console.log(`\nCSV disimpan:`);
    console.log(`  ${fileOrphan}`);
    console.log(`  ${fileMismatch}`);
  }

  await db.close();
}

main().catch(e => { console.error(e.message); db.close(); process.exit(1); });
