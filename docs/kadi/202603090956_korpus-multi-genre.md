# Korpus Multi-Genre untuk Kamus Deskriptif

**Tanggal**: 2026-03-09
**Status**: Lampiran Cetak Biru
**Terkait**: `202603090933_cetak-biru-kamus-deskriptif.md`

---

## Daftar Isi

1. [Mengapa Genre Penting](#1-mengapa-genre-penting)
2. [Taksonomi Genre Bahasa Indonesia](#2-taksonomi-genre-bahasa-indonesia)
3. [Profil Tiap Genre](#3-profil-tiap-genre)
4. [Komposisi Korpus yang Diusulkan](#4-komposisi-korpus-yang-diusulkan)
5. [Implikasi Skema](#5-implikasi-skema)
6. [Genre sebagai Konteks Atestasi](#6-genre-sebagai-konteks-atestasi)
7. [Roadmap Akuisisi Genre](#7-roadmap-akuisisi-genre)
8. [Referensi Corpus Design](#8-referensi-corpus-design)

---

## 1. Mengapa Genre Penting

Rencana awal cetak biru menargetkan berita online (RSS) sebagai sumber utama. Ini langkah
yang tepat untuk memulai, tapi **korpus berbasis berita saja menghasilkan kamus yang cacat**:

- Berita **over-represents** register formal dan kosakata jurnalistik/politik
- Berita **under-represents** percakapan sehari-hari, slang, bahasa lisan, dan register teknis
- Frekuensi kata di berita tidak mencerminkan frekuensi penggunaan aktual penutur

Konsekuensi praktisnya:

```
Kata yang frekuensinya tinggi di berita tapi rendah di percakapan nyata:
  "menegaskan", "mengungkapkan", "menilai", "Sementara itu,"

Kata yang frekuensinya tinggi di percakapan tapi hampir tidak muncul di berita:
  "dong", "sih", "lho", "bentar", "nih", "gue", "lo"
```

Penutur asli yang mencari tahu artinya "sih" atau "dong" tidak akan terbantu oleh kamus
yang hanya mengandalkan korpus berita.

### Prinsip Corpus Linguistics

Korpus yang representatif harus memiliki **keseimbangan genre** yang mencerminkan distribusi
penggunaan bahasa secara nyata. Referensi besar dunia memperlakukan ini serius:

| Korpus | Total Kata | Komposisi Genre |
|---|---|---|
| British National Corpus (BNC) | 100 juta | 90% tulis (informasi, fiksi, misc), 10% lisan |
| COCA (American English) | 1 miliar | Lisan 20%, fiksi 20%, majalah 20%, koran 20%, akademik 20% |
| Leipzig Indonesian | ~30 juta | Mayoritas berita — bias diketahui |
| OSCAR Indonesia | ~3 miliar | Web crawl sembarangan — noise tinggi |

Kateglo Corpus bisa mengambil posisi yang belum ada: **korpus bahasa Indonesia terkurasi
lintas genre dengan genre-label yang konsisten**.

---

## 2. Taksonomi Genre Bahasa Indonesia

Delapan genre utama dengan subgenre yang relevan untuk Bahasa Indonesia:

```
Bahasa Indonesia Tertulis & Lisan
│
├── G1. JURNALISTIK
│   ├── Berita keras (hard news)
│   ├── Feature & reportase
│   ├── Opini & editorial
│   └── Jurnalisme warga (citizen journalism)
│
├── G2. PERCAKAPAN DIGITAL
│   ├── Media sosial mikroblog (X/Twitter)
│   ├── Komentar & thread forum (Kaskus, Reddit.id)
│   ├── Caption & komentar Instagram/TikTok
│   └── Ulasan produk (Tokopedia, Shopee)
│
├── G3. SASTRA & FIKSI
│   ├── Novel & cerpen (penerbit formal)
│   ├── Sastra digital (Wattpad, NovelToon)
│   ├── Puisi & lirik
│   └── Naskah film & sinetron
│
├── G4. AKADEMIK & ILMIAH
│   ├── Jurnal ilmiah (open access)
│   ├── Skripsi & tesis (open repository)
│   └── Buku teks & materi kuliah terbuka
│
├── G5. HUKUM & PEMERINTAHAN
│   ├── Undang-undang & peraturan (JDIH)
│   ├── Putusan pengadilan
│   └── Dokumen kebijakan & laporan resmi
│
├── G6. ENSIKLOPEDIK & REFERENSI
│   ├── Wikipedia Indonesia
│   ├── Blog informatif & tutorial
│   └── Dokumentasi teknis
│
├── G7. PERCAKAPAN LISAN (TRANSKRIP)
│   ├── Podcast & wawancara
│   ├── Transkripsi siaran TV/radio
│   └── Sidang & debat publik
│
└── G8. BISNIS & PROFESIONAL
    ├── Siaran pers & laporan tahunan
    ├── Blog korporat & konten pemasaran
    └── Komunikasi profesional publik
```

---

## 3. Profil Tiap Genre

### G1 — Jurnalistik

**Sudah tercakup dalam rencana awal (Fase 1).**

| Aspek | Profil |
|---|---|
| Register | Formal–semi-formal |
| Kosakata khas | Verba kutip (menegaskan, mengungkapkan), istilah politik/ekonomi |
| Kekuatan | Volume besar, bertimestamp, mudah di-scrape, legal jelas |
| Kelemahan | Bias Jakarta, bias register formal, over-represents elite vocabulary |
| Sumber praktis | RSS feed 6 media (sudah dirancang) |
| Aksesibilitas | Sangat mudah |

Tanpa genre lain, korpus jurnalistik menghasilkan kamus yang terlalu resmi.

---

### G2 — Percakapan Digital

**Genre paling penting untuk kamus deskriptif, paling sulit diakses.**

| Aspek | Profil |
|---|---|
| Register | Informal, cakapan, slang aktif |
| Kosakata khas | Slang, akronim baru, code-mixing, partikel diskursif (dong, sih, lho) |
| Kekuatan | Real-time, mencerminkan penggunaan aktual, sumber neologisme terbesar |
| Kelemahan | Noise tinggi, masalah privasi, API mahal/terbatas |
| Sumber praktis | Lihat tabel di bawah |

**Opsi sumber per subplatform:**

| Platform | Aksesibilitas | Biaya | Kualitas | Catatan |
|---|---|---|---|---|
| Twitter/X | Sulit | API Basic: $100/bln | Tinggi untuk slang | Rate limit ketat sejak 2023 |
| Kaskus | Moderat | Gratis (scraping) | Sedang | Forum publik; perlu `robots.txt` check |
| Reddit Indonesia | Moderat | Pushshift mirror tersedia | Sedang | r/indonesia, r/indonesia2 |
| Tokopedia/Shopee ulasan | Mudah | Gratis (scraping) | Unik: register belanja | Bahasa natural, ekspresif |
| YouTube komentar | Moderat | YouTube Data API (gratis terbatas) | Campur | Perlu filter noise |

**Rekomendasi tahap awal**: ulasan produk e-commerce (mudah, legal lebih jelas, mencerminkan bahasa sehari-hari yang ekspresif) dan thread forum Kaskus yang publik.

---

### G3 — Sastra & Fiksi

**Genre kritis untuk kosakata ekspresif, arkais, dan dialektal.**

| Aspek | Profil |
|---|---|
| Register | Sangat luas: dari formal-sastrawi hingga dialek daerah dalam dialog |
| Kosakata khas | Arkais, puitis, idiom, nama diri yang terleksikalisasi, dialek dalam dialog |
| Kekuatan | Kosakata kaya, bahasa yang disengaja dan digarap |
| Kelemahan | Hak cipta, volume lebih kecil dari berita |
| Sumber praktis | Proyek Gutenberg (karya lama bebas hak cipta), Wattpad via API (TOS perlu dicek) |

**Subgenre yang paling berguna:**
- **Sastra digital (Wattpad)** — ditulis oleh penutur muda, kaya slang terkini dalam narasi
- **Dialog film/sinetron** (jika tersedia sebagai teks) — mencerminkan bahasa lisan yang dikodifikasi

**Catatan hak cipta:**
- Karya yang terbit sebelum 1972 (70 tahun setelah wafat pengarang) umumnya sudah bebas
- Karya modern butuh izin eksplisit; atau hanya ambil kutipan pendek (fair use)

---

### G4 — Akademik & Ilmiah

**Genre penting untuk memantau masuknya istilah teknis ke bahasa umum.**

| Aspek | Profil |
|---|---|
| Register | Sangat formal, register ilmiah |
| Kosakata khas | Terminologi bidang, istilah Latin/Inggris yang diserap, neologisme teknis |
| Kekuatan | Terdokumentasi baik, open access makin banyak, bertimestamp |
| Kelemahan | Jarang muncul slang; bahasa cenderung beku |
| Sumber praktis | Garuda (garuda.kemdikbud.go.id), DOAJ Indonesia slice, repository UI/UGM/ITB |

Peran utamanya bukan mencari slang, tapi **memantau istilah teknis sebelum masuk glosarium** —
dan menangkap momen ketika istilah akademik mulai dipakai populer (contoh: *ekosistem*,
*paradigma*, *sinergi* kini dipakai di berita umum).

---

### G5 — Hukum & Pemerintahan

**Genre paling mudah diakses dan bebas hak cipta, tapi register sangat spesifik.**

| Aspek | Profil |
|---|---|
| Register | Sangat formal, arkais, kaku |
| Kosakata khas | Istilah hukum, bahasa Belanda/Latin yang terserap, konstruksi kalimat panjang |
| Kekuatan | Domain publik sepenuhnya, volume besar, konsisten |
| Kelemahan | Register terlalu sempit; tidak merepresentasikan bahasa sehari-hari |
| Sumber praktis | **JDIH** (jdih.go.id) — seluruh peraturan RI tersedia, dapat diunduh |

**JDIH adalah sumber terbaik untuk Fase 2**: gratis, publik, volume besar, sudah terstruktur.
Corpus hukum berguna sebagai counter-balance terhadap bias informal dari percakapan digital.

---

### G6 — Ensiklopedik & Referensi

**Wikipedia Indonesia adalah sumber corpus terbaik yang sering diremehkan.**

| Aspek | Profil |
|---|---|
| Register | Netral, informatif, formal-menengah |
| Kosakata khas | Luas: ilmiah, budaya, sejarah, teknologi, semua bidang |
| Kekuatan | Dump tersedia (wikimedia.org/dumps), CC-BY-SA, terstruktur, bersih |
| Kelemahan | Ditulis oleh kontributor sukarela — kualitas tidak merata |
| Sumber praktis | Wikipedia dump bulanan — tidak perlu scraping, unduh langsung |
| Volume | ~650.000 artikel bahasa Indonesia |

**Wikipedia dump** seharusnya menjadi Fase 1 corpus karena: gratis, legal, bersih, mudah diproses,
dan lintas bidang ilmu. Sudah banyak pipeline NLP yang menggunakan ini sebagai baseline.

Blog teknis dan tutorial juga masuk di sini — kaya istilah teknologi dalam konteks bahasa Indonesia.

---

### G7 — Percakapan Lisan (Transkrip)

**Genre yang paling sulit diakses tapi paling kritis untuk bahasa lisan.**

| Aspek | Profil |
|---|---|
| Register | Paling informal, paling dekat dengan bahasa sehari-hari |
| Kosakata khas | Partikel diskursif (eh, ya, nah, nih, dong), filler words, konstruksi lisan |
| Kekuatan | Satu-satunya sumber bahasa lisan; kata *dong*, *sih*, *lho* hanya hidup di sini |
| Kelemahan | Butuh ASR (speech-to-text) atau transkripsi manual; volume kecil |
| Sumber praktis | Podcast publik dengan transkrip, YouTube auto-caption (kualitas rendah) |

**Realitas teknis**: transkripsi manual sangat mahal. Auto-caption YouTube memiliki akurasi
~70–80% untuk bahasa Indonesia standar, lebih buruk untuk dialek. Untuk Fase 1–3, genre ini
bisa diandalkan pada kontribusi pengguna saja.

**Peluang jangka panjang**: Whisper (OpenAI) sudah cukup baik untuk transkripsi bahasa Indonesia.
Jika ada podcast besar yang publik dan bersedia, ini bisa menjadi sumber berharga.

---

### G8 — Bisnis & Profesional

| Aspek | Profil |
|---|---|
| Register | Formal, semi-formal; campuran Indonesia-Inggris khas dunia korporat |
| Kosakata khas | Jargon bisnis serapan (*meeting*, *deadline*, *deliverable*), register korporat |
| Kekuatan | Merekam code-mixing formal; istilah korporat yang masuk bahasa sehari-hari |
| Kelemahan | Volume lebih kecil; banyak dokumen internal tidak publik |
| Sumber praktis | Siaran pers publik, laporan tahunan perusahaan terbuka (IDX), blog perusahaan teknologi |

---

## 4. Komposisi Korpus yang Diusulkan

Berdasarkan prinsip COCA (keseimbangan 20/20/20/20/20), adaptasi untuk bahasa Indonesia:

### Target Jangka Panjang (Fase 4+)

| Genre | Target Proporsi | Rationale |
|---|---|---|
| G2 Percakapan Digital | 25% | Sumber neologisme & slang terbesar |
| G1 Jurnalistik | 20% | Sudah dirancang; volume besar |
| G6 Ensiklopedik | 20% | Wikipedia: lintas bidang, bersih |
| G3 Sastra & Fiksi | 15% | Kosakata ekspresif, dialek dalam dialog |
| G4 Akademik | 10% | Terminologi teknis |
| G5 Hukum | 5% | Arkais, register hukum |
| G7 Lisan | 4% | Sangat sulit diakses |
| G8 Bisnis | 1% | Pelengkap |

### Realitas Akuisisi Bertahap

```
FASE 1–2 (dapat dimulai sekarang):
  ████████████████████ Jurnalistik (RSS, 6 media)
  ████████████████████ Wikipedia dump (unduh langsung)
  ████████████         JDIH hukum (unduh langsung)

FASE 2–3 (butuh pengembangan lebih):
  ████████████         Kaskus / Reddit.id (scraping forum publik)
  ████████             Ulasan e-commerce (scraping)
  ████                 Garuda / repository akademik

FASE 3–4 (kompleks/mahal):
  ████████             Twitter/X (API berbayar atau sampling)
  ████                 Sastra digital (izin atau Gutenberg)
  ██                   Podcast (ASR + transkripsi)
```

---

## 5. Implikasi Skema

### 5.1 Kolom Genre di `sumber_korpus`

```sql
ALTER TABLE sumber_korpus
  ADD COLUMN genre      text,    -- 'jurnalistik','percakapan-digital','sastra', dll
  ADD COLUMN subgenre   text,    -- 'hard-news','forum','ulasan-produk', dll
  ADD COLUMN register   text;    -- 'formal','semi-formal','informal'

ALTER TABLE sumber_korpus ADD CONSTRAINT sumber_korpus_genre_check CHECK (genre IN (
  'jurnalistik', 'percakapan-digital', 'sastra', 'akademik',
  'hukum', 'ensiklopedik', 'lisan', 'bisnis'
));
```

### 5.2 Genre di `atestasi`

Karena satu `sumber_korpus` bisa punya genre yang sudah terdefinisi, kolom genre di `atestasi`
cukup di-inherit dari `sumber_korpus`. Tidak perlu kolom redundan di `atestasi`.

Cukup query:

```sql
SELECT a.kutipan, s.genre, s.subgenre
FROM   atestasi a
JOIN   sumber_korpus s ON a.sumber_nama = s.kode
WHERE  a.kandidat_id = $1;
```

### 5.3 Tabel `korpus_frekuensi` — Frekuensi per Genre

Untuk analisis distribusi genre, ubah `korpus_frekuensi` agar bisa menyimpan frekuensi
per genre:

```sql
-- Opsi A: satu baris per token (aggregate global, sederhana)
CREATE TABLE korpus_frekuensi (
  token      text PRIMARY KEY,
  frekuensi  bigint,
  df         integer,
  pertama    date,
  terakhir   date,
  -- Breakdown per genre (denormalized untuk query cepat):
  freq_jurnalistik   bigint DEFAULT 0,
  freq_percakapan    bigint DEFAULT 0,
  freq_sastra        bigint DEFAULT 0,
  freq_akademik      bigint DEFAULT 0,
  freq_hukum         bigint DEFAULT 0,
  freq_ensiklopedik  bigint DEFAULT 0,
  updated_at         timestamptz DEFAULT now()
);

-- Opsi B: satu baris per (token, genre) — lebih fleksibel, lebih besar
CREATE TABLE korpus_frekuensi_genre (
  token     text,
  genre     text,
  frekuensi bigint DEFAULT 0,
  df        integer DEFAULT 0,
  pertama   date,
  terakhir  date,
  PRIMARY KEY (token, genre)
);
```

**Rekomendasi**: Opsi A untuk kesederhanaan; Opsi B jika analisis genre akan sering dilakukan.

---

## 6. Genre sebagai Konteks Atestasi

Informasi genre pada atestasi bukan sekadar metadata — ia adalah **fakta linguistik** yang
menentukan interpretasi.

### Satu Kata, Distribusi Genre yang Berbeda

Contoh kata *cancel*:

| Genre | Konteks kutipan | Interpretasi |
|---|---|---|
| Jurnalistik | "pemerintah membatalkan acara..." | Makna formal; bukan serapan baru |
| Percakapan digital | "dia di-cancel netizen gara-gara..." | Makna baru: dikecam publik secara massal |
| Bisnis | "meeting-nya ter-cancel karena..." | Code-mixing; konteks profesional |
| Sastra | "harapanku ter-cancel satu persatu..." | Makna kiasan baru |

Keempat kutipan di atas mendukung atestasi *cancel* sebagai verba serapan, tapi distribusi
genre-nya memberitahu redaktur bahwa makna "dikecam publik" hanya muncul di konteks percakapan
digital — bukan di jurnalistik atau bisnis.

### Implikasi untuk Pelabelan Makna

Distribusi genre atestasi bisa membantu redaktur menentukan label ragam yang tepat:

```
Jika atestasi kata X:
  - Mayoritas dari G1 (Jurnalistik) → ragam: formal atau netral
  - Mayoritas dari G2 (Percakapan Digital) → ragam: cakapan atau gaul
  - Campuran G1 + G2 → kata sudah lintas register → tidak perlu label ragam khusus
  - Hanya dari G3 (Sastra) → ragam: sastrawi atau arkais
  - Hanya dari G5 (Hukum) → ragam: teknis-hukum
```

Ini bisa diotomatisasi sebagai *saran* bagi redaktur, bukan keputusan final.

---

## 7. Roadmap Akuisisi Genre

### Fase 1: Corpus Berita + Wikipedia (dapat segera)

| Sumber | Tipe | Volume | Upaya |
|---|---|---|---|
| 6 media RSS (sudah dirancang) | G1 Jurnalistik | ~1.600 artikel/hari | Rendah |
| Wikipedia dump bahasa Indonesia | G6 Ensiklopedik | ~650.000 artikel (statis) | Sangat rendah |

Wikipedia: unduh satu kali dari `dumps.wikimedia.org`, ekstrak teks dengan `WikiExtractor`,
proses ke korpus. Tidak perlu scraping rutin — cukup update bulanan dari dump baru.

### Fase 2: Hukum + Forum + E-commerce

| Sumber | Tipe | Volume | Upaya | Catatan |
|---|---|---|---|---|
| JDIH (jdih.go.id) | G5 Hukum | ~100.000 dokumen | Rendah | Domain publik |
| Kaskus subforum publik | G2 Percakapan | Besar | Menengah | Cek `robots.txt` |
| Ulasan Tokopedia/Shopee | G2 Percakapan | Sangat besar | Menengah | Register belanja informal |
| Garuda (open access) | G4 Akademik | Besar | Menengah | Filter hanya open access |

### Fase 3: Sastra Digital + Twitter Sample

| Sumber | Tipe | Upaya | Tantangan |
|---|---|---|---|
| Wattpad Indonesia | G3 Sastra | Tinggi | TOS, hak cipta |
| Proyek Gutenberg Indonesia | G3 Sastra | Rendah | Volume kecil, karya lama |
| Twitter/X Academic API (jika tersedia) | G2 Percakapan | Tinggi | Biaya, rate limit |
| YouTube auto-caption | G7 Lisan | Tinggi | Kualitas ASR rendah |

### Fase 4: Lisan + Bisnis

| Sumber | Tipe | Upaya | Catatan |
|---|---|---|---|
| Podcast dengan transkrip publik | G7 Lisan | Sangat tinggi | Kerjasama produser |
| Laporan tahunan IDX | G8 Bisnis | Rendah | PDF → teks |
| Siaran pers publik | G8 Bisnis | Rendah | Format terstruktur |

---

## 8. Referensi Corpus Design

- **COCA** (Davies, 2008) — desain 5-genre 20% masing-masing; rujukan standar untuk keseimbangan genre
- **British National Corpus** — keseimbangan tulis/lisan 90/10; metodologi sampling genre
- **Indonesian National Corpus (INC)** — upaya korpus nasional Indonesia; referensi genre yang dipertimbangkan
- **Leipzig Corpora Collection** — metodologi corpus berita monolingual; menunjukkan bias yang timbul dari satu genre
- **Universal Dependencies Indonesian** — anotasi treebank UD bahasa Indonesia; referensi genre yang digunakan (berita + wiki)
- **IndoNLI / IndoNLU** — benchmark NLP Indonesia; menunjukkan pentingnya diversitas genre untuk generalisasi model
