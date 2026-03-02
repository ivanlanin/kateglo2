# Penerapan Daftar Hitam Pencarian (`pencarian_hitam`)

Tanggal: 2026-03-03

## Ringkasan

Fitur daftar hitam pencarian diterapkan untuk mencegah kata tertentu tampil pada daftar populer di beranda.

Perubahan utama:

1. Tabel `pencarian_hitam` dipakai sebagai sumber daftar kata yang diblokir.
2. Pelacakan pencarian (`ModelPencarian.catatPencarian`) tetap mencatat semua kata pencarian.
3. Endpoint admin blacklist dipisahkan pada router `pencarianHitam`.
4. Akses data `pencarian_hitam` dipisahkan ke model khusus `modelPencarianHitam`.
5. Halaman `PencarianAdmin` menampilkan penanda visual kata `Diblokir` vs `Normal`.

## Struktur Backend

### Model terpisah

- `backend/models/modelPencarianHitam.js`
  - `daftarAdmin({ q, aktif, limit, offset })`
  - `ambilDenganId(id)`
  - `simpan({ id, kata, aktif, catatan })`
  - `hapus(id)`
  - `apakahKataDiblokir(kata)`
  - cache in-memory daftar hitam aktif (TTL 5 menit)

- `backend/models/modelPencarian.js`
  - tetap fokus pada statistik/tracking pencarian.
  - filter daftar hitam diterapkan saat ambil data populer beranda.
  - statistik redaksi mengembalikan flag `diblokir` per kata.

### Router admin

- `backend/routes/redaksi/pencarianHitam.js`
- Mount path: `/api/redaksi/pencarianHitam`

Endpoint:

- `GET /api/redaksi/pencarianHitam`
- `GET /api/redaksi/pencarianHitam/:id`
- `POST /api/redaksi/pencarianHitam`
- `PUT /api/redaksi/pencarianHitam/:id`
- `DELETE /api/redaksi/pencarianHitam/:id`

## Struktur Frontend

### API hooks

- `frontend/src/api/apiAdmin.js`
  - `useDaftarPencarianHitamAdmin`
  - `useDetailPencarianHitamAdmin`
  - `useSimpanPencarianHitamAdmin`
  - `useHapusPencarianHitamAdmin`

Seluruh hook menggunakan path `/api/redaksi/pencarianHitam`.

### UI admin

- `frontend/src/halaman/redaksi/PencarianAdmin.jsx`
  - Panel geser untuk CRUD daftar hitam.
  - Tabel statistik memberi badge:
    - `Diblokir` (kata masuk `pencarian_hitam` aktif)
    - `Normal` (kata tidak diblokir)

## Catatan Operasional

- Daftar hitam aktif dibaca dari tabel `pencarian_hitam` saat query populer (beranda).
- Jika tabel `pencarian_hitam` kosong, tidak ada kata yang diblokir.
- Data `pencarian_hitam` saat ini sengaja dikosongkan untuk pengisian manual.
