# Eksekusi Backfill Etimologi dari `sumber_lihat` ke `lafal`

**Tanggal**: 2026-02-26 16:45  
**Status**: Selesai dijalankan di database development

## Tujuan

Mengisi `bahasa` dan `kata_asal` pada baris etimologi yang:

- `bahasa` masih kosong
- `sumber_lihat` terisi
- `sumber_lihat` ternyata merujuk ke **lafal**, bukan `indeks`

Aturan referensi:

- Cocokkan `TRIM(target.sumber_lihat)` dengan `source.lafal`
- Source harus punya `bahasa` dan `kata_asal`
- Jika source ganda: prioritas `aktif = true`, lalu `id` terkecil

## Migrasi yang Dijalankan

- SQL: `_docs/202602/202602261640_backfill_etimologi_sumber_lihat_ke_lafal.sql`

## Ringkasan Hasil

### Before

- Total baris `etimologi`: **16.512**
- `bahasa` kosong: **987**
- Kandidat target (`bahasa` kosong + `sumber_lihat` terisi): **362**
- Kandidat bisa diisi via `lafal`: **227**

### After

- Total baris `etimologi`: **16.512**
- `bahasa` kosong: **760**
- `kata_asal` kosong: **757**
- `arti_asal` kosong: **825**
- Kandidat target sisa (`bahasa` kosong + `sumber_lihat` terisi): **135**
- Kandidat sisa yang masih bisa diisi via aturan sama: **0**

### Delta

- `bahasa` terisi tambahan: **227**

## Verifikasi Sampel

Contoh hasil update setelah migrasi:

- `adjektif` (`sumber_lihat = adjéktiva`) -> `bahasa = Belanda`, `kata_asal = adjectief or`
- `adpertensi` (`sumber_lihat = adverténsi`) -> `bahasa = Belanda`, `kata_asal = advertentie`
- `aestetika` (`sumber_lihat = éstétika`) -> `bahasa = Belanda`, `kata_asal = esthetica`
- `ajektiva` (`sumber_lihat = adjéktiva`) -> `bahasa = Belanda`, `kata_asal = adjectief or`
- `alferes` (`sumber_lihat = alpérés`) -> `bahasa = Portugis`, `kata_asal = alferes`

## Catatan

Jumlah akhir `bahasa` yang masih kosong setelah migrasi ini adalah **760** baris.