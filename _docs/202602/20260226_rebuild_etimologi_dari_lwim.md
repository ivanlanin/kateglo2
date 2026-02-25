# Rebuild `etimologi` dari `etimologi_lwim` (lengkap + pemetaan konservatif)

**Tanggal**: 2026-02-26  
**Status**: Selesai dijalankan di database development  
**File migrasi**: `_docs/202602/20260226_rebuild_etimologi_dari_lwim.sql`

## Tujuan

Pendekatan ini mengganti tabel `etimologi` lama dengan tabel baru yang menyalin **seluruh kolom penting LWIM** secara langsung, lalu melakukan pemetaan `entri_id` secara konservatif agar keputusan otomatis tetap aman.

## Struktur Tabel Baru

Kolom yang dibentuk:

- `id serial primary key`
- `indeks = indeks_query`
- `entri_id integer references entri(id)`
- `homonim = lwim_hom`
- `lafal = lwim_orth`
- `bahasa = etym_lang`
- `sumber = 'LWIM'`
- `sumber_sitasi = etym_cite`
- `sumber_isi = etym_mentioned`
- `sumber_aksara = etym_aksara`
- `sumber_lihat = xr_lihat`
- `sumber_varian = xr_varian`
- `sumber_definisi = raw_def`
- `sumber_id = lwim_id`
- `aktif = false` (default)
- `created_at = fetched_at` (disimpan sebagai `timestamp with time zone`)
- `updated_at = created_at` saat inisialisasi

## Alur Migrasi

1. `DROP TABLE IF EXISTS etimologi`
2. `CREATE TABLE etimologi` dengan struktur final
3. `INSERT ... SELECT` dari `etimologi_lwim` (data mentah dipindah lengkap)
4. Reset idempoten: `entri_id = NULL`, `aktif = false`, `updated_at = created_at`
5. Pemetaan otomatis `entri_id` bertahap:
   - **Rule 1 (yakin tinggi)**: cocok `indeks + homonim + lafal`, kandidat tunggal
   - **Rule 2 (yakin)**: cocok `indeks + homonim`, kandidat tunggal
   - **Rule 3 (cadangan)**: cocok `indeks + lafal` saat `homonim` kosong, kandidat tunggal
  - **Rule 4 (fallback aman)**: `indeks` punya satu kandidat `entri` aktif
6. Baris yang tetap ambigu dibiarkan `entri_id = NULL`, `aktif = false`

## Statistik Hasil Eksekusi

Ringkasan utama:

- Total baris `etimologi`: **16.512**
- `entri_id` terpetakan: **16.356**
- `entri_id` belum terpetakan: **156**
- `aktif = true`: **16.356**
- `aktif = false`: **156**
- `sumber_definisi` terisi: **15.164**
- `sumber_definisi` kosong: **1.348**

Breakdown rule candidate:

- Rule 1 (`indeks + homonim + lafal`): **14**
- Rule 2 (`indeks + homonim`): **1.771**
- Rule 3 (`indeks + lafal` dengan homonim kosong): **0**
- Rule 4 (`indeks` kandidat tunggal): **14.571**
- Ragu (tetap null): **156**

## Interpretasi

Pendekatan rebuild ini **lebih meyakinkan untuk kelengkapan data etimologi mentah** karena semua field LWIM inti masuk langsung, khususnya `raw_def -> sumber_definisi`.

Dengan rule ke-4 diaktifkan, coverage pemetaan kembali tinggi sambil tetap menjaga prinsip kandidat tunggal untuk auto-link.

Artinya:

- **Kelengkapan data etimologi**: meningkat/lebih aman.
- **Coverage tautan ke entri kamus**: tinggi (16.356 terpetakan), dengan 156 kasus ambigu disisakan untuk review.

## Query Audit

```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE entri_id IS NOT NULL) AS terpetakan,
  COUNT(*) FILTER (WHERE entri_id IS NULL) AS belum_terpetakan,
  COUNT(*) FILTER (WHERE aktif = TRUE) AS aktif_true,
  COUNT(*) FILTER (WHERE aktif = FALSE) AS aktif_false,
  COUNT(*) FILTER (WHERE NULLIF(BTRIM(sumber_definisi), '') IS NOT NULL) AS sumber_definisi_terisi,
  COUNT(*) FILTER (WHERE NULLIF(BTRIM(sumber_definisi), '') IS NULL) AS sumber_definisi_kosong
FROM etimologi;
```
