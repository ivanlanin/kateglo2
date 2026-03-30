# Migrasi Homograf + Drop `entri.urutan` (2026-02-19)

## Tujuan

1. Menambah kolom `entri.homograf` sebagai pengelompokan varian lafal per `indeks`.
2. Mengisi `lafal` kosong dengan versi pepet (`ə`) **hanya** untuk pola aman.
3. Menghapus kolom legacy `entri.urutan`.
4. Menyiapkan pengurutan KamusDetail berbasis `homograf + homonim`.

## Aturan yang dijalankan

### A. Isi `lafal` kosong (safe mode)

`lafal` kosong diisi otomatis jika semua syarat berikut terpenuhi pada grup `(indeks, homonim)` aktif:

- Ada baris `lafal` kosong.
- Hanya ada **1** donor `lafal` non-kosong.
- Donor mengandung huruf `e` (agar bisa dikonversi ke pepet).
- Donor tidak mengandung token non-lafal murni (`spasi`, `,`, `;`, `/`, `(`, `)`, digit).

Konversi donor ke pepet menggunakan transliterasi:

- `e/E/é/É/è/È/ê/Ê` → `ə/Ə/ə/Ə/ə/Ə/ə/Ə`

Contoh:

- `per` → `pər`
- `seri` → `səri`

### B. Backfill `homograf`

Setiap `indeks` dikelompokkan per `lafal` (setelah langkah A), lalu diberi nomor `homograf` dengan prioritas:

1. lafal non-pepet
2. lafal pepet (`ə`)
3. lafal kosong

### C. Drop kolom lama

- `DROP COLUMN entri.urutan`
- drop index `idx_entri_indeks_urutan`
- tambah index `idx_entri_indeks_homograf_homonim (indeks, homograf, homonim, id)`

## Ringkasan audit pra-eksekusi (aktif=1)

- Aman diproses otomatis: **154** grup `(indeks, homonim)`
- Anomali multi-donor lafal (tidak diproses): **5** grup
- Anomali tanpa huruf `e` (tidak bisa dipetetkan): **0** grup
- Anomali lafal non-murni (tidak diproses): **1** grup

## Anomali yang tidak diproses

### 1) Multi donor lafal pada `(indeks, homonim)` yang sama

Tidak diproses karena ambigu menentukan donor pepet tunggal.

- `kelenteng` (`lafal`: `kəlenteng`, `kələnteng`)
- `ketel` (`lafal`: `ketel`, `kətel`)
- `lempeng` (`lafal`: `lempeng`, `ləmpeng`)
- `rembes` (`lafal`: `rembes`, `rembəs`)
- `remet` (`lafal`: `remet`, `rəmet`)

### 2) Lafal donor non-murni

Tidak diproses karena mengandung pola catatan/token tambahan.

- `meta` (`lafal`: `meta- (met)`)

## Dampak ke aplikasi

- Pengurutan detail entri publik beralih ke `homograf ASC, homonim ASC, entri ASC`.
- Form redaksi entri tidak lagi menampilkan `urutan`; diganti `homograf`.
- Respons backend detail kamus dan daftar admin entri menyertakan `homograf`.

## Catatan lanjutan

- `homonim` masih dipertahankan apa adanya pada migrasi ini.
- Reindex `homonim` per `(indeks, homograf)` bisa dilakukan pada migrasi lanjutan jika diperlukan normalisasi penuh.
