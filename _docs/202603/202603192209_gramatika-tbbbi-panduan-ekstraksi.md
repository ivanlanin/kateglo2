# Panduan Ekstraksi Bab TBBBI untuk Halaman Gramatika

Tanggal dibuat: 2026-03-19

## Latar Belakang

Halaman Gramatika (`/gramatika`) dibangun dengan pola yang sama seperti Ejaan: konten berupa file `.md` statis di `frontend/public/gramatika/`, dirender dengan `ReactMarkdown`, dilengkapi SSR meta, cache-control, dan sitemap. Bab pertama yang diselesaikan sebagai pilot adalah **Bab VIII: Kata Tugas** (~34 halaman PDF).

Sumber primer: *Tata Bahasa Baku Bahasa Indonesia Edisi Keempat* (2017), Badan Pengembangan dan Pembinaan Bahasa. Tercatat di tabel `sumber` dengan kode `TBBBI` (id 46).

PDF tersimpan di: `_data/gramatika/Tata Bahasa Baku Bahasa Indonesia TBBBI IV (2017).pdf`

---

## Pelajaran dari Pilot (Bab VIII)

### Alur Kerja Ekstraksi

1. **Ekstrak teks** menggunakan `pdfplumber` via `.venv/Scripts/python.exe`:
   ```python
   import pdfplumber
   with pdfplumber.open("_data/gramatika/...pdf") as pdf:
       for i in range(halaman_awal, halaman_akhir):
           print(f"=== hal {i+1} ===")
           print(pdf.pages[i].extract_text())
   ```
2. **Salin semua teks dari PDF secara lengkap** — jangan diringkas, jangan dipotong. Setiap contoh, setiap kalimat penjelasan dari TBBBI harus disertakan. Peringkasan menyebabkan konten hilang dan harus dikerjakan ulang. Satu-satunya pengecualian: bagan/diagram pohon yang tidak dapat dirender markdown (lihat poin 3).
3. **Identifikasi artefak OCR** yang umum terjadi pada PDF ini:
   - `ü` / `ii` → `u` (ligarur font menjadi dua karakter atau umlaut)
   - `l` → `/` dalam daftar pilihan (`a / b / c`)
   - `{` → `(`, `}` → `)`
   - Pemisahan baris pada kata berimbuhan: `digu-\nnakan` → `digunakan`
   - Baris header/footer halaman menyusup ke body text (nomor halaman, nama bab)
   - `c` untuk `t`, `daiam` → `dalam`, `tiigas` → `tugas`, dll.
4. **Bagan dan tabel** yang tidak dapat direproduksi sebagai markdown:
   - Bagan pohon sintaksis: dideskripsikan dalam prosa
   - Tabel yang OCR-nya kacau: direkonstruksi dari konteks dan pengetahuan TBBBI
5. **Tulis file markdown** per subbab ke `frontend/public/gramatika/{bab-slug}/{item-slug}.md`
   - Tambahkan **nomor subbab** setelah judul heading: `## Bentuk Preposisi (8.2.1.1)`
6. **Daftarkan item** di `frontend/src/constants/gramatikData.js`
7. **Jalankan lint + test** setelah setiap perubahan kode

### Struktur File

```
frontend/public/gramatika/
├── adverbia/
│   ├── batasan-dan-ciri.md
│   ├── makna-adverbia.md
│   ├── posisi-adverbia.md
│   ├── bentuk-adverbia.md
│   └── adverbial-dan-kelas-kata-lain.md
└── kata-tugas/               ← slug bab
    ├── batasan-dan-ciri.md
    ├── preposisi.md
    ├── konjungsi.md
    ├── interjeksi.md
    ├── artikula.md
    └── partikel-penegas.md

frontend/src/constants/gramatikData.js   ← daftar isi semua bab + item
```

---

## Nomor Halaman PDF per Bab

Nomor halaman di bawah adalah nomor halaman **aktual dalam file PDF** (1-indeks, sesuai tampilan di PDF viewer).

Formula Python pdfplumber (0-indeks): `range(PDF_awal - 1, PDF_akhir)`
- Contoh Bab VIII: `range(395, 429)` → mencetak hal 396 s.d. 429

### Bagian Bab

| Bab | Judul | PDF awal | PDF akhir | Jml hal PDF | Selesai |
|-----|-------|----------|-----------|------------|---------|
| I   | Pendahuluan | 25 | 46 | 22 | — |
| II  | Tata Bahasa: Tinjauan Selayang Pandang | 47 | 68 | 22 | — |
| III | Bunyi Bahasa dan Tata Bunyi | 69 | 118 | 50 | — |
| IV  | Verba | 119 | 216 | 98 | — |
| V   | Adjektiva | 217 | 257 | 41 | ✓ |
| VI  | Adverbia | 258 | 281 | 24 | ✓ |
| VII | Nomina, Pronomina, dan Numeralia | 282 | 395 | 114 | — |
| VIII | Kata Tugas | 396 | 429 | 34 | ✓ |
| IX  | Kalimat | 430 | 534 | 105 | — |
| X   | Hubungan Antarklausa | 535 | 574 | 40 | — |

### Bagian Lainnya

| Bagian | PDF awal | PDF akhir |
|--------|----------|-----------|
| Daftar Isi | 15 | 24 |
| Daftar Pustaka | 575 | 592 |
| Daftar Istilah | 593 | 610 |
| Indeks | 611 | 615 |
| Sampul Belakang | 616 | 616 |

---

## Daftar Periksa Urutan Ekstraksi: Termudah → Tersulit

Urutan mempertimbangkan: panjang bab, kualitas OCR yang dapat diharapkan, kepadatan tabel/diagram, dan nilai praktis bagi pengguna kamus.

---

### ✓ 1. Bab VIII — Kata Tugas (34 hal PDF) — **SELESAI**

- Bab terpendek dari sisi halaman.
- Kelas kata tertutup (daftar kata tertentu), mudah diverifikasi kebenarannya.
- Sebagian besar berupa prosa + tabel pendek (daftar preposisi, konjungsi).
- OCR cukup bisa diperbaiki secara manual.
- Tinggi relevansinya bagi pengguna kamus (preposisi, konjungsi, partikel).

**Subbab:** Batasan dan Ciri · Preposisi · Konjungsi · Interjeksi · Artikula · Partikel Penegas

---

### ✓ 2. Bab VI — Adverbia (24 hal PDF) — **SELESAI**

- Bab kedua terpendek.
- Struktur sederhana: klasifikasi semantis → sintaktis → bentuk.
- Tidak ada bagan pohon; tabel minimal.
- Relevan untuk pengguna kamus (kata seperti *sangat*, *selalu*, *hampir*).

**Subbab:** Batasan dan Ciri · Makna Adverbia (8 jenis) · Posisi Adverbia (6 posisi) · Bentuk Adverbia · Adverbial dan Kelas Kata Lain

---

### ✓ 3. Bab V — Adjektiva (41 hal PDF) — **SELESAI**

- Panjang sedang; struktur mirip Bab VIII.
- Bagian pertarafan (tingkat positif, intensif, elatif, dll.) menghasilkan tabel ringkas yang baik.
- Beberapa morfofonemik (adjektiva berimbuhan) tapi tidak sekompleks Bab IV.
- Relevan bagi pengguna kamus (pemahaman gradasi kata sifat).

**Subbab yang disarankan:** Batasan dan Ciri · Jenis Adjektiva (semantis) · Pertarafan · Bentuk Adjektiva · Frasa Adjektival

---

### ☐ 4. Bab I — Pendahuluan (22 hal PDF)

- Hampir seluruhnya prosa; tidak ada tabel atau diagram.
- OCR relatif mudah dibersihkan.
- Konten bersifat normatif (kedudukan bahasa, ragam, bahasa baku).
- Nilai praktis untuk pengguna kamus lebih rendah dibanding bab kelas kata.
- Cocok dikerjakan kapan saja karena tidak ada ketergantungan dengan bab lain.

**Subbab yang disarankan:** Kedudukan Bahasa Indonesia · Ragam Bahasa · Bahasa Baku · Bahasa yang Baik dan Benar

---

### ☐ 5. Bab X — Hubungan Antarklausa (40 hal PDF)

- Panjang sedang.
- Dua bagian besar: koordinatif dan subordinatif — struktur hirarkis yang rapi.
- Tabel jenis hubungan semantis dapat direkonstruksi dengan baik.
- Relevan untuk memahami konjungsi (hubungan dengan Bab VIII).
- OCR diperkirakan cukup bersih (banyak contoh kalimat pendek).

**Subbab yang disarankan:** Hubungan Koordinatif · Hubungan Subordinatif · Hubungan Semantis Antarklausa · Pelesapan

---

### ☐ 6. Bab II — Tata Bahasa: Tinjauan Selayang Pandang (22 hal PDF)

- Singkat, tapi sangat abstrak (proposisi, perikutan, deiksis, implikatur).
- Terminologi filosofis → perlu penerjemahan konsep yang cermat.
- Nilai praktis rendah bagi pengguna kamus biasa.
- Cocok sebagai bab terakhir dalam kelompok "lebih mudah" karena butuh pengerjaan konseptual lebih teliti.

**Subbab yang disarankan:** Pengertian Tata Bahasa · Fonologi · Morfologi · Sintaksis · Semantik dan Pragmatik

---

### ☐ 7. Bab III — Bunyi Bahasa dan Tata Bunyi (50 hal PDF)

- Mengandung bagan vokal dan konsonan (diagram artikulasi) yang tidak dapat dirender dalam markdown.
- Simbol IPA tidak selalu terbaca dengan benar oleh OCR.
- Tabel alofon vokal dan konsonan panjang dan kompleks.
- Pemenggalan kata dan tekanan bisa disajikan dalam prosa + tabel sederhana.
- Relevan tapi butuh keputusan editorial tentang cara menyajikan fonetik tanpa diagram.

**Pendekatan:** Abaikan bagan fonetik, gunakan deskripsi prosa untuk posisi artikulasi; fokus pada pemenggalan kata dan struktur suku kata yang paling berguna.

---

### ☐ 8. Bab IX — Kalimat (105 hal PDF)

- Bab terpanjang kedua; 9 subbab utama dengan banyak subbab bersarang.
- Mengandung bagan pohon kalimat (tidak dapat dirender markdown).
- Klasifikasi berdasarkan jumlah klausa, predikat, tujuan komunikatif, kelengkapan unsur, dan kemasan informasi → sangat banyak subtopik.
- Bagian fungsi sintaktis (S, P, O, Pel, Ket) dan peran semantis paling berguna.
- Strategi: ekstrak per subbab besar, tidak sekaligus.

**Subbab prioritas pertama:** Unsur Kalimat · Kategori-Fungsi-Peran · Kalimat Dasar · Jenis Kalimat (berdasarkan predikat + sintaktis)

---

### ☐ 9. Bab IV — Verba (98 hal PDF)

- Bab kedua terpanjang; morfologi verba paling kompleks dalam TBBBI.
- Tabel morfofonemik (meng- + kata dasar → bentuk infleksi) sangat panjang dan rawan OCR error.
- Perlu verifikasi silang dengan data kamus (entri dalam database) untuk memastikan contoh akurat.
- Frasa verbal dan fungsinya (bagian 4.6) lebih mudah dari bagian morfofonemik.
- Strategi: pisah menjadi setidaknya 3 bagian besar (Batasan & Ciri · Morfologi & Semantik · Frasa Verbal).

---

### ☐ 10. Bab VII — Nomina, Pronomina, dan Numeralia (114 hal PDF)

- Bab terpanjang keseluruhan; tiga kelas kata digabung dalam satu bab.
- Nomina: klasifikasi sangat beragam (berdasarkan acuan, bentuk morfologis, frasa nominal).
- Pronomina: tabel paradigma lengkap (persona 1/2/3, formal/informal, tunggal/jamak).
- Numeralia: pecahan, ordinal, klitika → tabel berlapis.
- Strategi: pecah menjadi minimal 4 dokumen terpisah per kelas kata utama, tambah 1 untuk frasa nominal.

---

## Catatan Teknis

- Tabel dalam markdown menggunakan `|` — pastikan jumlah kolom konsisten (OCR sering menggabungkan sel).
- Kata bercetak miring di TBBBI biasanya contoh kata/kalimat → gunakan `*miring*` atau blockquote.
- Contoh kalimat panjang: cukup kutip 2–3 yang paling representatif per aturan.
- Hapus header/footer halaman yang menyusup (nomor halaman, nama bab, penomoran romawi di pojok).
- Script sementara Python wajib dihapus setelah dipakai (prefix `temp_` di `backend/`).
