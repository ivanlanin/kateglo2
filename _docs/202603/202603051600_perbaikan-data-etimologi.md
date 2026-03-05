# Perbaikan Data Etimologi

**Tanggal**: 2026-03-05
**Status**: Selesai
**Dokumen terkait**:
- `_docs/202603/202603051318_audit-dan-rencana-perbaikan-tabel-etimologi.md` (rencana awal)
- `_docs/202603/202603050920_tambah-kolom-meragukan-etimologi.sql` (migrasi 1)
- `_docs/202603/202603051430_bersihkan-kata-asal-etimologi.sql` (migrasi 2)
- `_docs/202603/202603051849_rematch-homonim-etimologi.sql` (migrasi 3)
- `_docs/202603/202603051914_isi-bahasa-dari-sumber-definisi.sql` (migrasi 4)
- `_docs/202603/202603051929_isi-kata-asal-compound-aktif.sql` (migrasi 5)
- `_docs/202603/202603052000_aktifkan-compound-sejati-etimologi.sql` (migrasi 6)
- `_docs/202603/202603051849_disambiguasi-homonim-etimologi.md` (metode disambiguasi)
- `_docs/202603/202603051914_isi-bahasa-kata-asal-dari-sumber-definisi.md` (metode ekstraksi bahasa)

---

## 1. Kondisi Sebelum Perbaikan

```
Total baris    : 16.512
  aktif = TRUE :     10   ← hampir semua tersembunyi dari publik
  aktif = FALSE: 16.502
```

Masalah yang ditemukan:
- Hampir semua data etimologi tidak aktif → publik tidak bisa melihat bahasa asal kata
- Tidak ada penanda khusus untuk entri yang diragukan kebenarannya (hanya ada teks
  `(doubtful entry)` terpendam di kolom `sumber_definisi`)
- Kolom `kata_asal` mengandung campuran data bersih dan kotoran dari impor LWIM:
  referensi sumber kamus, alternatif kata, prefiks nama bahasa, notasi morfologi,
  duplikasi karakter CJK, dan sebagainya

---

## 2. Perbaikan yang Dilakukan

### 2.1 Tambah Kolom `meragukan` + Aktifkan Data Meyakinkan

**File migrasi**: `202603050920_tambah-kolom-meragukan-etimologi.sql`

Empat langkah dalam satu transaksi:

1. **Tambah kolom** `meragukan boolean NOT NULL DEFAULT false` + indeks btree
2. **Tandai doubtful**: baris dengan `(doubtful entry)` di `sumber_definisi`
   → `meragukan = true` (ditemukan 146 baris)
3. **Aktifkan data meyakinkan**: baris dengan `entri_id IS NOT NULL` dan `bahasa` terisi
   → `aktif = true`
4. **Sembunyikan kembali yang meragukan**: `meragukan = true` → `aktif = false`
   (disimpan untuk audit, tidak tampil ke publik)

Hasil awal setelah langkah ini:

```
aktif=TRUE,  meragukan=FALSE : 15.595   (meyakinkan, terhubung entri + bahasa terisi)
aktif=FALSE, meragukan=TRUE  :    146   (doubtful entry, disimpan tapi disembunyikan)
aktif=FALSE, meragukan=FALSE :    771   (orphan atau tanpa bahasa)
```

### 2.2 Koreksi Kondisi Aktif (Penyempurnaan)

Setelah analisis lebih lanjut ditemukan:
- Kondisi awal terlalu agresif karena salah menafsirkan `entri.homonim IS NULL`
  sebagai mismatch homonim. `entri.homonim IS NULL` berarti kata tunggal (bukan homonim),
  bukan kesalahan data.
- 14.499 baris diaktifkan kembali setelah dikonfirmasi valid
- 708 baris dinonaktifkan karena `bahasa` kosong

### 2.3 Disambiguasi Homonim (Rematch)

**File migrasi**: `202603051849_rematch-homonim-etimologi.sql`
**Dokumentasi metode**: `202603051849_disambiguasi-homonim-etimologi.md`

Analisis `COALESCE(en.homonim, 0)` di skrip lama menghasilkan 500 false positive.
Definisi mismatch yang benar mensyaratkan **kedua sisi** memiliki nilai homonim berbeda.
Hasil analisis ulang: hanya 1 mismatch sejati.

| Kasus | Jumlah |
|-------|--------|
| Mismatch sejati (kedua sisi homonim, nilai beda) | 1 |
| Bukan mismatch (entri.homonim IS NULL = kata tunggal) | 14.571 |

Satu kasus diselesaikan: etimologi "abah" homonim 1 (Arab) diperbaiki dari entri
"abah (2)" ke "abah (1)" dan diaktifkan.

**Kondisi setelah langkah ini**:

```
aktif=TRUE,  meragukan=FALSE : 15.475
aktif=FALSE, meragukan=FALSE :    891   (orphan atau tanpa bahasa)
aktif=FALSE, meragukan=TRUE  :    146
```

### 2.4 Pembersihan Kolom `kata_asal`

**File migrasi**: `202603051430_bersihkan-kata-asal-etimologi.sql`

`kata_asal` adalah kolom yang tampil ke publik (bersama `bahasa`).
Isi aslinya berasal dari data LWIM mentah dan mengandung enam pola kotoran:

| # | Pola | Contoh Sebelum | Sesudah |
|---|------|----------------|---------|
| 1 | CJK duplikat | `阿姊 阿姊 á chí` | `阿姊 á chí` |
| 2 | Referensi sumber | `ṭamaʿ Wehr1961:569` | `ṭamaʿ` |
| 3 | Alternatif "or" | `alkali or < Arabic al-qily` | `alkali` |
| 4 | Notasi morfologi "+" | `guerilla + from -wan` | `guerilla` |
| 5 | Prefiks nama bahasa | `Belanda (hand) doek]` | `doek` |
| 6 | Trailing `]` | `dopje(s)]` | `dopje(s)` |

Perkiraan baris yang berubah: ~1.100 dari 15.755 yang terisi.
Kolom `sumber_definisi` **tetap dipertahankan** sebagai cadangan data mentah.

### 2.5 Ekstraksi Bahasa dan Kata Asal dari Sumber Definisi

**File migrasi**: `202603051914_isi-bahasa-dari-sumber-definisi.sql`
**Dokumentasi metode**: `202603051914_isi-bahasa-kata-asal-dari-sumber-definisi.md`

891 baris `aktif=false` dianalisis — banyak yang menyimpan informasi bahasa dalam
`sumber_definisi` dengan notasi `[from KATA (< BAHASA) + ...]`. Tiga strategi:

- **Tunggal** (460 baris): bahasa diisi, `kata_asal = kata1 + kata2` untuk compound satu bahasa → aktif=true
- **Compound sejati** (99 baris): bahasa berbeda antar komponen → `bahasa` NULL, `kata_asal = "komponen (BhsA) + komponen (BhsB)"`, tetap nonaktif
- **Tidak ada info** (193 baris): tidak diubah

**Kondisi setelah langkah ini**:

```
aktif=TRUE,  meragukan=FALSE : 15.928   (naik +453 dari 15.475)
aktif=FALSE, meragukan=FALSE :    438   (193 tidak ada info + 99 compound sejati + 146 doubtful entry)
aktif=FALSE, meragukan=TRUE  :    146   (doubtful entry)
─────────────────────────────────────────
Total                        : 16.512
```

### 2.6 Pengisian `kata_asal` untuk Entri Aktif yang Kosong

**File migrasi**: `202603051929_isi-kata-asal-compound-aktif.sql`

Setelah migrasi 1–5, masih ada entri aktif (`aktif=true`) dengan `kata_asal` kosong
yang `sumber_definisi`-nya mengandung notasi `from`. Pola yang tidak tertangkap migrasi 4:

- `from KATA (< BhsA or < BhsB)` — parenthetical "or" memecah regex utama
- `< loan KATA` — pola loan tanpa label bahasa
- `{from:Arab ...}`, `{from:Amoy ...}` — format kurung kurawal (12–13 entri, tidak diotomasi)

Strategi: ekstraksi lebih longgar menggunakan `from\s+(\S+)` untuk mengambil kata tanpa
memerlukan label bahasa. Kata dibersihkan dari tanda baca akhir (`,` `.` `;` `)`) tetapi
mempertahankan tanda hubung (prefiks seperti `adi-`, `bio-`).

Hasil: **139 baris** diisi `kata_asal`-nya. Contoh: `biokimia` → `bio- + kimia`.

**Kondisi setelah langkah ini**:

```
aktif=TRUE,  meragukan=FALSE : 15.928
  → kata_asal terisi             : ~15.859  (69 masih kosong — tidak ada pola "from")
aktif=FALSE, meragukan=FALSE :    438   (193 tidak ada info + 99 compound sejati)
aktif=FALSE, meragukan=TRUE  :    146   (doubtful entry)
─────────────────────────────────────────
Total                        : 16.512
```

### 2.7 Aktifkan Compound Sejati

**File migrasi**: `202603052000_aktifkan-compound-sejati-etimologi.sql`

Dari 438 baris `aktif=false, meragukan=false`, 100 adalah compound sejati — kata yang
berasal dari dua bahasa berbeda. `kata_asal` sudah terisi dalam format
`komponen (BhsA) + komponen (BhsB)` tetapi `bahasa` kosong karena tidak ada bahasa tunggal.

Keputusan: compound sejati diaktifkan agar publik bisa melihat informasi etimologi
yang sudah tersedia di `kata_asal`. Kondisi aktivasi diperluas:
`entri_id IS NOT NULL` AND `kata_asal IS NOT NULL` AND `meragukan = false`
(tidak mensyaratkan `bahasa` terisi untuk tipe compound).

**Kondisi final setelah semua perbaikan**:

```
aktif=TRUE,  meragukan=FALSE : 16.028   (tampil ke publik, naik +100)
aktif=FALSE, meragukan=FALSE :    338   (193 tidak ada info + 141 orphan)
aktif=FALSE, meragukan=TRUE  :    146   (doubtful entry)
─────────────────────────────────────────
Total                        : 16.512
```

---

## 3. Perubahan Kode Aplikasi

### `backend/models/modelEtimologi.js`

Kolom `meragukan` ditambahkan ke semua query:

- `ambilAktifPublikByEntriId` — tambah `e.meragukan` ke SELECT
- `daftarAdmin` — tambah filter parameter `meragukan` ('1'/'0') dan kolom ke SELECT
- `ambilDenganId` — tambah `e.meragukan` ke SELECT
- `simpan` — tambah parameter `meragukan`, normalisasi `Boolean(meragukan)`,
  UPDATE posisi parameter digeser ($16=meragukan, $17=id),
  INSERT tambah $16 sebelum `NOW()`

### `backend/__tests__/models/modelEtimologi.test.js`

Array params di test UPDATE dan INSERT diperbarui untuk menyertakan nilai `false`
(meragukan) di posisi yang tepat.

---

## 4. Skrip Analisis

**`backend/scripts/analisis-homonim-etimologi.js`**

Skrip referensi untuk orphan dan mismatch. **Catatan**: query mismatch di skrip ini
mengandung bug `COALESCE(en.homonim, 0)` — lihat `202603051849_disambiguasi-homonim-etimologi.md`
untuk pembahasan lengkap dan metode yang benar.

Mode:
```bash
node scripts/analisis-homonim-etimologi.js --orphan  # detail orphan + kandidat
node scripts/analisis-homonim-etimologi.js --csv     # simpan ke CSV
```

CSV orphan (156 baris, 3 bisa auto-match):
- `_docs/202603/202603051003_kandidat-rematch-orphan-etimologi.csv`

---

## 5. Pekerjaan yang Belum Selesai

### 5.1 Orphan Pemetaan (156 baris)

156 baris dengan `entri_id IS NULL` — 3 bisa auto-match, 153 perlu review manual.
CSV tersedia di `_docs/202603/202603051003_kandidat-rematch-orphan-etimologi.csv`.

### 5.2 Frontend

Backend sudah mengembalikan kolom `meragukan` di semua endpoint etimologi,
tetapi belum ada tampilan khusus di frontend untuk menampilkan atau
memfilter entri berdasarkan status ini.

---

## 6. Referensi Teknis

### Cara identifikasi doubtful entry

```sql
SELECT COUNT(*) FROM etimologi WHERE sumber_definisi ILIKE '%doubtful%';
-- Hasil: 146
```

### Kondisi aktif valid

```sql
-- Etimologi layak aktif jika:
-- 1. terhubung ke entri
-- 2. bahasa ATAU kata_asal terisi (compound sejati boleh bahasa kosong)
-- 3. bukan doubtful entry
WHERE entri_id IS NOT NULL
  AND (
    NULLIF(BTRIM(COALESCE(bahasa, '')), '') IS NOT NULL
    OR NULLIF(BTRIM(COALESCE(kata_asal, '')), '') IS NOT NULL
  )
  AND meragukan = false
```

### Definisi homonim mismatch yang benar

```sql
-- BUKAN mismatch jika entri.homonim IS NULL (kata tunggal, tidak ada homonim)
-- Mismatch sesungguhnya:
WHERE et.homonim IS NOT NULL
  AND en.homonim IS NOT NULL
  AND et.homonim != en.homonim
```
