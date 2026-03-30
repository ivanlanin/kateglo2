# Analisis Missing Etimologi setelah Migrasi Pola `based on`

**Tanggal**: 2026-02-26 14:18  
**Status**: Selesai dijalankan di database development

## Migrasi yang Dijalankan

- File SQL: `docs/202602/202602261415_migrasi_pola_based_on_bahasa_kata_asal.sql`
- Tujuan: isi `bahasa` dan `kata_asal` untuk pola:
  - `[based on <bahasa> <kata_asal>]`
  - termasuk variasi seperti: `[based on Belanda absurditeit (< Prancis)]`

## Verifikasi Contoh yang Diminta

- `abreaksi` (`abreaction (in psychology)  [based on Inggris abreaction]`)
  - `bahasa = Inggris`
  - `kata_asal = abreaction`
- `absurditas` (`absurdity [based on Belanda absurditeit (< Prancis)]`)
  - `bahasa = Belanda`
  - `kata_asal = absurditeit`

## Dampak Migrasi (Before vs After)

- Total baris `etimologi`: **16.512** (tetap)

### Sebelum
- `bahasa` kosong: **2.475**
- `kata_asal` kosong: **1.973**
- `arti_asal` kosong: **825**
- salah satu dari tiga kosong (`bahasa|kata_asal|arti_asal`): **2.479**

### Sesudah
- `bahasa` kosong: **1.976**
- `kata_asal` kosong: **1.973**
- `arti_asal` kosong: **825**
- salah satu dari tiga kosong (`bahasa|kata_asal|arti_asal`): **1.982**

### Delta
- `bahasa` terisi tambahan: **499**
- `kata_asal` terisi tambahan: **0**
- `arti_asal` terisi tambahan: **0**
- total entri dengan minimal satu kolom kosong berkurang: **497**

## Pola Sisa Data Kosong

### 1) `bahasa` masih kosong (1.976)
Pola dominan:
- `tanpa_sumber_definisi`: **1.346**
- `berpola_keyword_from` (mis. `from ...`): **407**
- `narasi_lain`: **171**
- `berpola_based_on`: **51**
- `berpola_borrowing_chain_[<]`: **1**

### 2) `kata_asal` masih kosong (1.973)
Pola dominan:
- `tanpa_sumber_definisi`: **1.346**
- `berpola_keyword_from`: **407**
- `narasi_lain`: **171**
- `berpola_based_on`: **47**
- `berpola_from_(f)`: **2**

### 3) `arti_asal` masih kosong (825)
Pola dominan:
- `tanpa_sumber_definisi`: **825**

## Kesimpulan Pola

1. Mayoritas gap sekarang bukan lagi pola `based on`, tetapi karena **`sumber_definisi` memang kosong**.
2. Gap terbesar berikutnya ada pada pola narasi komposit **`from ...`** (terutama untuk `bahasa` dan `kata_asal`).
3. Sisa pola `based on` yang masih kosong kecil (51 untuk `bahasa`, 47 untuk `kata_asal`) dan kemungkinan berupa variasi format/teks yang belum tercakup parser saat ini.

## Rekomendasi Tahap Lanjut

1. Tambah migrasi khusus pola komposit `from ... + from ...` untuk isi `bahasa` sumber pertama.
2. Tambah fallback `kata_asal` untuk pola `from <token>` (mengambil token kata setelah bahasa pertama) saat `sumber_isi`/`sumber_aksara` kosong.
3. Untuk `arti_asal` kosong, sumber utama harus ditambal dari data non-`sumber_definisi` (karena 100% kasus kosong berada pada `sumber_definisi` kosong).
