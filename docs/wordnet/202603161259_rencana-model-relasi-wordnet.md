# Rencana: Model Relasi Komprehensif ala WordNet

## Konteks

Tesaurus Kateglo saat ini menyimpan relasi secara denormalisasi — tabel `tesaurus` hanya punya kolom teks `sinonim` dan `antonim` (dipisah titik koma). Ini membatasi:
- Hanya 2 tipe relasi (sinonim/antonim)
- Tidak ada konsep *synset* (pengelompokan kata berdasarkan makna)
- Tidak bisa query balik (jika A sinonim B, B belum tentu mencantumkan A)
- Tidak ada validasi bahwa kata terkait benar-benar ada di database

Data WordNet Indonesia sudah tersedia di `_data/wordnet/` dengan 42.937 synset, 88.955 relasi lintas 26 tipe, dan 398.874 entri lemma — cukup untuk menjadi seed data.

**Tujuan**: Membangun model relasi ternormalisasi yang mendukung 26 tipe relasi WordNet, menjaga kompatibilitas tesaurus lama, dan bisa dikelola lewat admin UI.

## Keputusan Arsitektur

**Tabel baru di samping `tesaurus` yang sudah ada.** Alasan:
- Model data berbeda fundamental (flat vs synset-based)
- Migrasi in-place berisiko merusak data produksi
- Tesaurus lama bisa tetap berjalan selama transisi
- Data tesaurus lama bisa diimpor sebagai salah satu sumber

## Skema Database Baru

### Tabel `sinset`
```sql
CREATE TABLE sinset (
  id         TEXT PRIMARY KEY,            -- '00001740-a' (WordNet) atau 'kg-000001' (Kateglo-native)
  pos        CHAR(1) NOT NULL,            -- n, v, a, r
  definisi   TEXT,
  contoh     TEXT,
  sumber     TEXT NOT NULL DEFAULT 'wordnet',
  aktif      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Tabel `sinset_lema`
```sql
CREATE TABLE sinset_lema (
  id         SERIAL PRIMARY KEY,
  sinset_id  TEXT NOT NULL REFERENCES sinset(id) ON DELETE CASCADE,
  lema       TEXT NOT NULL,
  urutan     SMALLINT NOT NULL DEFAULT 0,
  terverifikasi BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE jika ada di tabel entri
  sumber     TEXT NOT NULL DEFAULT 'wordnet',
  aktif      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sinset_id, lema)
);
-- Indexes
CREATE INDEX idx_sinset_lema_lema_lower ON sinset_lema (LOWER(lema));
CREATE INDEX idx_sinset_lema_lema_trgm ON sinset_lema USING gin (lema gin_trgm_ops);
CREATE INDEX idx_sinset_lema_sinset_id ON sinset_lema (sinset_id);
```

### Tabel `tipe_relasi`
```sql
CREATE TABLE tipe_relasi (
  kode        TEXT PRIMARY KEY,            -- 'hipernim', 'antonim', dll.
  nama        TEXT NOT NULL,               -- 'Hipernim'
  nama_publik TEXT NOT NULL,               -- 'Kata Umum' (user-friendly)
  kategori    TEXT NOT NULL,               -- 'hierarki'|'leksikal'|'morfologi'|'verba'|'domain'
  kebalikan   TEXT REFERENCES tipe_relasi(kode), -- kode relasi kebalikan
  simetris    BOOLEAN NOT NULL DEFAULT FALSE,    -- TRUE jika A→B berarti B→A otomatis
  urutan      SMALLINT NOT NULL DEFAULT 0
);
```

**Seed data (26 tipe dalam 5 kategori):**

| Kategori | Kode | Nama Publik | Kebalikan | Simetris |
|----------|------|-------------|-----------|----------|
| hierarki | hipernim | Kata Umum | hiponim | - |
| hierarki | hiponim | Kata Spesifik | hipernim | - |
| hierarki | hipernim_instans | Kelas Dari | hiponim_instans | - |
| hierarki | hiponim_instans | Contoh Dari | hipernim_instans | - |
| hierarki | holonim_bagian | Keseluruhan (bagian) | meronim_bagian | - |
| hierarki | meronim_bagian | Bagian Dari | holonim_bagian | - |
| hierarki | holonim_anggota | Kelompok (anggota) | meronim_anggota | - |
| hierarki | meronim_anggota | Anggota Dari | holonim_anggota | - |
| hierarki | holonim_substansi | Mengandung | meronim_substansi | - |
| hierarki | meronim_substansi | Terbuat Dari | holonim_substansi | - |
| leksikal | antonim | Lawan Kata | antonim | ya |
| leksikal | mirip | Mirip | mirip | ya |
| leksikal | lihat_juga | Lihat Juga | lihat_juga | ya |
| leksikal | atribut | Atribut | atribut | ya |
| morfologi | derivasi | Turunan | derivasi | ya |
| morfologi | pertainim | Berkaitan | — | - |
| morfologi | partisipial | Partisipial | — | - |
| verba | mengimplikasikan | Mengimplikasikan | — | - |
| verba | menyebabkan | Menyebabkan | — | - |
| verba | kelompok_verba | Kelompok Verba | kelompok_verba | ya |
| domain | domain_topik | Domain Topik | ber_domain_topik | - |
| domain | ber_domain_topik | Bertopik | domain_topik | - |
| domain | domain_wilayah | Domain Wilayah | ber_domain_wilayah | - |
| domain | ber_domain_wilayah | Berwilayah | domain_wilayah | - |
| domain | domain_penggunaan | Domain Penggunaan | ber_domain_penggunaan | - |
| domain | ber_domain_penggunaan | Berpenggunaan | domain_penggunaan | - |

### Tabel `relasi_sinset`
```sql
CREATE TABLE relasi_sinset (
  id              SERIAL PRIMARY KEY,
  sinset_asal     TEXT NOT NULL REFERENCES sinset(id) ON DELETE CASCADE,
  sinset_tujuan   TEXT NOT NULL REFERENCES sinset(id) ON DELETE CASCADE,
  tipe_relasi     TEXT NOT NULL REFERENCES tipe_relasi(kode),
  sumber          TEXT NOT NULL DEFAULT 'wordnet',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sinset_asal, sinset_tujuan, tipe_relasi)
);
CREATE INDEX idx_relasi_sinset_asal ON relasi_sinset (sinset_asal);
CREATE INDEX idx_relasi_sinset_tujuan ON relasi_sinset (sinset_tujuan);
CREATE INDEX idx_relasi_sinset_tipe ON relasi_sinset (tipe_relasi);
```

### Alur Query "Semua relasi untuk kata X"
```
sinset_lema (cari sinset_id berdasarkan lema=X)
  → relasi_sinset (cari relasi dari/ke sinset_id tersebut)
    → sinset_lema (resolusi kata target)
      → tipe_relasi (label & kategori)
```

Bidirectional: query `sinset_asal` DAN `sinset_tujuan`, mapping ke relasi kebalikan via `tipe_relasi.kebalikan`.

---

## Fase Implementasi

### Fase 1 — Fondasi Database + Impor WordNet
**Tujuan**: Tabel baru tercipta dan terisi data WordNet. Belum ada perubahan API/UI.

| Langkah | File | Aksi |
|---------|------|------|
| 1.1 | `docs/202603/YYYYMMDDHHMM_sinset-tabel-baru.sql` | DDL 4 tabel + seed `tipe_relasi` + trigger |
| 1.2 | `backend/temp_impor_wordnet.js` | Baca file `_data/wordnet/*.tab`, batch INSERT ke DB. Cross-ref dengan tabel `entri` untuk set `terverifikasi`. Hapus setelah selesai. |
| 1.3 | Regenerasi `docs/data/struktur.sql` | `node scripts/db-schema.js` |

**Strategi filter kata Melayu**: Impor semua data B+I. Set `terverifikasi=TRUE` jika lema ada di tabel `entri`. Prioritaskan kata terverifikasi saat tampil publik.

**Volume**: ~42.937 synset, ~398.874 lema, ~88.955 relasi, 26 tipe relasi.

---

### Fase 2 — API Publik Read-Only
**Tujuan**: Endpoint baru untuk query relasi. API tesaurus lama tetap berjalan.

| Langkah | File | Aksi |
|---------|------|------|
| 2.1 | `backend/models/modelRelasi.js` (baru) | `ambilRelasiKata(kata)`, `ambilSinset(id)`, `cariKataRelasi(query, limit)` |
| 2.2 | `backend/services/layananRelasiPublik.js` (baru) | Format data relasi terkelompok per kategori |
| 2.3 | `backend/routes/publik/relasi.js` (baru) | `GET /api/publik/relasi/:kata`, `GET /api/publik/relasi/autocomplete/:kata`, `GET /api/publik/relasi/sinset/:id` |
| 2.4 | `backend/routes/publik/index.js` | Daftarkan router baru |

**Struktur respons**:
```json
{
  "kata": "besar",
  "sinset": [
    {
      "id": "00123456-a",
      "pos": "a",
      "definisi": "memiliki ukuran melebihi rata-rata",
      "lema": ["agung", "akbar", "raya"],
      "relasi": {
        "hierarki": [
          { "tipe": "hiponim", "label": "Kata Spesifik", "target": [
            { "sinset_id": "...", "lema": ["raksasa", "jumbo"] }
          ]}
        ],
        "leksikal": [
          { "tipe": "antonim", "label": "Lawan Kata", "target": [
            { "sinset_id": "...", "lema": ["kecil", "mungil"] }
          ]}
        ]
      }
    }
  ]
}
```

---

### Fase 3 — Frontend Penjelajah Relasi
**Tujuan**: Halaman publik baru untuk menjelajahi relasi kata.

| Langkah | File | Aksi |
|---------|------|------|
| 3.1 | `frontend/src/api/apiPublik.js` | Tambah `ambilRelasiKata()`, `cariRelasiAutocomplete()` |
| 3.2 | `frontend/src/pages/publik/kamus/Relasi.jsx` (baru) | Halaman pencarian + tampilan relasi per sinset, terkelompok per kategori |
| 3.3 | `frontend/src/komponen/publik/KartuRelasi.jsx` (baru) | Komponen reusable untuk menampilkan relasi satu sinset |
| 3.4 | Router frontend | Tambah rute `/relasi` dan `/relasi/cari/:kata` |
| 3.5 | `frontend/src/pages/publik/kamus/Tesaurus.jsx` | Tambah tautan "Lihat relasi lengkap →" ke halaman relasi |

---

### Fase 4 — Admin CRUD Sinset & Relasi
**Tujuan**: Redaksi bisa mengelola sinset dan relasi.

| Langkah | File | Aksi |
|---------|------|------|
| 4.1 | `backend/models/modelRelasi.js` | Tambah metode CRUD admin |
| 4.2 | `backend/routes/redaksi/relasi.js` (baru) | CRUD endpoints + izin |
| 4.3 | Migrasi SQL izin | INSERT izin baru ke tabel `izin` |
| 4.4 | `frontend/src/api/apiAdmin.js` | Tambah hooks admin relasi |
| 4.5 | `frontend/src/pages/redaksi/leksikon/RelasiAdmin.jsx` (baru) | Halaman admin: daftar sinset, form edit, kelola lema & relasi |
| 4.6 | Router redaksi | Tambah rute `/redaksi/relasi` |

---

### Fase 5 — Migrasi Data Tesaurus Lama + Jembatan
**Tujuan**: Data tesaurus lama masuk ke model baru. API lama diperkaya.

| Langkah | File | Aksi |
|---------|------|------|
| 5.1 | `backend/temp_migrasi_tesaurus.js` | Parse tiap baris tesaurus → buat sinset `kg-XXXXXX`, parse sinonim/antonim → relasi. Deduplikasi dengan synset WordNet yang sudah ada. |
| 5.2 | `backend/services/layananTesaurusPublik.js` | Perkaya `ambilDetailTesaurus()` dengan data dari tabel baru |

---

## Verifikasi

Per fase, jalankan:
```bash
# Fase 1: Cek tabel tercipta dan data terimport
cd backend && node temp_impor_wordnet.js
node scripts/db-schema.js

# Fase 2: Test endpoint baru
cd backend && npm run lint && npx jest --findRelatedTests models/modelRelasi.js
curl http://localhost:3000/api/publik/relasi/besar

# Fase 3: Test frontend
cd frontend && npm run lint && npx vitest related --run src/pages/publik/kamus/Relasi.jsx

# Fase 4: Test admin
cd backend && npx jest --findRelatedTests routes/redaksi/relasi.js
cd frontend && npx vitest related --run src/pages/redaksi/leksikon/RelasiAdmin.jsx

# Fase 5: Test migrasi + jembatan
cd backend && node temp_migrasi_tesaurus.js
curl http://localhost:3000/api/publik/tesaurus/besar  # cek data diperkaya
```

## File Kunci yang Perlu Dirujuk
- `docs/data/struktur.sql` — skema lengkap saat ini
- `backend/models/modelTesaurus.js` — pola model yang harus diikuti
- `backend/db/index.js` — query builder & raw query
- `backend/routes/publik/tesaurus.js` — pola router publik
- `backend/routes/redaksi/tesaurus.js` — pola router admin
- `frontend/src/pages/publik/kamus/Tesaurus.jsx` — pola halaman publik
- `frontend/src/pages/redaksi/leksikon/TesaurusAdmin.jsx` — pola halaman admin
- `_data/wordnet/ekstrak-relasi.js` — definisi 26 tipe relasi (baris 22-52)
- `_data/wordnet/wn-ind-relasi.tab` — data relasi WordNet
- `_data/wordnet/wn-ind-lemma.tab` — data lemma WordNet
