# Migrasi Database: varchar → text & Optimasi Indeks

**Tanggal:** 2026-02-14  
**Status:** ✅ Selesai

## Ringkasan

Dua migrasi database untuk meningkatkan fleksibilitas dan kinerja:
1. Mengubah semua kolom `character varying(N)` menjadi `text`
2. Menambahkan indeks yang belum ada berdasarkan pola query frontend

## Perubahan yang Dilakukan

### 1. Ubah character varying → text

**Alasan:**
- PostgreSQL tidak memiliki perbedaan performa antara `varchar(N)` dan `text`
- Tipe `text` menghilangkan risiko data terpotong jika melebihi batas karakter
- Mengurangi noise di schema (tidak perlu menentukan panjang maksimal)

**Cakupan:** Seluruh 21 tabel — total ~80 kolom diubah.

**Migrasi:** `_sql/202602/20260214_alter_character_varying_to_text.sql`

### 2. Optimasi Indeks Database

**Masalah:** Beberapa tabel kritis tidak memiliki indeks sama sekali:
- `phrase` — tabel utama kamus, **tidak punya indeks**
- `proverb` — tidak ada indeks pada kolom `phrase`
- `translation` — tidak ada indeks pada kolom `lemma`
- `external_ref` — tidak ada indeks pada kolom `phrase`

**Solusi — 16 indeks baru:**

| Tabel | Indeks | Tipe | Kegunaan |
|-------|--------|------|----------|
| `phrase` | `idx_phrase_lower` | btree(LOWER) | Pencarian exact case-insensitive |
| `phrase` | `idx_phrase_trgm` | gin(trgm) | Pencarian ILIKE (prefix + contains) |
| `phrase` | `idx_phrase_type` | btree | Filter berdasarkan tipe frasa |
| `phrase` | `idx_phrase_actual` | btree (partial) | Ambil frasa redirect/salah eja |
| `definition` | `idx_definition_phrase_lower` | btree(LOWER) | Lookup definisi case-insensitive |
| `definition` | `idx_definition_phrase_order` | btree(phrase, def_num, def_uid) | Urutkan definisi tanpa sort |
| `definition` | `idx_definition_lex_class` | btree | JOIN ke lexical_class |
| `definition` | `idx_definition_discipline` | btree | JOIN ke discipline |
| `relation` | `idx_relation_root_lower` | btree(LOWER) | Pencarian relasi case-insensitive |
| `proverb` | `idx_proverb_phrase_lower` | btree(LOWER) | Lookup peribahasa case-insensitive |
| `proverb` | `idx_proverb_trgm` | gin(trgm) | Pencarian ILIKE peribahasa |
| `translation` | `idx_translation_lemma_lower` | btree(LOWER) | Lookup terjemahan case-insensitive |
| `external_ref` | `idx_external_ref_phrase_lower` | btree(LOWER) | Lookup tautan luar |
| `searched_phrase` | `idx_searched_phrase_phrase` | unique btree | Upsert pencarian populer |
| `abbr_entry` | `idx_abbr_entry_trgm` | gin(trgm) | Pencarian ILIKE singkatan |
| `glossary` | `idx_glossary_phrase_trgm` | gin(trgm) | Pencarian ILIKE glosarium |
| `glossary` | `idx_glossary_original_trgm` | gin(trgm) | Pencarian ILIKE bahasa asing |

**Catatan:** Membutuhkan ekstensi `pg_trgm` (sudah termasuk di PostgreSQL standar).

**Migrasi:** `_sql/202602/20260214_optimize_indexes.sql`

## Dampak

- **Kinerja pencarian kamus** meningkat signifikan karena tabel `phrase` sebelumnya melakukan seq scan
- **Halaman detail kamus** lebih cepat karena lookup definisi, relasi, peribahasa, terjemahan, dan tautan sudah terindeks
- **Pencarian glosarium dan singkatan** dengan ILIKE dipercepat oleh indeks trigram
- **Tidak ada breaking changes** — semua perubahan backward-compatible

## Cara Menjalankan

```powershell
Set-Location backend

# 1. Migrasi varchar → text
node -e "
  require('dotenv').config({ path: '.env' });
  const db = require('./db');
  const fs = require('fs');
  const sql = fs.readFileSync('../_sql/202602/20260214_alter_character_varying_to_text.sql', 'utf8');
  db.query(sql)
    .then(() => { console.log('Migration 1 OK'); return db.close(); })
    .catch(e => { console.error('FAIL:', e.message); db.close(); });
"

# 2. Optimasi indeks
node -e "
  require('dotenv').config({ path: '.env' });
  const db = require('./db');
  const fs = require('fs');
  const sql = fs.readFileSync('../_sql/202602/20260214_optimize_indexes.sql', 'utf8');
  db.query(sql)
    .then(() => { console.log('Migration 2 OK'); return db.close(); })
    .catch(e => { console.error('FAIL:', e.message); db.close(); });
"

# 3. Regenerate schema
node scripts/db-schema.js
```

## Verifikasi

```sql
-- Cek tidak ada lagi kolom character varying
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND data_type = 'character varying'
ORDER BY table_name;

-- Cek semua indeks baru terpasang
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Berkas Terkait

- `_sql/202602/20260214_alter_character_varying_to_text.sql` — Migrasi tipe kolom
- `_sql/202602/20260214_optimize_indexes.sql` — Migrasi indeks
- `_sql/tables.sql` — Master schema (regenerate setelah migrasi)
- `backend/scripts/db-schema.js` — Script untuk generate schema
