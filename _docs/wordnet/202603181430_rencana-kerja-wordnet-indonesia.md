# Rencana Kerja: Membangun WordNet Indonesia di Kateglo

> Dokumen kerja — diperbarui seiring pengerjaan agar bisa dilanjutkan lintas sesi.

## Konteks

WordNet Indonesia (wordnetid) pernah dikerjakan bertahun-tahun lalu tapi belum selesai.
Data sumbernya campur Melayu/Indonesia (label "B" = Both mendominasi 91.6%).
Tujuan akhir: data WordNet yang bersih, mutakhir, dan terhubung langsung ke kamus Kateglo.

## Hasil Statistik Awal (2026-03-18)

| Metrik | Nilai |
|--------|-------|
| Synset di wordnetid | 42,937 |
| Kata unik | 41,492 |
| Kata cocok entri Kateglo | 19,494 (47.0%) |
| Kata tidak cocok (Melayu/langka) | 21,998 (53.0%) |
| Synset dengan >= 1 kata di Kateglo | 34,941 (81.4%) |
| Synset dengan kata bermakna | 34,726 (80.9%) |
| Synset dengan definisi Indonesia | 13,093 (30.5%) |
| Relasi | 88,955 (26 tipe) |
| Coverage ILI (WN30 → lintas bahasa) | 86.1% |
| Entri aktif Kateglo | 92,010 |
| Makna aktif Kateglo | 109,008 |

Skrip statistik: `_data/wordnet/statistik.js`

## Skenario Besar

```
WN30 Inggris (117K synset)        ← kerangka dasar, definisi Inggris
       ↓
+ wordnetid (43K synset)          ← overlay kata Indonesia/Melayu
       ↓
Filter: cocokkan dengan entri     ← buang kata Melayu, sisakan yang ada di Kateglo
       ↓
Upgrade ke OEWN 2024 via ILI      ← mutakhirkan ke versi terbaru
       ↓
Pemetaan synset → makna.id        ← hubungkan ke kamus lewat kelas_kata + kecocokan definisi
       ↓
Kurasi manual di halaman redaksi  ← verifikasi & perkaya oleh manusia
```

## Pemetaan Kelas Kata

| Kateglo `makna.kelas_kata` | WordNet POS | Kode WN |
|---------------------------|-------------|---------|
| nomina | Noun | n |
| verba | Verb | v |
| adjektiva | Adjective | a (termasuk s = satelit adj) |
| adverbia | Adverb | r |
| pronomina, numeralia, dll. | — | Tidak ada padanan langsung di WN |

Hanya **4 kelas utama** (nomina, verba, adjektiva, adverbia) yang bisa langsung dipetakan.

## Format Data Sumber

### ili-map-pwn30.tab
```
i1    00001740-a       ← ILI ID → WN30 synset offset-POS
i2    00002098-a
```
117,659 pemetaan. ILI adalah pivot antar-versi WordNet.

### OEWN 2024 (english-wordnet-2024.xml)
Format WN-LMF. Synset ID: `oewn-XXXXXXXX-POS`. Perlu diekstrak ILI reference dari XML
untuk menghubungkan ke WN30.

### WN30 data files (data.noun, data.verb, dll.)
```
00001740 03 n 01 entity 0 003 ~ 00001930 n 0000 ... | that which is perceived...
```
Berisi: offset, POS, lemma, pointer/relasi, definisi Inggris.

### wordnetid (wn-ind-*.tab)
Synset ID menggunakan format WN30: `00001740-a`. Jadi langsung bisa di-join.

---

## Tahap Kerja

### Tahap 0: Persiapan Data [SELESAI]
- [x] Reorganisasi folder `_data/wordnet/` ke subfolder
- [x] Skrip statistik dasar (`statistik.js`)
- [x] Dokumentasi rencana kerja (dokumen ini)

### Tahap 1: Bangun Kerangka Bersih [SELESAI]
**Tujuan:** Buat dataset bersih dari WN30 + wordnetid, buang data Melayu.

#### 1a. `bangun-kerangka.js` [SELESAI]
- Parse WN30 data files → 117,660 synset + definisi Inggris + relasi
- Overlay kata Indonesia dari wn-ind-lemma.tab (42,937 synset)
- Filter kata terhadap `entri.indeks` di DB Kateglo
- Baca ILI mapping (117,659 entries)
- **Hasil:** 30,053 synset kerangka utama (punya ≥1 kata Indonesia cocok di DB)

#### 1b. `cocokkan-makna.js` [SELESAI]
- Pencocokan synset → `makna.id` via `entri.indeks` + `makna.kelas_kata`
- Kode kelas kata di DB: `n`, `v`, `a`, `adv` (bukan nama lengkap)
- **Hasil:**

| Kategori | Jumlah | % |
|----------|--------|---|
| Otomatis (1 makna cocok POS) | 3,827 | 12.7% |
| Kandidat (>1 makna, perlu kurasi) | 20,308 | 67.6% |
| Tanpa makna cocok POS | 5,918 | 19.7% |

Per kelas kata:
| Kelas kata | Otomatis | Kandidat | Tanpa | Total |
|------------|----------|----------|-------|-------|
| nomina | 2,644 | 12,699 | 2,137 | 17,480 |
| verba | 855 | 6,676 | 1,662 | 9,193 |
| adjektiva | 223 | 684 | 1,067 | 1,974 |
| adverbia | 105 | 249 | 1,052 | 1,406 |

**Output Tahap 1:**
```
_data/wordnet/output/
  kerangka-synset.json         ← 30,053 synset (def EN + kata ID bersih + relasi + ILI)
  synset-belum-indonesia.json  ← 80,699 synset WN30 tanpa kata Indonesia
  pemetaan-otomatis.json       ← 3,827 synset → makna.id (1:1 cocok)
  pemetaan-kandidat.json       ← 20,308 synset dengan >1 kandidat makna
  pemetaan-tanpa-makna.json    ← 5,918 synset tanpa makna cocok POS
  statistik-kerangka.json      ← ringkasan angka
```

### Tahap 2: Skema Database [SELESAI]
**Tujuan:** Buat tabel di PostgreSQL untuk menyimpan data WordNet.

Migration: `_docs/wordnet/202603181840_sinset-tabel-baru.sql`

4 tabel dibuat:
- `tipe_relasi` — 26 tipe relasi dalam 5 kategori (dengan kebalikan + simetris)
- `sinset` — unit makna, ID = WN30 format (`00001740-n`), menyimpan EN + ID
  - `lema_en TEXT[]`, `definisi_en`, `contoh_en TEXT[]` — Inggris sebagai rujukan
  - `definisi_id`, `contoh_id TEXT[]` — Indonesia
  - `kelas_kata` pakai kode singkat (`n`, `v`, `a`, `r`) konsisten dgn `makna.kelas_kata`
  - `ili_id` — pivot ke OEWN 2024
  - `status` — draf/tinjau/terverifikasi
- `sinset_lema` — hubungan synset ↔ kata Indonesia ↔ entri.id ↔ makna.id
- `relasi_sinset` — relasi antar-synset dengan referensi ke tipe_relasi

### Tahap 3: Impor Data ke Database [SELESAI]
Skrip: `_data/wordnet/impor-ke-db.js`

| Data | Jumlah |
|------|--------|
| Synset (kerangka + belum ID) | 110,752 |
| Synset dengan definisi Indonesia | 2,733 (status: tinjau) |
| Lema Indonesia | 225,246 |
| Lema → entri_id (terhubung) | 225,246 (100%) |
| Lema → makna_id (otomatis) | 3,832 |
| Relasi antar-synset | 101,256 |

Status awal: 108,019 draf + 2,733 tinjau (punya definisi ID)

### Tahap 4: Halaman Redaksi untuk Kurasi
**Tujuan:** Antarmuka untuk verifikasi manual oleh redaksi.

Fitur utama:
- **Daftar synset** — filter berdasarkan status, kelas kata, ada/tidaknya pemetaan
- **Detail synset** — tampilkan definisi EN/ID, kata-kata, relasi, dan kandidat makna Kateglo
- **Pemetaan** — pilih makna.id yang cocok untuk setiap kata dalam synset
- **Progres** — dashboard: berapa synset draf/tinjau/terverifikasi per kelas kata

Pelacakan progres:
```
                    Total    Draf    Tinjau    Terverifikasi
  nomina           22,090      ?        ?              ?
  verba            10,069      ?        ?              ?
  adjektiva         8,897      ?        ?              ?
  adverbia          1,881      ?        ?              ?
  ─────────────────────────────────────────────────────
  Total            42,937
```

### Tahap 5: Upgrade ke OEWN 2024
- Parse english-wordnet-2024.xml
- Petakan via ILI: WN30 synset → ILI → OEWN2024 synset
- Update definisi Inggris yang berubah
- Tambah synset baru yang belum ada di WN30

### Tahap 6: Kontribusi Balik
- Ekspor definisi Indonesia yang sudah terverifikasi ke format WN-LMF
- Kontribusi ke Open Multilingual Wordnet / OEWN

---

## Cara Melacak Perkembangan

1. **Di database** — kolom `status` pada tabel `sinset` (draf → tinjau → terverifikasi)
2. **Di halaman redaksi** — dashboard statistik real-time
3. **Di dokumen ini** — checklist per tahap, diperbarui tiap sesi kerja

## Urutan Pengerjaan Berikutnya

Tahap 1 dipecah menjadi langkah kecil yang bisa dikerjakan per sesi:

- [x] 1a. `bangun-kerangka.js` — 30,053 synset kerangka bersih
- [x] 1b. `cocokkan-makna.js` — 3,827 otomatis + 20,308 kandidat + 5,918 tanpa makna
- [ ] 1c. Review output, cek kualitas pemetaan dengan sampel manual
- [x] 2a. SQL migration: `_docs/wordnet/202603181840_sinset-tabel-baru.sql`
- [x] 2b. Eksekusi migration + seed 26 tipe relasi — berhasil
- [x] 3a. Impor 110,752 synset + 225,246 lema + 3,832 pemetaan otomatis
- [x] 3b. Impor 101,256 relasi antar-synset
- [ ] 4a. Backend: model + route untuk WordNet (GET/PUT synset, statistik)
- [ ] 4b. Frontend: halaman redaksi WordNet (daftar, detail, pemetaan)

---

*Dokumen ini diperbarui seiring pengerjaan. Cek checklist di atas untuk status terkini.*
