# Arsitektur Baru Kateglo 2.0

Tanggal: 2026-02-14

## Ringkasan

Kateglo 2.0 dirombak dari skema database lama (22 tabel warisan PHP) ke skema baru yang mengikuti struktur `kbbi.db`. Navigasi diubah menjadi 3 fitur utama: **Kamus**, **Tesaurus**, **Glosarium**. Routing diubah dari query string ke path-based.

---

## Struktur Data

### Tabel Inti (dari kbbi.db)

#### label
Tabel rujukan gabungan untuk ragam, kelas kata, bahasa, dan bidang.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | SERIAL PK | |
| kategori | TEXT NOT NULL | 'ragam', 'kelas_kata', 'bahasa', 'bidang' |
| kode | TEXT NOT NULL | Kode singkat (misal: 'n', 'v', 'ark') |
| nama | TEXT NOT NULL | Nama lengkap (misal: 'nomina', 'verba') |
| keterangan | TEXT | Keterangan tambahan |
| sumber | TEXT | Sumber legacy |

UNIQUE (kategori, kode)

#### lema
Tabel utama entri kamus. Mencakup kata dasar, berimbuhan, gabungan, idiom, peribahasa, dan varian.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | SERIAL PK | |
| legacy_eid | INTEGER UNIQUE | ID entri dari kbbi4.db |
| lema | TEXT NOT NULL | Teks lema |
| jenis | TEXT NOT NULL | 'dasar', 'berimbuhan', 'gabungan', 'idiom', 'peribahasa', 'varian' |
| induk | INTEGER FK→lema | Referensi ke lema induk |
| pemenggalan | TEXT | Pemenggalan suku kata |
| lafal | TEXT | Pelafalan |
| varian | TEXT | Varian lema |
| jenis_rujuk | TEXT | Tipe rujukan (→) |
| lema_rujuk | TEXT | Lema yang dirujuk |
| aktif | INTEGER NOT NULL DEFAULT 1 | Status aktif |
| legacy_tabel | TEXT | Tabel asal di kbbi4.db |
| legacy_tid | INTEGER | ID di tabel asal |

#### makna
Definisi/makna untuk setiap lema. Satu lema bisa punya banyak makna (polisemi).

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | SERIAL PK | |
| legacy_mid | INTEGER UNIQUE | ID makna dari kbbi4.db |
| lema_id | INTEGER FK→lema NOT NULL | |
| polisem | INTEGER NOT NULL DEFAULT 1 | Nomor polisemi |
| urutan | INTEGER NOT NULL DEFAULT 1 | Urutan tampil |
| makna | TEXT NOT NULL | Teks definisi |
| ragam | TEXT | Label ragam (ark, cak, dll.) |
| ragam_varian | TEXT | Varian ragam |
| kelas_kata | TEXT | Label kelas kata (nomina, verba, dll.) |
| bahasa | TEXT | Label bahasa |
| bidang | TEXT | Label bidang (Kedokteran, Matematika, dll.) |
| kiasan | INTEGER NOT NULL DEFAULT 0 | Apakah kiasan |
| tipe_penyingkat | TEXT | 'akronim', 'kependekan', 'singkatan' |
| ilmiah | TEXT | Nama ilmiah |
| kimia | TEXT | Rumus kimia |

#### contoh
Contoh penggunaan untuk setiap makna.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | SERIAL PK | |
| legacy_cid | INTEGER UNIQUE | ID contoh dari kbbi4.db |
| makna_id | INTEGER FK→makna NOT NULL | |
| urutan | INTEGER NOT NULL DEFAULT 1 | Urutan tampil |
| contoh | TEXT NOT NULL | Teks contoh |
| ragam | TEXT | Label ragam |
| bahasa | TEXT | Label bahasa |
| bidang | TEXT | Label bidang |
| kiasan | INTEGER NOT NULL DEFAULT 0 | Apakah kiasan |
| makna_contoh | TEXT | Makna dari contoh |

### Tabel Tesaurus

#### tesaurus
Gabungan data dari tabel `relation` (267K) dan `_thesaurus`.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | SERIAL PK | |
| lema | TEXT NOT NULL UNIQUE | Kata/lema |
| sinonim | TEXT | Daftar sinonim (dipisah titik koma) |
| antonim | TEXT | Daftar antonim (dipisah titik koma) |
| turunan | TEXT | Kata turunan (dipisah titik koma) |
| gabungan | TEXT | Kata gabungan (dipisah titik koma) |
| berkaitan | TEXT | Kata berkaitan (dipisah titik koma) |

### Tabel yang Dipertahankan

| Tabel | Keterangan |
|-------|------------|
| glossary | Glosarium istilah teknis bilingual (231K entri) |
| translation | Terjemahan kata |
| searched_phrase | Statistik pencarian |

### Tabel yang Dihapus

phrase, definition, proverb, abbr_entry, relation, _thesaurus, phrase_type, lexical_class, discipline, language, ref_source, relation_type, roget_class, external_ref, new_lemma, sys_comment, sys_user, sys_abbrev

---

## Alur Program

### Menu Utama

| Menu | Path | Keterangan |
|------|------|------------|
| Kamus | /kamus | Kamus bahasa Indonesia (termasuk peribahasa & singkatan) |
| Tesaurus | /tesaurus | Sinonim, antonim, dan relasi kata |
| Glosarium | /glosarium | Istilah teknis bilingual |

### Routing Frontend

```
/                           → Beranda (statistik, kata acak, populer)
/kamus                      → Landing kamus (browse A-Z)
/kamus/cari/:kata           → Hasil pencarian kamus
/kamus/detail/:entri        → Detail lema (makna, contoh, peribahasa terkait)
/tesaurus                   → Landing tesaurus
/tesaurus/cari/:kata        → Hasil pencarian tesaurus
/tesaurus/:kata             → Detail tesaurus (sinonim, antonim, dll.)
/glosarium                  → Landing glosarium (filter bidang/sumber)
/glosarium/cari/:kata       → Hasil pencarian glosarium
```

### API Backend

```
GET /api/public/beranda                 → Statistik dan data beranda
GET /api/public/kamus/cari/:kata        → Pencarian kamus
GET /api/public/kamus/detail/:entri     → Detail lema lengkap
GET /api/public/tesaurus/cari/:kata     → Pencarian tesaurus
GET /api/public/tesaurus/:kata          → Detail tesaurus
GET /api/public/glosarium               → Daftar glosarium (filter: ?bidang=&sumber=)
GET /api/public/glosarium/cari/:kata    → Pencarian glosarium
GET /api/public/glosarium/bidang        → Daftar bidang
GET /api/public/glosarium/sumber        → Daftar sumber
```

### Struktur File

```
backend/
├── models/
│   ├── modelLema.js          ← baru (ganti modelFrasa)
│   ├── modelTesaurus.js      ← baru
│   ├── modelGlosarium.js     ← tetap
│   └── modelBeranda.js       ← refaktor
├── services/
│   ├── layananKamusPublik.js  ← refaktor
│   └── layananTesaurusPublik.js ← baru
├── routes/api/public/
│   ├── kamus.js              ← refaktor
│   ├── tesaurus.js           ← baru
│   ├── glosarium.js          ← tetap
│   └── beranda.js            ← refaktor

frontend/src/
├── halaman/
│   ├── Beranda.jsx           ← refaktor
│   ├── Kamus.jsx             ← refaktor
│   ├── KamusDetail.jsx       ← refaktor
│   ├── Tesaurus.jsx          ← baru
│   ├── TesaurusDetail.jsx    ← baru
│   └── Glosarium.jsx         ← minor
├── komponen/
│   └── Navbar.jsx            ← refaktor (3 menu)
├── api/
│   └── apiPublik.js          ← refaktor
└── App.jsx                   ← refaktor routing
```

---

## Catatan Migrasi

- Data kamus diambil dari `_data/kbbi.db` (92K lema, 109K makna, 28K contoh, 205 label)
- Data tesaurus digabung dari `relation` (267K relasi) dan `_thesaurus`
- Data glosarium tetap dari tabel `glossary` yang sudah ada
- Peribahasa = lema dengan jenis='peribahasa' (2.033 entri)
- Singkatan = makna dengan tipe_penyingkat IS NOT NULL
