# Eksekusi Migrasi Etimologi: `bahasa`, `kata_asal`, `arti_asal`

**Tanggal**: 2026-02-26  
**Status**: Selesai dijalankan di database development  
**Tujuan**: menambah kolom baru dan menjalankan pengisian data bertahap sesuai rencana.

---

## Urutan Eksekusi (Satu per Satu)

### Persiapan Kolom Baru

1. `_docs/202602/202602261351_tambah_kolom_kata_asal_arti_asal.sql`
   - Menambah kolom `etimologi.kata_asal` dan `etimologi.arti_asal`.

### 1) Isi `bahasa` yang kosong

2. `_docs/202602/202602261352_isi_bahasa_kosong_dari_sumber_definisi.sql`
3. `_docs/202602/202602261356_perbaiki_isi_bahasa_kosong_langkah1.sql`
4. `_docs/202602/202602261359_perbaiki_lagi_bahasa_kata_asal.sql` (bagian A)

Aturan yang dipakai:
- Ambil **bahasa pertama** dari jejak etimologi (`[< ...]` atau `(f ...)`).
- Normalisasi ke nama bahasa Indonesia (`Dutch -> Belanda`, `English -> Inggris`, dst.).

### 2) Isi `kata_asal`

5. `_docs/202602/202602261353_isi_kata_asal_dari_sumber.sql`
6. `_docs/202602/202602261357_perbaiki_kata_asal_langkah2.sql`
7. `_docs/202602/202602261359_perbaiki_lagi_bahasa_kata_asal.sql` (bagian B)
8. `_docs/202602/202602261403_perbaiki_fallback_kata_asal_rantai_bertingkat.sql`

Aturan yang dipakai:
- `sumber_aksara + sumber_isi` -> `"<aksara> <latin>"`
- `sumber_aksara` saja -> `sumber_aksara`
- `sumber_isi` saja -> `sumber_isi`
- fallback dari `sumber_definisi` untuk kasus kosong/ambigu.

### 3) Isi `arti_asal`

9. `_docs/202602/202602261354_isi_arti_asal_dengan_format_indonesia_inggris.sql`

Aturan yang dipakai:
- Ambil gloss Inggris dari `sumber_definisi`.
- Ambil padanan Indonesia dari `makna` aktif pertama entri terkait (`entri_id`) bila tersedia.
- Format akhir: `Indonesia (Inggris)`.
- Jika padanan Indonesia belum tersedia: `(-) (Inggris)`.

---

## Hasil Akhir (Setelah Seluruh Langkah)

Ringkasan hasil saat eksekusi:

- Total baris `etimologi`: **16.512**
- `bahasa` terisi: **14.037**
- `kata_asal` terisi: **13.889**
- `arti_asal` terisi: **15.687**

Catatan:
- `bahasa` masih kosong pada sebagian baris yang pola narasinya tidak eksplisit menyebut bahasa pertama atau tidak cocok dengan kamus normalisasi saat ini.
- `kata_asal` masih kosong pada kasus yang tidak memiliki `sumber_isi`, `sumber_aksara`, dan fallback naratif tidak cukup tegas.

---

## Sinkronisasi Skema

Setelah migrasi selesai dijalankan, schema diregenerasi:

- Perintah: `Set-Location backend; node scripts/db-schema.js`
- Output: `_docs/data/struktur.sql` diperbarui.
