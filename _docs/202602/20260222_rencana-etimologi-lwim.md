# Rencana Fitur Etimologi dari LWIM (Sealang.net)

**Tanggal**: 2026-02-22
**Sumber data**: http://sealang.net/lwim/ (Loan Words in Indonesian and Malay)
**Status**: Perencanaan

---

## Temuan Awal

### Akses URL

```
GET http://sealang.net/lwim/search.pl?dict=lwim&ignoreDiacritic=1&orth=<indeks>
```

- Harus via **HTTP** (bukan HTTPS — sertifikat expired)
- Parameter `ignoreDiacritic=1` penting: query tanpa aksen tetap menemukan entri beraksen
- Response: XHTML dengan XML embedded (`<entry>`, `<etym>`, `<def>`, dll.)

### Dua Format Etimologi

**Format A — Terstruktur** (ada tag `<etym>`):
```xml
<entry orthTarget="komputer" id="LWIM:10960" hom="1">
  <def>computer</def>
  <etym><lang>English</lang> <mentioned>computer</mentioned></etym>
```

**Format B — Inline di `<def>`** (tanpa tag `<etym>`):
```xml
<entry orthTarget="véntilasi" id="LWIM:22824" hom="1">
  <def>ventilation  [&lt; Dutch <i>ventilatie</i> (&lt; French)]</def>
```

Contoh inline yang lebih kompleks (rantai):
```
bank [< Dutch bank (< Italian)]
algoritme [< Dutch algoritme (f Greek)]
per [< Dutch or < English per (< Latin)]
```

### Fitur Lain yang Ditemukan

- **Cross-reference**: `<xr type="see"><ref>fair</ref></xr>` dan `<xr type="var"><ref>pir</ref></xr>`
- **Banyak homonim**: kata "per" menghasilkan 7 entri berbeda dari sealang
- **Aksen menandakan pelafalan**: `pér` (é = taling/open-e) vs `per` (tanpa aksen = pepet/schwa)
- **Kutipan referensi**: `<cite>Monier-Williams:1098.2</cite>` — bibliografi sumber etimologi
- **Aksara non-Latin**: `<ming>四</ming>` — untuk entri dari bahasa Tionghoa (Amoy/Hokkien)

---

## Masalah Utama: Pencocokan (Matching)

### Penanda Lafal di Sealang vs DB

Sealang menggunakan diakritik di `orthTarget` untuk membedakan lafal:

| Sealang `orthTarget` | Lafal | DB `lafal` |
|---|---|---|
| `per` (tanpa aksen) | pepet / schwa | `pər` |
| `pér` (aksen akut) | taling / open-e | `per` |

Ini **terbalik secara visual**: sealang tanpa aksen = pepet, sealang `é` = taling.

### Masalah Penomoran Homonim

Nomor `hom` di sealang **tidak selalu sama** dengan `homonim` di tabel `entri`.

Contoh "per" di DB (jenis=dasar):

| id    | homonim | homograf | lafal |
|-------|---------|----------|-------|
| 28615 | 1       | 1        | per   |
| 28616 | 2       | 1        | per   |
| 28617 | 3       | 1        | per   |
| 28608 | 1       | 2        | pər   |
| 28609 | 2       | 2        | pər   |
| 28610 | 3       | 2        | pər   |
| 28611 | 4       | 3        | null  |
| 28612 | 5       | 3        | null  |

Sealang "per" (pepet, no diacritic) → hom 1,2,3
Sealang "pér" (taling, aksen) → hom 1,2,3,4

Relasi homonim antar sistem tidak bisa dicocokkan otomatis berdasarkan urutan saja.

### Masalah Kualitas Data di Sealang Sendiri

Dari pengujian kata-kata dengan banyak variasi, ditemukan bahwa sealang kadang punya
**nomor `hom` duplikat** untuk `orthTarget` yang sama:

| Kata | LWIM IDs | `hom` | Keterangan |
|---|---|---|---|
| `para` | LWIM:15668, LWIM:15669 | keduanya `hom="1"` | sentry vs. karet para |
| `kala` | LWIM:9403, LWIM:9404 | keduanya `hom="1"` | waktu vs. xr ke "kada" |
| `si` | LWIM:19461, LWIM:19462 | keduanya `hom="1"` | empat (Amoy) vs. nada musik (Dutch) |

Artinya `lwim_id` adalah pengidentifikasi unik yang sesungguhnya, **bukan** kombinasi `orthTarget + hom`.

### Banyak Entri DB Tanpa Penanda Lafal

Dari pengujian, banyak entri dengan `homograf=null` dan `lafal=null` (contoh: `kala`, `si`, `para`).
Matching berbasis lafal hanya bisa dilakukan untuk sebagian kecil entri.

### Kesimpulan Matching

Pencocokan otomatis **satu entri sealang ↔ satu entri DB** berisiko salah.
Pendekatan yang aman:
1. Simpan data mentah sealang, kunci unik adalah `lwim_id` (bukan kombinasi orthTarget+hom)
2. Sediakan kolom `entri_id` sebagai **optional foreign key** untuk link manual ke entri spesifik
3. Matching otomatis hanya untuk kasus sederhana: indeks unik + sealang hanya 1 hasil + lafal cocok
4. Kasus ambigu → biarkan `entri_id` null, tampilkan di antarmuka redaksi untuk review manual

---

## Desain Tabel

```sql
create table etimologi (
  id serial primary key,

  -- Tautan ke entri (opsional, bisa null untuk data mentah)
  entri_id integer references entri(id) on delete set null,

  -- Data dari sealang LWIM
  lwim_id text not null,           -- e.g., "LWIM:22824" — UNIQUE, bukan orthTarget+hom
  lwim_orth text not null,         -- orthTarget dengan diakritik, e.g., "véntilasi"
  lwim_hom integer,                -- nomor hom dari sealang (BISA duplikat per orthTarget)
  lwim_cite text,                  -- kutipan referensi, e.g., "Monier-Williams:1098.2"
  aksara_asal text,                -- aksara non-Latin jika ada, e.g., "四" (untuk Tionghoa)

  -- Data etimologi yang sudah diparsing
  bahasa_asal text,                -- e.g., "Dutch", "English", "Portuguese"
  kata_asal text,                  -- e.g., "ventilatie", "kantoor"
  bahasa_antara text,              -- bahasa perantara jika ada, e.g., "French"
  kata_antara text,                -- kata dalam bahasa perantara
  rantai_lengkap text,             -- teks rantai asli, e.g., "< Dutch ventilatie (< French)"

  -- Data tambahan
  definisi_en text,                -- definisi bahasa Inggris dari sealang
  xr_lihat text,                   -- cross-ref "see", e.g., "fair"
  xr_varian text,                  -- cross-ref "var", e.g., "pir"
  catatan text,                    -- catatan tambahan dari redaksi

  -- Metadata
  sumber text not null default 'lwim',
  aktif integer not null default 1,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create index idx_etimologi_entri_id on etimologi using btree (entri_id);
create index idx_etimologi_lwim_id on etimologi using btree (lwim_id);
create unique index idx_etimologi_lwim_id on etimologi using btree (lwim_id);
-- Catatan: lwim_id sudah unik sendiri (LWIM:xxxxx), tidak perlu lwim_id+hom karena hom bisa duplikat
```

---

## Rencana Implementasi

### Fase 1: Skrip Scraper (Backend)

File: `backend/scripts/scrapeEtimologi.js`

```
Algoritme:
1. Ambil semua indeks unik dari entri WHERE jenis = 'dasar'
   (±10.000 indeks unik)
2. Untuk setiap indeks:
   a. GET http://sealang.net/lwim/...?orth=<indeks>
   b. Jika "Nothing found" → skip
   c. Parse semua <entry> dalam response
   d. Parse etimologi dari <etym> atau dari <def> (regex)
   e. Simpan ke tabel etimologi (upsert by lwim_id)
3. Rate limiting: delay 500ms antar request
4. Retry sekali untuk error jaringan
5. Log progress ke file
```

### Fase 2: Matching Heuristik

Setelah scraping, jalankan matching otomatis hanya untuk kasus yang jelas:

```
Kasus auto-match (set entri_id otomatis):
  - indeks hanya punya 1 entri di DB (jenis=dasar) DAN sealang hanya 1 result → langsung link
  - Jika DB punya lafal: konversi diakritik sealang → lafal IPA, cocokkan dengan entri.lafal
    Contoh: lwim_orth="séri" → taling → cocok dengan entri.lafal="seri" (bukan "səri")

Kasus butuh review manual (entri_id = null):
  - Sealang punya duplikat hom untuk orthTarget yang sama
  - DB punya banyak homonim tapi lafal=null semua
  - Jumlah hasil sealang != jumlah entri di DB untuk indeks tersebut

Konversi diakritik sealang → lafal DB:
  - orthTarget tanpa aksen → pepet (schwa) → cocok dengan lafal "...ə..."
  - orthTarget dengan é (akut) → taling → cocok dengan lafal "...e..." (tanpa ə)
```

### Fase 3: Frontend

- Tampilkan blok etimologi di halaman kamus detail
- Format: "Dari bahasa Belanda *kantoor*" atau "Dari bahasa Portugis *escola* (berasal dari Latin)"
- Khusus kata tanpa `entri_id` → tidak ditampilkan ke publik (aktif=0)

---

## Estimasi Data

| Kategori | Estimasi |
|---|---|
| Total entri unik (indeks) | ~30.000 |
| Entri jenis `dasar` | ~25.000 |
| Perkiraan hit di sealang | ~5.000–8.000 |
| Request ke sealang | ~25.000 (dengan gap untuk "not found") |
| Waktu scraping (500ms delay) | ~3–4 jam |

---

## Catatan Penting

- Sealang hanya memiliki **kata serapan** — bukan semua entri kamus akan ditemukan
- Kata-kata asli Melayu/Jawa/daerah → "Nothing found" → skip
- Data LWIM memiliki lisensi akademik — gunakan untuk referensi, bukan redistribusi mentah
- Perlu konfirmasi: apakah sealang punya endpoint bulk/API atau hanya per-kata?
