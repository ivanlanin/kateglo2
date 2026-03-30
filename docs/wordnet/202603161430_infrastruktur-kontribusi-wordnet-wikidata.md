# Infrastruktur Kontribusi Dua Arah: Kateglo ↔ WordNet & Wikidata

## Konteks

Kateglo ingin menjadi **konsumen sekaligus kontributor** data leksikal terbuka:

1. **Mengimpor** data WordNet dan Wikidata untuk memperkaya relasi kata di Kateglo
2. **Mengekspor** hasil kurasi redaksi Kateglo kembali ke OEWN dan Wikidata

Ini membutuhkan infrastruktur pelacakan asal-usul data (provenance), pemetaan ID lintas sistem, dan mekanisme ekspor yang sesuai format masing-masing proyek.

---

## Pemetaan Antar Sistem

### ID dan Entitas

| Konsep | Kateglo | WordNet (WN 3.0) | OEWN 2024 | Wikidata |
|--------|---------|-------------------|-----------|----------|
| Kata/lema | `entri.id` + `entri.entri` | offset+lemma | `LexicalEntry` id | `L-id` (Lexeme) |
| Makna | `makna.id` | synset offset | `Synset` id + `Sense` id | `L-id-S-id` (Sense) |
| Relasi | `tesaurus` (flat text) | pointer dalam `data.*` | `SynsetRelation` | `P5972` (translation), dll. |
| Bentuk kata | — (belum ada) | — | — | `L-id-F-id` (Form) |
| Kelas kata | `makna.kelas_kata` (teks) | POS code (n/v/a/r/s) | `partOfSpeech` | `lexicalCategory` (Q-id) |

### Rantai Pemetaan ID

```
Kateglo entri.id
    ↕ (tabel pemetaan baru)
WN 3.0 synset offset (00001740-a)
    ↓ via ILI (ili-map-pwn30.tab, 117.659 pemetaan)
OEWN 2024 synset id (oewn-00001740-a)
    ↕ via P8814 (WordNet 3.1 Synset ID) — saat ini 0 entri Indonesia
Wikidata Lexeme (L6588)
    ↕ via P5137 (item for this sense) — saat ini 758 entri Indonesia
Wikidata Item (Q-id, knowledge graph)
```

**Fakta penting:**
- Data Indonesia berbasis **WN 3.0** (42.937 synset, 100% cocok)
- WN 3.0 → OEWN 2024 terpetakan **90,8%** via ILI
- Wikidata **belum punya** tautan WordNet untuk leksem Indonesia (P8814 = 0)
- Ini adalah peluang kontribusi besar dari Kateglo

---

## Skema Database Tambahan

### Tabel `pemetaan_eksternal`

Tabel sentral untuk melacak tautan antara entitas Kateglo dan sistem eksternal.

```sql
CREATE TABLE pemetaan_eksternal (
  id            SERIAL PRIMARY KEY,
  entitas_tipe  TEXT NOT NULL,                -- 'entri', 'makna', 'sinset'
  entitas_id    INTEGER NOT NULL,             -- ID di tabel Kateglo
  sistem        TEXT NOT NULL,                -- 'wn30', 'oewn2024', 'wikidata', 'ili'
  id_eksternal  TEXT NOT NULL,                -- '00001740-a', 'oewn-00001740-a', 'L6588', 'i1'
  yakin         SMALLINT NOT NULL DEFAULT 50, -- 0-100, tingkat keyakinan pemetaan
  arah_sinkron  TEXT NOT NULL DEFAULT 'impor', -- 'impor', 'ekspor', 'dua_arah'
  status        TEXT NOT NULL DEFAULT 'draf',  -- 'draf', 'terverifikasi', 'diekspor', 'ditolak'
  catatan       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    INTEGER REFERENCES pengguna(id),
  UNIQUE (entitas_tipe, entitas_id, sistem, id_eksternal)
);

CREATE INDEX idx_pe_entitas ON pemetaan_eksternal (entitas_tipe, entitas_id);
CREATE INDEX idx_pe_sistem ON pemetaan_eksternal (sistem, id_eksternal);
CREATE INDEX idx_pe_status ON pemetaan_eksternal (status);
```

### Tabel `riwayat_sinkron`

Log setiap operasi impor/ekspor untuk audit dan rollback.

```sql
CREATE TABLE riwayat_sinkron (
  id          SERIAL PRIMARY KEY,
  sistem      TEXT NOT NULL,                -- 'wn30', 'oewn2024', 'wikidata'
  operasi     TEXT NOT NULL,                -- 'impor', 'ekspor'
  ringkasan   JSONB NOT NULL,              -- { total, berhasil, gagal, dilewati }
  detail      JSONB,                       -- Array entitas yang diproses
  catatan     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  INTEGER REFERENCES pengguna(id)
);
```

### Perluasan Tabel yang Ada

```sql
-- Tambah kolom pelacakan sumber di tabel sinset (dari rencana sebelumnya)
-- Kolom 'sumber' sudah direncanakan di sinset dan sinset_lema

-- Tambah kolom di tabel makna untuk tautan ke sinset
ALTER TABLE makna ADD COLUMN sinset_id TEXT REFERENCES sinset(id);
-- Memungkinkan makna Kateglo ditautkan ke synset WordNet
```

---

## Alur Kerja Kontribusi

### A. Impor: WordNet → Kateglo

```
┌─────────────────────────────────────────────────┐
│ 1. Baca file tab WordNet Indonesia              │
│    (wn-ind-lemma.tab, wn-ind-def.tab,           │
│     wn-ind-relasi.tab)                          │
│                                                 │
│ 2. Buat sinset + sinset_lema + relasi_sinset    │
│                                                 │
│ 3. Cocokkan lema dengan entri Kateglo           │
│    → entri.indeks = LOWER(lema)                 │
│    → jika cocok: sinset_lema.terverifikasi=TRUE │
│                                                 │
│ 4. Catat di pemetaan_eksternal                  │
│    entitas_tipe='sinset', sistem='wn30'         │
│                                                 │
│ 5. Resolusi ILI → catat juga pemetaan OEWN      │
│    sistem='oewn2024', sistem='ili'              │
└─────────────────────────────────────────────────┘
```

### B. Impor: Wikidata → Kateglo

```
┌─────────────────────────────────────────────────┐
│ 1. Query SPARQL: leksem Indonesia + forms       │
│    + senses + glosses                           │
│                                                 │
│ 2. Cocokkan dengan entri Kateglo                │
│    → LOWER(wikidata.lemma) = entri.indeks       │
│                                                 │
│ 3. Impor data yang belum ada:                   │
│    - Gloss Indonesia → suplemen definisi        │
│    - Forms (me-, di-, ter-) → data morfologi    │
│    - P5137 item links → untuk terjemahan        │
│                                                 │
│ 4. Catat di pemetaan_eksternal                  │
│    entitas_tipe='entri', sistem='wikidata',     │
│    id_eksternal='L6588'                         │
└─────────────────────────────────────────────────┘
```

### C. Kurasi di Kateglo

```
┌─────────────────────────────────────────────────┐
│ Redaksi Kateglo bekerja di admin panel:         │
│                                                 │
│ 1. Verifikasi pemetaan sinset ↔ makna           │
│    - Apakah synset WordNet cocok dengan makna   │
│      yang ada di Kateglo?                       │
│    - Pisahkan makna campur Melayu vs Indonesia   │
│    - Tandai status: draf → terverifikasi        │
│                                                 │
│ 2. Perkaya data                                 │
│    - Tambah definisi Indonesia yang belum ada    │
│    - Tambah contoh kalimat                      │
│    - Koreksi relasi yang keliru                 │
│    - Tambah relasi baru antar sinset             │
│                                                 │
│ 3. Tandai data siap ekspor                      │
│    - status pemetaan: terverifikasi → diekspor  │
└─────────────────────────────────────────────────┘
```

### D. Ekspor: Kateglo → OEWN

**Target kontribusi:**
- Definisi bahasa Indonesia yang sudah dikurasi
- Relasi baru yang ditemukan saat kurasi
- Perbaikan relasi yang keliru

**Format dan proses:**
1. Ekspor data ke format WN-LMF XML sesuai [FORMAT.md](https://github.com/globalwordnet/english-wordnet/blob/main/FORMAT.md)
2. Buat Pull Request ke repositori [globalwordnet/english-wordnet](https://github.com/globalwordnet/english-wordnet)
3. Perubahan kecil dan inkremental (sesuai pedoman kontribusi OEWN)
4. Sertakan komentar yang mencantumkan anggota synset target

**Pedoman OEWN:**
- Fork → edit `wn.xml` → validasi dengan `xmllint` + `validate.py` → PR
- Perubahan kecil dan inkremental
- Respons dalam 3 hari kerja
- Tidak menerima hasil otomatis tanpa validasi manual
- Tag issue: `definition`, `add relation`, `change relation`, `new synset`, dll.
- Synset baru: gunakan `ili="in"` dan offset mulai "2..."

**Catatan:** OEWN berfokus pada data bahasa Inggris. Kontribusi definisi Indonesia lebih tepat ke proyek OMW/Bahasa Wordnet. Tapi perbaikan relasi synset (yang universal lintas bahasa) bisa langsung ke OEWN.

### E. Ekspor: Kateglo → Wikidata

**Target kontribusi (peluang besar):**
- Menambahkan **P8814** (WordNet 3.1 Synset ID) ke leksem Indonesia → saat ini 0 entri
- Menambahkan gloss/definisi Indonesia ke sense yang belum ada
- Menambahkan forms (morfologi) baru
- Menambahkan P5137 (item for this sense) untuk menghubungkan ke knowledge graph

**Property Wikidata yang relevan:**

| Property | Nama | Kegunaan |
|----------|------|----------|
| P5137 | item for this sense | Tautan sense → item Wikidata (Q-id) |
| P5972 | translation | Tautan sense → sense bahasa lain |
| P8814 | WordNet 3.1 Synset ID | Tautan ke Princeton WordNet |
| P5191 | derived from lexeme | Etimologi/turunan |
| P5831 | usage example | Contoh pemakaian |
| P5185 | lexicographical data item has form | Bentuk kata |

**Format dan proses:**
1. Gunakan Wikidata API (`wbeditentity`) atau QuickStatements untuk edit massal
2. Untuk kontribusi massal: ajukan persetujuan bot di Wikidata Project Chat
3. Setiap edit harus menyertakan sumber (referensi)
4. Rate limiting: hormati batas API Wikidata

**Contoh payload API (tambah P8814 ke sense):**
```json
{
  "action": "wbsetclaim",
  "entity": "L6588",
  "snaktype": "value",
  "property": "P8814",
  "value": "\"02672831-v\""
}
```

---

## Contoh Alur Lengkap: Kata "makan"

```
1. IMPOR WordNet
   - Synset 02672831-v ada di WN 3.0 dengan lema Indonesia "makan"
   - Buat sinset '02672831-v' di Kateglo
   - Catat pemetaan: sinset→wn30→02672831-v
   - Via ILI i37800 → catat juga: sinset→oewn2024→oewn-02672831-v

2. IMPOR Wikidata
   - L6588 = "makan" (bahasa Indonesia)
   - Sense L6588-S1: "mengunyah dan menelan sesuatu ke dalam mulut"
   - Forms: makan, memakan, dimakan, termakan
   - Catat pemetaan: entri→wikidata→L6588

3. COCOKKAN
   - entri Kateglo "makan" (id=X) ↔ sinset 02672831-v
   - makna "mengunyah dan menelan makanan" ↔ L6588-S1
   - Redaksi verifikasi → status: terverifikasi

4. KURASI
   - Redaksi menambah definisi Indonesia yang lebih baik
   - Redaksi menambah relasi: makan → hiponim → menyantap, melahap
   - Redaksi menambah contoh: "Anak itu makan nasi dengan lahap"

5. EKSPOR ke Wikidata
   - Tambah P8814 = "02672831-v" ke L6588-S1
   - Tambah P5831 = contoh kalimat baru
   - Catat di riwayat_sinkron

6. EKSPOR ke OEWN (jika ada perbaikan relasi)
   - Buat PR ke globalwordnet/english-wordnet
   - Format WN-LMF XML
```

---

## Arsitektur Teknis

### Modul Backend Baru

```
backend/
├── models/
│   ├── modelSinset.js         ← (dari rencana sebelumnya)
│   └── modelPemetaan.js       ← CRUD pemetaan_eksternal + riwayat_sinkron
│
├── services/
│   ├── layananImporWordnet.js  ← Baca file tab → INSERT sinset + pemetaan
│   ├── layananImporWikidata.js ← Query SPARQL → INSERT pemetaan + suplemen
│   ├── layananEksporOewn.js    ← Query sinset terverifikasi → WN-LMF XML
│   └── layananEksporWikidata.js← Query pemetaan siap ekspor → API calls
│
├── routes/
│   └── redaksi/
│       ├── pemetaan.js         ← CRUD pemetaan + verifikasi
│       └── sinkron.js          ← Trigger impor/ekspor + lihat riwayat
│
└── scripts/
    ├── impor-wordnet.js        ← CLI: node scripts/impor-wordnet.js
    ├── impor-wikidata.js       ← CLI: node scripts/impor-wikidata.js
    ├── ekspor-oewn.js          ← CLI: node scripts/ekspor-oewn.js
    └── ekspor-wikidata.js      ← CLI: node scripts/ekspor-wikidata.js
```

### Halaman Admin Baru

```
frontend/src/pages/redaksi/
└── leksikon/
    ├── SinsetAdmin.jsx         ← Kelola sinset + lema + relasi
    ├── PemetaanAdmin.jsx       ← Verifikasi pemetaan Kateglo ↔ eksternal
    └── SinkronAdmin.jsx        ← Trigger impor/ekspor + lihat riwayat
```

---

## Fase Implementasi

| Fase | Deskripsi | Prasyarat |
|------|-----------|-----------|
| **0** | Tabel sinset + tipe_relasi + relasi_sinset (rencana sebelumnya, fase 1) | — |
| **1** | Tabel pemetaan_eksternal + riwayat_sinkron | Fase 0 |
| **2** | Script impor WordNet + catat pemetaan | Fase 1 |
| **3** | Script impor Wikidata (SPARQL → pemetaan) | Fase 1 |
| **4** | Admin: halaman verifikasi pemetaan | Fase 2 + 3 |
| **5** | Script ekspor Wikidata (tambah P8814 + gloss) | Fase 4 |
| **6** | Script ekspor OEWN (WN-LMF XML) | Fase 4 |
| **7** | Admin: trigger impor/ekspor dari UI | Fase 5 + 6 |

---

## Peluang Kontribusi Unik Kateglo

Kateglo berada di posisi unik karena memiliki data kamus Indonesia yang sudah dikurasi manusia. Kontribusi potensial:

### Ke Wikidata (dampak tinggi, proses mudah)
1. **P8814 untuk 20.861 leksem** — Saat ini 0 leksem Indonesia punya tautan WordNet. Ini kontribusi massal yang sangat bernilai.
2. **Gloss Indonesia** — Hanya 1.500 dari 20.861 leksem punya definisi. Kateglo punya ribuan definisi yang bisa disumbangkan.
3. **Forms/morfologi** — Kateglo punya data pemenggalan dan varian yang bisa memperkaya forms Wikidata.

### Ke OEWN / OMW (dampak tinggi, proses lebih formal)
1. **Definisi Indonesia** — Hanya 31% synset WN 3.0 punya definisi Indonesia. Kateglo bisa menambah.
2. **Filter Melayu vs Indonesia** — Data WN-MSA mencampur kedua bahasa. Kateglo bisa membantu memisahkan.
3. **Relasi baru** — Relasi antar-kata yang ditemukan saat kurasi bisa disumbangkan.

### Dari Wikidata (menguntungkan Kateglo)
1. **Morfologi** (me-, di-, ter-, ber-) — Data forms yang Kateglo belum punya
2. **Terjemahan multibahasa** via P5972 dan knowledge graph
3. **Tautan ke ensiklopedia** via P5137 → item Wikidata

---

## Strategi Engagement Komunitas

Kontribusi massal membutuhkan koordinasi dengan komunitas terkait agar diterima dengan baik.

### OEWN / OMW

1. **Buka issue di GitHub** — jelaskan rencana perluasan cakupan bahasa Indonesia, tautkan ke metodologi
2. **Mulai kecil** — kirim PR pertama berisi 50-100 perbaikan definisi/relasi, bangun kepercayaan
3. **Gunakan format yang benar** — WN-LMF XML untuk OEWN, tab-separated untuk OMW/wn-msa
4. **Dokumentasikan metodologi** — bagaimana data divalidasi, sumber apa yang digunakan
5. **Pertimbangkan publikasi** — integrasi korpus + WordNet bisa layak paper di venue linguistik komputasional

### Wikidata

1. **Mulai dengan akun bot** — ajukan di [Wikidata:Requests for permissions/Bot](https://www.wikidata.org/wiki/Wikidata:Requests_for_permissions/Bot)
2. **Diskusi di Project Chat** — beritahu komunitas rencana penambahan P8814 massal
3. **Batch kecil dulu** — 100 leksem pertama, tunggu review, baru skalakan
4. **Sertakan referensi** — setiap edit harus menyertakan sumber (Kateglo, KBBI, dsb.)
5. **Koordinasi dengan komunitas Wikimedia Indonesia** — mungkin ada kontributor aktif yang bisa membantu

---

## Referensi

- [OEWN Contributing Guide](https://github.com/globalwordnet/english-wordnet/blob/main/CONTRIBUTING.md)
- [WN-LMF Format](https://github.com/globalwordnet/english-wordnet/blob/main/FORMAT.md)
- [CILI — Collaborative Interlingual Index](https://github.com/globalwordnet/cili)
- [ILI mapping WN 3.0](https://github.com/globalwordnet/ili/blob/master/ili-map-pwn30.tab)
- [OMW — Open Multilingual Wordnet](https://github.com/globalwordnet/OMW)
- [Wikidata Lexicographical Data](https://www.wikidata.org/wiki/Wikidata:Lexicographical_data)
- [Wikidata API — wbeditentity](https://www.wikidata.org/w/api.php?action=help&modules=wbeditentity)
- [Wikidata Bot Policy](https://www.wikidata.org/wiki/Wikidata:Bots)
- Rencana model relasi: `docs/202603/202603161259_rencana-model-relasi-wordnet.md`

## File Data Lokal

| File | Isi | Baris |
|------|-----|------:|
| `_data/wordnet/wn-ind-lemma.tab` | Lema Indonesia ↔ synset WN 3.0 | 398.874 |
| `_data/wordnet/wn-ind-def.tab` | Definisi Indonesia per synset | 13.099 |
| `_data/wordnet/wn-ind-relasi.tab` | Relasi antar synset (26 tipe) | 88.955 |
| `_data/wordnet/wn-ind-relasi-kata.tab` | Relasi dengan kata ter-resolve | — |
| `_data/wordnet/ili-map-pwn30.tab` | Pemetaan ILI ↔ WN 3.0 | 117.659 |
| `_data/wordnet/english-wordnet-2024.xml` | OEWN 2024 lengkap (relasi + ILI) | 120.630 synset |
| `_data/wordnet/dict30/` | Princeton WN 3.0 dict files | 117.659 synset |
| `_data/wordnet/dict/` | Princeton WN 3.1 dict files | 117.791 synset |
