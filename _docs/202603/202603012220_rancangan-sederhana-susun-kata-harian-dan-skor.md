# Rancangan Sederhana Susun Kata Harian + Skor

Tanggal: 2026-03-01 22:20  
Update: 2026-03-02 18:30  
Status: Implemented (Harian + Bebas)

## Status Implementasi per 2026-03-02

Dokumen ini awalnya rancangan. Berikut status implementasi terkini:

1. ✅ Tabel `susun_kata` dipakai untuk kata harian.
2. ✅ Tabel `susun_kata_skor` dipakai untuk skor harian.
3. ✅ Tabel `susun_kata_bebas` ditambahkan untuk sesi mode bebas.
4. ✅ URL publik mode terpisah:
   - `/gim/susun-kata/harian`
   - `/gim/susun-kata/bebas`
5. ✅ Klasemen harian menampilkan pemenang (`menang=true`) per hari.
6. ✅ Klasemen bebas juga per hari (zona Asia/Jakarta), dengan metrik rata-rata pemenang:
   - rata poin
   - rata detik
   - total main menang
7. ✅ Toast sukses mode bebas tidak auto-close, dan memberi opsi:
   - lihat arti kata di kamus
   - mulai sesi baru

## Catatan Delta terhadap Rancangan Awal

- Prefix route redaksi yang berjalan: `/api/redaksi/susun-kata` (bukan `/api/redaksi/gim/susun-kata`).
- Rumus skor tetap: `11 - percobaan` untuk sesi menang.
- Mode bebas menggunakan kata dasar acak panjang 4-6 huruf per sesi.

## Ringkasan

Rancangan direvisi agar memakai dua tabel inti:

1. `susun_kata` untuk menyimpan kata harian (bisa auto-generate, tetap bisa diubah admin).
2. `susun_kata_skor` untuk menyimpan hasil main per user per hari.

Desain ini tetap sederhana, tetapi lebih siap untuk kebutuhan operasional (termasuk override kata oleh admin).

## Tujuan MVP

1. Kata harian konsisten untuk semua user pada tanggal yang sama.
2. Skor tersimpan per user dengan data minimum: percobaan, waktu, menang/kalah.
3. Admin bisa mengubah kata harian jika diperlukan.
4. Tetap memakai filter sumber kata dari `entri.indeks` yang sudah dipakai Susun Kata saat ini.

## Skema Data Revisi

## 1) Tabel `susun_kata`

Tujuan: sumber kata harian per tanggal.

Kolom:
- `id` bigserial PK
- `tanggal` date NOT NULL
- `kata` text NOT NULL
- `panjang` smallint NOT NULL
- `created_at` timestamptz NOT NULL default now()
- `updated_at` timestamptz NOT NULL default now()

Constraint disarankan:
- `UNIQUE (tanggal, panjang)`

Catatan:
- Dengan unique ini, kata harian otomatis unik per tanggal+mode panjang.
- `kata` harus lolos validasi kata Susun Kata (huruf saja, tanpa spasi, aktif, jenis dasar, tanpa `jenis_rujuk`).

## 2) Tabel `susun_kata_skor`

Tujuan: hasil game user per hari.

Kolom:
- `id` bigserial PK
- `tanggal` date NOT NULL
- `susun_kata_id` bigint NOT NULL FK -> `susun_kata.id`
- `pengguna_id` bigint NOT NULL FK -> `pengguna.id`
- `percobaan` smallint NOT NULL
- `waktu` integer NOT NULL  (detik)
- `menang` boolean NOT NULL
- `created_at` timestamptz NOT NULL default now()
- `updated_at` timestamptz NOT NULL default now()

Constraint disarankan:
- `UNIQUE (tanggal, pengguna_id, susun_kata_id)`

Catatan:
- Menjamin 1 hasil final per user untuk puzzle harian tertentu.
- `tanggal` pada tabel ini dipertahankan sesuai usulan (meskipun redundan) agar query rekap harian lebih sederhana.

## Aturan Skor

Formula yang disetujui:

- `skor = menang ? (10 + 1 - percobaan) : 0`
- ekuivalen dengan: `skor = menang ? (11 - percobaan) : 0`

Rentang nilai menang (percobaan 1..6):
- 10, 9, 8, 7, 6, 5

Kalah:
- 0

## Auto-Generate Kata Harian

Pendekatan paling sederhana:

1. Saat `GET /harian`, backend cek baris `susun_kata` untuk `tanggal hari ini` + `panjang`.
2. Jika belum ada, backend generate kata otomatis dari pool valid lalu insert.
3. Jika insert bentrok (race), baca ulang baris yang sudah ada.

Keuntungan:
- Tidak butuh cron.
- Tetap deterministic di level data harian (karena once inserted menjadi sumber tunggal).

## Rancangan API Publik (Minimal)

Prefix: `/api/publik/gim/susun-kata`

### 1) GET `/harian?panjang=5`

Fungsi:
- memastikan kata harian tersedia di `susun_kata` (auto-generate bila belum ada)
- mengembalikan status user apakah sudah submit skor hari ini

Response ringkas:
- `tanggal`
- `panjang`
- `susun_kata_id`
- `sudah_selesai`
- `hasil_hari_ini` (opsional)

### 2) POST `/harian/submit`

Body minimum:
- `susun_kata_id`
- `percobaan`
- `waktu` (detik)
- `menang`

Validasi backend:
1. user login wajib
2. `susun_kata_id` valid untuk tanggal hari ini
3. belum ada skor user untuk puzzle ini
4. `percobaan` dan `waktu` dalam rentang aman

Response:
- `menang`, `percobaan`, `waktu`, `skor`
- `kata`, `arti`, `path_kamus` (agar UI bisa tampilkan toast sukses)

### 3) GET `/skor`

Fungsi:
- ringkasan skor user

Response sederhana:
- `total_skor`
- `total_main`
- `total_menang`

## SusunKataAdmin (Diperlukan)

Karena kata bisa diubah admin, perlu modul admin sederhana.

## Route Admin (awal)

Prefix: `/api/redaksi/gim/susun-kata`

1. `GET /harian?tanggal=YYYY-MM-DD&panjang=5`
   - lihat kata harian saat ini
2. `POST /harian`
   - set/replace kata harian pada tanggal tertentu
3. `PUT /harian/:id`
   - ubah kata yang sudah terdaftar

## Validasi Admin

Saat admin menyimpan kata:
1. kata harus valid di kamus Susun Kata (`indeks`, filter dasar)
2. panjang kata harus sesuai kolom `panjang`
3. pasangan `(tanggal, panjang)` tetap unik (upsert/update aman)

## UI Admin (minimal)

Halaman: `SusunKataAdmin`

Fitur MVP:
1. pilih tanggal
2. pilih panjang (default 5)
3. input kata
4. tombol simpan
5. tampilkan hasil tersimpan

Tidak perlu fitur tambahan dulu (history kompleks, bulk schedule, dll).

## Perubahan Frontend Publik Minimum

1. `SusunKata` ambil data dari endpoint `/harian`.
2. Submit akhir game kirim ke `/harian/submit`.
3. Jika sudah submit hari ini, kunci permainan dan tampilkan ringkasan.
4. Toast sukses tetap menampilkan arti + tautan entri.

## Risiko & Mitigasi

1. **Race condition generate kata harian**  
   Mitigasi: `UNIQUE (tanggal, panjang)` + retry read setelah insert conflict.

2. **Admin mengubah kata setelah banyak user main**  
   Mitigasi MVP: hanya izinkan ubah sebelum ada skor; atau tampilkan peringatan keras jika tetap diubah.

3. **Manipulasi waktu klien**  
   Mitigasi: logika tanggal harian berdasarkan server (`Asia/Jakarta`).

## Rangkuman Keputusan Revisi

1. Pakai dua tabel: `susun_kata` dan `susun_kata_skor`.
2. Kata harian otomatis dibuat saat dibutuhkan, unik per tanggal+panjang.
3. Skor pakai rumus sederhana `11 - percobaan` untuk menang.
4. Tambahkan `SusunKataAdmin` agar kata harian bisa dikontrol admin.

## Referensi

- `_docs/struktur-data.sql`
- `backend/models/modelEntri.js`
- `backend/routes/gim/susunKata.js`
- `frontend/src/halaman/gim/SusunKata.jsx`
