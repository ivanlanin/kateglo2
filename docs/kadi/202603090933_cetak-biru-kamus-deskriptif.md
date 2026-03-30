# Proposal Penelitian Doktoral — Kadi
# Leksikografi Deskriptif Bahasa Indonesia di Era Digital:
# Rancang Bangun Sistem Penjaringan Neologisme Berbasis Atestasi Korpus Multi-Genre

**Subproyek**: Kadi (Kamus Deskriptif Indonesia) — bagian dari Kateglo 2.0
**Tanggal**: 2026-03-09
**Status**: Draft Proposal (v1.0)
**Lokasi dokumen**: `docs/kadi/`
**Terkait kode**: `docs/data/struktur.sql`, `backend/models/modelEntri.js`, `backend/models/modelGlosarium.js`

---

## Daftar Isi

1. [Abstrak](#1-abstrak)
2. [Latar Belakang](#2-latar-belakang)
3. [Pertanyaan Penelitian](#3-pertanyaan-penelitian)
4. [Tinjauan Pustaka](#4-tinjauan-pustaka)
5. [Kerangka Teoretis](#5-kerangka-teoretis)
6. [Metodologi](#6-metodologi)
7. [Rancangan Artefak Penelitian](#7-rancangan-artefak-penelitian)
8. [Produk Sampingan: Korpus Bahasa Indonesia](#8-produk-sampingan-korpus-bahasa-indonesia)
9. [Studi Kelayakan & Infrastruktur](#9-studi-kelayakan--infrastruktur)
10. [Kontribusi yang Diharapkan](#10-kontribusi-yang-diharapkan)
11. [Jadwal Penelitian](#11-jadwal-penelitian)
12. [Keputusan Desain yang Telah Ditetapkan](#12-keputusan-desain-yang-telah-ditetapkan)
13. [Daftar Pustaka](#13-daftar-pustaka)

**Lampiran Teknis**

- [L1: Strategi Penanganan NE, Slang, dan Varian](202603090941_strategi-ne-slang-varian.md)
- [L2: Pertimbangan Lanjutan](202603090946_pertimbangan-lanjutan-kamus-deskriptif.md)
- [L3: Strategi Korpus Multi-Genre](202603090956_korpus-multi-genre.md)
- [L4: Saran Definisi Otomatis](202603091021_saran-definisi-otomatis.md)
- [L7: Evaluasi, Etika, dan Replikabilitas](202603091215_evaluasi-etika-replikabilitas.md)

---

## 1. Abstrak

Kamus Besar Bahasa Indonesia (KBBI) sebagai rujukan preskriptif utama memiliki siklus pembaruan tahunan yang tidak mampu mengikuti laju perkembangan leksikon bahasa Indonesia di era digital. Neologisme dari media sosial, dunia kerja teknologi, code-switching produktif, dan slang generasi muda muncul dan menyebar jauh lebih cepat daripada kemampuan rekam kamus konvensional.

Penelitian ini merancang dan mengimplementasikan **sistem leksikografi deskriptif berbasis atestasi** untuk bahasa Indonesia — sebuah infrastruktur yang menjaring kata-kata baru dari korpus multi-genre secara berkelanjutan, mengklasifikasikannya, dan mengantrikannya untuk kurasi redaksional sebelum masuk ke kamus publik. Sistem dibangun di atas Kateglo 2.0, kamus digital bahasa Indonesia yang sudah beroperasi, sebagai dasar kode dan data.

Tiga jalur penjaringan dikombinasikan: scraper RSS berita otomatis, kontribusi pengguna berbasis crowdsourcing, dan sinyal organik dari pencarian yang gagal. Pipeline normalisasi menangani tantangan spesifik bahasa Indonesia: morfologi aglutinatif, entitas bernama yang terleksikalisasi, slang dengan beragam mekanisme pembentukan, dan varian ortografis/dialektal yang kaya. Sebagai produk sampingan, sistem menghasilkan korpus bahasa Indonesia multi-genre bertimestamp — sumber daya yang langka dan bernilai untuk penelitian NLP lanjutan.

**Kata kunci**: leksikografi deskriptif, neologisme, bahasa Indonesia, korpus linguistik, leksikologi komputasional, atestasi elektronik

---

## 2. Latar Belakang

### 2.1 Kesenjangan Preskriptif–Deskriptif

Kamus konvensional beroperasi secara **preskriptif**: menetapkan kata mana yang "benar" dan "baku", dengan otoritas yang bersumber dari lembaga resmi. KBBI mengikuti siklus pembaruan yang lambat, melewatkan sebagian besar perkembangan leksikon yang terjadi di luar jalur formal.

Sebaliknya, **leksikografi deskriptif** merekam kata yang nyata digunakan — termasuk slang, neologisme, serapan informal, dan ungkapan hibrida — tanpa menghakimi apakah kata itu "benar" atau tidak.

| Aspek | Preskriptif (KBBI, sistem saat ini) | Deskriptif (sistem yang direncanakan) |
|---|---|---|
| **Pendekatan** | Menentukan "kata yang benar" | Merekam "kata yang nyata digunakan" |
| **Otoritas** | Badan Bahasa, redaksi ahli | Atestasi dari sumber nyata |
| **Cakupan** | Kata baku & standar | Termasuk slang, neologisme, serapan informal |
| **Validasi** | Review sebelum masuk | Frekuensi atestasi, baru review |
| **Kecepatan pembaruan** | Tahunan | Bisa mingguan |

### 2.2 Tekanan Leksikon Bahasa Indonesia di Era Digital

Bahasa Indonesia menghadapi tekanan leksikon dari beberapa arah sekaligus:

- **Media sosial** (X/Twitter, TikTok, Instagram) — kata viral muncul dan menyebar dalam hitungan hari, jauh melampaui kapasitas rekam kamus konvensional
- **Dunia kerja teknologi** — istilah serapan (*remote*, *burnout*, *onboarding*, *pivot*) dipakai luas tapi belum diformalkan
- **Slang generasi muda** yang kini masuk ke media arus utama dan jurnalistik populer, menandai pergeseran register
- **Code-switching produktif** (Jawa–Indonesia, Betawi–Indonesia, Inggris–Indonesia) yang menghasilkan kata hibrida baru secara morfologis produktif

Tanpa sistem penjaringan aktif, kamus digital bahasa Indonesia akan selalu tertinggal dari realitas penggunaan bahasa.

### 2.3 Pekerjaan Awal: Kateglo 2.0

Penelitian ini bukan dimulai dari nol. **Kateglo 2.0** adalah kamus digital bahasa Indonesia berbasis web yang sudah beroperasi, dibangun di atas arsitektur modern (React + Express.js + PostgreSQL) dengan ~127.000 lema, sistem tesaurus, glosarium bilingual, dan infrastruktur pencarian yang matang. Sistem yang dirancang dalam penelitian ini dibangun sebagai lapisan tambahan di atas Kateglo 2.0 — memanfaatkan basis data, infrastruktur autentikasi, dan statistik pencarian yang sudah ada.

Statistik pencarian yang gagal (kata dicari tetapi tidak ditemukan) merupakan sinyal organik yang paling berharga: demand yang sudah terverifikasi dari pengguna nyata.

---

## 3. Pertanyaan Penelitian

### Pertanyaan Utama

> Bagaimana merancang dan mengimplementasikan sistem leksikografi deskriptif berbasis atestasi yang mampu menjaring, mengklasifikasikan, dan mengkurasi neologisme bahasa Indonesia secara berkelanjutan dari korpus multi-genre?

### Sub-pertanyaan

1. **Efektivitas jalur penjaringan** — Di antara tiga jalur masuk (scraper otomatis, crowdsourcing, sinyal pencarian organik), mana yang menghasilkan kandidat dengan presisi dan recall tertinggi untuk bahasa Indonesia?

2. **Tantangan morfologi aglutinatif** — Bagaimana menangani entitas bernama yang terleksikalisasi, slang dengan beragam mekanisme pembentukan, dan varian ortografis/dialektal dalam pipeline leksikografis otomatis untuk bahasa yang sangat aglutinatif?

3. **Pengaruh keseimbangan genre** — Apakah keseimbangan genre korpus sumber (berita, percakapan digital, akademik, hukum, dll.) mempengaruhi jenis dan kualitas kandidat neologisme yang dihasilkan?

4. **Bantuan definisi non-generatif** — Dapatkah teknik NLP non-generatif (ekstraksi apositif, kolokasi korpus, word embeddings) memberikan saran definisi yang memadai bagi redaktur tanpa ketergantungan pada model bahasa generatif?

5. **Dinamika adopsi neologisme** — Bagaimana pola distribusi neologisme bahasa Indonesia berubah dari waktu ke waktu, dan faktor apa yang membedakan kata yang bertahan dari kata yang hanya viral sesaat?

---

## 4. Tinjauan Pustaka

### 4.1 Leksikografi Deskriptif

Tradisi leksikografi deskriptif modern dipelopori oleh karya-karya yang menekankan penggunaan aktual sebagai fondasi entri kamus. **Oxford English Dictionary** (OED) menetapkan standar atestasi: setiap kata harus didukung minimal tiga kutipan dari sumber berbeda, dengan rentang waktu yang mencerminkan stabilitas penggunaan. **Green's Dictionary of Slang** (Green, 2010) menerapkan metodologi serupa khusus untuk slang, dengan atestasi bertimestamp yang memungkinkan analisis siklus hidup leksikon informal.

**Wiktionary** memperkenalkan model crowdsourced dengan persyaratan atestasi — setiap entri harus dapat diverifikasi dari sumber publik — yang telah terbukti dapat menghasilkan kamus multi-bahasa berkualitas tinggi dengan kontributor sukarela.

Untuk bahasa Indonesia, karya **Alwi et al.** (*Tata Bahasa Baku Bahasa Indonesia*, 2003) dan **Sneddon** (*The Indonesian Language*, 2003) menjadi referensi linguistik utama, meski keduanya berfokus pada bahasa standar, bukan bahasa sehari-hari.

### 4.2 Korpus Linguistik dan Metodologi Korpus

**Biber, Conrad & Reppen** (*Corpus Linguistics*, 1998) meletakkan dasar metodologi pembuatan korpus yang representatif, termasuk pentingnya keseimbangan genre. **COCA** (Corpus of Contemporary American English; Davies, 2008) dengan komposisi 20% per genre (lisan, fiksi, majalah, koran, akademik) menjadi referensi standar.

Untuk bahasa Indonesia, **Leipzig Corpora Collection** menyediakan korpus berita ~30 juta kata, namun tidak diperbarui dan hanya mencakup satu genre. **OSCAR** dan **CC-100** menyediakan teks berbahasa Indonesia dalam volume besar (3–4 miliar kata) namun dari web crawl sembarangan dengan noise tinggi — tidak terkurasi dan tidak bertimestamp.

### 4.3 Leksikologi Komputasional

**Kilgarriff & Rundell** (*Lexicography in the Age of the Internet*, 2002) menguraikan bagaimana korpus elektronik mengubah praktik leksikografi. **Hanks** (*Lexical Analysis*, 2013) mengembangkan teori norma dan eksploitasi yang relevan untuk memahami bagaimana kata baru berperilaku dalam konteks.

Untuk pendeteksian neologisme secara otomatis, **Renouf** (2007) dan **Kerremans** (2015) mengusulkan metode berbasis korpus yang memanfaatkan frekuensi, distribusi, dan pola kolokasi — pendekatan yang menjadi dasar metodologi penelitian ini.

### 4.4 Bahasa Indonesia: Tantangan Khusus

Bahasa Indonesia bersifat **aglutinatif** dengan sistem afiksasi yang sangat produktif (Sneddon, 2003). Satu kata dasar dapat menghasilkan puluhan bentuk turunan, yang memperumit tokenisasi dan dedup dalam pipeline NLP. Stemmer Nazief-Adriani (1996) dan PySastrawi menjadi acuan, meski keduanya memiliki limitasi pada kata serapan baru dan afiks cakapan (*nge-*, *-in*).

**Code-switching** Inggris–Indonesia dibahas oleh **Hoffmann** dan **Muysken** dalam kerangka tipologi, namun aplikasinya dalam konteks leksikografi deskriptif digital masih sangat terbatas.

---

## 5. Kerangka Teoretis

Penelitian ini berdiri di persimpangan tiga bidang:

```
Leksikografi Deskriptif          Korpus Linguistik
  (apa yang direkam               (bagaimana bukti
   dan bagaimana)                  dikumpulkan)
          \                        /
           \                      /
            \                    /
         Leksikologi Komputasional
         (bagaimana otomasi dibangun
          dan dievaluasi)
```

### 5.1 Atestasi sebagai Unit Epistemik

Mengikuti tradisi OED, **atestasi** — kutipan penggunaan nyata dengan metadata sumber dan tanggal — adalah unit bukti terkecil yang valid untuk klaim leksikografis. Sistem yang dirancang menggunakan atestasi bukan hanya sebagai pelengkap, tetapi sebagai *fondasi* keputusan kurasi.

Ini berbeda dari pendekatan crowdsourced murni (Urban Dictionary) yang menerima klaim tanpa verifikasi, dan berbeda pula dari pendekatan preskriptif yang menolak kata tanpa atestasi formal.

### 5.2 Teori Neologisme: CANOE Metcalf

**Metcalf** (*Predicting New Words*, 2002) mengusulkan kriteria CANOE untuk menilai kemungkinan bertahannya sebuah neologisme:
- **C**onspicuousness — seberapa mencolok kata itu
- **A**daptability — seberapa mudah dimodifikasi morfologis
- **N**umber of users — jumlah penutur yang menggunakannya
- **O**pportunity — seberapa sering kesempatan penggunaan muncul
- **E**ndurance — seberapa lama kata sudah ada

Kriteria ini dapat dioperasionalisasikan dalam sistem: frekuensi atestasi, jumlah sumber berbeda, rentang waktu, dan produktivitas morfologis kata menjadi proksi komputasional untuk CANOE.

### 5.3 Register, Dialek, Sosiolek

Mengikuti **Halliday** dan **Biber & Conrad**, penelitian ini membedakan tiga dimensi variasi linguistik yang relevan untuk pelabelan leksikografis:
- **Register**: variasi berdasarkan situasi penggunaan (formal ↔ informal)
- **Dialek**: variasi berdasarkan wilayah geografis (Betawi, Medan, Surabaya)
- **Sosiolek**: variasi berdasarkan komunitas penutur (gamer, k-pop, akademik)

Ketiga dimensi ini diperlakukan sebagai metadata atestasi, bukan dikotomi biner.

---

## 6. Metodologi

### 6.1 Pendekatan: Design Science Research

Penelitian ini menggunakan **Design Science Research** (Hevner et al., 2004) — paradigma yang tepat untuk penelitian yang menghasilkan artefak beroperasi sebagai kontribusi utama. Siklus DSR:

```
[ Identifikasi masalah ] → [ Rancang artefak ] → [ Implementasi ]
         ↑                                              ↓
[ Evaluasi & revisi ] ←─────────────────────── [ Demonstrasi ]
```

Artefak utama adalah sistem leksikografi deskriptif yang beroperasi. Evaluasi dilakukan pada presisi/recall kandidat, kualitas saran definisi, dan beban kerja redaktur.

### 6.2 Arsitektur Sistem: Gambaran Besar

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUMBER MASUKAN                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Scraper RSS  │  │  Kontribusi  │  │  Sinyal Pencarian    │  │
│  │ (berita)     │  │  Pengguna    │  │  (kata tak ditemukan) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼────────────────────-─┼─────────────┘
          │                 │                       │
          ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE NORMALISASI                          │
│   Stemming → Normalisasi varian → Filter → Dedup → Cek kamus   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STAGING AREA + ATESTASI (DB)                   │
│                                                                  │
│   kandidat_entri  ←──→  atestasi                                │
│   (kata kandidat)        (kutipan bukti penggunaan)             │
│                                                                  │
│   korpus_frekuensi   korpus_dokumen → object storage            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANTRIAN KURASI REDAKSI                        │
│   Review atestasi → Saran definisi otomatis → Setujui/Tolak    │
└────────────────────────────┬────────────────────────────────────┘
                             │ setujui
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     KAMUS UTAMA (PUBLIK)                         │
│   entri + makna + contoh (tabel yang sudah ada)                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Tiga Jalur Penjaringan

| Jalur | Mekanisme | Volume estimasi | Hipotesis presisi |
|---|---|---|---|
| **Sinyal pencarian organik** | Kata dicari ≥10× tapi tidak ditemukan → otomatis masuk kandidat | Rendah, sangat relevan | Tertinggi — demand terverifikasi |
| **Kontribusi pengguna** | Form `/usul-kata` dengan login Google OAuth | Bergantung engagement | Menengah — ada intensi tapi perlu moderasi |
| **Scraper RSS berita** | Crawler otomatis, tokenisasi, filter | ~500–2.000 kandidat baru/hari (bulan pertama) | Rendah–menengah — banyak false positive |

Evaluasi efektivitas relatif ketiga jalur ini menjawab **sub-pertanyaan 1**.

### 6.4 Pipeline Normalisasi: Penanganan Morfologi Aglutinatif

Pipeline per token (dari Jalur Scraper) menangani tantangan khusus bahasa Indonesia:

```
Token mentah dari teks
    │
    ├─[1] Normalisasi ortografi: peta_varian lookup
    │     ("nggak" → "tidak", "karna" → "karena")
    │
    ├─[2] Normalisasi afiks cakapan (pre-stemmer)
    │     ("nge-cancel" → "cancel", "di-ghosting" → "ghosting")
    │
    ├─[3] Stemming (Nazief-Adriani)
    │     ("membatalkan" → "batal")
    │
    ├─[4] Filter: stopword, angka, simbol, token < 3 karakter
    │
    ├─[5] Heuristik Named Entity (skor_ne)
    │     Kapital mid-sentence tanpa afiks → skor tinggi → tidak dikandidatkan
    │     Kapital + afiks Indonesia → skor rendah → kemungkinan terleksikalisasi
    │
    ├─[6] Lookup BATCH ke entri + kandidat_entri
    │
    └─[7] Persist: kandidat baru atau tambah atestasi
```

Strategi lengkap untuk entitas bernama, slang, dan varian didokumentasikan di **Lampiran L1**.

### 6.5 Saran Definisi Otomatis (Non-Generatif)

Untuk mengurangi beban redaktur tanpa ketergantungan pada LLM, sistem menggabungkan tujuh teknik bertingkat (menjawab **sub-pertanyaan 4**):

| Teknik | Mekanisme | Nilai |
|---|---|---|
| A. Ekstraksi apositif | Regex pada atestasi: "X, atau Y" | Tertinggi — definisi dari sumber |
| B. Template tipe kata | Template akronim, serapan, code-mixing | Tinggi untuk kata berpola |
| C. Wiktionary lookup | API publik gratis | Tinggi untuk kata yang sudah diketahui |
| D. Kolokasi dari atestasi | SQL: token yang sering berdampingan | Selalu tersedia, memberikan konteks |
| E. FastText embeddings | Tetangga semantik terdekat (vektor, bukan generatif) | Tinggi, butuh setup |
| F. Komposisi morfologis | Definisi kata dasar + template afiks | Menengah |
| G. IndoWordNet | Hipernim & sinonim dari jaringan leksikal | Menengah, cakupan terbatas |

Semua saran bersifat **read-only** — ditampilkan sebagai panel bantuan, tidak mengubah data. Redaktur tetap yang menulis definisi final. Rincian implementasi di **Lampiran L4**.

### 6.6 Strategi Korpus Multi-Genre

Mengikuti prinsip COCA, korpus yang dibangun menargetkan keseimbangan delapan genre (lihat **Lampiran L3**):

| Genre | Target proporsi | Sumber |
|---|---|---|
| Percakapan digital | 25% | Forum, ulasan e-commerce |
| Jurnalistik | 20% | RSS berita (Fase 1) |
| Ensiklopedik | 20% | Wikipedia dump (Fase 1) |
| Sastra & fiksi | 15% | Proyek Gutenberg, Wattpad |
| Akademik | 10% | Garuda, repositori terbuka |
| Hukum | 5% | JDIH (domain publik) |
| Lisan | 4% | Podcast dengan transkrip |
| Bisnis | 1% | Siaran pers, laporan IDX |

Pengaruh keseimbangan genre terhadap jenis kandidat yang dihasilkan menjawab **sub-pertanyaan 3**.

### 6.7 Evaluasi

**Evaluasi sistem (kuantitatif):**
- Presisi: proporsi kandidat yang pada akhirnya disetujui redaktur
- Recall: perkiraan neologisme yang berhasil ditangkap vs. yang terlewat (sampel manual)
- Beban redaktur: waktu rata-rata kurasi per kandidat (dengan vs. tanpa saran definisi otomatis)
- Inter-annotator agreement: Cohen's kappa dari review ganda 200 kandidat oleh 2–3 redaktur independen

**Evaluasi linguistik (kualitatif):**
- Analisis 500 kandidat pertama yang disetujui: distribusi tipe, mekanisme pembentukan, ragam
- Pelacakan kurva saturasi: kapan sistem berhenti menemukan kata genuinely baru dari satu sumber
- Studi kasus siklus hidup: 20 neologisme dipilih dan dilacak dari kemunculan hingga adopsi/kematian
- Survival analysis (Kaplan-Meier) untuk operasionalisasi siklus hidup neologisme

**Baseline comparison (eksternal):**
- Retroaktif: bandingkan output sistem terhadap kata-kata baru yang masuk KBBI edisi terbaru dalam periode observasi
- Paralel: bandingkan terhadap neologisme yang muncul di Wiktionary bahasa Indonesia dalam periode yang sama
- Keduanya memberikan anchor evaluasi di luar sistem sendiri

Detail operasionalisasi metrik temporal dan desain studi IAA didokumentasikan di **Lampiran L7**.

### 6.8 Ancaman terhadap Validitas

Karena penelitian ini menghasilkan artefak yang beroperasi di lingkungan nyata, ancaman terhadap validitas tidak hanya metodologis, tetapi juga operasional. Empat ancaman utama perlu diantisipasi sejak desain awal:

| Ancaman | Bentuk bias | Dampak | Mitigasi yang diusulkan |
|---|---|---|---|
| **Bias sumber** | RSS berita dan platform publik tidak merepresentasikan seluruh ekologi bahasa Indonesia | Kandidat terlalu didominasi register jurnalistik/digital urban | Jaga komposisi genre; laporkan distribusi kandidat per genre; jangan generalisasi melampaui cakupan korpus |
| **False novelty** | Typo, nama produk, judul kampanye, dan noise scraping tampak sebagai kata baru | Presisi turun; backlog redaksi membengkak | Fingerprint artikel, heuristik NE, daftar blokir dinamis, dan review sampel false positive tiap bulan |
| **Drift redaksional** | Redaktur berbeda dapat menerapkan standar kelayakan yang berbeda | Label dan keputusan kurasi tidak konsisten | Pedoman kurasi tertulis, audit inter-annotator, dan adjudication meeting berkala |
| **Drift platform** | Sumber digital berubah struktur HTML, kebijakan, atau gaya bahasa | Ketidakstabilan pipeline longitudinal | Versioning parser per sumber, logging kegagalan ekstraksi, dan fallback ke sumber lain |

Selain itu, evaluasi recall harus dinyatakan sebagai **estimasi berbasis sampel manual**, bukan recall absolut. Untuk domain neologisme terbuka, himpunan ground truth penuh hampir mustahil diperoleh; karena itu, transparansi metode sampling lebih penting daripada klaim recall yang terlalu kuat.

---

## 7. Rancangan Artefak Penelitian

### 7.1 Skema Database: Empat Tabel Baru

Empat tabel ditambahkan ke skema Kateglo yang sudah ada. Tabel kamus utama (`entri`, `makna`, `contoh`) tidak diubah.

#### `kandidat_entri` — Staging Area

```sql
CREATE TABLE kandidat_entri (
  id              serial PRIMARY KEY,
  kata            text NOT NULL,
  indeks          text NOT NULL,           -- normalized: lowercase, tanpa diakritik
  jenis           text,                    -- 'kata-dasar','kata-majemuk','frasa','singkatan','serapan'
  kelas_kata      text,                    -- nomina, verba, adjektiva, dll
  definisi_awal   text,                    -- definisi sementara dari kontributor/scraper
  ragam           text,                    -- cakapan, gaul, teknis, arkais, dll
  bahasa_campur   text,                    -- 'id-en', 'id-jw', dll
  status          text NOT NULL DEFAULT 'menunggu',
  catatan_redaksi text,
  entri_id        integer REFERENCES entri(id),
  kontributor_id  integer REFERENCES pengguna(id),
  sumber_scraper  text,
  prioritas       smallint DEFAULT 0,      -- 0=normal, 1=tinggi, 2=segera
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT kandidat_kata_check    CHECK (trim(kata) <> ''),
  CONSTRAINT kandidat_status_check  CHECK (status IN (
    'menunggu', 'ditinjau', 'disetujui', 'ditolak', 'tunda'
  )),
  CONSTRAINT kandidat_jenis_check   CHECK (jenis IN (
    'kata-dasar', 'kata-majemuk', 'frasa', 'singkatan', 'serapan', NULL
  ))
);

CREATE UNIQUE INDEX idx_kandidat_indeks_uq  ON kandidat_entri (indeks);
CREATE INDEX        idx_kandidat_status     ON kandidat_entri (status);
CREATE INDEX        idx_kandidat_prioritas  ON kandidat_entri (prioritas DESC, created_at DESC);
CREATE INDEX        idx_kandidat_created    ON kandidat_entri (created_at DESC);
```

#### `atestasi` — Bukti Penggunaan

Mengikuti standar OED: setiap kandidat idealnya memiliki minimal 2 atestasi dari sumber berbeda.

```sql
CREATE TABLE atestasi (
  id             serial PRIMARY KEY,
  kandidat_id    integer NOT NULL REFERENCES kandidat_entri(id) ON DELETE CASCADE,
  kutipan        text NOT NULL,        -- kalimat asli yang mengandung kata
  konteks_pra    text,                 -- kalimat sebelumnya (opsional)
  konteks_pasca  text,                 -- kalimat sesudahnya (opsional)
  sumber_tipe    text NOT NULL,        -- 'berita','web','media-sosial','buku','jurnal','kontribusi'
  sumber_url     text,
  sumber_nama    text,
  sumber_penulis text,                 -- boleh dianonimisasi
  tanggal_terbit date,                 -- kritis: memungkinkan analisis temporal
  crawler_id     text,
  skor_konfiden  numeric(3,2),         -- 0.00–1.00, dari heuristik NLP
  penulis_anonim boolean DEFAULT false,
  konten_dihapus boolean DEFAULT false,
  aktif          boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),

  CONSTRAINT atestasi_sumber_tipe_check CHECK (sumber_tipe IN (
    'berita', 'web', 'media-sosial', 'buku', 'jurnal', 'kontribusi'
  ))
);

CREATE INDEX idx_atestasi_kandidat ON atestasi (kandidat_id);
CREATE INDEX idx_atestasi_tanggal  ON atestasi (tanggal_terbit DESC);
```

#### `sumber_korpus` — Registri Sumber

```sql
CREATE TABLE sumber_korpus (
  id             serial PRIMARY KEY,
  kode           text UNIQUE NOT NULL,
  nama           text NOT NULL,
  tipe           text NOT NULL,        -- 'rss', 'api', 'scrape', 'upload', 'manual'
  genre          text,                 -- 'jurnalistik','percakapan-digital','akademik', dll
  subgenre       text,
  url_dasar      text,
  bahasa         text DEFAULT 'id',
  aktif          boolean DEFAULT true,
  config         jsonb,                -- rate_limit, selectors, auth
  terakhir_crawl timestamptz,
  created_at     timestamptz DEFAULT now()
);
```

#### `riwayat_kurasi` — Audit Trail

```sql
CREATE TABLE riwayat_kurasi (
  id           serial PRIMARY KEY,
  kandidat_id  integer NOT NULL REFERENCES kandidat_entri(id),
  redaktur_id  integer NOT NULL REFERENCES pengguna(id),
  aksi         text NOT NULL,   -- 'tinjau', 'setujui', 'tolak', 'tunda', 'edit'
  status_lama  text,
  status_baru  text,
  catatan      text,
  perubahan    jsonb,           -- diff field yang diubah
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_riwayat_kandidat  ON riwayat_kurasi (kandidat_id);
CREATE INDEX idx_riwayat_redaktur  ON riwayat_kurasi (redaktur_id);
CREATE INDEX idx_riwayat_created   ON riwayat_kurasi (created_at DESC);
```

#### Tabel Korpus (Fase 3)

```sql
-- Metadata artikel — teks penuh disimpan di object storage
CREATE TABLE korpus_dokumen (
  id          serial PRIMARY KEY,
  sumber_id   integer REFERENCES sumber_korpus(id),
  url         text UNIQUE NOT NULL,
  judul       text,
  tanggal     date,
  rubrik      text,
  jumlah_kata integer,
  path_storage text,           -- path ke file .txt.gz di object storage
  bahasa      text DEFAULT 'id',
  crawled_at  timestamptz DEFAULT now()
);

-- Frekuensi token global (aggregate)
CREATE TABLE korpus_frekuensi (
  token      text PRIMARY KEY,
  frekuensi  bigint DEFAULT 0,
  df         integer DEFAULT 0,   -- document frequency
  pertama    date,
  terakhir   date,
  updated_at timestamptz DEFAULT now()
);

-- Frekuensi token per bulan (kritis untuk analisis temporal, sub-pertanyaan 5)
CREATE TABLE korpus_frekuensi_bulanan (
  token      text NOT NULL,
  bulan      date NOT NULL,        -- hari pertama bulan (2026-03-01, dst.)
  frekuensi  bigint DEFAULT 0,
  df         integer DEFAULT 0,     -- document frequency bulan itu
  PRIMARY KEY (token, bulan)
);

CREATE INDEX idx_frekuensi_bulanan_bulan ON korpus_frekuensi_bulanan (bulan);
```

Tabel `korpus_frekuensi` menyimpan agregat global, sedangkan `korpus_frekuensi_bulanan` memungkinkan analisis tren temporal untuk *seluruh* kosakata korpus — bukan hanya kata-kata yang sudah masuk kandidat. Tanpa tabel ini, pelacakan siklus hidup (sub-pertanyaan 5) hanya bisa dilakukan melalui `atestasi.tanggal_terbit`, yang cakupannya terbatas pada kata-kata yang sudah teridentifikasi.

### 7.2 Jalur Penjaringan: Implementasi

#### Jalur 1 — Sinyal Pencarian Organik

```sql
-- Tambah ke tabel pencarian yang sudah ada:
ALTER TABLE pencarian ADD COLUMN ditemukan boolean DEFAULT true;

-- Cron harian: kandidatkan kata yang sering dicari tapi gagal
INSERT INTO kandidat_entri (kata, indeks, sumber_scraper, prioritas)
SELECT kata, lower(kata), 'pencarian-tidak-ditemukan', 1
FROM pencarian
WHERE ditemukan = false
  AND tanggal >= current_date - 7
GROUP BY kata
HAVING sum(jumlah) >= 10
ON CONFLICT (indeks) DO NOTHING;
```

#### Jalur 2 — Kontribusi Pengguna

Form dua langkah di `/usul-kata` (login Google OAuth wajib):

**Langkah 1** — Cek real-time: apakah kata sudah ada di kamus atau sudah dalam antrian?
**Langkah 2** — Isi: kata, kelas kata, definisi, contoh kalimat, sumber.

Pengguna yang sudah login dapat melihat kandidat yang sudah ada dan menambahkan atestasi pendukung — mengubah sistem dari pasif (submit lalu lupakan) menjadi partisipatif.

#### Jalur 3 — Scraper RSS Berita

Target media (RSS publik tersedia, legal untuk parsing):

| Media | ~Artikel/hari | Karakteristik bahasa |
|---|---|---|
| Detik.com | 600 | Kasual, cepat, banyak kata baru |
| Tribunnews.com | 400 | Populis |
| Kompas.com | 250 | Baku, jurnalistik |
| Kumparan.com | 150 | Digital, millennial |
| Tempo.co | 120 | Investigatif, istilah hukum/politik |
| CNN Indonesia | 100 | Teknis, ekonomi |
| **Total** | **~1.620/hari** | |

Pipeline scraper per artikel:

```
[RSS Fetcher]     → Ambil feed setiap jam, ekstrak URL baru
      ↓
[Article Fetcher]  → GET halaman (1 req/detik/domain, hormati robots.txt)
      ↓
[Parser]           → Ekstrak teks bersih (Cheerio), buang HTML/iklan
      ↓
[Normalisasi]      → Peta varian → afiks cakapan → stemming
      ↓
[Filter]           → Stopword, angka, token <3 karakter, heuristik NE
      ↓
[Lookup BATCH]     → Cek vs entri + kandidat_entri
      ↓
[Persist]          → INSERT kandidat baru / INSERT atestasi / UPDATE frekuensi
```

**Stack teknis**: `axios` + `rss-parser` + `cheerio` + stemmer Nazief-Adriani (`natural`) + `node-cron`

**Pertimbangan legal & etis**:
- Hanya scrape halaman publik; hormati `robots.txt`
- Simpan URL sumber untuk atribusi; tidak simpan artikel penuh kecuali di object storage (Fase 3)
- User-Agent transparan: `KategloBot/1.0 (+https://kateglo.com/bot)`

#### Guardrail Kualitas Data

Supaya jalur scraper tidak membanjiri redaksi dengan kandidat semu, pipeline perlu dilengkapi guardrail tambahan sejak fase awal:

| Guardrail | Fungsi | Implementasi awal |
|---|---|---|
| **Dedup artikel lintas-sindikasi** | Mencegah artikel yang sama dari banyak portal dihitung sebagai bukti berbeda | Simpan fingerprint konten (hash judul + paragraf awal ter-normalisasi) di `korpus_dokumen` |
| **Dedup kandidat lintas-varian** | Menggabungkan `work from office`, `wfo`, `WFO`, dan ejaan terkait sebagai keluarga kandidat saat perlu | Indeks normalisasi + tabel alias/varian pada fase lanjut |
| **Quota sumber** | Mencegah satu media mendominasi antrian kandidat | Batas kandidat baru per sumber per hari; sisanya tetap disimpan sebagai atestasi |
| **Cooling-off window** | Menahan istilah viral sesaat sebelum diprioritaskan | Kandidat dari scraper naik prioritas hanya jika muncul ulang setelah jeda waktu tertentu |
| **Sampling audit** | Mengukur kualitas filter secara terus-menerus | Audit manual 100 kandidat scraper per bulan untuk menghitung false positive utama |

Guardrail ini penting karena masalah terbesar fase awal biasanya bukan kekurangan data, melainkan **kelebihan kandidat berkualitas rendah**.

### 7.3 Alur Kurasi Redaksi

#### Siklus Hidup Status Kandidat

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────────────┐
│ menunggu │──→  │ ditinjau │──→  │ disetujui │──→  │  entri + makna   │
└──────────┘     └──────┬───┘     └───────────┘     │  (kamus publik)  │
                        │                            └──────────────────┘
                        ├──→ ditolak
                        └──→ tunda
```

#### Kriteria Kelayakan

| Kriteria | Minimum | Ideal |
|---|---|---|
| Jumlah atestasi | 2 | 5+ |
| Rentang sumber | 1 platform | 3+ platform berbeda |
| Rentang waktu atestasi | — | 3+ bulan |
| Definisi tersedia | Wajib | Jelas, tidak tautologis |
| Bukan nama diri | Wajib | — |
| Stabilitas penggunaan | — | Bukan tren sesaat |

#### Pedoman Konsistensi Redaksi

Untuk menjaga kualitas keputusan kurasi sebagai data penelitian, redaksi perlu memakai rubric yang eksplisit. Tanpa itu, keputusan `disetujui` atau `ditolak` akan sulit dipakai sebagai label emas untuk evaluasi sistem.

Rubric minimum yang disarankan:

- **Setujui** jika kandidat menunjukkan penggunaan leksikal relatif stabil, bukan sekadar typo, bukan nama diri murni, dan dapat didefinisikan secara non-sirkular.
- **Tunda** jika bukti penggunaan belum cukup tersebar atau masih tampak sebagai tren sangat sesaat, tetapi ada indikasi akan bertahan.
- **Tolak** jika kandidat terutama merupakan typo, noise parser, spam SEO, nama kampanye sesaat, atau bentuk yang seluruh nilainya hanya berasal dari kapitalisasi/format.

Secara metodologis, 10–15% kandidat pada fase awal sebaiknya direview ganda oleh dua redaktur untuk mengukur **inter-annotator agreement**. Ketidaksepakatan menjadi bahan revisi rubric, bukan sekadar dianggap noise manusia.

#### Migrasi ke Kamus Utama (Transaksi Atomik)

Saat redaktur menekan "Setujui & Migrasi":

1. `INSERT INTO entri` — kata, indeks, jenis
2. `INSERT INTO makna` — definisi final, kelas_kata, ragam
3. `INSERT INTO contoh` — 1–2 atestasi terpilih sebagai contoh kalimat
4. `UPDATE kandidat_entri SET entri_id = <baru>, status = 'disetujui'`
5. `INSERT INTO riwayat_kurasi` — aksi, redaktur, timestamp
6. Entri langsung tampil di kamus publik

### 7.4 API Endpoints

**Publik** (login Google OAuth):
```
POST /api/publik/usulan-kata      — submit kontribusi
GET  /api/publik/kandidat         — lihat kandidat (pengguna login)
POST /api/publik/kandidat/:id/atestasi — tambah atestasi pendukung
```

**Redaksi** (role redaktur/admin):
```
GET    /api/redaksi/kandidat            — list + filter + sort
GET    /api/redaksi/kandidat/:id        — detail + atestasi + riwayat + saran definisi
PUT    /api/redaksi/kandidat/:id        — edit definisi/kelas_kata
PUT    /api/redaksi/kandidat/:id/status — ubah status
POST   /api/redaksi/kandidat/:id/migrasi — migrasi ke kamus
GET    /api/redaksi/kandidat/stats      — statistik antrian
```

**Internal/Scraper** (API key):
```
POST /api/internal/kandidat/bulk    — bulk upsert dari scraper
POST /api/internal/frekuensi/bulk  — update korpus_frekuensi
```

### 7.5 Antarmuka Pengguna

**Publik `/usul-kata`** — form dua langkah (cek keberadaan → isi detail) dengan real-time autocomplete untuk mencegah duplikasi.

**Publik `/kata-baru`** — daftar kandidat yang dapat dilihat pengguna login; tombol "Saya juga pakai kata ini" untuk tambah atestasi kolektif.

**Redaksi `/redaksi/kandidat-kata`** — panel split: daftar kandidat (kiri) + detail dengan semua atestasi + panel saran definisi otomatis (kanan). Tab: Menunggu / Ditinjau / Disetujui / Ditolak / Tunda.

### 7.6 Integrasi dengan Sistem yang Ada

Saat pencarian gagal di kamus publik:
> *"Kata ini belum ada di kamus. Apakah kamu tahu artinya? [Usulkan →]"*

Pada entri yang berasal dari migrasi kandidat, badge kecil (opsional):
> *"Kata ini ditambahkan berdasarkan penggunaan aktual."*

---

## 8. Produk Sampingan: Korpus Bahasa Indonesia

Infrastruktur scraper yang dibangun untuk sistem kamus deskriptif secara otomatis menghasilkan **korpus bahasa Indonesia multi-genre bertimestamp** — produk sampingan yang bernilai tinggi untuk penelitian NLP.

### 8.1 Posisi di antara Korpus yang Sudah Ada

| Korpus | Ukuran | Sumber | Keunggulan | Kelemahan |
|---|---|---|---|---|
| Leipzig Indonesian | ~30M kata | Berita | Terstruktur | Tidak diperbarui, satu genre |
| OSCAR Indonesia | ~3B kata | Web crawl | Volume besar | Noise tinggi, tidak terkurasi |
| CC-100 Indonesia | ~4B kata | Web crawl | Volume besar | Tidak terkurasi |
| IndoNLU | ~1M kata | Beragam | Berlabel | Kecil |
| **Kateglo Corpus** | **~270M kata/tahun** | **Multi-genre** | **Terstempel waktu, terhubung ke kamus** | Baru dimulai |

### 8.2 Kegunaan Korpus

| Aplikasi | Nilai |
|---|---|
| Analisis frekuensi & pergeseran makna temporal | Langsung dari korpus_frekuensi |
| Kolokasi & distribusi genre | Dari korpus_dokumen + atestasi |
| Fine-tuning language model Indonesia | Perlu teks penuh dari object storage |
| Training POS tagger / NER | Perlu teks penuh |
| Open dataset untuk riset akademik | Ekspor CC-BY dari korpus_frekuensi |

### 8.3 Arsitektur Storage

Teks penuh **tidak** disimpan di PostgreSQL (biaya tidak proporsional). Arsitektur yang benar:

```
PostgreSQL (Render)              Object Storage (Cloudflare R2 / B2)
├── korpus_dokumen               └── id/2026/03/detik-a1b2.txt.gz
│   metadata + path_storage           (~3 KB/artikel terkompresi)
└── korpus_frekuensi
    aggregate token global
```

| Opsi storage | Biaya/bulan untuk 25 GB (5 tahun) |
|---|---|
| PostgreSQL di Render | $40–80/bulan |
| Cloudflare R2 | ~$0,38/bulan |
| Backblaze B2 | ~$0,15/bulan |

---

## 9. Studi Kelayakan & Infrastruktur

### 9.1 Funnel Tokenisasi → Kandidat

```
~730.000 total kata/hari (1.620 artikel, dengan pengulangan)
   ↓ dedup per artikel
~290.000 token unik/hari
   ↓ filter stopword, angka, simbol, URL
~160.000 token bermakna/hari
   ↓ cek vs kamus utama (~127.000 lema)
~24.000 token tidak dikenal/hari
   ↓ filter heuristik NE, token <3 karakter
~8.000 kandidat/hari (bulan pertama, sebelum dedup global)
   ↓ dedup vs kandidat yang sudah ada
~500–2.000 kandidat benar-benar baru/hari (bulan pertama)
```

### 9.2 Kurva Saturasi

Sistem akan mencapai saturasi relatif setelah 6 bulan — kandungan kosakata berita konvergen:

```
Waktu        Kandidat baru/hari   Kumulatif      Karakter
Bulan 1      1.000–2.000          ~30.000–60.000  Kosakata umum yang belum tercatat
Bulan 3      300–600              ~80.000–120.000  Gap mengecil
Bulan 6      100–200              ~100.000–140.000 Mulai stabil
Tahun 1      30–80                ~110.000–160.000 Neologisme genuine
Tahun 2+     10–30                Tumbuh pelan     Kata benar-benar baru
```

Setelah 6 bulan, kandidat yang masuk semakin akurat mencerminkan neologisme genuine — inilah data yang paling berharga untuk menjawab sub-pertanyaan 5.

### 9.3 Kebutuhan Infrastruktur

| Komponen | Kebutuhan | Estimasi biaya |
|---|---|---|
| PostgreSQL (kandidat + atestasi) | ~3–9 GB/tahun | $15–30/bulan |
| Object storage (teks penuh) | ~5–8 GB/tahun | ~$0,50/bulan |
| CPU scraping | < 1 detik/hari CPU time | Di server yang ada |
| Bandwidth scraping | ~16 MB/hari masuk | Termasuk paket server |
| FastText model (Fase 3) | ~600 MB RAM | Di server yang ada |

### 9.4 Risiko Operasional yang Perlu Diantisipasi

Secara teknis, rencana ini layak. Tantangan terbesarnya justru ada pada ritme operasional setelah sistem mulai menghasilkan kandidat dalam jumlah nyata.

| Risiko | Gejala | Dampak | Mitigasi |
|---|---|---|---|
| **Backlog redaksi** | Kandidat `menunggu` tumbuh lebih cepat daripada kapasitas kurasi | Sistem kehilangan nilai praktis dan data evaluasi memburuk | Skor prioritas, batching per domain, dan mode `triase cepat` untuk redaktur |
| **Precision collapse pada fase awal** | Banyak kandidat ternyata typo/nama produk/noise | Kepercayaan redaktur terhadap sistem turun | Fokus pada sinyal pencarian + crowdsourcing terlebih dahulu; scraper dibuka bertahap per sumber |
| **Bias urban-digital** | Kandidat didominasi bahasa media kota besar | Klaim tentang bahasa Indonesia menjadi terlalu sempit | Tambah genre regional dan sumber non-berita secepat mungkin setelah fase dasar stabil |
| **Ketergantungan pada satu kanal login atau satu platform sumber** | Gangguan OAuth atau perubahan akses sumber menghentikan pemasukan data | Pipeline rapuh | Siapkan login alternatif dan diversifikasi sumber sejak awal |

Secara praktis, saya menilai Fase 1 dan Fase 2 akan jauh lebih aman bila keberhasilan tidak diukur hanya dari jumlah kandidat yang masuk, tetapi juga dari dua rasio kontrol: **median waktu dari masuk ke keputusan** dan **persentase kandidat scraper yang tetap relevan setelah 30 hari**.

---

## 10. Kontribusi yang Diharapkan

### Kontribusi Primer

1. **Sistem leksikografi deskriptif yang beroperasi** — artefak fungsional yang dapat digunakan dan direplikasi untuk bahasa lain dengan karakteristik aglutinatif serupa

2. **Metodologi penjaringan neologisme** untuk bahasa aglutinatif — panduan yang mencakup normalisasi morfologis, penanganan NE terleksikalisasi, klasifikasi slang, dan dedup varian

3. **Analisis empiris neologisme bahasa Indonesia** — data longitudinal tentang jenis, frekuensi, mekanisme pembentukan, dan siklus hidup neologisme berdasarkan korpus multi-genre nyata

### Kontribusi Sekunder

4. **Korpus bahasa Indonesia multi-genre bertimestamp** (~270M kata/tahun) — dataset terbuka (CC-BY) untuk komunitas riset NLP bahasa Indonesia

5. **Dataset kandidat neologisme berlabel** — ribuan kata dengan metadata atestasi, keputusan kurasi, dan alasan — berguna sebagai benchmark untuk tugas deteksi neologisme otomatis

6. **Teknik saran definisi non-generatif** — demonstrasi bahwa pipeline berbasis ekstraksi apositif + kolokasi + word embeddings dapat mengurangi beban redaktur secara signifikan tanpa LLM

---

## 11. Jadwal Penelitian

### Fase 1 — Fondasi Sistem (Bulan 1–4)

*Target: sistem dapat menerima kontribusi dan redaktur dapat mengkurasi*

- [ ] SQL migration: 4 tabel baru + `ALTER TABLE pencarian ADD COLUMN ditemukan`
- [ ] Backend model `modelKandidatEntri.js`: CRUD + migrasi ke entri
- [ ] API: route publik (usul kata) + route redaksi (antrian, detail, status, migrasi)
- [ ] Frontend: `/usul-kata` (2 langkah) + `/kata-baru` (lihat kandidat)
- [ ] Frontend redaksi: `/redaksi/kandidat-kata` (panel split + aksi)
- [ ] Integrasi pencarian: catat `ditemukan = false`, tampilkan link usul
- [ ] Rubric kurasi redaksi v1 + template catatan adjudikasi

*Evaluasi Fase 1*: uji coba dengan 3–5 redaktur volunteer selama 1 bulan; ukur beban kerja dan kualitas keputusan kurasi.

### Fase 2 — Scraper & Saran Definisi (Bulan 5–10)

*Target: sistem menjaring kata secara otomatis dan memberikan bantuan definisi*

- [ ] Seed `sumber_korpus` (6 media RSS)
- [ ] Scraper: RSS fetcher + article parser + tokenizer + stopword
- [ ] Pipeline normalisasi: peta_varian + afiks cakapan + stemming
- [ ] `node-cron` scheduler (setiap jam)
- [ ] Cron harian: kandidatkan dari `pencarian` tidak ditemukan
- [ ] Saran definisi A–D (apositif, template, Wiktionary, kolokasi)
- [ ] Dashboard statistik scraper
- [ ] Dedup lintas-sindikasi + fingerprint artikel
- [ ] Sampling audit bulanan untuk false positive scraper

*Evaluasi Fase 2*: ukur presisi (% kandidat scraper yang disetujui), recall (sampel manual), dan waktu kurasi dengan vs. tanpa saran definisi.

### Fase 3 — Korpus & Analisis Temporal (Bulan 11–18)

*Target: korpus beroperasi, data cukup untuk analisis temporal*

- [ ] Pilih & konfigurasi object storage
- [ ] `korpus_dokumen` + update scraper untuk simpan teks penuh
- [ ] `korpus_frekuensi` + aggregate token
- [ ] Wikipedia dump: proses & masuk object storage
- [ ] JDIH: proses & masuk object storage
- [ ] FastText embeddings (saran definisi E)
- [ ] Visualisasi tren kata di halaman redaksi
- [ ] Ekspor dataset frekuensi CC-BY

*Evaluasi Fase 3*: analisis pengaruh genre terhadap jenis kandidat; mulai pelacakan siklus hidup 20 neologisme terpilih.

### Fase 4 — Kecerdasan & Penulisan (Bulan 19–36)

*Target: sistem matang, data analisis cukup untuk disertasi*

- [ ] Clustering: deteksi varian ejaan otomatis
- [ ] Skor prioritas otomatis (CANOE operasionalisasi)
- [ ] Analisis longitudinal neologisme (menjawab sub-pertanyaan 5)
- [ ] Evaluasi komparatif teknik saran definisi
- [ ] Penulisan disertasi + paper
- [ ] Ekspor dataset terbuka + dokumentasi replikasi

---

## 12. Keputusan Desain yang Telah Ditetapkan

Keputusan-keputusan berikut telah difinalisasi sebelum implementasi dimulai:

| # | Pertanyaan | Keputusan | Catatan implementasi |
|---|---|---|---|
| 1 | Login untuk usul kata? | ✅ Wajib login via Google OAuth | Gunakan sistem login yang sudah ada |
| 2 | Visibilitas kandidat | ✅ Pengguna login bisa melihat & menambah atestasi | Tidak terlihat tanpa login |
| 3 | Threshold atestasi | ✅ Langsung masuk antrian — tidak ada threshold minimum | Semua kandidat masuk sejak pertama |
| 4 | Scope scraper awal | ✅ RSS saja | Tambah sumber lain hanya setelah RSS stabil |
| 5 | Label ragam khusus | ✅ Gunakan nilai yang ada (`cakapan`, dll.) | Tidak perlu perubahan skema |
| 6 | Korpus: teks penuh? | ✅ Simpan teks penuh di object storage | PostgreSQL hanya metadata |
| 7 | Recall penelitian | ✅ Dilaporkan sebagai estimasi berbasis sampel | Hindari klaim recall absolut |
| 8 | Kualitas keputusan kurasi | ✅ Gunakan rubric eksplisit + review ganda sebagian sampel | Penting untuk validitas label |

---

## 13. Daftar Pustaka

- **Alwi, H., Dardjowidjojo, S., Lapoliwa, H., & Moeliono, A.M.** (2003). *Tata Bahasa Baku Bahasa Indonesia* (edisi ke-3). Balai Pustaka.
- **Atkins, B.T.S. & Rundell, M.** (2008). *The Oxford Guide to Practical Lexicography*. Oxford University Press.
- **Biber, D., Conrad, S., & Reppen, R.** (1998). *Corpus Linguistics: Investigating Language Structure and Use*. Cambridge University Press.
- **Davies, M.** (2008–). *The Corpus of Contemporary American English (COCA)*. Available online at english-corpora.org/coca/.
- **Green, J.** (2010). *Green's Dictionary of Slang*. Chambers.
- **Hanks, P.** (2013). *Lexical Analysis: Norms and Exploitations*. MIT Press.
- **Hevner, A.R., March, S.T., Park, J., & Ram, S.** (2004). Design Science in Information Systems Research. *MIS Quarterly*, 28(1), 75–105.
- **Kerremans, D.** (2015). *A Web of New Words: A Corpus-Based Study of the Conventionalization Process of English Neologisms*. Peter Lang.
- **Kilgarriff, A. & Rundell, M.** (2002). Lexical Profiling Software and its Lexicographic Applications. *Proceedings of EURALEX 2002*.
- **Landau, S.I.** (2001). *Dictionaries: The Art and Craft of Lexicography* (edisi ke-2). Cambridge University Press.
- **Metcalf, A.** (2002). *Predicting New Words: The Secrets of Their Success*. Houghton Mifflin.
- **Nazief, B. & Adriani, M.** (1996). Confix-Stripping: Approach to Stemming Algorithm for Bahasa Indonesia. Internal Publication, Faculty of Computer Science, University of Indonesia.
- **Oxford English Dictionary** (edisi ke-3). Oxford University Press. Daring: oed.com.
- **Renouf, A.** (2007). Tracing Lexical Productivity and Creativity in the British Media. Dalam Munat, J. (ed.), *Lexical Creativity, Texts and Contexts*. John Benjamins.
- **Sneddon, J.N.** (2003). *The Indonesian Language: Its History and Role in Modern Society*. University of New South Wales Press.
- **OSCAR Corpus** — Common Crawl-based multilingual corpus. Ortiz Suárez et al. (2019).
- **IndoNLU Benchmark** — Wilie et al. (2020). IndoNLU: Benchmark and Resources for Evaluating Indonesian Natural Language Understanding. *AACL-IJCNLP 2020*.
- **Leipzig Corpora Collection** — Quasthoff, U., Richter, M., & Biemann, C. (2006). Corpus Portal for Search in Monolingual Corpora. *LREC 2006*.
- **Sinclair, J.M.** (1991). *Corpus, Concordance, Collocation*. Oxford University Press.
- **Zgusta, L.** (1971). *Manual of Lexicography*. Academia / Mouton.
- **Artstein, R. & Poesio, M.** (2008). Inter-Coder Agreement for Computational Linguistics. *Computational Linguistics*, 34(4), 555–596.
- **Kleinbaum, D.G. & Klein, M.** (2012). *Survival Analysis: A Self-Learning Text* (edisi ke-3). Springer.

---

## Lampiran Teknis

Lampiran berikut mendokumentasikan spesifikasi teknis rinci yang mendukung metodologi di atas.
Setiap lampiran dapat dikembangkan menjadi paper atau bab tersendiri.

- **[L1] `202603090941_strategi-ne-slang-varian.md`** — Taksonomi dan strategi penanganan entitas bernama (terleksikalisasi vs. murni), slang (5 mekanisme pembentukan, siklus hidup), dan varian (ortografis, morfologis, dialektal). Mencakup implementasi filter, tabel `peta_varian`, dan clustering Levenshtein.

- **[L2] `202603090946_pertimbangan-lanjutan-kamus-deskriptif.md`** — Isu lanjutan: normalisasi morfologis dan limitasi stemmer, multi-word expressions/frasa leksikal, pergeseran makna temporal, granularitas label (register/dialek/sosiolek), privasi atestasi dan UU PDP, kata dari media non-teks, homonim baru dari slang.

- **[L3] `202603090956_korpus-multi-genre.md`** — Rancangan keseimbangan genre korpus: taksonomi 8 genre, profil linguistik dan aksesibilitas tiap genre, komposisi yang diusulkan, genre sebagai konteks atestasi, roadmap akuisisi per fase.

- **[L4] `202603091021_saran-definisi-otomatis.md`** — Implementasi lengkap tujuh teknik saran definisi non-generatif: ekstraksi apositif (regex), template tipe kata, Wiktionary API lookup, kolokasi SQL, FastText embeddings (Python sidecar), komposisi morfologis dari kata dasar, IndoWordNet.

- **[L5] `202603091036_infrastruktur-penelitian-terbuka.md`** — Rancangan akses terbuka untuk peneliti: model akses empat tier, lisensi per komponen (MIT/CC-BY/CC-BY-NC), infrastruktur API penelitian, format bulk download, tata kelola, keberlanjutan biaya, potensi mitra institusi (BRIN, Badan Bahasa, universitas), dan preseden proyek serupa.

- **[L6] `202603091108_perdebatan-teoritis-leksikografi.md`** — Perdebatan teoritis: spektrum preskriptif–deskriptif sebagai kontinum (bukan dikotomi), posisi KBBI secara teoritis (normatif dalam tujuan, campuran dalam metodologi), tiga revolusi besar sejarah leksikografi (kamus normatif modern → OED/atestasi → corpus computing dan crowdsourcing), perdebatan yang belum selesai (masalah seleksi, ambang atestasi, otoritas), dan posisi Kadi di antara OED edisi ke-3 dan COBUILD.

- **[L7] `202603091215_evaluasi-etika-replikabilitas.md`** — Kerangka evaluasi lanjutan: desain studi IAA, operasionalisasi siklus hidup neologisme (survival analysis), metodologi baseline comparison eksternal, strategi cold start crowdsourcing, kepatuhan UU PDP dan ethical clearance, penanganan neologisme semantik (makna baru untuk kata lama), dan kerangka replikabilitas.
