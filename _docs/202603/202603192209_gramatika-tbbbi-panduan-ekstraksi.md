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
│   ├── numeralia-pokok.md
│   ├── numeralia-tingkat.md
│   └── frasa-numeral.md
├── verba/
│   ├── fitur-semantis-verba.md
│   ├── perilaku-sintaktis-verba.md
│   ├── bentuk-verba.md
│   ├── verba-transitif.md
│   ├── verba-taktransitif.md
│   ├── verba-reduplikasi.md
│   ├── verba-majemuk.md
│   └── frasa-verbal.md
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
| Batasan & Ciri | ✓ | ✓¹ | ✓ | ✓ | ✓ | — | ✓ |
| Makna / Fitur Semantis | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Fungsi / Perilaku Sintaktis / Posisi | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Jenis | ✓ | ✓² | — | — | ✓ | ✓³ | — |
| Bentuk | — | ✓ | ✓ | ✓ | — | — | — |
| Frasa | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| ... dan Kelas Kata Lain | — | — | ✓ | ✓ | — | — | — |
| Acuan *(semantik)* | ✓ | — | — | — | — | — | — |
| Pertarafan *(sintaktis)* | — | — | ✓ | — | — | — | — |
| Sub-item bertingkat⁴ | — | — | — | — | — | — | ✓ |

¹ Dipecah jadi 2 halaman: Fitur Semantis (4.1.1) + Perilaku Sintaktis (4.1.2)
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

Contoh terkonfirmasi: file `bab-ix-h475.jpg` menampilkan nomor halaman buku 452 di bagian bawah (475 − 23 = 452). File `bab-ix-h430.jpg` menampilkan halaman judul "BAB IX KALIMAT" (PDF halaman 430 = halaman buku 407).

### Bagian Bab

Semua nomor adalah **nomor halaman PDF** (1-indeks).

| Bab | Judul | PDF awal | PDF akhir | Jml hal | JPG | Markdown |
|-----|-------|:---:|:---:|:---:|:---:|:---:|
| I   | Pendahuluan | 25 | 46 | 22 | — | — |
| II  | Tata Bahasa: Tinjauan Selayang Pandang | 47 | 68 | 22 | ✓ | ✓ |
| III | Bunyi Bahasa dan Tata Bunyi | 69 | 118 | 50 | ✓ | ✓ |
| IV  | Verba | 119 | 216 | 98 | — | ✓ |
| V   | Adjektiva | 217 | 257 | 41 | — | ✓ |
| VI  | Adverbia | 258 | 281 | 24 | — | ✓ |
| VII | Nomina, Pronomina, Numeralia | 282 | 395 | 114 | — | ✓ |
| VIII | Kata Tugas | 396 | 429 | 34 | — | ✓ |
| IX  | Kalimat | 430 | 534 | 105 | ✓ | ✓ |
| X   | Hubungan Antarklausa | 535 | 574 | 40 | — | ✓ |

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
2. **Claude membaca gambar langsung** (multimodal) — jauh lebih akurat untuk teks berformat kompleks, contoh bernomor, dan tabel
3. **Tidak perlu perbaikan OCR manual** — Claude langsung menginterpretasi layout halaman

### Lokasi File JPG

```
_data/gramatika/
├── Tata Bahasa Baku Bahasa Indonesia TBBBI IV (2017).pdf
├── bab-09/          ← sudah ada (Bab IX, 105 file)
│   ├── bab-09-h430.jpg
│   └── ...
└── bab-10/          ← sudah ada (Bab X, digunakan untuk verifikasi OCR)
    ├── bab-10-h535.jpg
    └── ...
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
BAB_SLUG   = "bab-x"                          # nama subfolder & prefix file
PDF_AWAL   = 558                               # 1-indeks, inklusif
PDF_AKHIR  = 597                               # 1-indeks, inklusif
OUTPUT_DIR = f"c:/Kode/Kateglo/kateglo/_data/gramatika/{BAB_SLUG}-jpg"

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
| IX  | `bab-09/` | h430–h534 | ✓ selesai |
| X   | `bab-10/` | h535–h574 | ✓ selesai |
| I   | `bab-01/` | h025–h046 | — |
| II  | `bab-02/` | h047–h068 | ✓ selesai |
| III | `bab-03/` | h069–h118 | ✓ selesai |
| IV  | `bab-04/` | h119–h216 | — |
| V   | `bab-05/` | h217–h257 | — |
| VI  | `bab-06/` | h258–h281 | — |
| VII | `bab-07/` | h282–h395 | — |
| VIII | `bab-08/` | h396–h429 | — |

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

**Subbab:** Batasan dan Ciri · Makna (8 jenis semantis) · Fungsi (atributif, predikatif, adverbial) · Pertarafan (6 tingkat kualitas + 3 tingkat pembandingan) · Bentuk · Frasa Adjektival · Adjektiva dan Kelas Kata Lain

---

### ☐ 4. Bab I — Pendahuluan (22 hal PDF)

- Hampir seluruhnya prosa; tidak ada tabel atau diagram.
- OCR relatif mudah dibersihkan.
- Konten bersifat normatif (kedudukan bahasa, ragam, bahasa baku).
- Nilai praktis untuk pengguna kamus lebih rendah dibanding bab kelas kata.
- Cocok dikerjakan kapan saja karena tidak ada ketergantungan dengan bab lain.

**Subbab yang disarankan:** Kedudukan Bahasa Indonesia · Ragam Bahasa · Bahasa Baku · Bahasa yang Baik dan Benar

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
- Dikerjakan dengan bantuan JPG per halaman (`_data/gramatika/bab-ix-jpg/`) karena OCR teks tidak memadai.
- Dipecah menjadi 6 file markdown.

**Subbab:** Batasan dan Ciri Kalimat (9.1) · Unsur Kalimat (9.2) · Kategori, Fungsi, dan Peran (9.3) · Kalimat Dasar (9.4) · Jenis Kalimat (9.5) · Pengingkaran (9.6)

---

### ✓ 9. Bab IV — Verba (98 hal PDF) — **SELESAI**

- Bab kedua terpanjang; morfologi verba paling kompleks dalam TBBBI.
- Tabel morfofonemik (meng- + kata dasar → bentuk infleksi) sangat panjang dan rawan OCR error — direkonstruksi dari pengetahuan morfofonologi bahasa Indonesia.
- Frasa verbal dan fungsinya (4.6) disertakan lengkap sebagai file ke-8.
- Dipecah menjadi 8 item: Fitur Semantis · Perilaku Sintaktis · Bentuk Verba · Verba Transitif · Verba Taktransitif · Verba Hasil Reduplikasi · Verba Majemuk · Frasa Verbal.

**Subbab:** Fitur Semantis Verba (4.1.1) · Perilaku Sintaktis Verba (4.1.2) · Bentuk Verba (4.1.3) · Verba Transitif (4.2) · Verba Taktransitif (4.3) · Verba Hasil Reduplikasi (4.4) · Verba Majemuk (4.5) · Frasa Verbal dan Fungsinya (4.6)

---

### ✓ 4. Bab VII — Nomina, Pronomina, dan Numeralia (114 hal PDF) — **SELESAI**

- Bab terpanjang keseluruhan; tiga kelas kata digabung dalam satu bab.
- Dipecah menjadi tiga entri terpisah di `gramatikData.js`: Nomina (7 item), Pronomina (3 item), Numeralia (3 item).

**Subbab Nomina:** Batasan dan Ciri · Makna · Acuan · Fungsi · Jenis · Frasa Nominal (7.1.5–7.1.6)

**Subbab Pronomina:** Batasan dan Ciri · Jenis (persona, penunjuk, penanya) · Frasa Pronominal

**Subbab Numeralia:** Numeralia Pokok (tentu, kolektif, distributif, taktentu, klitika, pecahan) · Numeralia Tingkat · Frasa Numeral

---

## Catatan Teknis

- Tabel dalam markdown menggunakan `|` — pastikan jumlah kolom konsisten (OCR sering menggabungkan sel).
- Kata bercetak miring di TBBBI biasanya contoh kata/kalimat → gunakan `*miring*` atau blockquote.
- Contoh kalimat panjang: cukup kutip 2–3 yang paling representatif per aturan.
- Hapus header/footer halaman yang menyusup (nomor halaman, nama bab, penomoran romawi di pojok).
- Script sementara Python wajib dihapus setelah dipakai (prefix `temp_` di `backend/`).
