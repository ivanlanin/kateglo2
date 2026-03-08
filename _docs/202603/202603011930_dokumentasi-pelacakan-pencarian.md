# Dokumentasi Penerapan Pelacakan Pencarian

Tanggal: 2026-03-01 19:30  
Status: Implemented

## Ringkasan

Sistem pelacakan pencarian digunakan untuk merekam kata yang dicari pengguna dan menampilkan statistik terpopuler untuk kebutuhan publik (fitur kata terpopuler) serta redaksi (analitik lintas domain).

Implementasi mengikuti rancangan awal pada dokumen:
- `_docs/202602/202602232254_sistem-pelacakan-kata-terpopuler-efisien.md`

## Tujuan

1. Menyediakan daftar kata terpopuler untuk pengguna publik.
2. Menyediakan statistik pencarian lintas domain untuk redaksi.
3. Menjaga performa penyimpanan dan agregasi data melalui model tabel induk + partisi bulanan.
4. Memungkinkan aktivasi/nonaktif pelacakan via environment variable.

## Cakupan Pelacakan

Pelacakan aktif pada titik berikut:

1. Kamus
   - Pencarian kamus (`/api/publik/kamus/cari/:kata`)
   - Detail kamus (`/api/publik/kamus/detail/:indeks`)
2. Tesaurus
   - Pencarian tesaurus (`/api/publik/tesaurus/cari/:kata`)
3. Glosarium
   - Pencarian glosarium (`/api/publik/glosarium/cari/:asing`)
   - Detail glosarium (`/api/publik/glosarium/:kata`)
4. Makna
   - Pencarian makna (`/api/publik/makna/cari/:kata`)
5. Rima
   - Pencarian rima (`/api/publik/rima/cari/:kata`)

## Kode Domain

Mapping domain disimpan pada `backend/models/modelPencarian.js`:

- `1` = kamus
- `2` = tesaurus
- `3` = glosarium
- `4` = makna
- `5` = rima

Penyimpanan domain numerik dipilih untuk:
- footprint data lebih kecil,
- query agregasi lebih konsisten,
- validasi domain lebih mudah.

## Skema Data & Partisi

### Tabel Inti

Tabel pelacakan menggunakan entitas `pencarian` dengan kolom inti:
- `tanggal` (date)
- `domain` (smallint)
- `kata` (text)
- `jumlah` (integer)
- `created_at` (timestamp UTC, waktu pertama hit pada bucket harian)
- `updated_at` (timestamp UTC, waktu terakhir hit pada bucket harian)

### Kunci Unik

Upsert harian berbasis kombinasi:
- `(tanggal, domain, kata)`

Artinya kata yang sama di domain sama pada tanggal sama akan dijumlahkan pada baris yang sama.

### Partisi Bulanan

Model penyimpanan menggunakan tabel induk + tabel turunan bulanan dan trigger routing untuk menulis ke partisi bulan aktif.

Manfaat:
- maintenance lebih mudah (drop/arsip per bulan),
- index lebih kecil per partisi,
- query rentang waktu lebih efisien.

Referensi migrasi terkait:
- `_docs/202603/202603011210_tambah-sistem-pelacakan-kata-terpopuler.sql`
- `_docs/202603/202603011245_refactor-pencarian-tambah-domain-kode.sql`

## Konfigurasi Environment

Pelacakan dikendalikan oleh variabel:

- `TRACK_SEARCH=true|false`

Aturan default di model:
- Jika `TRACK_SEARCH` tidak di-set:
  - `NODE_ENV=development` → pelacakan nonaktif
  - selain development → pelacakan aktif
- Jika `TRACK_SEARCH` di-set, nilai `true`/`false` dipakai langsung.

Contoh pada `backend/.env.example`:

```env
TRACK_SEARCH=true
```

## Alur Backend

### 1) Mencatat Pencarian

Fungsi utama:
- `ModelPencarian.catatPencarian(kata, { domain, jumlah })`

Langkah:
1. Cek apakah pelacakan aktif.
2. Normalisasi kata (`trim`, rapikan spasi, lowercase).
3. Validasi domain dan jumlah.
4. Insert ke tabel `pencarian` (diarahkan trigger ke partisi bulan).
5. Jika gagal, log warning dan tidak memblokir response endpoint utama.

### 2) Ambil Kata Terpopuler (Publik)

Fungsi:
- `ModelPencarian.ambilKataTerpopuler({ periode, limit, domain })`

Periode saat ini:
- `all`
- `7hari` (7 hari terakhir)

Endpoint publik yang menggunakan fungsi ini:
- `GET /api/publik/kamus/terpopuler`

### 3) Ambil Statistik Redaksi

Fungsi:
- `ModelPencarian.ambilStatistikRedaksi({ domain, periode, limit, tanggalMulai, tanggalSelesai })`

Fitur filter:
- domain (opsional)
- periode: `7hari` (default), `30hari`, `all`
- rentang tanggal: `tanggal_mulai`, `tanggal_selesai`
- limit (maks 1000)

Sort data detail:
- `jumlah DESC`
- `tanggal_akhir DESC` (berbasis `MAX(updated_at)`)
- `domain ASC`
- `kata ASC`

## API yang Tersedia

### Publik

1. `GET /api/publik/kamus/terpopuler`
   - Query:
     - `periode=all|7hari` (default: `all`)
     - `limit=1..100` (default: `10`)
   - Response:
     - `periode`, `limit`, `data[]` (kata + jumlah)

### Redaksi

1. `GET /api/redaksi/statistik/pencarian`
   - Permission: `lihat_statistik`
   - Query:
     - `domain` (opsional, 1..5)
     - `periode=7hari|30hari|all` (default: `7hari`)
     - `limit=1..1000` (default: `200`)
     - `tanggal_mulai=YYYY-MM-DD` (opsional)
     - `tanggal_selesai=YYYY-MM-DD` (opsional)
   - Response:
     - `filter`
     - `ringkasanDomain[]`
     - `data[]` (domain, kata, jumlah, tanggal_awal, tanggal_akhir)
          - `tanggal_awal` berasal dari `MIN(created_at)`
          - `tanggal_akhir` berasal dari `MAX(updated_at)`

## Integrasi Frontend Redaksi

Halaman statistik pencarian redaksi:
- Route: `/redaksi/pencarian`
- Komponen: `frontend/src/halaman/redaksi/PencarianAdmin.jsx`
- Hook API: `useStatistikPencarianAdmin` pada `frontend/src/api/apiAdmin.js`

Fitur UI:
1. Filter domain, periode, limit, tanggal mulai, tanggal selesai.
2. Ringkasan jumlah per domain.
3. Tabel kata terpopuler lintas domain.
4. Format waktu UTC: `DD MMM YYYY HH:mm UTC`.
5. State loading, error, dan kosong.

## Catatan Implementasi

1. Pelacakan dibuat non-blocking:
   - kegagalan insert tracking tidak menggagalkan endpoint utama pencarian/detail.
2. Nilai kata dinormalisasi sebelum disimpan untuk mencegah duplikasi semu.
3. Parsing input defensif untuk periode, domain, limit, dan tanggal.
4. Statistik redaksi mendukung kombinasi filter periode maupun rentang tanggal eksplisit.

## Validasi & Kualitas

Penerapan ini telah divalidasi dengan:

1. Lint backend dan frontend.
2. Test backend dan frontend.
3. Coverage 100% (statements, branches, functions, lines) per file pada backend dan frontend.

## Referensi Kode

Backend:
- `backend/models/modelPencarian.js`
- `backend/routes/publik/kamus.js`
- `backend/routes/publik/tesaurus.js`
- `backend/routes/publik/glosarium.js`
- `backend/routes/publik/makna.js`
- `backend/routes/publik/rima.js`
- `backend/routes/redaksi/statistik.js`

Frontend:
- `frontend/src/halaman/redaksi/PencarianAdmin.jsx`
- `frontend/src/api/apiAdmin.js`
- `frontend/src/App.jsx`
- `frontend/src/komponen/redaksi/NavbarAdmin.jsx`

Dokumen terkait:
- `_docs/202602/202602232254_sistem-pelacakan-kata-terpopuler-efisien.md`
- `_docs/data/struktur.sql`
- `_docs/202603/202603011210_tambah-sistem-pelacakan-kata-terpopuler.sql`
- `_docs/202603/202603011245_refactor-pencarian-tambah-domain-kode.sql`
- `_docs/202603/202603011950_tambah_timestamp_utc_pencarian.sql`
