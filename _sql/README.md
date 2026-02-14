# SQL Migrations — Kateglo 2.0

## Struktur Folder

```
_sql/
├── tables.sql              # Master schema (di-generate oleh db-schema.js)
├── README.md               # Dokumen ini
└── YYYYMM/                 # Folder per bulan
    └── YYYYMMDD_nama_migrasi.sql
```

## Konvensi Penamaan

### File Migrasi
Format: `YYYYMMDD_nama_migrasi.sql` (disamakan dengan prefix docs: `YYYYMMDD_`)

```
20260214_alter_character_varying_to_text.sql
20260214_optimize_indexes.sql
```

### Prefiks Nama
| Prefiks | Kegunaan |
|---------|----------|
| `add_` | Tambah tabel/kolom baru |
| `alter_` | Ubah struktur kolom |
| `rename_` | Ubah nama tabel/kolom |
| `drop_` | Hapus tabel/kolom |
| `optimize_` | Optimasi indeks/performa |
| `fix_` | Perbaiki data atau constraint |
| `seed_` | Isi data awal |
| `cleanup_` | Bersihkan data/kolom tidak terpakai |
| `migrate_` | Perubahan struktural besar |

### File Rollback (opsional)
Format: `YYYYMMDD_nama_migrasi_rollback.sql`

## Master Schema

File `tables.sql` di root `_sql/` adalah schema lengkap database yang di-generate otomatis:

```powershell
Set-Location backend; node scripts/db-schema.js
```

**JANGAN edit `tables.sql` manual** — selalu generate ulang setelah menjalankan migrasi.

## Cara Menjalankan Migrasi

### 1. Review dulu
Baca file SQL dan pastikan perubahannya benar.

### 2. Jalankan
```powershell
# Dari root project
Set-Location backend
node -e "
  require('dotenv').config({ path: '.env' });
  const db = require('./db');
  const fs = require('fs');
  const sql = fs.readFileSync('../_sql/202602/20260214_nama_migrasi.sql', 'utf8');
  db.query(sql)
    .then(r => { console.log('Migration OK'); db.close(); })
    .catch(e => { console.error('FAIL:', e.message); db.close(); });
"
```

### 3. Regenerate schema
```powershell
Set-Location backend; node scripts/db-schema.js
```

## Best Practices

1. **Gunakan `IF NOT EXISTS` / `IF EXISTS`** untuk idempotency
2. **Bungkus perubahan data dengan `BEGIN; ... COMMIT;`**
3. **Sertakan query verifikasi** (di-comment) di akhir file
4. **Satu migrasi = satu concern** — jangan campur perubahan yang tidak terkait
5. **Selalu cek schema** sebelum membuat migrasi baru

## Riwayat Migrasi

### Februari 2026
| File | Deskripsi |
|------|-----------|
| [20260214_alter_character_varying_to_text.sql](202602/20260214_alter_character_varying_to_text.sql) | Ubah semua kolom `character varying` → `text` |
| [20260214_optimize_indexes.sql](202602/20260214_optimize_indexes.sql) | Tambah indeks untuk optimasi kinerja frontend |
