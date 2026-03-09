# Infrastruktur Terbuka untuk Peneliti

**Tanggal**: 2026-03-09
**Status**: Lampiran Proposal Doktoral
**Terkait**: `202603090933_cetak-biru-kamus-deskriptif.md`

---

## Ringkasan

Ya, infrastruktur ini bisa dibuka untuk peneliti lain — tetapi tidak semuanya
dengan cara yang sama. Ada tiga lapisan berbeda dengan implikasi hukum dan teknis
yang berbeda pula. Pemisahan ini bukan birokrasi berlebihan; ini perbedaan antara
apa yang **aman secara hukum** untuk didistribusikan dan apa yang tidak.

---

## 1. Apa yang Bisa dan Tidak Bisa Dibagikan

### 1.1 Masalah Hak Cipta Teks Berita

Teks artikel berita yang di-scrape adalah karya berhak cipta milik masing-masing
media. Menyimpannya untuk keperluan internal penelitian (fair use / penelitian
ilmiah) berbeda secara hukum dari mendistribusikannya ke pihak lain.

| Aset | Status hukum distribusi | Catatan |
|---|---|---|
| Teks artikel penuh | ❌ Tidak aman didistribusikan | Hak cipta media; simpan internal saja |
| Kutipan atestasi (2–3 kalimat) | ⚠️ Abu-abu | Fair use untuk penelitian, tapi skala besar berisiko |
| Tabel frekuensi token | ✅ Aman | Aggregate statistik, bukan teks asli |
| Metadata dokumen (URL, tanggal, judul, genre) | ✅ Aman | Fakta bibliografis |
| Teks Wikipedia | ✅ Aman | CC-BY-SA; boleh didistribusikan |
| Teks JDIH (hukum) | ✅ Aman | Domain publik pemerintah |
| Basis data kandidat + status kurasi | ✅ Aman | Data original Kateglo |
| Kode sistem | ✅ Aman | Open source |

**Preseden**: Mayoritas NLP dataset berbasis Twitter hanya mendistribusikan *ID tweet*,
bukan teks, karena alasan yang sama. Peneliti mengunduh ulang teks sendiri dari API.
Model yang sama bisa diterapkan di sini: distribusikan ID + URL, bukan teks.

### 1.2 Apa yang Pasti Bisa Dibagikan

1. **Frekuensi token** — tabel agregat: kata, frekuensi, document frequency, pertama/terakhir muncul
2. **Metadata korpus** — per dokumen: URL, tanggal, genre, rubrik, jumlah kata (tanpa teks)
3. **Dataset kandidat neologisme** — kata, status kurasi, ragam, kelas kata, tanggal masuk
4. **Frekuensi per genre** — breakdown frekuensi token per genre
5. **Kode sistem** — seluruh codebase (scraper, pipeline, sistem kurasi)
6. **Teks Wikipedia + JDIH** — boleh didistribusikan penuh

---

## 2. Model Akses Bertingkat

```
┌────────────────────────────────────────────────────────────┐
│  TIER 0 — Publik (siapa pun, tanpa registrasi)             │
│  • Frekuensi token (CSV/JSON bulk download)                 │
│  • Dataset kandidat neologisme berlabel                     │
│  • Metadata korpus (URL, tanggal, genre, word count)        │
│  • Kode sistem (GitHub, MIT/Apache license)                 │
└────────────────────────────────────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────────┐
│  TIER 1 — API Penelitian (registrasi email akademik)        │
│  • Query frekuensi kata real-time                           │
│  • Query kolokasi (N kata yang sering berdampingan)         │
│  • Query tren temporal (frekuensi per bulan)                │
│  • Query per genre                                          │
│  • Rate limit: 1.000 request/hari                           │
└────────────────────────────────────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────────┐
│  TIER 2 — Akses Korpus (aplikasi + data agreement)          │
│  • Teks penuh Wikipedia + JDIH (aman didistribusikan)       │
│  • Indeks dokumen berita (URL + metadata, tanpa teks)       │
│  • Atestasi dengan anotasi (kutipan pendek per kata)        │
│  • Mensyaratkan: afiliasi akademik + pernyataan tujuan      │
└────────────────────────────────────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────────┐
│  TIER 3 — Replikasi Infrastruktur (untuk institusi)         │
│  • Docker image + setup guide untuk jalankan instance baru  │
│  • Cocok untuk: bahasa daerah Indonesia, bahasa serumpun    │
│  • Mensyaratkan: kontribusi balik ke proyek utama           │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Lisensi yang Diusulkan

| Komponen | Lisensi | Alasan |
|---|---|---|
| Kode sistem | **MIT** | Paling bebas; mendorong adopsi dan modifikasi |
| Dataset frekuensi token | **CC-BY 4.0** | Bebas digunakan, syarat atribusi |
| Dataset kandidat neologisme | **CC-BY 4.0** | Sama |
| Metadata korpus | **CC-BY 4.0** | Fakta bibliografis |
| Teks Wikipedia slice | **CC-BY-SA 4.0** | Mengikuti lisensi Wikipedia |
| Teks JDIH slice | **CC-BY 4.0** | Domain publik pemerintah |
| Atestasi (kutipan pendek) | **CC-BY-NC 4.0** | Non-komersial; lebih hati-hati |

Atribusi standar yang diminta:
> *"Kateglo Corpus [tahun], dikembangkan oleh [nama/institusi]. Tersedia di https://kateglo.com/penelitian"*

---

## 4. Infrastruktur Teknis untuk Akses Peneliti

### 4.1 Halaman Penelitian (`kateglo.com/penelitian`)

Halaman publik yang berisi:
- Deskripsi dataset yang tersedia
- Tautan unduh bulk (Tier 0)
- Formulir registrasi API (Tier 1)
- Formulir aplikasi akses korpus (Tier 2)
- Dokumentasi API
- Paper/sitasi yang direkomendasikan

### 4.2 API Penelitian (Tier 1)

Endpoint tambahan di backend, terpisah dari API publik kamus:

```
GET /api/penelitian/frekuensi/:token
    Response: { token, frekuensi, df, pertama, terakhir, per_genre: {...} }

GET /api/penelitian/kolokasi/:token?window=5&limit=20
    Response: [{ token, mi_score, frekuensi_bersama }]

GET /api/penelitian/tren/:token?dari=2026-01&sampai=2026-12&granularitas=bulan
    Response: [{ periode, frekuensi, df }]

GET /api/penelitian/neologisme?dari=...&sampai=...&ragam=...
    Response: [{ kata, status, tanggal_masuk, jumlah_atestasi, ragam }]

GET /api/penelitian/korpus/stats
    Response: { total_dokumen, total_token, per_genre: {...}, per_bulan: [...] }
```

Autentikasi: API key sederhana yang dikirim via email setelah registrasi.

### 4.3 Bulk Download (Tier 0)

File diperbarui bulanan, tersedia di object storage (Cloudflare R2):

```
penelitian/
├── frekuensi/
│   ├── kateglo-frekuensi-2026-03.csv.gz    (~50 MB)
│   └── kateglo-frekuensi-genre-2026-03.csv.gz
├── neologisme/
│   ├── kandidat-disetujui-2026-03.jsonl.gz
│   └── kandidat-semua-2026-03.jsonl.gz     (tanpa teks kutipan)
├── metadata-korpus/
│   └── dokumen-metadata-2026-03.jsonl.gz   (URL, tanggal, genre, word count)
└── wikipedia-id/
    └── wikipedia-id-2026-03.txt.gz         (~2 GB, teks penuh)
```

Format: JSONL (JSON Lines) atau CSV, terkompresi gzip, unduh langsung tanpa autentikasi.

### 4.4 GitHub Repository

```
github.com/kateglo/kateglo-corpus
├── README.md           — deskripsi, cara akses, sitasi
├── LICENSE             — MIT (kode) + CC-BY (data)
├── docs/
│   ├── schema.md       — skema database lengkap
│   ├── api.md          — dokumentasi API penelitian
│   └── replication.md  — cara menjalankan instance sendiri
├── docker/
│   ├── docker-compose.yml
│   └── Dockerfile
└── scripts/
    ├── download-dataset.py    — script unduh & verifikasi
    └── example-analysis.ipynb — notebook contoh analisis
```

---

## 5. Apa yang Peneliti Bisa Lakukan dengan Ini

### 5.1 Dengan Frekuensi Token (Tier 0)

- Analisis perbedaan frekuensi KBBI vs. penggunaan aktual
- Studi distribusi kosakata per genre
- Deteksi kata yang frekuensinya naik/turun (pergeseran makna temporal)
- Baseline untuk task NLP: language model perplexity, out-of-vocabulary analysis

### 5.2 Dengan API Penelitian (Tier 1)

- Query kolokasi untuk studi semantik
- Analisis tren temporal neologisme
- Studi komparatif antar genre
- Validasi kamus: apakah kata dalam KBBI masih dipakai? Seberapa sering?

### 5.3 Dengan Akses Korpus (Tier 2)

- Fine-tuning language model bahasa Indonesia
- Training POS tagger / NER
- Studi register dan variasi sosiolinguistik
- Benchmark deteksi neologisme otomatis (menggunakan dataset kandidat berlabel)

### 5.4 Dengan Replikasi (Tier 3)

- Membangun sistem serupa untuk bahasa Jawa, Sunda, Melayu, Bugis, dll.
- Membangun kamus deskriptif untuk bahasa daerah yang belum punya infrastruktur
- Studi komparatif laju adopsi neologisme antar bahasa

---

## 6. Tata Kelola

### 6.1 Struktur Sederhana (awal)

Tidak perlu organisasi formal di tahap awal. Cukup kebijakan yang jelas:

- **Maintainer**: peneliti utama (pemilik proyek)
- **Editorial board**: 2–3 orang yang bisa diajak review keputusan kurasi penting
- **Data steward**: bertanggung jawab atas permintaan akses Tier 2

### 6.2 Terms of Use (wajib)

Dokumen singkat yang mensyaratkan:
1. Atribusi dalam publikasi
2. Tidak digunakan untuk tujuan komersial (khusus Tier 2)
3. Tidak mendistribusikan ulang teks berita yang diperoleh dari Tier 2
4. Melaporkan temuan yang bisa memperkaya proyek (opsional tapi dianjurkan)

### 6.3 Kontribusi Balik

Peneliti yang menggunakan infrastruktur ini dan mempublikasikan hasilnya diharapkan:
- Menyebut Kateglo Corpus dalam atribusi
- Berkontribusi anotasi atau koreksi jika menemukan kesalahan dalam dataset
- (Tier 3) Berbagi kode dan data dari proyek replikasi

---

## 7. Keberlanjutan Biaya

Membuka akses peneliti menambah beban infrastruktur. Estimasi:

| Komponen | Estimasi tambahan |
|---|---|
| Object storage (bulk download) | +$2–5/bulan (bandwidth) |
| API penelitian (1.000 req/hari × 100 pengguna) | Minimal — query ringan |
| Bandwidth bulk download | ~$5–10/bulan untuk 100 unduhan/bulan |
| **Total tambahan** | **~$10–20/bulan** |

### Opsi Keberlanjutan

1. **Self-funded** (paling simpel untuk awal): biaya kecil, bisa ditanggung proyek
2. **Hibah penelitian**: BRIN, LPDP, Ford Foundation, Wikimedia Foundation punya program untuk infrastruktur bahasa
3. **Donasi institusi**: universitas yang menggunakan data bisa berkontribusi biaya server
4. **Berlangganan API** untuk penggunaan komersial (tetap gratis untuk akademik)

### Potensi Mitra Institusi

| Institusi | Relevansi | Bentuk kerja sama |
|---|---|---|
| **BRIN** (Badan Riset dan Inovasi Nasional) | Sangat relevan: ada divisi bahasa | Hibah, hosting, validasi data |
| **Badan Bahasa Kemdikbud** | Langsung relevan: pengelola KBBI | Kolaborasi data, legitimasi |
| **Fakultas Ilmu Budaya** (UI, UGM, UNPAD) | Linguistik & leksikografi | Kontribusi anotasi, mahasiswa peneliti |
| **Teknik Informatika / NLP groups** | NLP bahasa Indonesia | Kontribusi model, benchmark |
| **Wikimedia Indonesia** | Corpus Wikipedia | Potensi hibah Wikimedia Foundation |

---

## 8. Preseden Proyek Serupa

| Proyek | Model | Pelajaran |
|---|---|---|
| **Leipzig Corpora Collection** | Bulk download bebas, satu genre | Sederhana dan efektif; tapi tidak diperbarui |
| **Common Crawl** | Open crawl masif, tidak terkurasi | Volume besar tapi noise; peneliti perlu filter sendiri |
| **Hugging Face Datasets** | Platform distribusi + metadata terstandar | Format JSONL + dataset card sangat membantu adopsi |
| **CLARIN** (Eropa) | Infrastruktur riset terpusat, federated | Terlalu kompleks untuk awal; tapi model federasi menarik jangka panjang |
| **UD Treebanks** | GitHub + CC-BY | Standar de facto untuk NLP; adopsi tinggi karena simpel |

**Rekomendasi**: mulai seperti Leipzig + UD Treebanks — bulk download sederhana di GitHub + dokumentasi yang baik. Tambah API hanya setelah ada permintaan nyata.

---

## 9. Langkah Pertama yang Konkret

Tidak perlu semua sekaligus. Urutan yang masuk akal:

**Segera (Fase 1, tanpa tambahan infrastruktur):**
- [ ] Buat `github.com/kateglo/kateglo-corpus` dengan README + LICENSE
- [ ] Ekspor pertama: dataset kandidat neologisme (setelah ada data kurasi)

**Setelah korpus berjalan (Fase 3):**
- [ ] Bulk download frekuensi token + metadata dokumen (otomatis bulanan dari object storage)
- [ ] Halaman `kateglo.com/penelitian` dengan deskripsi dataset

**Setelah ada permintaan (Fase 3–4):**
- [ ] API penelitian dengan registrasi API key
- [ ] Formulir aplikasi akses Tier 2
- [ ] Dataset card di Hugging Face untuk visibilitas

**Jangka panjang:**
- [ ] Hubungi BRIN dan Badan Bahasa untuk eksplorasi kemitraan
- [ ] Ajukan dataset ke CLARIN untuk visibilitas internasional
