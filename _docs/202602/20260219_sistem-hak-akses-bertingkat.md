# Sistem Hak Akses Bertingkat (RBAC)

**Tanggal**: 2026-02-19  
**Status**: Aktif

---

## Ringkasan

Kateglo menggunakan **Role-Based Access Control (RBAC)** berbasis izin.
Setiap pengguna mempunyai satu **peran** (`pengguna`, `penyunting`, `admin`).
Setiap peran memiliki sekumpulan **izin** yang tersimpan di tabel `peran_izin`.
Pada saat login, peran dan daftar izin disisipkan ke dalam JWT payload.

---

## Arsitektur

```
pengguna → (punya) → peran → (punya banyak) → izin
```

### Tabel database

| Tabel | Fungsi |
|-------|--------|
| `peran` | Daftar peran (pengguna, penyunting, admin) |
| `izin` | Daftar kode izin per kelompok resource |
| `peran_izin` | Relasi many-to-many peran ↔ izin |
| `pengguna.peran_id` | Peran aktif pengguna |

---

## Peran

### `pengguna` (default)
Pengguna biasa yang login. Hanya bisa membaca data.

### `penyunting`
Tim redaksi. Bisa edit/tambah konten kamus, tesaurus, glosarium.
**Tidak bisa** hapus entri, kelola label, atau kelola pengguna.

### `admin`
Akses penuh. Semua izin termasuk hapus, kelola pengguna, kelola label.

---

## Daftar Izin

### Kelompok `entri` (kamus)
| Kode | Penyunting | Admin |
|------|:---:|:---:|
| `lihat_entri` | ✓ | ✓ |
| `tambah_entri` | ✓ | ✓ |
| `edit_entri` | ✓ | ✓ |
| `hapus_entri` | — | ✓ |
| `tambah_makna` | ✓ | ✓ |
| `edit_makna` | ✓ | ✓ |
| `hapus_makna` | — | ✓ |
| `tambah_contoh` | ✓ | ✓ |
| `edit_contoh` | ✓ | ✓ |
| `hapus_contoh` | — | ✓ |

### Kelompok `tesaurus`
| Kode | Penyunting | Admin |
|------|:---:|:---:|
| `lihat_tesaurus` | ✓ | ✓ |
| `tambah_tesaurus` | ✓ | ✓ |
| `edit_tesaurus` | ✓ | ✓ |
| `hapus_tesaurus` | — | ✓ |

### Kelompok `glosarium`
| Kode | Penyunting | Admin |
|------|:---:|:---:|
| `lihat_glosarium` | ✓ | ✓ |
| `tambah_glosarium` | ✓ | ✓ |
| `edit_glosarium` | ✓ | ✓ |
| `hapus_glosarium` | — | ✓ |

### Kelompok `komentar`
| Kode | Penyunting | Admin |
|------|:---:|:---:|
| `kelola_komentar` | ✓ | ✓ |

### Kelompok `label` *(admin only)*
| Kode | Penyunting | Admin |
|------|:---:|:---:|
| `kelola_label` | — | ✓ |

### Kelompok `statistik`
| Kode | Penyunting | Admin |
|------|:---:|:---:|
| `lihat_statistik` | ✓ | ✓ |

### Kelompok `pengguna` *(admin only)*
| Kode | Penyunting | Admin |
|------|:---:|:---:|
| `kelola_pengguna` | — | ✓ |
| `kelola_peran` | — | ✓ |

---

## Implementasi Backend

### Middleware

**`middleware/auth.js`**
- `authenticate` — wajib untuk semua route `/api/redaksi/*`
- `authenticateOptional` — untuk route publik yang perlu info user

**`middleware/otorisasi.js`**
- `redaksiSaja` — gate pertama: hanya `admin` atau `penyunting` yang bisa masuk area redaksi
- `adminSaja` — untuk operasi yang murni admin (tidak dipakai di route redaksi lagi)
- `periksaIzin(...kode)` — cek apakah JWT payload (`req.user.izin`) mengandung salah satu kode izin

### Penerapan di Router

```
/api/redaksi/* → authenticate → redaksiSaja → (route handler dengan periksaIzin)
```

**`routes/index.js`**
```js
router.use('/redaksi', authenticate, redaksiSaja, redaksiRouter);
```

### Contoh Penggunaan periksaIzin

```js
// Tampil daftar — penyunting & admin
router.get('/', periksaIzin('lihat_entri'), handler);

// Edit — penyunting & admin
router.put('/:id', periksaIzin('edit_entri'), handler);

// Hapus — admin only (karena hanya admin punya izin hapus_entri)
router.delete('/:id', periksaIzin('hapus_entri'), handler);

// Admin only via izin
router.get('/', periksaIzin('kelola_label'), handler);
```

---

## Implementasi Frontend

### `authContext.jsx`

```js
{
  adalahAdmin:   user?.peran === 'admin',
  adalahRedaksi: user?.peran === 'admin' || user?.peran === 'penyunting',
  punyaIzin: (kode) => user?.izin?.includes(kode),
}
```

### Route Guard

| Guard | Kondisi | Digunakan untuk |
|-------|---------|-----------------|
| `RuteRedaksi` | `adalahRedaksi` | Semua halaman redaksi |
| `RuteAdmin` | `adalahAdmin` | Label, Pengguna (redirect ke `/redaksi` jika bukan admin) |

### Penyembunyian UI Berdasarkan Peran

- **Menu navigasi**: `adminSaja: true` → hanya tampil jika `adalahAdmin`
- **Dasbor**: Kartu Label & Pengguna hanya tampil jika `adalahAdmin`
- **Tombol hapus** di halaman konten: gunakan `punyaIzin('hapus_entri')` untuk show/hide

```jsx
// Contoh di halaman KamusAdmin
const { punyaIzin } = useAuth();

{punyaIzin('hapus_entri') && (
  <button onClick={hapus}>Hapus</button>
)}
```

---

## Cara Menambah Peran/Izin Baru

### 1. Tambah izin baru di database

```sql
INSERT INTO izin (kode, nama, kelompok)
VALUES ('kode_baru', 'Nama Izin', 'kelompok');
```

### 2. Pasang izin ke peran

```sql
INSERT INTO peran_izin (peran_id, izin_id)
SELECT p.id, i.id
FROM peran p, izin i
WHERE p.kode = 'penyunting' AND i.kode = 'kode_baru'
  AND NOT EXISTS (SELECT 1 FROM peran_izin WHERE peran_id = p.id AND izin_id = i.id);
```

### 3. Pasang di route backend

```js
router.post('/', periksaIzin('kode_baru'), handler);
```

### 4. Update model schema

```bash
Set-Location backend; node scripts/db-schema.js
```

---

## Riwayat Perubahan

| Tanggal | Migration | Deskripsi |
|---------|-----------|-----------|
| 2026-02-17 | `20260214_migrasi-001-otorisasi.sql` | Skema awal: tabel peran, izin, peran_izin + seed data |
| 2026-02-19 | `20260219_aktifkan_hak_akses_penyunting.sql` | Tambah izin baru, aktifkan peran penyunting |
| 2026-02-19 | `20260219_rename_izin_lema_ke_entri.sql` | Rename kode izin lema→entri sesuai nama tabel |
