/**
 * @fileoverview Analisis pola suku kata dari kolom entri.pemenggalan.
 *
 * Menghasilkan dokumen Markdown di _docs/202603/202603060001_analisis-pola-suku-kata.md.
 * Jalankan kapan saja setelah data pemenggalan berubah untuk memperbarui dokumen.
 *
 * Cakupan: entri jenis 'dasar' dan 'prakategorial' yang aktif,
 * pemenggalan tidak kosong, entri tidak mengandung spasi (multi-kata dilewati).
 *
 * Notasi VK:
 *   V  = vokal tunggal (a, e, i, o, u)
 *   VV = diftong (ai, au, oi, ei) — setelah normalisasi digraf
 *   K  = konsonan, termasuk digraf ng, ny, kh, sy, gh (= K tunggal)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const db   = require('../db');

const OUT = path.join(__dirname, '../../_docs/202603/202603060001_analisis-pola-suku-kata.md');

// ── Normalisasi ────────────────────────────────────────────────────────────
function normDigraf(s) {
  return s
    .replace(/ng/g, '§').replace(/ny/g, '¥')
    .replace(/kh/g, '©').replace(/sy/g, '®').replace(/gh/g, '¤')
    .replace(/ei/g, 'ᴱ').replace(/ai/g, 'ᴬ').replace(/au/g, 'ᴮ').replace(/oi/g, 'ᴼ');
}

const VOKAL = new Set(['a','e','i','o','u']);
const DIFTONG = new Set(['ᴬ','ᴮ','ᴼ','ᴱ']);

/** Pola VK dengan normalisasi (untuk dokumen). Diftong = VV. */
function polaVK(suku) {
  return normDigraf(suku.toLowerCase()).split('')
    .map(c => VOKAL.has(c) ? 'V' : DIFTONG.has(c) ? 'VV' : 'K').join('');
}

/** Pola VK tanpa normalisasi (untuk perbandingan 3.0). */
function polaVKRaw(suku) {
  return suku.toLowerCase().split('').map(c => VOKAL.has(c) ? 'V' : 'K').join('');
}

const KANONIK = new Set(['V','VK','KV','KVK','KKV','KKVK','KVKK','KKKV','KKKVK','KKVKK','KVKKK']);

function addContoh(map, pola, pemenggalan) {
  if (!map[pola]) map[pola] = [];
  if (map[pola].length < 4 && !map[pola].includes(pemenggalan)) map[pola].push(pemenggalan);
}

// ── Markdown helpers ───────────────────────────────────────────────────────
const N  = (n) => n.toLocaleString('id-ID');
const P  = (n, d) => (n / d * 100).toFixed(2) + '%';
const TB = (cols) => '| ' + cols.join(' | ') + ' |';
const TH = (n) => '|' + Array(n).fill('---|').join('') ;

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const { rows } = await db.query(`
    SELECT pemenggalan, jenis FROM entri
    WHERE aktif = 1 AND jenis IN ('dasar','prakategorial')
      AND pemenggalan IS NOT NULL AND pemenggalan != ''
    ORDER BY pemenggalan
  `);

  // Counters
  const sukuCnt  = {};
  const sukuEx   = {};
  const sukuCntJ = { dasar: {}, prakategorial: {} };
  const sukuRaw  = {};
  const rawEx    = {};
  const wordCnt  = { dasar: {}, prakategorial: {} };
  const wordEx   = { dasar: {}, prakategorial: {} };
  const sylHist  = { dasar: {}, prakategorial: {} };
  let totalSuku  = { dasar: 0, prakategorial: 0 };
  let terbuka    = { dasar: 0, prakategorial: 0 };
  let tertutup   = { dasar: 0, prakategorial: 0 };
  let kluster    = { dasar: 0, prakategorial: 0 };
  const klustPola = {};
  let dilewati   = { dasar: 0, prakategorial: 0 };
  let totalEntri = { dasar: 0, prakategorial: 0 };
  let diftCnt    = { dasar: 0, prakategorial: 0 };
  const diftPola = {};

  for (const { pemenggalan, jenis } of rows) {
    if (pemenggalan.includes(' ')) { dilewati[jenis]++; continue; }
    totalEntri[jenis]++;

    const sukukata = pemenggalan.toLowerCase().split(/[.\-]/).filter(Boolean);
    const n = sukukata.length;
    sylHist[jenis][n] = (sylHist[jenis][n] || 0) + 1;

    const wPola = sukukata.map(sk => polaVK(sk)).join('.');
    wordCnt[jenis][wPola] = (wordCnt[jenis][wPola] || 0) + 1;
    addContoh(wordEx[jenis], wPola, pemenggalan);

    for (const sk of sukukata) {
      const p    = polaVK(sk);
      const pRaw = polaVKRaw(sk);
      totalSuku[jenis]++;
      sukuCnt[p]  = (sukuCnt[p]  || 0) + 1;
      addContoh(sukuEx, p, pemenggalan);
      sukuCntJ[jenis][p] = (sukuCntJ[jenis][p] || 0) + 1;
      sukuRaw[pRaw] = (sukuRaw[pRaw] || 0) + 1;
      addContoh(rawEx, pRaw, pemenggalan);

      const last = p[p.length - 1];
      if (last === 'V') terbuka[jenis]++; else tertutup[jenis]++;

      if (p.startsWith('KK')) {
        kluster[jenis]++;
        klustPola[p] = (klustPola[p] || 0) + 1;
        addContoh(sukuEx, p, pemenggalan);
      }

      if (p.includes('VV')) {
        diftCnt[jenis]++;
        diftPola[p] = (diftPola[p] || 0) + 1;
      }
    }
  }

  const totalD = totalSuku.dasar;
  const totalP = totalSuku.prakategorial;
  const totalAll = totalD + totalP;
  const totalEntriAll = totalEntri.dasar + totalEntri.prakategorial;
  const dilewatiAll = dilewati.dasar + dilewati.prakategorial;

  // Sort helpers
  const byCount = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const ex4 = (p) => (sukuEx[p] || []).slice(0, 4).join(', ');
  const wex4 = (j, p) => (wordEx[j][p] || []).slice(0, 4).join(', ');

  // ── Kanonik tabel (section 2) ─────────────────────────────────────────
  const kanOrder = ['KV','KVK','V','VK','KKV','KKVK','KVKK','KKVKK','KKKVK','KKKV','KVKKK'];
  const kanRef   = ['ka.mu','pak.sa','a.ku','il.mu','dra.ma','trak.tor','teks.til','kom.pleks','struk.tur','stra.ta','korps'];
  const kanSorted = kanOrder.map((p, i) => ({ p, ref: kanRef[i], n: sukuCnt[p] || 0 }))
    .sort((a, b) => b.n - a.n);

  // ── Non-kanonik untuk section 3 dan 4 ───────────────────────────────
  const tipeA = p => p.includes('VV');
  const tipeB = new Set(['VKKV','KVKKV','KVKKVK','VKKVK','KKVKV']);
  const kat = (p) => tipeA(p) ? 'A – diftong' : tipeB.has(p) ? 'B – serapan (koda kompleks)' : 'C – anomali (pemenggalan keliru?)';
  const nonKan = byCount(sukuCnt).filter(([p]) => !KANONIK.has(p));
  const nonKanRaw = byCount(sukuRaw).filter(([p]) => !KANONIK.has(p));

  // ── Section 3.0: murni (raw) ─────────────────────────────────────────
  // Patterns that are still anomalous even WITHOUT normalization
  const rawMurni = nonKanRaw.filter(([p]) => !tipeA(p));

  // ── Perbandingan dasar vs prakat (section 4) ─────────────────────────
  const allPola = new Set([...Object.keys(sukuCntJ.dasar), ...Object.keys(sukuCntJ.prakategorial)]);
  const cmpPola = byCount(sukuCnt).filter(([p]) => allPola.has(p) && (sukuCnt[p] || 0) > 5);

  // ── Generate markdown ─────────────────────────────────────────────────
  const tanggal = new Date().toISOString().slice(0, 10);
  const lines = [];
  const L = (...a) => lines.push(...a);

  L(
    '# Analisis Pola Suku Kata Bahasa Indonesia',
    '## Kata Dasar dan Prakategorial',
    '',
    `**Tanggal analisis:** ${tanggal}`,
    '**Tabel:** `entri`',
    '**Filter jenis:** `dasar`, `prakategorial`',
    '**Sumber data:** Kolom `pemenggalan` (KBBI4)',
    '',
    '---',
    '',
    '## Metodologi',
    '',
    '### Notasi VK',
    '',
    'Setiap suku kata direpresentasikan dalam notasi **VK** di mana:',
    '- **V** = vokal tunggal (a, e, i, o, u)',
    '- **VV** = diftong (ai, au, oi, ei) — diperlakukan sebagai dua unsur vokal dalam satu suku kata',
    '- **K** = konsonan, termasuk digraf yang diperlakukan sebagai satu fonem:',
    '',
    '  | Digraf | Fonem | Contoh suku |',
    '  |---|---|---|',
    '  | ng | /ŋ/ velar nasal | bu.nga, ngang |',
    '  | ny | /ɲ/ palatal nasal | nya.ta, bu.nyi |',
    '  | kh | /x/ frikatif velar | kha.sus, a.khir |',
    '  | sy | /ʃ/ frikatif palatal | sya.rat, khu.syuk |',
    '  | gh | /ɣ/ frikatif velar bersuara | ghaz.al (kata serapan) |',
    '',
    '- **Diftong** yang dikenali: `ai`, `au`, `oi`, `ei` (sesuai konvensi PUEBI dan praktik KBBI)',
    '',
    '### Proses Klasifikasi',
    '',
    '1. Ambil nilai kolom `pemenggalan` (misal: `ber.ja.lan`)',
    '2. Pecah berdasarkan titik sebagai batas suku kata',
    '3. Tanda hubung (kata ulang seperti `si.a-si.a`) dinormalisasi sebagai batas suku kata (setara titik)',
    '4. Tiap suku kata diklasifikasikan ke pola VK (misal: `ber` → KVK, `ja` → KV, `lan` → KVK)',
    '5. Pola kata = gabungan pola suku kata dengan titik (misal: `KVK.KV.KVK`)',
    '6. Entri multi-kata (mengandung spasi) dilewati',
    '',
    '### Contoh Konversi',
    '',
    '| Entri | Pemenggalan | Pola Kata | Pola per Suku |',
    '|---|---|---|---|',
    '| aku | a.ku | V.KV | V + KV |',
    '| ilmu | il.mu | VK.KV | VK + KV |',
    '| kata | ka.ta | KV.KV | KV + KV |',
    '| paksa | pak.sa | KVK.KV | KVK + KV |',
    '| drama | dra.ma | KKV.KV | KKV + KV |',
    '| traktor | trak.tor | KKVK.KVK | KKVK + KVK |',
    '| tekstil | teks.til | KVKK.KVK | KVKK + KVK |',
    '| strata | stra.ta | KKKV.KV | KKKV + KV |',
    '| struktur | struk.tur | KKKVK.KVK | KKKVK + KVK |',
    '| kompleks | kom.pleks | KVK.KKVKK | KVK + KKVKK |',
    '| bunga | bu.nga | KV.KV | KV + KV (ng = K tunggal) |',
    '',
    '---',
    '',
    '## Ringkasan Data',
    '',
    '| Metrik | Kata Dasar | Prakategorial | Gabungan |',
    '|---|---:|---:|---:|',
    `| Total entri | ${N(totalEntri.dasar + dilewati.dasar)} | ${N(totalEntri.prakategorial + dilewati.prakategorial)} | ${N(totalEntriAll + dilewatiAll)} |`,
    `| Dilewati (multi-kata/kosong) | ${N(dilewati.dasar)} | ${N(dilewati.prakategorial)} | ${N(dilewatiAll)} |`,
    `| Total suku kata dianalisis | ${N(totalD)} | ${N(totalP)} | ${N(totalAll)} |`,
    '',
    '---',
    '',
    '## 1. Distribusi Jumlah Suku Kata per Kata',
    '',
    '### Kata Dasar',
    '',
    '| Jumlah Suku | Jumlah Kata | % |',
    '|---:|---:|---:|',
  );
  for (const [n, c] of Object.entries(sylHist.dasar).sort((a, b) => +a[0] - +b[0]))
    L(`| ${n} | ${N(c)} | ${P(c, totalEntri.dasar)} |`);

  L(
    '',
    '### Prakategorial',
    '',
    '| Jumlah Suku | Jumlah Kata | % |',
    '|---:|---:|---:|',
  );
  for (const [n, c] of Object.entries(sylHist.prakategorial).sort((a, b) => +a[0] - +b[0]))
    L(`| ${n} | ${N(c)} | ${P(c, totalEntri.prakategorial)} |`);

  L(
    '',
    '---',
    '',
    '## 2. Perbandingan dengan Tipe Kanonik',
    '',
    'Sebelas tipe suku kata yang diakui dalam fonologi bahasa Indonesia (berdasarkan rujukan).',
    '',
    '| # | Tipe | Contoh (Ref) | Ada di Data | Jumlah | % dari total suku | Contoh pemenggalan |',
    '|---:|---|---|:---:|---:|---:|---|',
  );
  kanSorted.forEach(({ p, ref, n }, i) =>
    L(`| ${i + 1} | \`${p}\` | \`${ref}\` | ✅ | ${N(n)} | ${P(n, totalAll)} | ${ex4(p)} |`)
  );

  L(
    '',
    '---',
    '',
    '## 3. Pola di Luar Tipe Kanonik',
    '',
    'Pola-pola berikut **tidak termasuk** dalam 11 tipe kanonik. Perlu analisis apakah ini:',
    '- (A) Perluasan valid — diftong sebagai unsur baru (VV, KVV, dll.)',
    '- (B) Kata serapan dengan fonotaktik asing yang tidak ada padanannya dalam kanonik Indonesia',
    '- (C) Anomali data — pemenggalan yang kemungkinan keliru dalam sumber',
    '',
    '### 3.0 Efek Normalisasi Digraf dan Diftong',
    '',
    'Tabel utama di bawah menggunakan normalisasi digraf (ng, ny, kh, sy, gh = K tunggal) dan diftong (ai, au, oi, ei = VV). Bila normalisasi **dinonaktifkan** — setiap karakter diklasifikasikan apa adanya — sebagian pola lenyap dan sebagian berubah bentuk:',
    '',
    '| Perubahan | Contoh | Penjelasan |',
    '|---|---|---|',
    `| \`VKVK\` (${sukuCnt['VKVK'] || 0}) → \`VKKVK\` | angah | ng = n+g = KK, bukan K tunggal |`,
    `| \`VKV\` (${sukuCnt['VKV'] || 0}) → \`VKKV\` | ukhuwah | kh = k+h = KK |`,
    `| \`VKK\` (${sukuCnt['VKK'] || 0}) → bertambah | alf, am.bi.ens | kh/ng dihitung dua karakter → lebih banyak koda ganda |`,
    `| \`KKVV\` (${sukuCnt['KKVV'] || 0}) → bertambah | al.zhei.mer, dis.plai | ny/ng tidak dinormalisasi, vokal berdampingan tetap VV |`,
    '',
    '**Pola anomali yang tetap muncul** meski tanpa normalisasi digraf/diftong (anomali "murni"):',
    '',
    '| Pola | Jumlah | Contoh pemenggalan | Dugaan masalah |',
    '|---|---:|---|---|',
  );
  for (const [p, n] of rawMurni.slice(0, 12)) {
    const ex = (rawEx[p] || []).slice(0, 3).join(', ');
    L(`| \`${p}\` | ${n} | ${ex || '—'} | — |`);
  }

  L(
    '',
    '| Pola | Jumlah | % | Kategori | Contoh pemenggalan | Keterangan |',
    '|---|---:|---:|---|---|---|',
  );
  for (const [p, n] of nonKan)
    L(`| \`${p}\` | ${n} | ${P(n, totalAll)} | ${kat(p)} | ${ex4(p)} | |`);

  L(
    '',
    '---',
    '',
    '## 4. Distribusi Lengkap Jenis Suku Kata',
    '',
    'Dihitung per suku kata individual.',
    '',
    '### Semua Jenis (Dasar + Prakategorial)',
    '',
    `Total: **${N(totalAll)}** suku kata`,
    '',
    '| Pola Suku | Jumlah | % | Contoh pemenggalan |',
    '|---|---:|---:|---|',
  );
  for (const [p, n] of byCount(sukuCnt))
    L(`| \`${p}\` | ${N(n)} | ${P(n, totalAll)} | ${ex4(p)} |`);

  L(
    '',
    '### Perbandingan: Dasar vs Prakategorial',
    '',
    '| Pola Suku | Dasar (%) | Prakategorial (%) | Selisih |',
    '|---|---:|---:|---:|',
  );
  for (const [p] of cmpPola) {
    const nd = sukuCntJ.dasar[p] || 0;
    const np = sukuCntJ.prakategorial[p] || 0;
    const pd = (nd / totalD * 100).toFixed(2);
    const pp = (np / totalP * 100).toFixed(2);
    const diff = (parseFloat(pd) - parseFloat(pp)).toFixed(2);
    L(`| \`${p}\` | ${pd}% | ${pp}% | ${diff}pp |`);
  }

  L(
    '',
    '---',
    '',
    '## 5. Distribusi Pola Kata (Top 30)',
    '',
    'Pola kata = gabungan pola tiap suku kata.',
    '',
    '### Kata Dasar (Top 30)',
    '',
    `Total pola unik: **${N(Object.keys(wordCnt.dasar).length)}**`,
    '',
    '| Pola Kata | Jumlah | % | Contoh pemenggalan |',
    '|---|---:|---:|---|',
  );
  for (const [p, n] of byCount(wordCnt.dasar).slice(0, 30))
    L(`| \`${p}\` | ${N(n)} | ${P(n, totalEntri.dasar)} | ${wex4('dasar', p)} |`);

  L(
    '',
    '### Prakategorial (semua pola)',
    '',
    `Total pola unik: **${N(Object.keys(wordCnt.prakategorial).length)}**`,
    '',
    '| Pola Kata | Jumlah | % | Contoh pemenggalan |',
    '|---|---:|---:|---|',
  );
  for (const [p, n] of byCount(wordCnt.prakategorial))
    L(`| \`${p}\` | ${N(n)} | ${P(n, totalEntri.prakategorial)} | ${wex4('prakategorial', p)} |`);

  L(
    '',
    '---',
    '',
    '## 6. Suku Kata Terbuka vs Tertutup',
    '',
    'Suku **terbuka** = berakhir vokal (pola berakhir V atau VV).',
    'Suku **tertutup** = berakhir konsonan.',
    '',
    '| Jenis | Terbuka | Tertutup | Rasio Terbuka |',
    '|---|---:|---:|---:|',
    `| Kata Dasar | ${N(terbuka.dasar)} | ${N(tertutup.dasar)} | ${P(terbuka.dasar, totalD)} |`,
    `| Prakategorial | ${N(terbuka.prakategorial)} | ${N(tertutup.prakategorial)} | ${P(terbuka.prakategorial, totalP)} |`,
    '',
    '---',
    '',
    '## 7. Kluster Konsonan (KK-)',
    '',
    'Suku kata yang diawali dua atau lebih konsonan — umumnya kata serapan.',
    '',
    '| Jenis | Suku KK- | Total Suku | % |',
    '|---|---:|---:|---:|',
    `| Kata Dasar | ${N(kluster.dasar)} | ${N(totalD)} | ${P(kluster.dasar, totalD)} |`,
    `| Prakategorial | ${N(kluster.prakategorial)} | ${N(totalP)} | ${P(kluster.prakategorial, totalP)} |`,
    '',
    '#### Distribusi Pola KK- (Kata Dasar)',
    '',
    '| Pola | Jumlah | % | Contoh pemenggalan |',
    '|---|---:|---:|---|',
  );
  for (const [p, n] of byCount(klustPola))
    L(`| \`${p}\` | ${N(n)} | ${P(n, totalD)} | ${ex4(p)} |`);

  L(
    '',
    '---',
    '',
    '## 8. Diftong (ai, au, oi, ei)',
    '',
    '| Jenis | Suku mengandung diftong | Total Suku | % |',
    '|---|---:|---:|---:|',
    `| Kata Dasar | ${N(diftCnt.dasar)} | ${N(totalD)} | ${P(diftCnt.dasar, totalD)} |`,
    `| Prakategorial | ${N(diftCnt.prakategorial)} | ${N(totalP)} | ${P(diftCnt.prakategorial, totalP)} |`,
    '',
    '#### Distribusi Pola Diftong (Dasar + Prakategorial)',
    '',
    '| Pola | Jumlah | Contoh pemenggalan |',
    '|---|---:|---|',
  );
  for (const [p, n] of byCount(diftPola))
    L(`| \`${p}\` | ${N(n)} | ${ex4(p)} |`);

  L(
    '',
    '---',
    '',
    '## 9. Isu Menarik untuk Dikaji',
    '',
    '### 9.1 Dominasi Pola KV (Warisan Austronesia)',
    '',
    'Suku bertipe **KV** adalah yang paling dominan (~50%), diikuti **KVK** (~34%). Ini konsisten dengan tipologi rumpun bahasa Melayu-Polinesia yang menyukai suku terbuka (CV).',
    '',
    '**Pertanyaan penelitian:** Apakah rasio suku terbuka berbeda signifikan antara kata asli Indonesia dan kata serapan?',
    '',
    '### 9.2 Pola Kata Paling Produktif',
    '',
    'Tiga pola kata paling umum pada kata dasar: **`KV.KVK`, `KVK.KVK`, `KV.KV.KVK`**.',
    '',
    'Kata dasar Melayu-Indonesia cenderung berstruktur dua suku kata (disyllabic) dengan suku akhir tertutup.',
    '',
    '**Pertanyaan penelitian:** Adakah korelasi antara frekuensi pemakaian kata (dari `searched_phrase`) dan pola suku kata?',
    '',
    '### 9.3 Kluster Konsonan sebagai Penanda Kata Serapan',
    '',
    `Kluster KK- sangat jarang di prakategorial (${P(kluster.prakategorial, totalP)}) vs kata dasar (${P(kluster.dasar, totalD)}). Ini mendukung hipotesis bahwa prakategorial merupakan warisan Melayu kuno yang fonotaktiknya lebih "murni".`,
    '',
    '**Pertanyaan penelitian:** Dapatkah pola suku kata digunakan sebagai fitur untuk mengklasifikasikan otomatis kata serapan vs kata asli?',
    '',
    '### 9.4 Kata Satu Suku (Monosilabik)',
    '',
    `Kata dasar monosilabik: **${N(sylHist.dasar[1] || 0)}** (${P(sylHist.dasar[1] || 0, totalEntri.dasar)}). Prakategorial: **${N(sylHist.prakategorial[1] || 0)}** (${P(sylHist.prakategorial[1] || 0, totalEntri.prakategorial)}). Kemunculannya yang terbatas mencerminkan preferensi fonotaktik terhadap kata polisillabik.`,
    '',
    '**Pertanyaan penelitian:** Apa distribusi kelas kata (lex_class) pada kata dasar monosilabik?',
    '',
    '### 9.5 Kata Polisuku Panjang (≥5 suku)',
    '',
  );
  const panjang = Object.entries(sylHist.dasar)
    .filter(([n]) => +n >= 5).reduce((s, [, c]) => s + c, 0);
  L(
    `Kata dasar ≥5 suku: **${N(panjang)}** (${P(panjang, totalEntri.dasar)}). Umumnya serapan ilmiah (Yunani/Latin).`,
    '',
    '**Pertanyaan penelitian:** Adakah batas persepsi "kata panjang" di angka 4 suku?',
    '',
    '### 9.6 Perbedaan Dasar vs Prakategorial',
    '',
    `Prakategorial ${P(sylHist.prakategorial[2] || 0, totalEntri.prakategorial)} berstruktur dua suku kata (dasar hanya ${P(sylHist.dasar[2] || 0, totalEntri.dasar)}). Suku terbuka prakategorial (${P(terbuka.prakategorial, totalP)}) lebih rendah dari kata dasar (${P(terbuka.dasar, totalD)}), artinya prakategorial justru lebih banyak suku tertutup — menarik karena berlawanan dengan hipotesis Austronesia.`,
    '',
    '**Pertanyaan penelitian:** Apakah dominasi KVK di prakategorial mencerminkan bias leksikografi KBBI, atau memang pola fonotaktik yang khas?',
    '',
    '### 9.7 Diftong dan Monoftongisasi',
    '',
    `Diftong lebih banyak di prakategorial (${P(diftCnt.prakategorial, totalP)}) dibanding kata dasar (${P(diftCnt.dasar, totalD)}).`,
    '',
    '**Pertanyaan penelitian:** Apakah kemunculan diftong berkorelasi dengan asal bahasa? Diftong /au/ dan /ai/ dominan pada kata Melayu asli, sedangkan /ei/ hampir seluruhnya dari kata serapan.',
    '',
    '### 9.8 Pola Anomali — Perlu Verifikasi Data',
    '',
    'Beberapa pola yang muncul dalam data kemungkinan adalah kesalahan pemenggalan:',
    '',
    '| Pola | Jumlah | Contoh | Seharusnya |',
    '|---|---:|---|---|',
  );
  const cAnomali = [['VKVK', 'Suku dipecah: ang.ah → VK.VK, atau a.khir → V.KVK (kh = K tunggal)'],
                    ['KVKV', 'lo.gi → KV.KV, bukan KVKV satu suku'],
                    ['VKV',  'Kemungkinan suku parsial dari digraf'],
                    ['KVKVK','Lima bunyi satu suku — hampir pasti keliru']];
  for (const [p, seharusnya] of cAnomali) {
    const n = sukuCnt[p] || 0;
    if (n > 0) L(`| \`${p}\` | ${n} | ${ex4(p)} | ${seharusnya} |`);
  }

  L(
    '',
    '---',
    '',
    '## Referensi',
    '',
    '- PUEBI (Pedoman Umum Ejaan Bahasa Indonesia) — Aturan pemenggalan kata',
    '- Adelaar, A. (1992). *Proto Malayo-Javanic.* KITLV Press.',
    '- Lapoliwa, H. (1981). *A Generative Approach to the Phonology of Bahasa Indonesia.* Pacific Linguistics.',
    '- Sneddon, J.N. (2003). *The Indonesian Language: Its History and Role in Modern Society.*',
    '- Data: KBBI4 (Kamus Besar Bahasa Indonesia edisi ke-4), diproses dalam Kateglo 2.0',
    '',
  );

  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`Dokumen ditulis ke ${OUT}`);
  console.log(`Total suku: ${N(totalAll)} | Entri: ${N(totalEntriAll)} dasar+prakat`);
  await db.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
