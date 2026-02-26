# Eksekusi Sinkronisasi Status Etimologi dari Kolom `bahasa`

**Tanggal**: 2026-02-26 17:10  
**Status**: Selesai dijalankan di database development

## Tujuan

Menetapkan status etimologi (`aktif`) agar konsisten dengan isi kolom `bahasa`:

- `aktif = TRUE` jika `bahasa` terisi
- `aktif = FALSE` jika `bahasa` kosong/NULL

## Migrasi yang Dijalankan

- SQL: `_docs/202602/202602261705_sinkronisasi_status_etimologi_berdasarkan_bahasa.sql`

## Hasil Setelah Eksekusi

- Total baris `etimologi`: **16.512**
- `aktif = TRUE`: **15.752**
- `aktif = FALSE`: **760**
- `bahasa` kosong/NULL: **760**

## Catatan

Jumlah `aktif = FALSE` sekarang selaras dengan jumlah baris `bahasa` kosong.