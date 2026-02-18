# 20260218 — Label aktif, edit redaksi, dan kategori di Kamus

## Ringkasan

Perubahan ini mencakup:

1. Penambahan kolom `aktif` pada tabel `label`.
2. Eksekusi langsung SQL migrasi ke database development.
3. Dukungan edit status aktif label di panel redaksi.
4. Penerapan filter label aktif untuk kategori publik Kamus.
5. Tampilan kategori (kelas kata/ragam/bidang/bahasa) pada hasil Kamus.

## SQL Migration

- File migrasi: `_docs/202602/20260218_tambah_aktif_pada_label.sql`
- Isi utama:
  - `ALTER TABLE label ADD COLUMN IF NOT EXISTS aktif BOOLEAN NOT NULL DEFAULT TRUE;`
  - Backfill aman: `UPDATE label SET aktif = TRUE WHERE aktif IS NULL;`

### Eksekusi Langsung

Migrasi sudah dijalankan langsung pada database development menggunakan skrip sementara di `backend/` (kemudian dihapus).

Hasil verifikasi kolom:

- `column_name`: `aktif`
- `data_type`: `boolean`
- `is_nullable`: `NO`
- `column_default`: `true`

## Perubahan Backend

### Model Label

File: `backend/models/modelLabel.js`

- Menambahkan normalisasi nilai boolean untuk `aktif` saat simpan.
- Menambahkan `aktif` pada output admin:
  - `daftarAdmin`
  - `ambilDenganId`
  - `simpan` (insert/update + returning)
- Memfilter label publik hanya yang aktif:
  - `ambilSemuaKategori` → `WHERE aktif = TRUE`
  - `cariEntriPerLabel` (lookup label) → `AND aktif = TRUE`
  - `ambilKategoriUntukRedaksi` (dropdown redaksi) → `AND aktif = TRUE`
- Menambahkan preview kategori pada hasil entri per kategori:
  - `preview_kelas_kata`
  - `preview_ragam`
  - `preview_bidang`
  - `preview_bahasa`

### Route Redaksi Label

File: `backend/routes/redaksi/label.js`

- Menambahkan validasi input `aktif` pada endpoint:
  - `POST /api/redaksi/label`
  - `PUT /api/redaksi/label/:id`

## Perubahan Frontend

### Redaksi Label

File: `frontend/src/halaman/redaksi/LabelAdmin.jsx`

- Menambahkan field status aktif (`ToggleAktif`) pada form tambah/sunting.
- Menambahkan kolom tabel `Status` (Aktif/Nonaktif).
- Nilai awal form sekarang menyertakan `aktif: true`.

### Kamus Publik

File: `frontend/src/halaman/publik/Kamus.jsx`

- Tetap menggunakan tampilan hasil Kamus yang sederhana (tanpa badge preview kategori tambahan).
- Pemuatan kategori tetap difokuskan untuk mode browse kategori Kamus.

## Perubahan Data Pencarian Kamus

File: `backend/models/modelEntri.js`

- Query `cariEntri` tetap menggunakan kueri sederhana tanpa `LEFT JOIN LATERAL`.
- Pertimbangan: menjaga beban server tetap ringan pada trafik pencarian Kamus.

## Sinkronisasi Schema Referensi

File: `_docs/struktur-data.sql`

- Menambahkan kolom `aktif boolean not null default true` pada definisi tabel `label`.

## Validasi

Sudah dijalankan dan lulus:

- Backend lint: `npm run lint`
- Backend test terarah:
  - `npm run test -- modelLabel.test.js routesRedaksi.test.js`
- Frontend lint: `npm run lint`
- Frontend test terarah:
  - `npm run test -- Kamus.test.jsx LabelAdmin.test.jsx`
