# Saran Definisi Kata Otomatis (Tanpa Generative AI)

**Tanggal**: 2026-03-09
**Status**: Lampiran Cetak Biru
**Terkait**: `202603090933_cetak-biru-kamus-deskriptif.md`

---

## Premis

Saran definisi otomatis tidak harus berupa kalimat definisi yang sempurna dan polished.
Tujuannya cukup: **memberi redaktur titik awal yang kuat**, bukan halaman kosong.

Bahkan petunjuk seperti *"Kata ini sering muncul bersama: emosional, sensitif, perasaan, mudah"*
jauh lebih berguna daripada tidak ada petunjuk sama sekali.

Semua teknik di dokumen ini tidak menggunakan generative AI (LLM). Yang digunakan adalah:
- Pattern matching & regular expression
- Lookup lintas kamus/kamus daring
- Word embeddings (matematika vektor — bukan generatif)
- Statistik kolokasi sederhana

---

## Teknik yang Tersedia: Tiga Level

```
Level 1 — Pure rule-based (tidak perlu ML sama sekali)
  │
  ├── A. Ekstraksi apositif dari atestasi
  ├── B. Template berdasarkan tipe kata
  └── C. Lookup lintas sumber (Wiktionary, kamus lain)

Level 2 — Statistik NLP ringan (bukan generatif)
  │
  ├── D. Kolokasi terdekat dari korpus
  └── E. Word embeddings: tetangga semantik terdekat (FastText)

Level 3 — Inferensi dari kamus yang ada
  │
  ├── F. Komposisi definisi dari kata dasar (morfologi)
  └── G. Lookup IndoWordNet: hipernim & sinonim
```

---

## A. Ekstraksi Apositif dari Atestasi

**Teknik paling langsung dan hasilnya paling berkualitas.**

Jurnalis sering mendefinisikan istilah baru secara inline saat pertama kali digunakan dalam
artikel. Ini adalah "definisi terpendam" yang sudah ada di dalam atestasi.

### Pola yang Dicari

```javascript
const POLA_DEFINISI = [
  // "baper, atau bawa perasaan, adalah..."
  /(\w+),\s+(?:atau|yakni|yaitu|yang berarti|yang artinya)\s+([^,.;]+)/gi,

  // "istilah 'kepo' berarti ingin tahu secara berlebihan"
  /(?:istilah|kata)\s+['"]?(\w+)['"]?\s+(?:berarti|bermakna|artinya)\s+([^,.;]+)/gi,

  // "kepo (ingin tahu berlebihan)"
  /(\w+)\s+\(([^)]{10,80})\)/gi,

  // "disebut baper—singkatan dari bawa perasaan"
  /disebut\s+(\w+)[—–-]\s*(?:singkatan dari|akronim dari|kependekan dari)\s+([^,.;]+)/gi,

  // "X adalah Y yang Z"  (pola definisi genus-differentia klasik)
  /(\w+)\s+adalah\s+([^,.;]{15,120})/gi,
];
```

### Implementasi

```javascript
async function ekstrakDefinisiApositif(kandidatId) {
  const atestasi = await db.query(
    'SELECT kutipan FROM atestasi WHERE kandidat_id = $1',
    [kandidatId]
  );

  const kata = await db.query(
    'SELECT kata FROM kandidat_entri WHERE id = $1',
    [kandidatId]
  );

  const kandidatDef = [];

  for (const { kutipan } of atestasi.rows) {
    for (const pola of POLA_DEFINISI) {
      const cocok = [...kutipan.matchAll(pola)];
      for (const match of cocok) {
        // Cek apakah token pertama cocok dengan kata kandidat
        if (match[1].toLowerCase() === kata.rows[0].kata.toLowerCase()) {
          kandidatDef.push({
            teks: match[2].trim(),
            sumber: 'apositif',
            kutipan_asal: kutipan,
            skor: 0.85,  // tinggi: diekstrak langsung dari kalimat definitif
          });
        }
      }
    }
  }

  return kandidatDef;
}
```

### Hasilnya

Untuk kata *baper* dengan atestasi:
> *"Fenomena baper, atau bawa perasaan, makin sering ditemukan di kalangan anak muda."*

→ Sistem mengekstrak: `"bawa perasaan, makin sering ditemukan di kalangan anak muda"`

Redaktur tinggal mempersingkat menjadi: *"Kondisi mudah terbawa perasaan; terlalu sensitif secara emosional."*

---

## B. Template Berdasarkan Tipe Kata

Untuk kata dengan tipe yang sudah diketahui, definisi awal bisa di-*generate* dari template.

### B1. Akronim & Singkatan

Jika kata terdeteksi sebagai akronim (pola: huruf kapital semua atau panjang pendek):

```javascript
function templateAkronim(kata, kepanjangan) {
  // kepanjangan bisa dari: deteksi pola X yang Y, atau dari kontribusi pengguna
  return `Singkatan dari "${kepanjangan}".`;
  // Contoh: "Singkatan dari 'bawa perasaan'."
}
```

Deteksi kepanjangan: cari pola `[kata] (kepanjangan)` atau `kepanjangan ([kata])` di atestasi.

### B2. Kata Serapan / Loanword

Jika kata terdeteksi sebagai serapan (masih berbentuk asing, tidak ada di kamus):

```javascript
function templateSerapan(kata, bahasaAsal, definisiAsal) {
  return `Bentuk serapan dari bahasa ${bahasaAsal} '${kata}'; ${definisiAsal}`;
  // Contoh: "Bentuk serapan dari bahasa Inggris 'cancel'; membatalkan sesuatu."
}
```

Definisi bahasa asal diambil dari teknik C (lookup Wiktionary) di bawah.

### B3. Code-mixing Morfologis

Jika kata adalah [afiks Indonesia] + [kata asing]:

```javascript
function templateCodeMixing(afiks, kata_dasar, makna_dasar) {
  const templateAfiks = {
    'nge-':  `Verba: melakukan tindakan ${makna_dasar}`,
    'di-':   `Bentuk pasif: dikenai tindakan ${makna_dasar}`,
    'ter-':  `Bentuk pasif-statis: dalam keadaan telah ${makna_dasar}`,
    '-in':   `Bentuk verba kausal cakapan: menyebabkan ${makna_dasar}`,
  };
  return templateAfiks[afiks] ?? null;
  // Contoh untuk "nge-cancel": "Verba: melakukan tindakan membatalkan"
}
```

---

## C. Lookup Lintas Sumber

### C1. Wiktionary Indonesia

Wiktionary memiliki API terbuka dan banyak kata informal yang sudah terdokumentasi.

```javascript
async function lookupWiktionaryId(kata) {
  const url = `https://id.wiktionary.org/w/api.php?action=query&titles=${
    encodeURIComponent(kata)
  }&prop=extracts&exintro=true&format=json`;

  const resp = await axios.get(url);
  // Parse HTML extract → ambil paragraf pertama sebagai definisi
  return ekstrakTeksBersih(resp.data);
}
```

Wiktionary Indonesia cukup kaya untuk slang umum (baper, kepo, bucin, galau, dll).

### C2. Wiktionary English (untuk loanword)

Jika kata adalah loanword dari bahasa Inggris yang tidak ada di Wiktionary Indonesia:

```javascript
async function lookupWiktionaryEn(kata) {
  const url = `https://en.wiktionary.org/w/api.php?action=query&titles=${
    encodeURIComponent(kata)
  }&prop=extracts&exintro=true&format=json`;
  // Ambil definisi bahasa Inggris → jadi bahan template B2
}
```

### C3. Kamus Besar lainnya (jika ada API)

Untuk kata yang sudah masuk KBBI edisi lama tapi belum di database Kateglo, bisa di-lookup
dari endpoint publik KBBI jika tersedia. Simpan hasil sebagai sumber dengan label `kbbi-online`.

---

## D. Kolokasi Terdekat dari Korpus

Tanpa word embeddings sekalipun, kolokasi bisa dihitung dari frekuensi kemunculan berdampingan.

### Mutual Information (MI) Score

Dua kata X dan Y punya kolokasi kuat jika mereka sering muncul berdampingan *melebihi
kebetulan* berdasarkan frekuensi masing-masing:

```
MI(X, Y) = log₂( P(X,Y) / (P(X) × P(Y)) )
```

Tidak perlu implementasi dari nol — cukup hitung dari tabel `atestasi`:

```sql
-- Kata yang paling sering muncul dalam atestasi kandidat yang sama
-- (proxy sederhana untuk kolokasi)
WITH kata_target AS (
  SELECT id FROM kandidat_entri WHERE kata = 'baper'
),
kata_dalam_atestasi AS (
  SELECT regexp_split_to_table(lower(kutipan), '\s+') AS token
  FROM   atestasi
  WHERE  kandidat_id = (SELECT id FROM kata_target)
)
SELECT token, count(*) AS frek
FROM   kata_dalam_atestasi
WHERE  length(token) > 3
  AND  token NOT IN (SELECT kata FROM stopword)  -- tabel stopword sederhana
GROUP BY token
ORDER BY frek DESC
LIMIT 10;
```

**Output untuk kata *baper*:**
```
emosional: 8
perasaan:  7
sensitif:  6
jangan:    5
mudah:     5
orang:     4
galau:     4
```

→ Saran otomatis ke redaktur: *"Kata ini sering muncul dalam konteks: emosional, perasaan,
sensitif, galau."*

Redaktur bisa langsung menyusun: *"Mudah terbawa emosi; terlalu sensitif secara emosional."*

---

## E. Word Embeddings: Tetangga Semantik Terdekat

Word embeddings **bukan** generative AI — ini adalah representasi matematis (vektor) dari kata
berdasarkan konteks kemunculannya. Tidak ada teks yang "dibuat", hanya vektor yang dibandingkan.

### FastText Bahasa Indonesia

Facebook Research telah merilis model FastText pre-trained untuk bahasa Indonesia:
- Model: `cc.id.300.bin` (Common Crawl Indonesia, 300 dimensi)
- Ukuran: ~4 GB (model penuh) atau ~600 MB (quantized)
- Bisa jalan sepenuhnya offline, tidak butuh API eksternal

```python
# Script Python terpisah (sidecar kecil, dipanggil oleh Node.js via child_process)
import fasttext

model = fasttext.load_model('cc.id.300.bin')

def tetangga_terdekat(kata, n=10):
    neighbors = model.get_nearest_neighbors(kata, k=n)
    return [(skor, kata) for skor, kata in neighbors if skor > 0.6]

# Output untuk "baper":
# [(0.82, "galau"), (0.79, "sensitif"), (0.76, "emosional"),
#  (0.74, "perasaan"), (0.71, "mellow"), (0.69, "overthinking")]
```

Output ini ditampilkan ke redaktur sebagai **"Kata-kata yang maknanya berdekatan"** —
bukan definisi langsung, tapi petunjuk yang sangat berguna untuk menyusun definisi.

### Kapan Ini Berguna vs. Tidak

| Kata | Kualitas Tetangga Semantik | Alasan |
|---|---|---|
| `baper` | Tinggi | Frekuensi tinggi di korpus, konteks konsisten |
| `bucin` | Tinggi | Sama |
| `nge-cancel` | Rendah | Afiks non-standar, model tidak mengenali bentuk ini |
| Kata sangat baru | Rendah | Belum ada di korpus pre-training model |

Untuk kata yang tidak dikenali model, fallback ke teknik D (kolokasi dari atestasi).

---

## F. Komposisi dari Kata Dasar (Morfologi)

Jika stemmer berhasil menemukan kata dasar dan kata dasar ada di kamus:

```javascript
async function saran_dari_kata_dasar(kata) {
  const kataDasar = stem(kata);
  if (kataDasar === kata) return null;  // tidak berubah, bukan turunan

  const entri = await db.query(
    'SELECT e.kata, m.makna FROM entri e JOIN makna m ON m.entri_id = e.id WHERE e.indeks = $1',
    [kataDasar]
  );

  if (!entri.rows.length) return null;

  const { kata: dasarKata, makna } = entri.rows[0];
  const afiks = kata.replace(dasarKata, '');

  // Template komposisi
  const AFIKS_TEMPLATE = {
    'pe-': `Orang yang ${makna}`,
    'pe--an': `Hal atau proses yang berkaitan dengan ${makna}`,
    '-an': `Hasil dari atau sesuatu yang berhubungan dengan ${makna}`,
    'ke--an': `Keadaan atau kondisi ${makna}`,
  };

  return AFIKS_TEMPLATE[afiks] ?? `Bentuk turunan dari '${dasarKata}': ${makna}`;
}
```

Contoh: kata *keresahan* belum ada di kamus, tapi *resah* ada. Output otomatis:
*"Keadaan atau kondisi resah; rasa gelisah yang dialami."*

---

## G. IndoWordNet: Hipernim & Sinonim

IndoWordNet adalah jaringan leksikal bahasa Indonesia yang memetakan relasi antar kata
(sinonim, antonim, hipernim, hiponim) — serupa dengan Princeton WordNet untuk bahasa Inggris.

```javascript
// Jika ada akses ke IndoWordNet (file lokal atau API)
async function lookupIndoWordNet(kata) {
  const synsets = await indoWordNet.lookup(kata);
  if (!synsets.length) return null;

  const synset = synsets[0];
  return {
    hipernim: synset.hypernyms,   // kategori lebih umum
    sinonim:  synset.synonyms,    // kata dengan makna sama
    definisi: synset.gloss,       // definisi dari WordNet
  };
}
```

**Keterbatasan**: IndoWordNet cakupannya masih terbatas (~40.000 kata), dan kata slang baru
hampir tidak ada. Berguna untuk kata-kata yang lebih formal atau teknis.

---

## Integrasi: Alur Saran Definisi Otomatis

Semua teknik di atas dijalankan secara berurutan saat kandidat baru masuk, hasilnya disimpan
dan ditampilkan ke redaktur sebagai panel "Bantuan Definisi":

```
Kandidat masuk (kata: "baper")
    │
    ├── [A] Ekstraksi apositif dari atestasi yang sudah ada
    │       → "bawa perasaan" (skor: 0.85) ← jika ditemukan, ini prioritas tertinggi
    │
    ├── [C] Lookup Wiktionary Indonesia
    │       → definisi dari Wiktionary (skor: 0.80)
    │
    ├── [D] Kolokasi dari atestasi
    │       → "Konteks: emosional, sensitif, perasaan, galau"
    │
    ├── [E] FastText tetangga terdekat
    │       → "Kata berdekatan: galau (0.82), sensitif (0.79), emosional (0.76)"
    │
    ├── [F] Dari kata dasar (jika ada)
    │       → null (baper tidak punya kata dasar yang dikenal)
    │
    └── [G] IndoWordNet
            → tidak ditemukan (kata terlalu baru/informal)
```

**Tampilan di antarmuka redaksi:**

```
┌─────────────────────────────────────────────────────────┐
│ BANTUAN DEFINISI untuk "baper"                          │
├─────────────────────────────────────────────────────────┤
│ ★ Dari korpus (apositif):                               │
│   "bawa perasaan"                                       │
│   Sumber: Kompas.com, 2024-08-12                        │
│                                                          │
│ ★ Wiktionary Indonesia:                                 │
│   "Singkatan dari bawa perasaan; mudah tersinggung"     │
│                                                          │
│ Konteks kemunculan:                                     │
│   emosional · sensitif · perasaan · galau · mudah       │
│                                                          │
│ Kata berdekatan secara semantik:                        │
│   galau (0.82) · sensitif (0.79) · emosional (0.76)    │
│   overthinking (0.71) · mellow (0.69)                   │
│                                                          │
│ [Salin ke kolom definisi]   [Abaikan semua]             │
└─────────────────────────────────────────────────────────┘
```

---

## Implementasi Bertahap

| Teknik | Upaya Implementasi | Nilai | Prioritas |
|---|---|---|---|
| A. Ekstraksi apositif | Rendah (regex) | Sangat tinggi | **Fase 2** |
| B. Template tipe kata | Rendah (string) | Tinggi (untuk serapan/akronim) | **Fase 2** |
| C. Wiktionary lookup | Rendah (HTTP) | Tinggi untuk kata umum | **Fase 2** |
| D. Kolokasi dari atestasi | Menengah (SQL) | Tinggi, selalu tersedia | **Fase 2** |
| E. FastText embeddings | Menengah (Python sidecar) | Tinggi untuk kata frekuensi sedang | **Fase 3** |
| F. Dari kata dasar | Menengah (butuh stemmer) | Menengah | **Fase 3** |
| G. IndoWordNet | Menengah (setup data) | Menengah, cakupan terbatas | **Fase 4** |

### Catatan Arsitektur

- Teknik A–D berjalan di Node.js backend, tidak butuh dependensi baru yang berat
- Teknik E butuh Python sidecar kecil yang dipanggil via `child_process.spawn`
  (atau microservice terpisah jika FastText model-nya besar)
- Model FastText bisa dijalankan di server yang sama dengan backend — tidak perlu GPU
- Semua saran bersifat **read-only dan tidak mengubah data** — hanya ditampilkan ke redaktur

### Tidak Perlu API Berbayar

Semua teknik di dokumen ini menggunakan:
- Corpus lokal yang sudah dibangun (atestasi, korpus)
- Model pre-trained yang bisa diunduh sekali dan disimpan lokal (FastText)
- API publik gratis (Wiktionary)
- Komputasi lokal (regex, SQL, vektor matematika)

Tidak ada biaya per-query, tidak ada ketergantungan pada layanan eksternal berbayar.
