# Rencana Integrasi Korpus Leipzig

**Tanggal**: 2026-03-18
**Status**: Draft
**Terkait**: `_docs/kadi/202603091036_infrastruktur-penelitian-terbuka.md`

---

## 1. Latar Belakang

[Leipzig Corpora Collection](https://corpora.uni-leipzig.de/) (Universitas Leipzig) menyediakan
data korpus bahasa untuk 250+ bahasa, termasuk bahasa Indonesia. Data mencakup frekuensi kata,
kalimat contoh, kookurensi, dan sumber — fitur yang sangat melengkapi Kateglo sebagai kamus
deskriptif.

### 1.1 Tujuan

Mengintegrasikan data korpus Leipzig ke Kateglo untuk menampilkan informasi linguistik
berbasis korpus: frekuensi, kalimat contoh, kata-kata yang sering muncul bersama,
dan visualisasi jaringan kata — mirip tampilan di situs Leipzig sendiri.

### 1.2 Mengapa Bukan Pakai API Leipzig?

API publik Leipzig (`api.wortschatz-leipzig.de`) **tidak menyediakan korpus bahasa Indonesia**.
Endpoint `/ws/corpora` hanya mengembalikan korpus bahasa Eropa dan beberapa bahasa besar lainnya.
Situs web mereka (`corpora.uni-leipzig.de`) menggunakan backend internal yang berbeda.

**Konsekuensi**: data harus di-host sendiri dari file unduhan yang mereka sediakan secara gratis.

---

## 2. Data yang Tersedia

### 2.1 File yang Sudah Diunduh

```
_data/leipzig/
├── ind_news_2024_10K/        (5.8 MB, 10.000 kalimat)
└── ind_wikipedia_2021_1M/    (465 MB, 1.000.000 kalimat)
```

### 2.2 Korpus Indonesia yang Tersedia di Leipzig

Dari halaman unduh Leipzig, korpus Indonesia tersedia dalam berbagai domain dan tahun:

| Domain | Tahun | Ukuran tersedia |
|--------|-------|-----------------|
| News | 2008–2024 | 10K, 30K, 100K, 300K, 1M |
| Wikipedia | 2010, 2014, 2016, 2021 | 10K–1M |
| Web | 2011–2018 | 10K–1M |
| Newscrawl | 2011–2016 | 10K–1M |
| Mixed | 2012–2013 | 10K–1M |

**Rekomendasi awal**: unduh `ind_news_2024` versi **1M** untuk data yang representatif.
Data 10K terlalu kecil (frekuensi "jika" hanya ratusan, vs 54.226 di korpus 1M situs Leipzig).

### 2.3 Struktur File per Korpus

Setiap unduhan berisi 9 file TSV (tab-separated):

| File | Isi | Format kolom |
|------|-----|-------------|
| `*-words.txt` | Leksikon + frekuensi | `w_id \t word \t freq` |
| `*-sentences.txt` | Kalimat korpus | `s_id \t sentence` |
| `*-sources.txt` | Sumber (URL + tanggal) | `so_id \t url \t date` |
| `*-co_n.txt` | Kookurensi tetangga (neighbour) | `w1_id \t w2_id \t freq \t sig` |
| `*-co_s.txt` | Kookurensi sekalimat (same sentence) | `w1_id \t w2_id \t freq \t sig` |
| `*-inv_w.txt` | Indeks kata → kalimat + posisi | `w_id \t s_id \t pos` |
| `*-inv_so.txt` | Indeks sumber → kalimat | `so_id \t s_id` |
| `*-meta.txt` | Metadata korpus | `attribute \t value` |
| `*-import.sql` | Skema MySQL (referensi) | SQL DDL |

### 2.4 Skema Tabel (dari import.sql Leipzig)

```sql
-- Leksikon
words       (w_id INT PK, word VARCHAR UNIQUE, freq INT)

-- Kalimat + sumber
sentences   (s_id INT PK, sentence TEXT)
sources     (so_id INT PK, source VARCHAR, date DATE)

-- Kookurensi
co_n        (w1_id INT, w2_id INT, freq INT, sig FLOAT)  -- tetangga
co_s        (w1_id INT, w2_id INT, freq INT, sig FLOAT)  -- sekalimat

-- Indeks terbalik
inv_w       (w_id INT, s_id INT, pos INT)                -- kata → kalimat
inv_so      (so_id INT, s_id INT)                        -- sumber → kalimat

-- Metadata
meta        (run INT, attribute VARCHAR, value VARCHAR)
```

---

## 3. Pemetaan Fitur

Fitur yang ditampilkan di situs Leipzig (`corpora.uni-leipzig.de`) dan ketersediaan
datanya dari file unduhan:

| # | Fitur | Deskripsi | Sumber data | Status |
|---|-------|-----------|-------------|--------|
| 1 | **Word Info** | Frekuensi, rank, frequency class | `words` | Langsung tersedia |
| 2 | **See Also** | Varian huruf besar/kecil (Jika, JIKA) | `words` | Langsung tersedia (query case-insensitive) |
| 3 | **Examples** | Kalimat contoh + URL sumber + tanggal | `inv_w` → `sentences` → `inv_so` → `sources` | Langsung tersedia |
| 4 | **Words in Same Sentence** | Kata yang sering muncul dalam kalimat yang sama | `co_s` + `words` | Langsung tersedia |
| 5 | **Neighbour Cooccurrences** | Kata tetangga (kiri/kanan) | `co_n` + `words` | Tersedia, arah kiri/kanan dihitung dari `inv_w` |
| 6 | **Word Graph** | Visualisasi jaringan kookurensi | `co_s` atau `co_n` | Tersedia (lapisan visualisasi, misal D3.js force graph) |
| 7 | **Words with Similar Context** | Kata dengan profil kookurensi mirip | Butuh `sim_w_co` | **Tidak tersedia** — perlu dihitung sendiri |

### 3.1 Perhitungan Turunan

**Rank**: urutan kata berdasarkan frekuensi descending di tabel `words`.

**Frequency Class**: `floor(log2(freq_tertinggi / freq_kata))`.
Contoh: jika kata paling sering = 500.000 dan "jika" = 54.226, maka
`floor(log2(500000/54226))` = `floor(3.2)` = 3.

**Arah kiri/kanan** (Neighbour Cooccurrences): dari `inv_w`, untuk setiap pasangan
di `co_n`, cek posisi relatif kata dalam kalimat yang sama. Jika `pos(w1) < pos(w2)`,
maka w2 adalah tetangga kanan w1.

**Similar Context** (sim_w_co): cosine similarity antara vektor kookurensi kata.
Untuk setiap kata, vektor = daftar kookurensi dari `co_s` dengan skor signifikansi.
Komputasi one-time, hasilnya disimpan di tabel `sim_w_co(w1_id, w2_id, cos)`.

---

## 4. Arsitektur Penyimpanan

### 4.1 Pertimbangan

Data korpus Leipzig punya karakteristik unik dibanding data Kateglo utama:

| Aspek | Data Kateglo | Data Leipzig |
|-------|-------------|-------------|
| Sifat | Dinamis (redaksi aktif) | **Statis** (snapshot korpus) |
| Update | Real-time | Bulk import per korpus baru |
| Pola akses | CRUD | **Read-only** |
| Ukuran | Moderat | **Besar** (1M kalimat = ~18 juta baris inv_w) |
| Kritis | Ya (data utama) | Pelengkap (bisa offline tanpa rusak) |

### 4.2 Opsi Penyimpanan

#### Opsi A: Schema Terpisah di PostgreSQL (Render)

```
PostgreSQL (Render)
├── public (schema)     → data Kateglo utama
└── leipzig (schema)    → data korpus Leipzig
```

**Pro**: paling simpel, satu koneksi DB, bisa JOIN lintas schema jika perlu.
**Kontra**: menambah beban Render PostgreSQL (storage + koneksi), data statis
mengonsumsi resources yang sama dengan data dinamis.

**Estimasi storage**: korpus 1M ≈ 500 MB di PostgreSQL (dengan indeks).

#### Opsi B: SQLite Read-Only di Server

```
Backend Server (Render)
├── PostgreSQL          → data Kateglo utama
└── data/leipzig/
    ├── ind_news_2024.sqlite      (~300 MB)
    └── ind_wikipedia_2021.sqlite (~2 GB)
```

**Pro**: nol beban ke PostgreSQL, tidak perlu pool koneksi, sangat cepat untuk
read-only, bisa di-bundle saat deploy, setiap korpus = satu file.
**Kontra**: menambah ukuran deploy artifact, tidak bisa scale horizontal
(setiap instance perlu salinan), perlu tooling impor TSV → SQLite.

#### Opsi C: SQLite di Cloudflare R2 + Download saat Deploy

```
Cloudflare R2 (Object Storage)
├── leipzig/ind_news_2024.sqlite.gz
└── leipzig/ind_wikipedia_2021.sqlite.gz

Build/Deploy:
  1. Download dari R2
  2. Decompress
  3. Serve dari filesystem lokal
```

**Pro**: deploy artifact tetap kecil, R2 gratis untuk 10 GB storage + 10 juta
read/bulan, bisa menambah korpus baru tanpa redeploy, sesuai pola di dokumen
infrastruktur penelitian (`_docs/kadi/202603091036`).
**Kontra**: deploy lebih lambat (download step), perlu setup R2, perlu persistent
disk di Render (atau download ulang tiap deploy).

#### Opsi D: PostgreSQL Terpisah (Database Kedua di Render)

**Pro**: isolasi penuh, bisa di-scale mandiri.
**Kontra**: biaya tambahan ($7+/bulan di Render), over-engineering untuk tahap awal.

### 4.3 Rekomendasi Bertahap

```
Fase 1 (prototyping)  → Opsi A: schema "leipzig" di PostgreSQL Render
                         Mulai dengan ind_news_2024_10K (kecil, cepat iterasi)

Fase 2 (data 1M)      → Evaluasi: jika PostgreSQL masih nyaman, tetap Opsi A
                         Jika storage/performa jadi masalah → migrasi ke Opsi B atau C

Fase 3 (multi-korpus)  → Opsi C: SQLite di R2
                         Setiap korpus = file SQLite mandiri
                         Download on deploy, serve dari disk
```

---

## 5. Struktur Kode

### 5.1 Backend

```
backend/
├── db/
│   └── leipzig.js              # Koneksi/query builder khusus Leipzig
├── models/
│   └── leipzig/
│       ├── modelKorpus.js      # Info korpus, daftar korpus tersedia
│       ├── modelKata.js        # Frekuensi, rank, frequency class, see also
│       ├── modelKalimat.js     # Kalimat contoh + sumber
│       └── modelKookurensi.js  # co_s, co_n, neighbour left/right, graph
├── routes/
│   └── publik/
│       └── leipzig.js          # GET /api/publik/leipzig/*
├── scripts/
│   └── leipzig/
│       ├── impor-korpus.js     # Impor TSV → PostgreSQL/SQLite
│       └── hitung-similarity.js # Hitung sim_w_co (opsional, fase lanjut)
```

### 5.2 Frontend

```
frontend/src/
├── api/
│   └── apiLeipzig.js           # API client untuk endpoint Leipzig
├── pages/
│   └── publik/
│       └── korpus/
│           ├── KorpusDetail.jsx    # Halaman utama (mirip tampilan Leipzig)
│           └── KorpusWordGraph.jsx # Komponen visualisasi graph (D3.js)
├── components/
│   └── korpus/
│       ├── WordInfo.jsx            # Header: kata, frekuensi, rank
│       ├── ContohKalimat.jsx       # Panel kalimat contoh + sumber
│       ├── KookurensiSekalimat.jsx # Words in Same Sentence
│       └── KookurensiTetangga.jsx  # Neighbour Cooccurrences (Left/Right)
```

### 5.3 API Endpoints

```
GET /api/publik/leipzig/korpus
    → Daftar korpus yang tersedia + metadata

GET /api/publik/leipzig/korpus/:korpusId/kata/:kata
    → Word info: frekuensi, rank, frequency class, see also

GET /api/publik/leipzig/korpus/:korpusId/kata/:kata/contoh
    → Kalimat contoh + sumber (paginated: offset, limit)

GET /api/publik/leipzig/korpus/:korpusId/kata/:kata/kookurensi-sekalimat
    → Words in Same Sentence (paginated)

GET /api/publik/leipzig/korpus/:korpusId/kata/:kata/kookurensi-tetangga
    → Neighbour Cooccurrences (query param: arah=kiri|kanan|semua)

GET /api/publik/leipzig/korpus/:korpusId/kata/:kata/graf
    → Data graf kookurensi (nodes + edges untuk D3.js)
```

---

## 6. Skrip Impor

### 6.1 Alur Impor TSV → PostgreSQL

```
_data/leipzig/ind_news_2024_10K/*-words.txt
                                *-sentences.txt
                                *-sources.txt     →  skrip impor  →  PostgreSQL
                                *-co_n.txt                           schema: leipzig
                                *-co_s.txt                           tabel: lc_words,
                                *-inv_w.txt                                  lc_sentences,
                                *-inv_so.txt                                 lc_co_n, ...
                                *-meta.txt
```

### 6.2 Skema PostgreSQL Target

```sql
CREATE SCHEMA IF NOT EXISTS leipzig;

-- Registri korpus (meta)
CREATE TABLE leipzig.corpora (
    corpus_id   SERIAL PRIMARY KEY,
    corpus_name VARCHAR(100) UNIQUE NOT NULL,  -- 'ind_news_2024'
    description TEXT,
    sentences   INT,
    word_types  INT,
    word_tokens INT,
    sources     INT,
    build_date  DATE
);

-- Kata (per korpus)
CREATE TABLE leipzig.words (
    corpus_id   INT NOT NULL REFERENCES leipzig.corpora(corpus_id),
    w_id        INT NOT NULL,
    word        VARCHAR(255) NOT NULL,
    freq        INT NOT NULL DEFAULT 0,
    PRIMARY KEY (corpus_id, w_id)
);
CREATE INDEX idx_lw_word ON leipzig.words (corpus_id, word);
CREATE INDEX idx_lw_freq ON leipzig.words (corpus_id, freq DESC);

-- Kalimat
CREATE TABLE leipzig.sentences (
    corpus_id   INT NOT NULL REFERENCES leipzig.corpora(corpus_id),
    s_id        INT NOT NULL,
    sentence    TEXT NOT NULL,
    PRIMARY KEY (corpus_id, s_id)
);

-- Sumber
CREATE TABLE leipzig.sources (
    corpus_id   INT NOT NULL REFERENCES leipzig.corpora(corpus_id),
    so_id       INT NOT NULL,
    source      VARCHAR(512),
    date        DATE,
    PRIMARY KEY (corpus_id, so_id)
);

-- Kookurensi tetangga (neighbour)
CREATE TABLE leipzig.co_n (
    corpus_id   INT NOT NULL,
    w1_id       INT NOT NULL,
    w2_id       INT NOT NULL,
    freq        INT NOT NULL DEFAULT 0,
    sig         REAL,
    PRIMARY KEY (corpus_id, w1_id, w2_id)
);
CREATE INDEX idx_lcn_w2 ON leipzig.co_n (corpus_id, w2_id, sig DESC);

-- Kookurensi sekalimat (same sentence)
CREATE TABLE leipzig.co_s (
    corpus_id   INT NOT NULL,
    w1_id       INT NOT NULL,
    w2_id       INT NOT NULL,
    freq        INT NOT NULL DEFAULT 0,
    sig         REAL,
    PRIMARY KEY (corpus_id, w1_id, w2_id)
);
CREATE INDEX idx_lcs_w2 ON leipzig.co_s (corpus_id, w2_id, sig DESC);

-- Indeks kata → kalimat
CREATE TABLE leipzig.inv_w (
    corpus_id   INT NOT NULL,
    w_id        INT NOT NULL,
    s_id        INT NOT NULL,
    pos         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_liw_w ON leipzig.inv_w (corpus_id, w_id);
CREATE INDEX idx_liw_s ON leipzig.inv_w (corpus_id, s_id);

-- Indeks sumber → kalimat
CREATE TABLE leipzig.inv_so (
    corpus_id   INT NOT NULL,
    so_id       INT NOT NULL,
    s_id        INT NOT NULL
);
CREATE INDEX idx_liso_s ON leipzig.inv_so (corpus_id, s_id);

-- Similarity (fase lanjut, dihitung sendiri)
CREATE TABLE leipzig.sim_w_co (
    corpus_id   INT NOT NULL,
    w1_id       INT NOT NULL,
    w2_id       INT NOT NULL,
    cos         DECIMAL(4,3),
    PRIMARY KEY (corpus_id, w1_id, w2_id)
);
```

---

## 7. Isu: Homonim dan Homograf

### 7.1 Masalah

Data Leipzig **tidak melakukan disambiguasi makna**. Kata "bisa" (mampu) dan "bisa"
(racun ular) tersimpan sebagai satu entri dengan frekuensi gabungan:

```
4521    bisa    8.743
```

Akibatnya, frekuensi, kookurensi, dan kalimat contoh dari semua makna kata yang
sama bentuknya dicampur menjadi satu.

### 7.2 Dampak per Fitur

| Fitur | Dampak homonim |
|-------|---------------|
| Word Info (frekuensi, rank) | Frekuensi gabungan semua makna, tidak bisa dipecah |
| Examples (kalimat contoh) | Kalimat dari berbagai makna bercampur tanpa label |
| Words in Same Sentence | Kookurensi bisa dari dua "dunia" makna berbeda |
| Neighbour Cooccurrences | Sama — campuran dua konteks semantik |
| Similar Context | Vektor similarity terdistorsi oleh campuran makna |

### 7.3 Catatan: Kookurensi Tetap Informatif

Meski digabung, kookurensi secara alami cenderung mencerminkan makna dominan.
Untuk kata seperti "bisa", makna "mampu" jauh lebih frekuen dalam teks berita,
sehingga kolokat yang muncul (kamu, dia, pergi, seharusnya) akan mendominasi.
Makna minoritas (racun, ular) tetap muncul tapi dengan frekuensi/sig lebih rendah.

### 7.4 Opsi Penanganan

**Opsi A — Terima limitasinya (direkomendasikan untuk tahap awal)**

Tampilkan data korpus di level kata, bukan level makna. Tambahkan catatan kecil di UI:
*"Data korpus mencakup semua penggunaan kata ini."*

Ini konsisten dengan pendekatan Leipzig sendiri — mereka pun tidak membedakan per makna.

**Opsi B — Tabel asosiasi manual**

Untuk kata-kata homonim yang paling sering diakses, editor bisa menandai secara manual
asosiasi antara entri Leipzig dan makna tertentu di Kateglo:

```sql
CREATE TABLE leipzig.asosiasi_makna (
    corpus_id   INT,
    w_id        INT,
    phrase_id   INT,   -- FK ke tabel phrase Kateglo
    def_num     INT,   -- nomor makna spesifik
    catatan     TEXT,
    PRIMARY KEY (corpus_id, w_id, def_num)
);
```

Tidak scalable untuk semua kata, tapi bisa diterapkan secara selektif.

**Opsi C — WSD otomatis (fase jauh ke depan)**

Word Sense Disambiguation menggunakan model bahasa (misalnya IndoBERT) untuk
mengklasifikasi makna per kalimat. Hasilnya bisa mengelompokkan kalimat contoh
per makna. Komputasinya berat dan membutuhkan data berlabel.

### 7.5 Keputusan

**Tahap awal: Opsi A.** Kata-kata homonim sejati yang benar-benar ambigu di bahasa
Indonesia jumlahnya tidak banyak, dan makna dominan biasanya menang secara statistik
dalam korpus berita. Opsi B bisa ditambahkan belakangan jika ada kebutuhan kurasi
spesifik.

---

## 8. Hak Cipta dan Lisensi

Data Leipzig Corpora Collection dilisensikan di bawah **CC BY 4.0**
(Creative Commons Attribution). Ini berarti:

- **Boleh** digunakan, dimodifikasi, dan didistribusikan
- **Wajib** memberikan atribusi ke Universitas Leipzig
- **Sesuai** dengan model lisensi Kateglo di dokumen infrastruktur penelitian

Atribusi yang disarankan:
> Corpus data provided by Leipzig Corpora Collection, Universitas Leipzig.
> https://corpora.uni-leipzig.de/

**Catatan kalimat contoh**: kalimat berasal dari sumber berita berhak cipta.
Untuk tampilan publik di Kateglo, ini termasuk fair use (kutipan pendek untuk
keperluan linguistik/leksikografis) — konsisten dengan pendekatan Leipzig sendiri
dan analisis hak cipta di `_docs/kadi/202603091036`.

---

## 8. Rencana Tahapan

### Fase 1 — Prototyping (data 10K, PostgreSQL)

1. Buat skema PostgreSQL `leipzig` (SQL migration)
2. Buat skrip impor TSV → PostgreSQL (`backend/scripts/leipzig/impor-korpus.js`)
3. Impor `ind_news_2024_10K` sebagai data development
4. Buat model + route backend (4 endpoint utama)
5. Buat halaman frontend dasar (word info + contoh kalimat + kookurensi)
6. Validasi: tampilan menyerupai situs Leipzig

### Fase 2 — Data Penuh

7. Unduh `ind_news_2024` versi **1M**
8. Impor ke PostgreSQL, evaluasi performa
9. Tambah fitur Neighbour Left/Right (hitung dari inv_w)
10. Tambah Word Graph (D3.js force-directed)

### Fase 3 — Optimasi + Multi-Korpus

11. Evaluasi: jika PostgreSQL terbebani → migrasi ke SQLite
12. Setup Cloudflare R2 untuk hosting file SQLite (sesuai pola infrastruktur penelitian)
13. Skrip deploy: download SQLite dari R2 → serve dari filesystem
14. Tambah korpus kedua (`ind_wikipedia_2021_1M`)
15. UI pemilihan korpus

### Fase 4 — Similar Context (opsional)

16. Hitung cosine similarity dari vektor co_s
17. Simpan hasil di `sim_w_co`
18. Tampilkan "Words with Similar Context" di UI

---

## 9. Referensi

- Situs Leipzig Corpora: https://corpora.uni-leipzig.de/
- Halaman unduh: https://wortschatz-leipzig.de/en/download/ind
- API Swagger (tidak ada korpus Indonesia): https://api.wortschatz-leipzig.de/ws/swagger-ui/
- Dokumen infrastruktur penelitian Kateglo: `_docs/kadi/202603091036_infrastruktur-penelitian-terbuka.md`
- Data lokal: `_data/leipzig/`
