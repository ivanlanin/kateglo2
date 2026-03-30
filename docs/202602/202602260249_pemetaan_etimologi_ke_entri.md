# Pemetaan `etimologi.entri_id` ke `entri.id`

**Tanggal**: 2026-02-26  
**Status**: Selesai dijalankan di database development

## Tujuan

Menyiapkan tabel `etimologi` agar siap untuk alur redaksi:

1. Menambah kolom relasi `entri_id` (FK ke `entri.id`).
2. Menambah kolom status editorial `aktif` (default `false`).
3. Memetakan `entri_id` otomatis berdasarkan kombinasi `indeks`, `homonim`, dan `lafal`.
4. Menandai baris yang dianggap yakin sebagai `aktif = true`.

## Perubahan Skema

File migrasi: `docs/202602/20260226_etimologi_tambah_entri_id_aktif_dan_pemetaan.sql`

Perubahan utama:

- `ALTER TABLE etimologi ADD COLUMN entri_id integer REFERENCES entri(id) ON DELETE SET NULL`
- `ALTER TABLE etimologi ADD COLUMN aktif boolean NOT NULL DEFAULT false`
- Penambahan index:
  - `idx_etimologi_entri_id`
  - `idx_etimologi_aktif`
  - `idx_etimologi_indeks_homonim`

## Aturan Pemetaan Otomatis

Pemetaan dijalankan **konservatif bertahap**. Jika sebuah baris belum mendapat kandidat unik pada aturan sebelumnya, baru lanjut ke aturan berikutnya.

1. **Aturan 1 (paling yakin)**: `indeks + homonim + lafal` cocok persis (case-insensitive), kandidat tunggal.
2. **Aturan 2**: `indeks + homonim` cocok, kandidat tunggal.
3. **Aturan 3**: `indeks + lafal` cocok persis (case-insensitive), kandidat tunggal, saat `homonim` kosong.
4. **Aturan 4 (fallback aman)**: `indeks` hanya punya satu kandidat `entri` aktif.

Jika tidak memenuhi kandidat tunggal, maka dianggap **ragu** dan dibiarkan `entri_id = null`, `aktif = false`.

## Statistik Hasil

Hasil setelah pemetaan:

- Total baris `etimologi`: **16.512**
- Terpetakan (`entri_id` terisi): **16.356**
- Belum terpetakan (`entri_id` null): **156**
- `aktif = true`: **16.356**
- `aktif = false`: **156**

Breakdown kategori hasil:

- Aturan 1 (`indeks + homonim + lafal`): **14**
- Aturan 2 (`indeks + homonim`): **1.771**
- Aturan 4 (`indeks` kandidat tunggal): **14.571**
- Tidak terpetakan: **156**

Catatan: Aturan 3 tidak muncul sebagai kategori akhir terpisah karena pada data saat ini seluruh kasus relevan sudah tercakup oleh prioritas aturan lain.

## Implikasi Redaksi

- Baris yang sudah `aktif = true` dapat langsung ditampilkan/diolah sebagai data etimologi yang siap redaksi.
- Baris dengan `entri_id = null` menjadi antrean review manual.
- UI redaksi Etimologi sekarang mendukung:
  - edit field etimologi,
  - toggle `aktif`,
  - autocomplete tautan `entri_id`.

## Query Audit Ringkas

```sql
-- Ringkasan status pemetaan
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE entri_id IS NOT NULL) AS terpetakan,
  COUNT(*) FILTER (WHERE entri_id IS NULL) AS belum_terpetakan,
  COUNT(*) FILTER (WHERE aktif = TRUE) AS aktif_true,
  COUNT(*) FILTER (WHERE aktif = FALSE) AS aktif_false
FROM etimologi;

-- Baris yang masih perlu review manual
SELECT id, indeks, homonim, lafal, bahasa, sumber_isi
FROM etimologi
WHERE entri_id IS NULL
ORDER BY indeks, homonim NULLS LAST, id
LIMIT 200;
```
