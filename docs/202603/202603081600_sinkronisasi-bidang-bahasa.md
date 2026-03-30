# Sinkronisasi Master Bidang dan Bahasa

**Tanggal:** 2026-03-08
**File migrasi:** `202603081400_sinkronisasi-bidang.sql`, `202603081500_sinkronisasi-bahasa.sql`

---

## Ringkasan Perubahan

### Bidang

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| `bidang.kode` | Format slug kebab-case (mis. `agama-islam`) | Kode singkatan KBBI (mis. `Isl`) |
| Sumber data | `label.kategori = 'bidang'` (63 entri) | Tabel `bidang` langsung (96 entri) |
| Referensi di kamus | `makna.bidang`, `contoh.bidang` (teks, kode singkat) | Tidak berubah |
| Referensi di glosarium | `glosarium.bidang_id` (FK integer) | Tidak berubah |
| `bidang.aktif` | Semua true | true jika dipakai di makna, contoh, atau glosarium |

**Total bidang setelah migrasi:** 96 (72 aktif, 24 nonaktif)

Entri baru ditambahkan dari dua sumber:
- Label KBBI yang belum ada di tabel bidang (26 entri: Adm, Anat, Astrol, Bakt, Bot, dll.)
- Referensi terbaru `daftar-bidang.xlsx` (23 entri baru: Bu, Ekol, Ft, Geof, Gz, dll.)

Konflik nama tidak ditemukan; `label.kategori = 'bidang'` dihapus setelah migrasi.

---

### Bahasa

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Tabel master | Tidak ada (pakai `label.kategori = 'bahasa'`) | Tabel `bahasa` baru |
| `glosarium.bahasa` | TEXT `'en'` | Dihapus → diganti `bahasa_id` (FK ke `bahasa.id`) |
| `etimologi.bahasa` | TEXT nama penuh (mis. `'Arab'`, `'Belanda'`) | Dihapus → diganti `bahasa_id` (FK ke `bahasa.id`) |
| `makna.bahasa` | Kode singkat (mis. `Jw`, `Ar`) — TEXT | Tidak berubah (teks, kode singkat) |
| `contoh.bahasa` | Nama penuh (`'Minangkabau'`) — TEXT | Dikonversi ke kode singkat (`'Mk'`) |
| `bahasa.aktif` | — | true jika dipakai di `makna.bahasa` atau `contoh.bahasa` |

**Total bahasa setelah migrasi:** 291 (91 aktif, 200 nonaktif)

Sumber data bahasa (berurutan, prioritas tertinggi ke terendah):
1. `label.kategori = 'bahasa'` (102 entri) — sumber primer KBBI
2. Referensi `daftar-bahasa.xlsx` (267 entri, 172 tambahan baru)
3. Bahasa etimologi-only dengan kode generated (14 entri: Amy, Chj, Fch, Hak, Hi, IngA, Kan, Mdn, Ngp, Tam, Tch, Tgh, Tng, Tsn)

#### Resolusi Konflik Kode

| Kode | Label (lama) | Excel (baru) | Resolusi |
|------|-------------|--------------|---------|
| `Sb` | Sumbawa | Sabu | Label → kode baru `Sbw` (Sumbawa); `Sb` = Sabu dari Excel |
| `Mrd` | Bian Marind Deg | Moraid | Label → kode baru `BMr` (Bian Marind Deg); `Mrd` = Moraid dari Excel |

Data di `makna.bahasa` disesuaikan: `Sb` → `Sbw`, `Mrd` → `BMr`, `XXX` → `NULL`.

#### Pemetaan Bahasa Etimologi

Bahasa di `etimologi.bahasa` (nama penuh) dipetakan ke `bahasa_id` via:
- Kecocokan nama langsung (mis. `'Arab'` → kode `Ar`)
- Kasus khusus: `'Persia'` → kode `Par` (Parsi)
- Penggabungan: `'Amoy/Ts'` → `Amy` (Amoy), `'Tong'an/A'` → `Tng` (Tong'an)

Hasil: 16.212 dari 16.512 etimologi berhasil dipetakan (300 sisanya memiliki `bahasa = NULL` sejak awal).

#### Kolom ISO

Tabel `bahasa` memiliki kolom `iso2` dan `iso3`. Diisi saat ini:
- `iso2 = 'en'` untuk kode `Ing` (Inggris)

---

## Kolom Baru / Terhapus

### Tabel `etimologi`
- **Tambah:** `bahasa_id integer REFERENCES bahasa(id) ON DELETE SET NULL`
- **Hapus:** `bahasa text`

### Tabel `glosarium`
- **Tambah:** `bahasa_id integer REFERENCES bahasa(id) ON DELETE RESTRICT NOT NULL`
- **Hapus:** `bahasa text`

### Tabel `bidang`
- **Ubah:** kolom `kode` dari slug ke kode singkatan

---

## Aturan Aktif/Nonaktif

### Bidang
- `aktif = true` jika `kode` muncul di `makna.bidang` **atau** `contoh.bidang` **atau** `id` dirujuk dari `glosarium.bidang_id`
- `aktif = false` untuk semua entri baru dari Excel yang belum terpakai

### Bahasa
- `aktif = true` jika `kode` muncul di `makna.bahasa` **atau** `contoh.bahasa`
- `aktif = false` untuk bahasa etimologi-only, bahasa dari Excel yang belum di kamus

### Implikasi Frontend

| Konteks | Tampil |
|---------|--------|
| Kartu kamus (dropdown filter/form bahasa & bidang) | Hanya `aktif = true` |
| Dropdown redaksi (CRUD master) | Semua (aktif maupun nonaktif) |

---

## Perubahan Kode

### Backend
- `backend/models/modelGlosarium.js`: Semua query normalized menggunakan `bahasa_id`, JOIN `bahasa ba`, filter `ba.kode`/`ba.iso2`. Tambah method `ambilDaftarBahasa()`, dan CRUD `daftarMasterBahasa`, `simpanMasterBahasa`, `hapusMasterBahasa`.
- `backend/models/modelEtimologi.js`: Semua query menggunakan `bahasa_id`, JOIN `bahasa ba`. `simpan()` menerima `bahasa_id` (integer) atau `bahasa` (kode string, di-resolve ke id).
- `backend/routes/redaksi/bahasa.js`: Route baru (CRUD master bahasa, izin `kelola_bahasa`).
- `backend/routes/redaksi/index.js`: Registrasi route `/bahasa`.
- Database: Izin `kelola_bahasa` ditambah dan diberikan ke peran admin.

### Frontend
- `frontend/src/halaman/redaksi/BahasaAdmin.jsx`: Halaman baru CRUD master bahasa.
- `frontend/src/api/apiAdmin.js`: Tambah hooks `useDaftarBahasaAdmin`, `useDetailBahasaAdmin`, `useSimpanBahasa`, `useHapusBahasa`.
- `frontend/src/komponen/redaksi/NavbarAdmin.jsx`: Tambah menu Bahasa di kelompok Master.
- `frontend/src/App.jsx`: Daftarkan route `/redaksi/bahasa` dan `/redaksi/bahasa/:id`.
- `frontend/src/halaman/redaksi/KamusAdmin.jsx`: Dropdown bidang dan bahasa kini diambil dari tabel master (bukan label).

---

## Izin Baru

| Kode | Nama | Diberikan ke |
|------|------|-------------|
| `kelola_bahasa` | Kelola Master Bahasa | Peran admin |
