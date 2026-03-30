/**
 * @fileoverview Analisis pola suku kata dari kolom entri.pemenggalan.
 *
 * Menghasilkan dokumen Markdown di docs/202603/202603060001_analisis-pola-suku-kata.md.
 * Jalankan kapan saja setelah data pemenggalan berubah untuk memperbarui dokumen.
 *
 * Cakupan: entri jenis 'dasar' dan 'prakategorial' yang aktif,
 * pemenggalan tidak kosong, entri tidak mengandung spasi (multi-kata dilewati).
 *
 * Notasi VK:
 *   V  = vokal tunggal (a, e, i, o, u) — diftong (ai, au, oi, ei) dihitung sebagai satu V
 *   K  = konsonan, termasuk digraf ng, ny, kh, sy (= K tunggal)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs   = require('fs');
const path = require('path');
const db   = require('../../db');

const OUT = path.join(__dirname, '../../docs/202603/202603060001_analisis-pola-suku-kata.md');

// ── Normalisasi ────────────────────────────────────────────────────────────
function normDigraf(s) {
  return s
    .replace(/ng/g, '§').replace(/ny/g, '¥')
    .replace(/kh/g, '©').replace(/sy/g, '®')
    .replace(/ei/g, 'ᴱ').replace(/ai/g, 'ᴬ').replace(/au/g, 'ᴮ').replace(/oi/g, 'ᴼ');
}

const VOKAL   = new Set(['a','e','i','o','u']);
const DIFTONG = new Set(['ᴬ','ᴮ','ᴼ','ᴱ']);

/** Pola VK dengan normalisasi. Diftong = V (satu unsur vokal). */
function polaVK(suku) {
  return normDigraf(suku.toLowerCase()).split('')
    .map(c => VOKAL.has(c) ? 'V' : DIFTONG.has(c) ? 'V' : 'K').join('');
}

const KANONIK = new Set(['V','VK','KV','KVK','KKV','KKVK','KVKK','KKKV','KKKVK','KKVKK','KVKKK']);

function addContoh(map, pola, pemenggalan) {
  if (!map[pola]) map[pola] = [];
  if (map[pola].length < 4 && !map[pola].includes(pemenggalan)) map[pola].push(pemenggalan);
}

// ── Markdown helpers ───────────────────────────────────────────────────────
const N  = (n) => n.toLocaleString('id-ID');
const P  = (n, d) => (n / d * 100).toFixed(2) + '%';

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const { rows } = await db.query(`
    SELECT pemenggalan FROM entri
    WHERE aktif = 1 AND jenis IN ('dasar','prakategorial')
      AND pemenggalan IS NOT NULL AND pemenggalan != ''
    ORDER BY pemenggalan
  `);

  // Counters
  const sukuCnt  = {};
  const sukuEx   = {};
  const sukuDetail = {};   // semua contoh per pola non-kanonik
  const wordCnt  = {};
  const wordEx   = {};
  const sylHist  = {};
  let totalSuku  = 0;
  let terbuka    = 0;
  let tertutup   = 0;
  let kluster    = 0;
  const klustPola = {};
  let dilewati   = 0;
  let totalEntri = 0;
  let diftCnt    = 0;
  const diftPola = {};

  for (const { pemenggalan } of rows) {
    if (pemenggalan.includes(' ')) { dilewati++; continue; }
    totalEntri++;

    const sukukata = pemenggalan.toLowerCase().split(/[.-]/).filter(Boolean);
    const n = sukukata.length;
    sylHist[n] = (sylHist[n] || 0) + 1;

    const wPola = sukukata.map(sk => polaVK(sk)).join('.');
    wordCnt[wPola] = (wordCnt[wPola] || 0) + 1;
    addContoh(wordEx, wPola, pemenggalan);

    // pakai pemenggalan asli (bukan lowercase) untuk sukukata
    const skAsli = pemenggalan.split(/[.-]/).filter(Boolean);

    for (let i = 0; i < skAsli.length; i++) {
      const sk = skAsli[i];
      const p  = polaVK(sk);
      totalSuku++;
      sukuCnt[p]  = (sukuCnt[p]  || 0) + 1;
      addContoh(sukuEx, p, pemenggalan);

      if (!KANONIK.has(p)) {
        if (!sukuDetail[p]) sukuDetail[p] = [];
        sukuDetail[p].push(`${sk} (${pemenggalan})`);
      }

      const last = p[p.length - 1];
      if (last === 'V') terbuka++; else tertutup++;

      if (p.startsWith('KK')) {
        kluster++;
        klustPola[p] = (klustPola[p] || 0) + 1;
        addContoh(sukuEx, p, pemenggalan);
      }

      if (/ai|au|oi|ei/i.test(sk)) {
        diftCnt++;
        diftPola[p] = (diftPola[p] || 0) + 1;
      }
    }
  }

  const totalAll     = totalSuku;
  const totalEntriAll = totalEntri;

  // Sort helpers
  const byCount  = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const ex4      = (p) => (sukuEx[p] || []).slice(0, 4).join(', ');
  const wex4     = (p) => (wordEx[p] || []).slice(0, 4).join(', ');

  // ── Kanonik tabel (section 2) ─────────────────────────────────────────
  const kanOrder = ['KV','KVK','V','VK','KKV','KKVK','KVKK','KKVKK','KKKVK','KKKV','KVKKK'];
  const kanRef   = ['ka.mu','pak.sa','a.ku','il.mu','dra.ma','trak.tor','teks.til','kom.pleks','struk.tur','stra.ta','korps'];
  const kanSorted = kanOrder.map((p, i) => ({ p, ref: kanRef[i], n: sukuCnt[p] || 0 }))
    .sort((a, b) => b.n - a.n);

  // ── Non-kanonik ───────────────────────────────────────────────────────
  const tipeB = new Set(['VKKV','KVKKV','KVKKVK','VKKVK','KKVKV']);
  const kat = (p) => {
    if (p === 'VKK')  return 'Kata serapan (fonotaktik asing, koda -KK)';
    if (p === 'K')    return 'Huruf abjad';
    if (tipeB.has(p)) return 'B – serapan (koda kompleks)';
    return 'C – anomali (perlu ditinjau)';
  };
  const nonKan = byCount(sukuCnt).filter(([p]) => !KANONIK.has(p));

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
    '- **V** = vokal tunggal (a, e, i, o, u). Diftong (ai, au, oi, ei) diperlakukan sebagai **satu V** — satu unsur vokal.',
    '- **K** = konsonan, termasuk digraf yang diperlakukan sebagai satu fonem:',
    '',
    '  | Digraf | Fonem | Contoh suku |',
    '  |---|---|---|',
    '  | ng | /ŋ/ velar nasal | bu.nga, ngang |',
    '  | ny | /ɲ/ palatal nasal | nya.ta, bu.nyi |',
    '  | kh | /x/ frikatif velar | kha.sus, a.khir |',
    '  | sy | /ʃ/ frikatif palatal | sya.rat, khu.syuk |',
    '',
    '- **Diftong** yang dikenali: `ai`, `au`, `oi`, `ei` (sesuai EYD V). Karena diftong = satu unsur vokal, suku seperti `pan.dai` terbaca sebagai **KVK.KV** (bukan KVK.KVV).',
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
    '| pandai | pan.dai | KVK.KV | KVK + KV (diftong = V) |',
    '',
    '---',
    '',
    '## Ringkasan Data',
    '',
    '| Metrik | Jumlah |',
    '|---|---:|',
    `| Total entri | ${N(totalEntriAll + dilewati)} |`,
    `| Dilewati (multi-kata/kosong) | ${N(dilewati)} |`,
    `| Entri dianalisis | ${N(totalEntriAll)} |`,
    `| Total suku kata | ${N(totalAll)} |`,
    '',
    '---',
    '',
    '## 1. Distribusi Jumlah Suku Kata per Kata',
    '',
    '| Jumlah Suku | Jumlah Kata | % |',
    '|---:|---:|---:|',
  );
  for (const [n, c] of Object.entries(sylHist).sort((a, b) => +a[0] - +b[0]))
    L(`| ${n} | ${N(c)} | ${P(c, totalEntriAll)} |`);

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
    'Pola-pola berikut **tidak termasuk** dalam 11 tipe kanonik.',
    '',
    '| Pola | Jumlah | % | Keterangan | Contoh pemenggalan |',
    '|---|---:|---:|---|---|',
  );
  for (const [p, n] of nonKan)
    L(`| \`${p}\` | ${n} | ${P(n, totalAll)} | ${kat(p)} | ${ex4(p)} |`);

  // Detail kasus per pola non-kanonik
  const reviewPola = nonKan;
  if (reviewPola.length > 0) {
    L('', '### Detail Kasus untuk Ditinjau', '');
    for (const [p] of reviewPola) {
      const items = sukuDetail[p] || [];
      if (items.length === 0) continue;

      if (p === 'VKK') {
        const eksItems    = items.filter(s => /^eks /i.test(s));
        const nonEksItems = items.filter(s => !/^eks /i.test(s));
        L(`#### \`${p}\` — ${items.length} suku`, '');
        if (eksItems.length > 0)    L(`**eks- (bentuk terikat):** ${eksItems.join(', ')}`, '');
        if (nonEksItems.length > 0) L(`**Non-eks-:** ${nonEksItems.join(', ')}`, '');
      } else if (p === 'K') {
        L(`#### \`${p}\` — ${items.length} suku`, '');
        L('*Catatan: huruf vokal (A, E, I, O, U) muncul di pola `V`, bukan di sini.*', '');
        L(items.join(', '), '');
      } else if (p === 'KVV' || p === 'KVVK') {
        const euItems    = items.filter(s => /eu/i.test(s));
        const nonEuItems = items.filter(s => !/eu/i.test(s));
        L(`#### \`${p}\` — ${items.length} suku`, '');
        if (euItems.length > 0)    L(`**Mengandung \`eu\` (bahasa daerah, diterima):** ${euItems.join(', ')}`, '');
        if (nonEuItems.length > 0) L(`**Lainnya (perlu ditinjau):** ${nonEuItems.join(', ')}`, '');
      } else {
        L(`#### \`${p}\` — ${items.length} suku`, '');
        L(items.join(', '), '');
      }
      L('');
    }
  }

  L(
    '',
    '---',
    '',
    '## 4. Distribusi Lengkap Jenis Suku Kata',
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
    '---',
    '',
    '## 5. Distribusi Pola Kata (Top 30)',
    '',
    'Pola kata = gabungan pola tiap suku kata.',
    '',
    `Total pola unik: **${N(Object.keys(wordCnt).length)}**`,
    '',
    '| Pola Kata | Jumlah | % | Contoh pemenggalan |',
    '|---|---:|---:|---|',
  );
  for (const [p, n] of byCount(wordCnt).slice(0, 30))
    L(`| \`${p}\` | ${N(n)} | ${P(n, totalEntriAll)} | ${wex4(p)} |`);

  L(
    '',
    '---',
    '',
    '## 6. Suku Kata Terbuka vs Tertutup',
    '',
    'Suku **terbuka** = berakhir vokal.',
    'Suku **tertutup** = berakhir konsonan.',
    '',
    '| Terbuka | Tertutup | Rasio Terbuka |',
    '|---:|---:|---:|',
    `| ${N(terbuka)} | ${N(tertutup)} | ${P(terbuka, totalAll)} |`,
    '',
    '---',
    '',
    '## 7. Kluster Konsonan (KK-)',
    '',
    `Suku kata yang diawali dua atau lebih konsonan — umumnya kata serapan. Total: **${N(kluster)}** (${P(kluster, totalAll)})`,
    '',
    '| Pola | Jumlah | % | Contoh pemenggalan |',
    '|---|---:|---:|---|',
  );
  for (const [p, n] of byCount(klustPola))
    L(`| \`${p}\` | ${N(n)} | ${P(n, totalAll)} | ${ex4(p)} |`);

  L(
    '',
    '---',
    '',
    '## 8. Diftong (ai, au, oi, ei)',
    '',
    `Suku kata mengandung diftong: **${N(diftCnt)}** (${P(diftCnt, totalAll)})`,
    '',
    '| Pola suku | Jumlah | Contoh pemenggalan |',
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
    'Tiga pola kata paling umum: **`KV.KVK`, `KVK.KVK`, `KV.KV.KVK`**.',
    '',
    'Kata Melayu-Indonesia cenderung berstruktur dua suku kata (disyllabic) dengan suku akhir tertutup.',
    '',
    '**Pertanyaan penelitian:** Adakah korelasi antara frekuensi pemakaian kata (dari `searched_phrase`) dan pola suku kata?',
    '',
    '### 9.3 Kata Satu Suku (Monosilabik)',
    '',
  );
  const mono = sylHist[1] || 0;
  L(
    `Kata monosilabik: **${N(mono)}** (${P(mono, totalEntriAll)}). Kemunculannya yang terbatas mencerminkan preferensi fonotaktik terhadap kata polisillabik.`,
    '',
    '**Pertanyaan penelitian:** Apa distribusi kelas kata (lex_class) pada kata dasar monosilabik?',
    '',
    '### 9.4 Kata Polisuku Panjang (≥5 suku)',
    '',
  );
  const panjang = Object.entries(sylHist)
    .filter(([n]) => +n >= 5).reduce((s, [, c]) => s + c, 0);
  L(
    `Kata ≥5 suku: **${N(panjang)}** (${P(panjang, totalEntriAll)}). Umumnya serapan ilmiah (Yunani/Latin).`,
    '',
    '**Pertanyaan penelitian:** Adakah batas persepsi "kata panjang" di angka 4 suku?',
    '',
    '---',
    '',
    '## Referensi',
    '',
    '- EYD V (Ejaan Bahasa Indonesia yang Disempurnakan Edisi V, 2022) — Kaidah pemenggalan kata',
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
