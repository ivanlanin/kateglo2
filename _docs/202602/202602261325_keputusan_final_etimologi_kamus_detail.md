# Keputusan Final Ekstraksi Etimologi untuk KamusDetail

**Tanggal**: 2026-02-26  
**Status**: Disepakati (siap diimplementasikan)

## Tujuan Tampilan

Subentri paling akhir di detail entri kamus:

- Heading: **Etimologi**
- Isi utama per baris: **`<bahasa> <kata_asal> <arti_asal>`**

Format akhir `arti_asal` disepakati sebagai:

- **Indonesia (Inggris)**

---

## Keputusan Aturan Ekstraksi

## 1) Bahasa (`bahasa`)

### Keputusan

- Penanda `f` di `sumber_definisi` ditafsirkan sebagai **from**.
- Pada rantai serapan bertingkat, bahasa yang dipakai adalah **bahasa pertama (sumber langsung ke bahasa Indonesia)**.

Contoh:

- `...[< Belanda ... (< Latin < Yunani)]` -> ambil **Belanda**
- `...[< Inggris ... (< Prancis)]` -> ambil **Inggris**
- `...[< Belanda or < Inggris ...]` -> ambil **Belanda** (yang muncul pertama)

### Prioritas sumber

1. `etimologi.bahasa` (jika sudah ada dan valid)
2. Parse `sumber_definisi` untuk mengambil bahasa pertama setelah pola `<` atau `f`

### Catatan normalisasi

- Nama bahasa tetap dinormalisasi ke bentuk Indonesia (mis. `Dutch` -> `Belanda`, `English` -> `Inggris`).

---

## 2) Kata Asal (`kata_asal`)

### Keputusan

Jika tersedia `sumber_aksara`, gabungkan ke `kata_asal` dengan format:

- **`<sumber_aksara> <bentuk_latin>`**

### Prioritas sumber

1. Jika `sumber_aksara` **dan** `sumber_isi` terisi -> `kata_asal = "{sumber_aksara} {sumber_isi}"`
2. Jika hanya `sumber_aksara` terisi -> `kata_asal = sumber_aksara`
3. Jika hanya `sumber_isi` terisi -> `kata_asal = sumber_isi`
4. Jika keduanya kosong -> fallback parse kandidat bentuk kata dari `sumber_definisi`

### Catatan

- `sumber_varian` bukan isi utama `kata_asal`; jika dipakai, posisikan sebagai alias/varian pelengkap.

---

## 3) Arti Asal (`arti_asal`)

### Keputusan

- Ambil gloss dari `sumber_definisi`.
- Tampilkan sebagai **Indonesia (Inggris)** untuk menghindari salah paham.

### Format kolom yang direkomendasikan

Untuk menjaga transparansi dan audit:

- `arti_asal_id` -> hasil terjemahan Indonesia
- `arti_asal_en` -> gloss Inggris asli
- `arti_asal_tampil` -> gabungan `"{arti_asal_id} ({arti_asal_en})"`

### Catatan kualitas

- Jika terjemahan Indonesia belum yakin, tetap tampilkan format konservatif:
  - `(-) ({arti_asal_en})`
  - atau sementara `({arti_asal_en})` sampai review redaksi.

---

## Peran Kolom Sumber Lain

- `sumber_lihat`: rujukan silang (lihat entri lain), **bukan** sumber utama `kata_asal`/`arti_asal`.
- `sumber_varian`: daftar varian bentuk, dipakai sebagai data pendukung (opsional di UI redaksi).
- `sumber_sitasi`: boleh diabaikan pada tahap tampilan publik awal.

---

## Aturan Ringkas Implementasi (Deterministik)

Untuk setiap baris etimologi aktif yang tertaut ke `entri_id`:

1. Tentukan `bahasa_final` sesuai prioritas bahasa.
2. Tentukan `kata_asal_final` sesuai prioritas kata asal (termasuk format aksara + latin).
3. Ekstrak gloss Inggris dari `sumber_definisi` menjadi `arti_asal_en`.
4. Terjemahkan ke `arti_asal_id`.
5. Bentuk `arti_asal_tampil = "{arti_asal_id} ({arti_asal_en})"`.
6. Render di subentri **Etimologi** pada KamusDetail (posisi paling akhir).

---

## Contoh Hasil Tampilan

- `Belanda abacus sempoa (abacus)`
- `Arab عبد ʿabd hamba (slave)`
- `Inggris komputer komputer (computer)`

---

## Implikasi Tahap Berikutnya

1. Tambah pipeline parsing untuk bahasa pertama dari `sumber_definisi` (fallback).
2. Tambah pembentuk `kata_asal_final` dengan aturan aksara+latin.
3. Tambah kolom/field hasil terjemahan arti asal (`id` + `en`).
4. Ekspos data etimologi di endpoint detail kamus publik.
5. Render panel/subentri Etimologi di KamusDetail sebagai blok terakhir.
