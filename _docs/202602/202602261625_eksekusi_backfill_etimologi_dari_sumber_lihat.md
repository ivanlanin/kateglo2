# Eksekusi Backfill Etimologi dari `sumber_lihat`

**Tanggal**: 2026-02-26 16:25  
**Status**: Selesai dijalankan di database development

## Tujuan

Mengisi kolom `bahasa` dan `kata_asal` pada baris etimologi yang punya nilai `sumber_lihat`, dengan mengambil data dari baris rujukan ketika:

- `etimologi.indeks = TRIM(etimologi.sumber_lihat)`
- baris rujukan memiliki `bahasa` dan `kata_asal` yang terisi

Jika kandidat rujukan lebih dari satu, dipilih urutan prioritas:

1. `aktif = true` terlebih dahulu
2. lalu `id` paling kecil

## Migrasi yang Dijalankan

- SQL: `_docs/202602/202602261620_backfill_etimologi_dari_sumber_lihat.sql`

## Ringkasan Hasil

### Before

- Total baris `etimologi`: **16.512**
- `bahasa` masih kosong: **1.976**
- Kandidat target (punya `sumber_lihat` + ada kolom kosong `bahasa/kata_asal`): **1.351**
- Kandidat yang bisa diisi dari baris rujukan: **989**

### After

- Total baris `etimologi`: **16.512**
- `bahasa` masih kosong: **987**
- `kata_asal` masih kosong: **984**
- `arti_asal` masih kosong: **825**
- Kandidat target sisa (punya `sumber_lihat` + ada kolom kosong `bahasa/kata_asal`): **362**
- Kandidat sisa yang masih bisa diisi dengan aturan yang sama: **0**

### Delta

- `bahasa` terisi tambahan: **989**

## Verifikasi Sampel

Contoh hasil pengisian yang tervalidasi setelah migrasi:

- `aba` (`sumber_lihat = abu`) -> `bahasa = Arab`, `kata_asal = abū`
- `abah` (`sumber_lihat = abu`) -> `bahasa = Arab`, `kata_asal = abū`
- `abang` (`sumber_lihat = bang`) -> `bahasa = Persia`, `kata_asal = bāng`
- `ablur` (`sumber_lihat = hablur`) -> `bahasa = Persia`, `kata_asal = bulūr`
- `acik` (`sumber_lihat = aci`) -> `bahasa = Amoy`, `kata_asal = 阿姊 阿姊 á chí`

## Catatan

Sisa `bahasa` yang masih kosong (**987**) saat ini tidak terselesaikan oleh aturan `sumber_lihat -> indeks` ini, sehingga butuh strategi lanjutan (misalnya parse pola naratif lain atau enrichment dari sumber data tambahan).