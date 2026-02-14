# Dokumentasi — Kateglo 2.0

## Struktur Folder

```
_docs/
├── README.md               # Dokumen ini
├── struktur-data.sql       # Struktur database (hasil generate)
└── YYYYMM/                 # Catatan perubahan per bulan
    ├── YYYYMMDD_nama-topik.md
    └── YYYYMMDD_nama-migrasi.sql
```

## Konvensi Penamaan

### File Changelog
Format: `YYYYMMDD_nama-topik.md` (tanggal + kebab-case)

Contoh:
```
20260214_migrasi-varchar-ke-text.md
20260214_optimasi-indeks-database.md
```

### Pedoman Penulisan
- Judul sebagai Heading 1 (`# Judul`)
- Metadata: **Tanggal**, **Status**
- Bagian utama: Ringkasan → Perubahan → Verifikasi
- Cantumkan **Berkas Terkait** di akhir dokumen
- Gunakan bahasa Indonesia untuk deskripsi, Inggris untuk kode

## Akses Cepat

- [Changelog](../frontend/public/changelog.md) — perubahan user-facing
- [Todo](../frontend/public/todo.md) — daftar pekerjaan aktif

### Februari 2026
- [Migrasi varchar ke text & optimasi indeks](202602/20260214_migrasi-database-v2.md)

## Cara Menambah Entri Baru

1. Buat folder bulan jika belum ada: `_docs/YYYYMM/`
2. Buat file dengan format nama di atas
3. Isi dengan struktur standar:

```markdown
# Judul Perubahan

**Tanggal:** YYYY-MM-DD
**Status:** ✅ Selesai / 🔄 Dalam Proses / ❌ Ditunda

## Ringkasan
(1-2 kalimat)

## Perubahan yang Dilakukan
### 1. ...
### 2. ...

## Berkas Terkait
- `path/ke/file.js` — deskripsi
```

4. Perbarui daftar di README.md ini
