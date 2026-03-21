# Panduan Ekstraksi Bab TBBBI untuk Halaman Gramatika

Tanggal dibuat: 2026-03-19
Dimutakhirkan: 2026-03-21

## Latar Belakang

Halaman Gramatika (`/gramatika`) dibangun dengan pola yang sama seperti Ejaan: konten berupa file `.md` statis di `frontend/public/gramatika/`, dirender dengan `ReactMarkdown`, dilengkapi SSR meta, cache-control, dan sitemap. Bab pertama yang diselesaikan sebagai pilot adalah **Bab VIII: Kata Tugas** (~34 halaman PDF).

Per 2026-03-21, seluruh bab inti TBBBI I-X sudah tersedia dalam markdown di `frontend/public/gramatika/`, dengan daftar isi terpusat di `frontend/src/constants/gramatikData.js`. Dokumen ini berfungsi sebagai panduan kerja sekaligus catatan status terkini.

Sumber primer: *Tata Bahasa Baku Bahasa Indonesia Edisi Keempat* (2017), Badan Pengembangan dan Pembinaan Bahasa. Tercatat di tabel `sumber` dengan kode `TBBBI` (id 46).

PDF tersimpan di: `_data/gramatika/Tata Bahasa Baku Bahasa Indonesia TBBBI IV (2017).pdf`

Asset gambar pendukung Gramatika dipusatkan di: `frontend/public/gramatika/_gambar/`

---

## Pelajaran dari Proyek Ekstraksi

Bab VIII tetap menjadi pilot awal, tetapi pola kerja di bawah ini sudah divalidasi dan dipakai untuk seluruh rangkaian ekstraksi bab Gramatika.

### Alur Kerja Ekstraksi

1. **Ekstrak teks** menggunakan `pdfplumber` via `.venv/Scripts/python.exe`:
   ```python
   import pdfplumber
   with pdfplumber.open("_data/gramatika/...pdf") as pdf:
       for i in range(halaman_awal, halaman_akhir):
           print(f"=== hal {i+1} ===")
           print(pdf.pages[i].extract_text())
   ```
2. **Salin semua teks dari PDF secara lengkap** — jangan diringkas, jangan dipotong. Setiap contoh, setiap kalimat penjelasan dari TBBBI harus disertakan. Peringkasan menyebabkan konten hilang dan harus dikerjakan ulang. Satu-satunya pengecualian: bagan/diagram pohon atau elemen visual yang memang tidak dapat dirender memadai dalam markdown (lihat poin 4).
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
    - Jika bagan/diagram kehilangan makna visual saat ditranskripsi, sisipkan gambar dari `frontend/public/gramatika/_gambar/` dan tetap pertahankan caption serta uraian teksnya
5. **Tulis file markdown** per subbab ke `frontend/public/gramatika/{bab-slug}/{item-slug}.md`
   - Tambahkan **nomor subbab** setelah judul heading: `## Bentuk Preposisi (8.2.1.1)`
6. **Daftarkan item** di `frontend/src/constants/gramatikData.js`
7. **Jalankan lint + test** setelah setiap perubahan kode

### Konvensi Format Daftar Markdown

- Untuk halaman daftar bab, gunakan ordered list Markdown biasa dengan indentasi 3 spasi untuk anak daftar.
- Contoh yang benar:

    ```md
    1. [Ragam Bahasa](/gramatika/ragam-bahasa)
         1. [Ragam Menurut Golongan Penutur](/gramatika/ragam-menurut-golongan-penutur)
         2. [Ragam Menurut Jenis Pemakaian](/gramatika/ragam-menurut-jenis-pemakaian)
    ```

- Untuk contoh bertingkat di dalam uraian, jangan menulis label datar seperti `- a. i. Kalimat ...` karena renderer akan menganggapnya satu tingkat bullet saja.
- Gunakan nested list seperti berikut:

    ```md
    (35)
    - a.
        - i. Wati ke Bandung.
        - ii. Wati akan/sudah/belum/tidak ke Bandung.
    - b.
        - i. Wati pergi ke Bandung.
    ```

- Jika ada kelanjutan penjelasan untuk satu butir, indentasikan tetap di bawah butir yang sama; jangan dibiarkan sebagai baris gantung tanpa struktur list yang jelas.
- Hindari mencampur pola ordered list, unordered list, dan penomoran manual dalam satu blok jika hubungan hierarkinya sebenarnya sama.
- Jangan membungkus contoh biasa yang masih berupa daftar atau kalimat dengan blok `text`; gunakan markdown biasa agar tipografi dan spasi mengikuti halaman lain.
- Blok `text` dipakai hanya untuk diagram ASCII, bagan pohon, atau susunan visual monospace yang memang akan rusak jika diubah menjadi paragraf/list biasa.

### Konvensi Gambar

- Semua asset gambar Gramatika dipusatkan di `frontend/public/gramatika/_gambar/`
- Gunakan subfolder per bab bila diperlukan, misalnya `frontend/public/gramatika/_gambar/bab-03/`
- Pola nama file: `{jenis}-{bab-dua-digit}-{nomor-dua-digit}-{slug}`
- Contoh nama file: `bagan-03-01-alat-ucap.webp`
- Simpan `png` sebagai master kerja dan gunakan `webp` sebagai file frontend bila kualitas tetap tajam
- Jika hasil konversi `webp` menurunkan keterbacaan teks kecil atau garis tipis, pakai `png` langsung di markdown
- Referensi dari markdown harus memakai path absolut publik, misalnya:

  ```md
  ![Bagan 3.1 Alat Ucap](/gramatika/_gambar/bab-03/bagan-03-01-alat-ucap.webp)

  *Bagan 3.1 Alat Ucap*
  ```

- Gunakan gambar untuk bagan anatomi, diagram posisi, pohon sintaksis, atau tabel kompleks yang tidak nyaman dibaca sebagai markdown
- Untuk aksesibilitas dan fallback, jangan mengganti seluruh isi dengan gambar saja; pertahankan transkripsi atau deskripsi singkat setelah gambar

### Struktur File

```
frontend/public/gramatika/
├── pendahuluan/
│   ├── kedudukan-bahasa-indonesia.md
│   ├── ragam-bahasa.md
│   ├── diglosia.md
│   ├── pembakuan-bahasa.md
│   ├── bahasa-baku.md
│   ├── fungsi-bahasa-baku.md
│   ├── bahasa-yang-baik-dan-benar.md
│   └── hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing.md
├── tata-bahasa/
│   ├── deskripsi-dan-teori.md
│   ├── pengertian-tata-bahasa.md
│   └── semantik-pragmatik-dan-relasi-makna.md
├── bunyi-bahasa/
│   ├── batasan-dan-ciri-bunyi-bahasa.md
│   ├── vokal-dan-konsonan.md
│   ├── struktur-suku-kata-dan-kata.md
│   ├── pemenggalan-kata.md
│   └── ciri-suprasegmental.md
├── verba/
│   ├── batasan-dan-ciri-verba.md
│   ├── fitur-semantis-verba.md
│   ├── perilaku-sintaktis-verba.md
│   ├── bentuk-verba.md
│   ├── verba-transitif.md
│   ├── verba-taktransitif.md
│   ├── verba-reduplikasi.md
│   ├── verba-majemuk.md
│   └── frasa-verbal.md
├── adjektiva/
│   ├── batasan-dan-ciri-adjektiva.md
│   ├── makna-adjektiva.md
│   ├── fungsi-adjektiva.md
│   ├── pertarafan-adjektiva.md
│   ├── bentuk-adjektiva.md
│   ├── frasa-adjektival.md
│   └── adjektiva-dan-kelas-kata-lain.md
├── adverbia/
│   ├── batasan-dan-ciri-adverbia.md
│   ├── makna-adverbia.md
│   ├── posisi-adverbia.md
│   ├── bentuk-adverbia.md
│   ├── bentuk-adverbial.md
│   └── adverbia-dan-kelas-kata-lain.md
├── nomina/
│   ├── batasan-dan-ciri-nomina.md
│   ├── makna-nomina.md
│   ├── acuan-nomina.md
│   ├── fungsi-nomina.md
│   ├── jenis-nomina.md
│   └── frasa-nominal.md
├── pronomina/
│   ├── batasan-dan-ciri-pronomina.md
│   ├── jenis-pronomina.md
│   └── frasa-pronominal.md
├── numeralia/
│   ├── batasan-dan-ciri-numeralia.md
│   ├── numeralia-pokok.md
│   ├── numeralia-tingkat.md
│   └── frasa-numeral.md
├── kata-tugas/
│   ├── batasan-dan-ciri-kata-tugas.md
│   ├── preposisi.md
│   ├── konjungsi.md
│   ├── interjeksi.md
│   ├── artikula.md
│   └── partikel-penegas.md
├── kalimat/
│   ├── batasan-dan-ciri-kalimat.md
│   ├── unsur-kalimat.md
│   ├── kategori-fungsi-dan-peran.md
│   ├── kalimat-dasar.md
│   ├── jenis-kalimat.md
│   └── pengingkaran.md
└── hubungan-antarklausa/
    ├── hubungan-koordinatif.md
    ├── hubungan-subordinatif.md
    └── pelesapan.md

frontend/src/constants/gramatikData.js   ← daftar isi semua bab + item
```

---

## Pola Struktur Deskripsi Kelas Kata

TBBBI menggunakan kerangka deskripsi yang konsisten untuk setiap kelas kata. Setiap bab pada dasarnya menjawab pertanyaan yang sama secara berurutan:

| Urutan | Pertanyaan | Label di TBBBI |
|:---:|---|---|
| 1 | Apa itu & bagaimana mengenalinya? | Batasan & Ciri |
| 2 | Apa yang dikandungnya secara semantis? | Makna / Fitur Semantis |
| 3 | Bagaimana perilakunya dalam kalimat? | Fungsi / Perilaku Sintaktis / Posisi |
| 4 | Apa saja jenisnya? | Jenis / Transitif+Taktransitif / Pokok+Tingkat |
| 5 | Bagaimana bentuk morfologisnya? | Bentuk |
| 6 | Bagaimana membentuk frasa? | Frasa |
| 7 | Apa hubungannya dengan kelas kata lain? | ... dan Kelas Kata Lain *(opsional)* |

Pemetaan tiap bab ke kerangka ini:

| Topik | Nom | Ver | Adj | Adv | Pro | Num | KTg |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Batasan & Ciri | ✓ | ✓¹ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Makna / Fitur Semantis | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Fungsi / Perilaku Sintaktis / Posisi | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Jenis | ✓ | ✓² | — | — | ✓ | ✓³ | — |
| Bentuk | — | ✓ | ✓ | ✓ | — | — | — |
| Frasa | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| ... dan Kelas Kata Lain | — | — | ✓ | ✓ | — | — | — |
| Acuan *(semantik)* | ✓ | — | — | — | — | — | — |
| Pertarafan *(sintaktis)* | — | — | ✓ | — | — | — | — |
| Sub-item bertingkat⁴ | — | — | — | — | — | — | ✓ |

¹ Diawali halaman Batasan dan Ciri Verba, lalu rincian 4.1 dipecah lagi menjadi Fitur Semantis (4.1.1) + Perilaku Sintaktis (4.1.2)
² Dipecah jadi 4 halaman: Transitif · Taktransitif · Reduplikasi · Majemuk
³ Dipecah jadi 2 halaman: Pokok · Tingkat
⁴ Preposisi & Konjungsi punya sub-jenis yang dalam (tunggal/gabungan, koordinatif/subordinatif/dll.)

### Catatan per Bab

- **Nomina**: punya *Acuan* — deskripsi semantis tentang rujukan nomina ke dunia nyata, setara dengan dimensi semantik.
- **Adjektiva**: punya *Pertarafan* — menggambarkan konstruksi derajat (*sangat*, *lebih*, *paling*, *ter-*, *se-...-nya*); berbasis sintaktis dengan latar semantis gradabilitas.
- **Verba & Numeralia**: "Jenis" dipecah menjadi beberapa halaman karena materinya panjang.
- **Kata Tugas**: anomali — tidak memiliki analisis semantik, sintaktis, morfologis, atau frasa sendiri. Seluruh bab berisi inventarisasi jenis-jenis kata tugas beserta sub-jenisnya.

---

## Nomor Halaman

### Konversi Nomor Halaman

PDF tersimpan di: `_data/gramatika/Tata Bahasa Baku Bahasa Indonesia TBBBI IV (2017).pdf`

Terdapat dua sistem penomoran yang berbeda:
- **Nomor halaman PDF** (1-indeks) — nomor urut halaman dalam file PDF; digunakan sebagai nama file JPG
- **Nomor halaman buku** — angka yang tercetak di pojok halaman

Formula: `nomor_buku = nomor_PDF − 23`

Contoh terkonfirmasi: file `bab-09-h475.jpg` menampilkan nomor halaman buku 452 di bagian bawah (475 − 23 = 452). File `bab-09-h430.jpg` menampilkan halaman judul "BAB IX KALIMAT" (PDF halaman 430 = halaman buku 407).

### Bagian Bab

Semua nomor adalah **nomor halaman PDF** (1-indeks).

| Bab | Judul | PDF awal | PDF akhir | Jml hal | JPG | Markdown |
|-----|-------|:---:|:---:|:---:|:---:|:---:|
| I   | Pendahuluan | 25 | 46 | 22 | ✓ | ✓ |
| II  | Tata Bahasa: Tinjauan Selayang Pandang | 47 | 68 | 22 | ✓ | ✓ |
| III | Bunyi Bahasa dan Tata Bunyi | 69 | 118 | 50 | ✓ | ✓ |
| IV  | Verba | 119 | 216 | 98 | ✓ | ✓ |
| V   | Adjektiva | 217 | 257 | 41 | ✓ | ✓ |
| VI  | Adverbia | 258 | 281 | 24 | ✓ | ✓ |
| VII | Nomina, Pronomina, Numeralia | 282 | 395 | 114 | ✓ | ✓ |
| VIII | Kata Tugas | 396 | 429 | 34 | ✓ | ✓ |
| IX  | Kalimat | 430 | 534 | 105 | ✓ | ✓ |
| X   | Hubungan Antarklausa | 535 | 574 | 40 | ✓ | ✓ |

### Bagian Lainnya

| Bagian | PDF awal | PDF akhir | Jml hal | JPG |
|--------|:---:|:---:|:---:|:---:|
| Daftar Isi | 15 | 24 | 10 | — |
| Daftar Pustaka | 575 | 592 | 18 | — |
| Daftar Istilah | 593 | 610 | 18 | — |
| Indeks | 611 | 615 | 5 | — |
| Kover Belakang | 616 | 616 | 1 | — |

---

## Pendekatan JPG per Halaman

### Mengapa JPG lebih baik daripada ekstraksi teks OCR

Ekstraksi teks PDF dengan `pdfplumber` menghasilkan banyak artefak OCR (karakter salah, baris tergabung, tabel berantakan). Pendekatan alternatif yang terbukti lebih efektif:

1. **Konversi PDF → JPG per halaman** menggunakan PyMuPDF (`fitz`)
2. **Model multimodal membaca gambar langsung** — jauh lebih akurat untuk teks berformat kompleks, contoh bernomor, dan tabel
3. **Beban perbaikan OCR manual jauh berkurang** karena layout halaman bisa diverifikasi langsung dari gambar

### Lokasi File JPG

```
_data/gramatika/
├── Tata Bahasa Baku Bahasa Indonesia TBBBI IV (2017).pdf
├── bab-01/
├── bab-02/
├── bab-03/
├── bab-04/
├── bab-05/
├── bab-06/
├── bab-07/
├── bab-08/
├── bab-09/
├── bab-10/
├── daftar-isi/
├── daftar-istilah/
├── daftar-pustaka/
├── indeks/
└── kover-belakang/
```

Konvensi nama: `bab-{NN}-h{NNN}.jpg` di mana `NN` = nomor bab dua digit, `NNN` = nomor PDF 1-indeks (tiga digit).

Contoh: `bab-09-h475.jpg` = halaman PDF ke-475 = halaman buku 452.

### Script Konversi JPG

Simpan sementara di `backend/temp_pdf_to_jpg.py`, hapus setelah selesai.

```python
import fitz  # PyMuPDF — install: python -m pip install PyMuPDF
import os

PDF_PATH = "c:/Kode/Kateglo/kateglo/_data/gramatika/Tata Bahasa Baku Bahasa Indonesia TBBBI IV (2017).pdf"

# Sesuaikan per bab:
BAB_SLUG   = "bab-10"                         # nama subfolder & prefix file
PDF_AWAL   = 535                              # 1-indeks, inklusif
PDF_AKHIR  = 574                              # 1-indeks, inklusif
OUTPUT_DIR = f"c:/Kode/Kateglo/kateglo/_data/gramatika/{BAB_SLUG}"

os.makedirs(OUTPUT_DIR, exist_ok=True)
doc = fitz.open(PDF_PATH)
mat = fitz.Matrix(150/72, 150/72)  # 150 DPI

for page_num in range(PDF_AWAL - 1, PDF_AKHIR):   # fitz pakai 0-indeks
    page = doc[page_num]
    pix  = page.get_pixmap(matrix=mat)
    nama = f"{BAB_SLUG}-h{page_num + 1:03d}.jpg"
    pix.save(os.path.join(OUTPUT_DIR, nama))
    print(f"Disimpan: {nama}")

doc.close()
print("Selesai.")
```

### Status JPG per Bab

| Bab | Subfolder | Rentang file | Status |
|-----|-----------|-------------|--------|
| I   | `bab-01/` | h025–h046 | ✓ selesai |
| II  | `bab-02/` | h047–h068 | ✓ selesai |
| III | `bab-03/` | h069–h118 | ✓ selesai |
| IV  | `bab-04/` | h119–h216 | ✓ selesai |
| V   | `bab-05/` | h217–h257 | ✓ selesai |
| VI  | `bab-06/` | h258–h281 | ✓ selesai |
| VII | `bab-07/` | h282–h395 | ✓ selesai |
| VIII | `bab-08/` | h396–h429 | ✓ selesai |
| IX  | `bab-09/` | h430–h534 | ✓ selesai |
| X   | `bab-10/` | h535–h574 | ✓ selesai |

---

## Status Ekstraksi per Bab

Urutan berikut merekam jalur kerja yang ditempuh saat proyek ekstraksi berjalan. Per 2026-03-21, seluruh bab inti I-X berstatus selesai.

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

**Subbab:** Batasan dan Ciri · Makna (8 jenis semantis) · Fungsi (atributif, predikatif, adverbial) · Pertarafan (6 tingkat kualitas + 3 tingkat pembandingan) · Bentuk · Frasa Adjektival · Adjektiva dan Kelas Kata Lain

---

### ✓ 4. Bab I — Pendahuluan (22 hal PDF) — **SELESAI**

- Hampir seluruhnya prosa; tidak ada tabel atau diagram.
- OCR relatif mudah dibersihkan.
- Konten bersifat normatif (kedudukan bahasa, ragam, bahasa baku).
- Nilai praktis untuk pengguna kamus lebih rendah dibanding bab kelas kata.
- Dipecah menjadi 8 item agar selaras dengan struktur pembahasan di sumber dan navigasi frontend.

**Subbab:** Kedudukan Bahasa Indonesia · Ragam Bahasa · Diglosia · Pembakuan Bahasa · Bahasa Baku · Fungsi Bahasa Baku · Bahasa yang Baik dan Benar · Hubungan Bahasa Indonesia dengan Bahasa Daerah dan Bahasa Asing

---

### ✓ 5. Bab X — Hubungan Antarklausa (40 hal PDF) — **SELESAI**

- Panjang sedang.
- Dua bagian besar: koordinatif dan subordinatif — struktur hirarkis yang rapi.
- Tabel jenis hubungan semantis dapat direkonstruksi dengan baik.
- Relevan untuk memahami konjungsi (hubungan dengan Bab VIII).
- Diekstrak dari PDF dengan PyMuPDF (`fitz`), dikonfirmasi dengan JPG per halaman dari `_data/gramatika/bab-10/`.
- Banyak artefak OCR sistematis pada halaman 565–574: `cl→d`, `c→t`, `e→t`, `b→6` — semua diperbaiki.
- Simbol pelesapan `△` (segitiga) digunakan mengganti artefak OCR `6.`.

**Subbab:** Hubungan Koordinatif (10.1) · Hubungan Subordinatif (10.2) · Pelesapan (10.3)

---

### ✓ 6. Bab II — Tata Bahasa: Tinjauan Selayang Pandang (22 hal PDF) — **SELESAI**

- Diekstrak dengan metode hibrida: teks dasar dari PDF, diverifikasi silang dengan JPG per halaman di `_data/gramatika/bab-02/`.
- Bab ini sangat konseptual, tetapi struktur sumber akhirnya lebih tepat dipertahankan mengikuti pembagian asli TBBBI, bukan dipecah per subseksi kecil.
- Diagram sintaksis pada bagian struktur konstituen, fungsi, dan model diagram direpresentasikan ulang ke bentuk teks/ASCII agar substansinya tetap hadir di markdown.
- Tabel kategori leksikal, kategori frasa, dan contoh fonologi dikonfirmasi dengan gambar untuk membetulkan artefak OCR.

**Subbab:** Deskripsi dan Teori (2.1) · Pengertian Tata Bahasa (2.2) · Semantik, Pragmatik, dan Relasi Makna (2.3)

---

### ✓ 7. Bab III — Bunyi Bahasa dan Tata Bunyi (50 hal PDF) — **SELESAI**

- Diekstrak dengan metode hibrida: teks dasar dari PDF, diverifikasi dengan JPG per halaman di `_data/gramatika/bab-03/`.
- Bagan alat ucap dan bagan vokal direpresentasikan ulang dalam bentuk daftar/tabel markdown karena diagram aslinya tidak bisa ditampilkan langsung.
- Tabel konsonan, tabel alofon vokal, daftar gugus konsonan, dan deret konsonan dibersihkan dari artefak OCR menggunakan konfirmasi silang dari gambar halaman.
- Simbol fonetik dipertahankan sejauh diperlukan agar isi Bab III tetap lengkap dan tidak tereduksi menjadi paraprase.

**Subbab:** Batasan dan Ciri Bunyi Bahasa (3.1) · Vokal dan Konsonan (3.2) · Struktur Suku Kata dan Kata (3.3) · Pemenggalan Kata (3.4) · Ciri Suprasegmental (3.5)

---

### ✓ 8. Bab IX — Kalimat (105 hal PDF) — **SELESAI**

- Bab terpanjang kedua; 9 subbab utama dengan banyak subbab bersarang.
- Mengandung bagan pohon kalimat (tidak dapat dirender markdown — dideskripsikan atau dilewati).
- Dikerjakan dengan bantuan JPG per halaman (`_data/gramatika/bab-09/`) karena OCR teks tidak memadai.
- Dipecah menjadi 6 file markdown.

**Subbab:** Batasan dan Ciri Kalimat (9.1) · Unsur Kalimat (9.2) · Kategori, Fungsi, dan Peran (9.3) · Kalimat Dasar (9.4) · Jenis Kalimat (9.5) · Pengingkaran (9.6)

---

### ✓ 9. Bab IV — Verba (98 hal PDF) — **SELESAI**

- Bab kedua terpanjang; morfologi verba paling kompleks dalam TBBBI.
- Tabel morfofonemik (meng- + kata dasar → bentuk infleksi) sangat panjang dan rawan OCR error — direkonstruksi dari pengetahuan morfofonologi bahasa Indonesia.
- Frasa verbal dan fungsinya (4.6) disertakan lengkap sebagai item penutup.
- Dipecah menjadi 9 item: Batasan dan Ciri Verba · Fitur Semantis · Perilaku Sintaktis · Bentuk Verba · Verba Transitif · Verba Taktransitif · Verba Hasil Reduplikasi · Verba Majemuk · Frasa Verbal.

**Subbab:** Batasan dan Ciri Verba · Fitur Semantis Verba (4.1.1) · Perilaku Sintaktis Verba (4.1.2) · Bentuk Verba (4.1.3) · Verba Transitif (4.2) · Verba Taktransitif (4.3) · Verba Hasil Reduplikasi (4.4) · Verba Majemuk (4.5) · Frasa Verbal dan Fungsinya (4.6)

---

### ✓ 10. Bab VII — Nomina, Pronomina, dan Numeralia (114 hal PDF) — **SELESAI**

- Bab terpanjang keseluruhan; tiga kelas kata digabung dalam satu bab.
- Dipecah menjadi tiga entri terpisah di `gramatikData.js`: Nomina (6 item), Pronomina (3 item), Numeralia (4 item).

**Subbab Nomina:** Batasan dan Ciri · Makna · Acuan · Fungsi · Jenis · Frasa Nominal (7.1.5–7.1.6)

**Subbab Pronomina:** Batasan dan Ciri · Jenis (persona, penunjuk, penanya) · Frasa Pronominal

**Subbab Numeralia:** Batasan dan Ciri · Numeralia Pokok (tentu, kolektif, distributif, taktentu, klitika, pecahan) · Numeralia Tingkat · Frasa Numeral

---

## Catatan Teknis

- Tabel dalam markdown menggunakan `|` — pastikan jumlah kolom konsisten (OCR sering menggabungkan sel).
- Kata bercetak miring di TBBBI biasanya contoh kata/kalimat → gunakan `*miring*` atau blockquote.
- Pertahankan semua contoh yang substantif dari sumber; jangan memangkas daftar contoh hanya demi meringkas tampilan.
- Hapus header/footer halaman yang menyusup (nomor halaman, nama bab, penomoran romawi di pojok).
- Script sementara Python wajib dihapus setelah dipakai (prefix `temp_` di `backend/`).
