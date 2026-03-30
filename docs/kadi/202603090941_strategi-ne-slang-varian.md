# Strategi Penanganan: Entitas Bernama, Slang, dan Varian

**Tanggal**: 2026-03-09
**Status**: Lampiran Cetak Biru (lihat `202603090933_cetak-biru-kamus-deskriptif.md`)
**Posisi dalam sistem**: Pipeline Penjaringan → Filter → Klasifikasi Kandidat

---

## Daftar Isi

1. [Kerangka Berpikir](#1-kerangka-berpikir)
2. [Entitas Bernama (Named Entity)](#2-entitas-bernama-named-entity)
3. [Slang](#3-slang)
4. [Varian](#4-varian)
5. [Titik Persinggungan Antar Kategori](#5-titik-persinggungan-antar-kategori)
6. [Implikasi Skema Database](#6-implikasi-skema-database)
7. [Implikasi Pipeline Scraper](#7-implikasi-pipeline-scraper)

---

## 1. Kerangka Berpikir

Ketiga kategori ini berbagi satu tantangan mendasar: **tidak ada batas yang keras**. Entitas bernama bisa menjadi kata biasa. Slang bisa mengeras menjadi leksikon standar. Varian informal bisa menggusur bentuk resminya. Sistem harus dirancang untuk **merekam proses ini**, bukan hanya hasilnya.

Prinsip utama:

- **Tidak ada filter otomatis yang sempurna.** Semua heuristik menghasilkan false positive dan false negative. Desain sistem harus meminimalkan kerugian dari kedua arah.
- **Metadata lebih berharga dari binari masuk/keluar.** Menyimpan sinyal (skor, tipe, sumber) lebih berguna daripada keputusan awal yang tidak bisa diubah.
- **Manusia tetap di loop untuk edge case.** Algoritma mengurangi volume; redaktur menangani kasus ambigu.

---

## 2. Entitas Bernama (Named Entity)

### 2.1 Masalah Inti

Scraper berita akan menghasilkan banyak sekali nama diri — nama orang, lembaga, kota, produk, merek. Ini adalah *noise* terbesar dalam pipeline. Namun sebagian entitas bernama layak masuk kamus karena telah **terleksikalisasi**: berpindah dari nama diri menjadi kata biasa.

### 2.2 Taksonomi

```
Entitas Bernama
│
├── [A] Murni nama diri → FILTER (tidak masuk kandidat)
│   Contoh: Joko Widodo, Surabaya, Shopee, Kementerian Pendidikan
│
├── [B] Terleksikalisasi sebagai verba → MASUKKAN
│   Entitas bernama yang dipakai dengan afiks produktif → bukti lexicalization
│   Contoh: nge-zoom, di-WhatsApp, nge-google, ter-cancel, di-booking
│
├── [C] Terleksikalisasi sebagai nomina umum → MASUKKAN (dengan catatan)
│   Merek/produk yang menjadi nama generik untuk kategorinya
│   Contoh: aqua (air minum kemasan), odol (pasta gigi), pempers (popok)
│
└── [D] Zona abu-abu → TUNDA untuk review redaksi
    Demonym yang dipakai sebagai adjektif, julukan yang meluas
    Contoh: betawi (kebudayaan), jaksel (gaya bicara), hoaks (dari "hoax")
```

### 2.3 Sinyal Deteksi Otomatis

**Sinyal FILTER (kemungkinan besar nama diri):**

| Sinyal | Contoh | Catatan |
|---|---|---|
| Kapital di tengah kalimat, tanpa afiks | "...kata Prabowo bahwa..." | Nama orang |
| Didahului kata sapaan | Pak, Bu, Bapak, Ibu, Prof, Dr, Kiai | Kuat |
| Didahului kata depan nama | "di Jakarta", "dari Medan" | Nama tempat |
| Pola: dua kata kapital berurutan | "Bank Mandiri", "Jawa Tengah" | Nama institusi/wilayah |
| Muncul konsisten kapital di semua sumber | — | Nama propersi |

**Sinyal MASUKKAN (kemungkinan terleksikalisasi):**

| Sinyal | Contoh | Kekuatan |
|---|---|---|
| Muncul dengan afiks Indonesia | nge-zoom, di-WhatsApp, googling | **Sangat kuat** |
| Muncul huruf kecil secara dominan | google (verba), internet | Kuat |
| Muncul dalam konteks generik, bukan branding | "pake aqua aja" (bukan iklan) | Menengah |
| Kolokasi dengan kata umum yang tidak bernama | "...supaya tidak di-ghosting..." | Menengah |

### 2.4 Implementasi Filter

**Tahap 1 — Heuristik cepat (di scraper):**

```javascript
function isLikelyNamedEntity(token, sentence, position) {
  // Kapital di tengah kalimat
  if (position > 0 && token[0] === token[0].toUpperCase()) {
    // Pengecualian: jika ada afiks → kemungkinan terleksikalisasi
    if (hasIndonesianAffix(token)) return false;  // nge-Zoom → bukan NE murni
    return true;
  }
  return false;
}

function hasIndonesianAffix(token) {
  // Cek prefiks: nge-, di-, ter-, ke-, me-, ber-, pe-
  // Cek sufiks: -kan, -i, -an, -nya
  const prefixes = /^(nge|di|ter|ke|me|ber|pe|meng|peng)/i;
  const suffixes = /(kan|[^a]i|an|nya)$/i;
  return prefixes.test(token) || suffixes.test(token);
}
```

**Tahap 2 — Daftar gazeteer (lookup cepat):**

Simpan daftar minimal di memori scraper:
- ~500 nama kota/provinsi Indonesia
- ~100 kata sapaan dan jabatan (Pak, Bu, Presiden, Menteri, dll)
- ~200 merek nasional yang umum

Tidak perlu NER model lengkap untuk tahap awal.

**Tahap 3 — Skor NE di kolom `skor_konfiden`:**

Jika token lolos filter tapi masih ambigu, simpan dengan `skor_konfiden` rendah (< 0.5) sebagai sinyal bagi redaktur.

### 2.5 Keputusan Redaksi untuk Kasus Terleksikalisasi

Merek yang terleksikalisasi perlu perlakuan khusus saat masuk kamus:
- Tandai `kelas_kata = 'verba'` atau `'nomina'` sesuai penggunaan
- Tambahkan catatan asal usul di `makna`
- Contoh model entri untuk *zoom*:

```
zoom
verba, cakapan
Melakukan pertemuan daring melalui aplikasi konferensi video.
Contoh: "Besok kita zoom jam 10, ya."
[Berasal dari nama aplikasi Zoom; terleksikalisasi ~2020]
```

---

## 3. Slang

### 3.1 Mengapa Slang adalah Target Utama

Kamus deskriptif yang tidak memuat slang adalah kamus yang tidak berguna bagi penutur muda. Slang bahasa Indonesia kaya dan produktif, tapi KBBI selalu tertinggal 5–10 tahun. Ini adalah celah paling jelas untuk diisi.

### 3.2 Taksonomi Pembentukan Slang Indonesia

Memahami *cara terbentuknya* slang penting untuk klasifikasi dan filter:

#### A. Akronim & Singkatan
Paling produktif dalam slang Indonesia:

| Kata | Asal | Kategori |
|---|---|---|
| baper | bawa perasaan | akronim bermakna |
| bucin | budak cinta | akronim bermakna |
| gercep | gerak cepat | akronim bermakna |
| gaje | ga jelas | akronim informal |
| sabi | bisa | pemendekan fonetis |
| santuy | santai + uy | blending + partikel |

**Sinyal deteksi**: panjang 3–6 karakter, tidak ditemukan di kamus, frekuensi tinggi di teks informal.

#### B. Prokem (Pembalikan Suku Kata)
Mekanisme lama yang masih produktif:

| Kata | Asal | Keterangan |
|---|---|---|
| bokap | bapak | prokem klasik |
| nyokap | ibu/emak | prokem + sufiks |
| doku | uang | prokem |
| kece | cakep | prokem |

**Sinyal deteksi**: pola suku kata yang merupakan inverse dari kata umum → butuh algoritma khusus atau daftar manual.

#### C. Kontraksi Fonologis
Pemendekan yang mencerminkan pengucapan cepat:

| Bentuk formal | Bentuk kontraksi | Distribusi |
|---|---|---|
| tidak | gak, nggak, ndak, ga, kagak | regional + register |
| sudah | udah, dah | pan-regional |
| bagaimana | gimana, gimne | pan-regional |
| habis | abis | pan-regional |
| sama | ama, ma | cakapan |

Ini lebih tepat dikategorikan sebagai **varian** daripada slang baru (lihat §4).

#### D. Code-mixing Morfologis
Kata asing + afiks Indonesia — sangat produktif, terus berkembang:

| Contoh | Struktur | Asal |
|---|---|---|
| nge-cancel | nge- + cancel | Inggris + afiks |
| di-ghosting | di- + ghosting | Inggris + afiks pasif |
| ter-cancel | ter- + cancel | Inggris + afiks statis |
| baper-in | baper + -in | Slang + sufiks cakapan |
| nge-judge | nge- + judge | Inggris + afiks |

**Sinyal deteksi kuat**: token asing (alfanumerik, tidak ada di kamus Indonesia) yang muncul dalam kalimat dengan konteks morfologis Indonesia.

#### E. Kreasi Baru & Plesetan
Kata yang tidak punya derivasi jelas:

| Kata | Keterangan |
|---|---|
| kepo | nosy/penasaran; asal tidak jelas (kemungkinan "knowing every particular object") |
| lebay | berlebihan; asal tidak jelas |
| galau | sedih bimbang; sudah masuk KBBI tapi awalnya slang |
| alay | norak/berlebihan; asal tidak jelas |
| mager | malas gerak |

Kata-kata ini tidak bisa dideteksi algoritmik — hanya muncul dari frekuensi + konteks.

### 3.3 Siklus Hidup Slang

Slang punya umur. Menyimpan timestamp atestasi memungkinkan analisis siklus hidup:

```
[ Muncul ]  →  [ Viral ]  →  [ Mainstream ]  →  [ Usang ]  →  [ Arkeologis ]
   ↑                              ↑
   Tangkap di sini          Sudah boleh masuk kamus
   (kandidat)               jika frekuensi stabil
```

Kategori pragmatis untuk label di kamus:

| Label | Kriteria | Contoh |
|---|---|---|
| `cakapan` | Luas dipakai, lintas generasi | gimana, nggak, udah |
| `gaul` | Umum di media sosial, relatif stabil | baper, kepo, bucin |
| `viral` | Baru, frekuensi sangat tinggi, belum stabil | kata yang trending bulan ini |
| `usang` | Dulu umum, kini jarang / identik generasi sebelumnya | alay, lebay (mulai bergeser) |

**Rekomendasi**: tambah nilai `viral` dan `usang` ke constraint kolom `ragam` di `makna`. Redaktur yang menentukan, bukan algoritma.

### 3.4 Risiko: Slang Ofensif

Scraper akan menemukan slang yang kasar, rasis, atau berbahaya. Perlu kebijakan eksplisit:

- **Slang deskriptif pun bisa mendokumentasikan kata ofensif** — ini bukan berarti mempromosikannya
- Model: Merriam-Webster dan OED mendokumentasikan kata ofensif dengan label `offensive` dan catatan penggunaan
- Rancangan label: tambah `ofensif` sebagai nilai valid di `ragam`
- Kandidat dengan potensi ofensif perlu `prioritas = -1` (tidak muncul di antrian tanpa filter aktif)
- **Keputusan terpisah**: apakah kata ofensif yang terdokumentasi akan ditampilkan di kamus publik, hanya di admin, atau tidak sama sekali

---

## 4. Varian

### 4.1 Mengapa Varian adalah Masalah Dedup Terbesar

Tanpa penanganan varian, tabel `kandidat_entri` akan penuh dengan duplikasi konseptual. "gak", "nggak", "ngga", "ga", "enggak", "ndak", "kagak" adalah tujuh entri berbeda untuk satu konsep yang sama. Sistem perlu tahu ini sebelum membuat 7 kandidat terpisah.

### 4.2 Tiga Jenis Varian

#### Tipe 1: Varian Ortografis
Perbedaan ejaan tanpa perbedaan pengucapan atau makna bermakna:

| Bentuk kanonik | Varian umum | Keterangan |
|---|---|---|
| karena | karna, gara-gara (bukan varian) | Pemendekan tidak resmi |
| menggunakan | menggunakan | — |
| apotek | apotik | Varian ejaan historis |
| manajemen | management | Varian sebelum dibakukan |
| teknik | tehnik | Hipervarian historis |

Termasuk di sini: singkatan teks informal (`yg`, `dgn`, `utk`, `krn`) yang muncul banyak di berita UGC.

#### Tipe 2: Varian Morfologis / Kontraksi Dialektal
Perbedaan bunyi yang mencerminkan register atau dialek:

| Kelompok | Anggota | Catatan |
|---|---|---|
| tidak | tidak, nggak, gak, ga, enggak, ndak, kagak, tak | Distribusi regional jelas |
| sudah | sudah, udah, dah, dah | — |
| bagaimana | bagaimana, gimana, gmn | Tingkatan formal-informal |
| dengan | dengan, ama, sama, ma | — |
| saja | saja, aja, ae, wae | Varian terakhir: Jawa Barat |

Ini bukan "varian" dalam arti ortografis — ini *variabel sosiolinguistik*. Masing-masing membawa informasi register dan distribusi geografis yang berharga.

#### Tipe 3: Varian Afiks Cakapan
Afiks yang berbeda secara fonologis tapi secara fungsional setara:

| Afiks formal | Afiks cakapan | Contoh |
|---|---|---|
| me-N- | nge- | menulis → nge-nulis (untuk kata satu suku) |
| -kan | -in | bilangkan → bilangin |
| -i | -i / -in | datangi → datangin |

### 4.3 Strategi Dedup di Pipeline Scraper

Tiga lapisan normalisasi sebelum lookup:

**Lapisan 1 — Normalisasi ortografis (sebelum lookup ke DB):**

```javascript
const pemetaanOrtografi = {
  // Internet shorthand
  'yg': 'yang', 'dgn': 'dengan', 'utk': 'untuk', 'krn': 'karena',
  'gmn': 'bagaimana', 'knp': 'kenapa', 'sdh': 'sudah',
  // Varian ejaan umum
  'karna': 'karena', 'apotik': 'apotek', 'tehnik': 'teknik',
};

function normalisasiOrtografi(token) {
  return pemetaanOrtografi[token.toLowerCase()] ?? token.toLowerCase();
}
```

**Lapisan 2 — Tabel `peta_varian` (di database, dikelola redaksi):**

```sql
CREATE TABLE peta_varian (
  varian      text PRIMARY KEY,    -- bentuk yang muncul di teks
  kanonik     text NOT NULL,       -- bentuk yang dipakai untuk lookup
  tipe        text,                -- 'ortografi', 'morfologi', 'dialek'
  catatan     text
);

-- Contoh isi:
-- ('nggak',  'tidak',    'dialek',    'Jakarta + Jawa')
-- ('ga',     'tidak',    'dialek',    'cakapan umum')
-- ('kagak',  'tidak',    'dialek',    'Betawi')
-- ('gimana', 'bagaimana','morfologi',  NULL)
-- ('bilangin','bilangkan','morfologi', 'afiks cakapan -in')
```

Lookup scraper: `SELECT kanonik FROM peta_varian WHERE varian = $1` sebelum cek ke `entri`.

**Lapisan 3 — Clustering pasca-scraping (harian, opsional):**

Temukan kandidat baru yang kemungkinan varian dari kandidat lain:

```sql
-- Kandidat yang jarak Levenshtein-nya dekat dengan entri/kandidat yang ada
SELECT a.kata AS kandidat_baru, b.kata AS kemungkinan_kanonik,
       levenshtein(a.indeks, b.indeks) AS jarak
FROM   kandidat_entri a
JOIN   kandidat_entri b ON a.id <> b.id
WHERE  levenshtein(a.indeks, b.indeks) <= 2
  AND  a.status = 'menunggu'
ORDER BY jarak;
```

Output ini masuk ke antrian khusus "kemungkinan duplikasi" untuk dikonfirmasi redaktur.

### 4.4 Strategi Representasi di Kamus

**Opsi A — Entri kanonik + daftar varian (rekomendasi):**

Satu entri untuk bentuk kanonik, varian disimpan di kolom `varian` (sudah ada di skema `entri`):

```
tidak
adverb
Partikel negasi...

Varian cakapan: nggak, gak, ga, enggak (Jakarta); ndak, tak (Jawa); kagak (Betawi)
```

**Opsi B — Entri varian dengan rujukan:**

Buat entri `nggak` dengan `entri_rujuk → tidak` dan `jenis_rujuk = 'varian'`. Ini memungkinkan pengguna yang mencari "nggak" langsung menemukan entri, bukan hanya "tidak".

**Rekomendasi**: kombinasi keduanya. Entri kanonik menyimpan daftar varian. Varian yang sangat umum (nggak, gak, udah, gimana) mendapat entri sendiri dengan `jenis_rujuk = 'varian'` agar pencarian tetap berfungsi.

---

## 5. Titik Persinggungan Antar Kategori

Ketiga kategori sering tumpang tindih. Contoh-contoh nyata:

### 5.1 Slang yang Berasal dari Named Entity

| Kata | Asal | Kategori Akhir |
|---|---|---|
| nge-zoom | Zoom (merek) | NE terleksikalisasi → verba cakapan |
| di-ghosting | Ghost (bahasa Inggris, bukan NE tapi asing) | Code-mixing → verba cakapan |
| grab-an | Grab (merek) | NE terleksikalisasi → nomina cakapan |
| ojol | ojek online (bukan NE tunggal) | Akronim → nomina umum |

### 5.2 Varian yang Sudah Menjadi Kata Mandiri

Beberapa "varian" sudah mandiri secara sosiolinguistik — bukan sekadar "cara lain menulis":

| Token | Hubungan dengan "kanonik" | Status |
|---|---|---|
| `kagak` | Varian "tidak" khas Betawi | Layak entri mandiri dengan label dialek Betawi |
| `ndak` | Varian "tidak" khas Jawa | Layak entri mandiri |
| `gimana` | Varian "bagaimana" | Sudah sangat umum, perlu entri sendiri |
| `woles` | Dari "slow" terbalik (prokem) | Sudah mandiri, bukan varian "slow" |

### 5.3 Slang yang Bermutasi Menjadi Varian Resmi

Beberapa kata yang berawal sebagai slang kini hampir setara dengan bentuk resminya:

| Kata | Asalnya | Status Kini |
|---|---|---|
| galau | Slang media sosial ~2010 | Sudah masuk KBBI |
| keren | Slang lama | Sudah KBBI, sangat umum |
| gawai | Terjemahan resmi "gadget" | Diusulkan resmi, tapi kalah populer |
| kepo | Slang | Belum KBBI, tapi sangat stabil |

---

## 6. Implikasi Skema Database

### 6.1 Kolom Tambahan di `kandidat_entri`

```sql
ALTER TABLE kandidat_entri
  ADD COLUMN tipe_entitas   text,           -- 'ne-murni','ne-leksikalisasi','slang','varian','umum'
  ADD COLUMN indeks_kanonik text,           -- untuk varian: indeks bentuk kanoniknya
  ADD COLUMN skor_ne        numeric(3,2),   -- 0.00–1.00: probabilitas ini named entity
  ADD COLUMN ragam_slang    text;           -- 'gaul','viral','usang','ofensif' (jika slang)

ALTER TABLE kandidat_entri
  ADD CONSTRAINT kandidat_tipe_entitas_check CHECK (tipe_entitas IN (
    'ne-murni', 'ne-leksikalisasi', 'slang', 'varian', 'umum', NULL
  ));
```

### 6.2 Tabel `peta_varian` (Baru)

Sudah didefinisikan di §4.3. Diisi secara:
- **Seed**: ~200 varian paling umum (gak, nggak, udah, gimana, dll)
- **Otomatis**: output clustering Levenshtein yang dikonfirmasi redaktur
- **Manual**: redaktur menambah dari temuan kurasi

### 6.3 Constraint Tambahan di `makna` (sistem yang ada)

Tambah nilai valid ke kolom `ragam` yang sudah ada:

```sql
-- Nilai ragam yang sudah ada: arkais, klasik, hormat, cakapan, kasar
-- Tambahan untuk kamus deskriptif:
ALTER TABLE makna DROP CONSTRAINT IF EXISTS makna_ragam_check;
ALTER TABLE makna ADD CONSTRAINT makna_ragam_check CHECK (ragam IN (
  'arkais', 'klasik', 'hormat', 'cakapan', 'kasar',
  'gaul', 'viral', 'usang', 'ofensif',   -- tambahan deskriptif
  NULL
));
```

> **Catatan**: perubahan constraint ini berdampak ke tabel `makna` yang sudah ada. Perlu migration yang hati-hati dan pastikan nilai lama tetap valid.

---

## 7. Implikasi Pipeline Scraper

### 7.1 Urutan Pemrosesan Token

```
Token dari teks
    ↓
[1] Normalisasi huruf kecil
    ↓
[2] Cek peta_varian → ganti dengan bentuk kanonik jika ada
    ↓
[3] Cek stopword → buang jika stopword
    ↓
[4] Heuristik NE (kapital, sapaan, dll) → tandai skor_ne
    ↓
[5] Cek panjang karakter (< 3 → buang)
    ↓
[6] Lookup BATCH ke tabel entri.indeks
      → ditemukan: lewati (sudah ada di kamus)
      → tidak ditemukan: lanjut
    ↓
[7] Lookup BATCH ke kandidat_entri.indeks
      → ditemukan: tambah atestasi saja
      → tidak ditemukan: buat kandidat baru
    ↓
[8] Simpan: kandidat baru + atestasi / tambah atestasi / update frekuensi
```

### 7.2 Penandaan Otomatis (Heuristik, Bukan Mutlak)

Beberapa sinyal yang bisa otomatis diisi di `kandidat_entri.tipe_entitas`:

| Kondisi | `tipe_entitas` otomatis |
|---|---|
| `skor_ne > 0.7` | `'ne-murni'` — masuk kandidat tapi dengan prioritas rendah |
| `indeks_kanonik != NULL` (dari peta_varian) | `'varian'` |
| Token mengandung afiks + kata asing | `'slang'` → code-mixing |
| Token panjang 3–5 huruf, semua konsonan atau pola akronim | `'slang'` → kemungkinan singkatan |
| Token ada di peta_varian tapi bukan NE | `'varian'` |
| Tidak memenuhi kondisi di atas | `NULL` (redaktur menentukan) |

### 7.3 Antrian Terpisah di Redaksi

Pertimbangkan tab tersendiri di antrian redaksi untuk memudahkan penanganan:

| Tab | Isi | Penanganan |
|---|---|---|
| **Kata Baru** | `tipe_entitas = NULL` atau `'slang'` | Kurasi normal |
| **Kemungkinan NE** | `skor_ne > 0.5` | Putuskan: filter atau leksikalisasi |
| **Varian** | `tipe_entitas = 'varian'` | Konfirmasi → masuk `peta_varian` atau buat entri |
| **Duplikasi** | Output clustering Levenshtein | Merge atau pisah |
| **Ofensif** | `ragam_slang = 'ofensif'` | Review dengan kebijakan khusus |
