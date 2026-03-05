# Audit dan Rencana Perbaikan Tabel Etimologi

**Tanggal**: 2026-03-05
**Status**: Analisis selesai — belum ada perubahan ke database
**Konteks**: Temuan dari proyek deteksi sisipan/dwipurwa
**Dokumen terkait**: `_docs/202603/202603050001_deteksi-sisipan-dwipurwa-entri-dasar.md` §9.9

---

## 1. Kondisi Tabel Saat Ini

```
Total baris     : 16.512
  aktif = TRUE  :     10
  aktif = FALSE : 16.502  ← data lama KBBI, belum diintegrasikan
```

Data tidak aktif mengandung informasi bahasa asal yang kaya dan berguna,
tetapi **tidak dapat digunakan secara programatik** sebelum tiga masalah
berikut diselesaikan.

---

## 2. Tiga Masalah Utama

### 2.1 Tipe 1 — Homonim Etimologi Melebihi Jumlah Entri (233 indeks)

**Apa yang terjadi**: Data etimologi lama mencatat setiap homonim KBBI secara
terpisah (blok₁, blok₂, blok₃, blok₄, blok₅ → 5 baris), tetapi tabel `entri`
hanya memiliki satu baris *blok* karena konsolidasi homonim belum selesai.

```sql
-- Query untuk melihat kasus ini
SELECT e2.indeks,
       COUNT(DISTINCT et.homonim) AS jml_homonim_etim,
       COUNT(DISTINCT e2.id)      AS jml_entri
FROM etimologi et
JOIN entri e2 ON et.entri_id = e2.id
WHERE et.aktif = FALSE
GROUP BY e2.indeks
HAVING COUNT(DISTINCT et.homonim) > COUNT(DISTINCT e2.id)
ORDER BY (COUNT(DISTINCT et.homonim) - COUNT(DISTINCT e2.id)) DESC;
-- Top: blok(5>1), hun(4>1), setem/mek/patron(3>1), ...
```

**Penyebab akar**: Tabel `entri` belum memisahkan homonim menjadi baris
terpisah untuk kata-kata yang di KBBI memiliki banyak makna tidak berkerabat.

**Opsi penanganan**:
- (A) Tunda — tunggu sampai konsolidasi homonim `entri` selesai lebih dulu
- (B) Simpan saja kolom `homonim` di etimologi sebagai metadata informatif,
  tidak perlu join ke `entri` per homonim untuk keperluan deteksi FP
- (C) Gabungkan semua baris etimologi untuk satu `entri_id` menjadi satu
  representasi (ambil bahasa asal yang paling sering, atau daftarkan semua)

**Rekomendasi**: Opsi B untuk jangka pendek — cukup query `DISTINCT bahasa`
per `entri_id` tanpa mempedulikan kolom `homonim`.

### 2.2 Tipe 2 — Duplikat (entri_id + homonim sama) (177 pasangan)

**Apa yang terjadi**: Dua atau lebih baris dengan `entri_id` dan `homonim`
yang identik — kemungkinan artefak impor data yang tidak deduplikasi.

```sql
-- Query untuk melihat kasus ini
SELECT et.entri_id, e.entri, et.homonim, COUNT(*) AS cnt
FROM etimologi et
LEFT JOIN entri e ON et.entri_id = e.id
WHERE et.aktif = FALSE
GROUP BY et.entri_id, e.entri, et.homonim
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
-- Top: NULL(106), NULL(23), kaf(3), pak(3), papa(3), real(3), ...
```

**Penyebab akar**: Baris duplikat dari impor data mentah, tanpa unique
constraint pada (entri_id, homonim).

**Opsi penanganan**:
- (A) Hapus duplikat dengan `DELETE ... WHERE id NOT IN (SELECT MIN(id) ...
  GROUP BY entri_id, homonim)` — aman jika kontennya identik
- (B) Cek dulu apakah konten kolom lain (`bahasa`, `kata_asal`, dll.) berbeda
  di antara duplikat sebelum menghapus

**Rekomendasi**: Opsi B → audit isi kolom duplikat, baru hapus yang benar-benar
identik. Yang berbeda isi → perlu keputusan manual.

### 2.3 Tipe 3 — Orphan (entri_id IS NULL) (156 baris)

**Apa yang terjadi**: Baris etimologi tanpa `entri_id` — entri asal tidak
ditemukan di tabel `entri` saat impor.

```sql
-- Lihat bahasa asal orphan
SELECT bahasa, COUNT(*) AS cnt
FROM etimologi
WHERE entri_id IS NULL
GROUP BY bahasa
ORDER BY cnt DESC;

-- Lihat homonim orphan (ada duplikat homonim di sini juga)
SELECT indeks, homonim, COUNT(*) AS cnt
FROM etimologi
WHERE entri_id IS NULL
GROUP BY indeks, homonim
ORDER BY cnt DESC LIMIT 20;
```

**Penyebab akar**: Entri asal di KBBI tidak ada padanannya di tabel `entri`,
atau nama/indeksnya berbeda sehingga join gagal saat impor.

**Opsi penanganan**:
- (A) Coba re-match: join `etimologi.indeks` ke `entri.indeks` lagi, update
  `entri_id` yang masih NULL jika ditemukan
- (B) Tandai sebagai "tidak terpetakan" dan simpan untuk audit manual
- (C) Hapus jika tidak ada nilai kegunaannya

**Rekomendasi**: Opsi A dulu — re-match berdasarkan `indeks`. Yang masih NULL
setelah re-match → Opsi B.

---

## 3. Dampak Terhadap Deteksi Sisipan/Dwipurwa

Meski belum bersih, data etimologi sudah bisa **digunakan terbatas** untuk
menyaring false positive dengan pendekatan berikut:

```sql
-- Cukup query DISTINCT bahasa per entri_id, abaikan kolom homonim
SELECT DISTINCT e.id AS entri_id, et.bahasa
FROM entri e
JOIN etimologi et ON et.entri_id = e.id
WHERE e.jenis = 'dasar' AND e.aktif = 1
  AND et.aktif = FALSE
  AND et.bahasa IN ('Belanda','Arab','Inggris','Latin',
                    'Yunani','Portugis','Persia','Tamil',
                    'Amoy','Prancis');
```

Hasilnya: **1.034 entri** dari 2.086 kandidat sisipan/dwipurwa terkonfirmasi
sebagai serapan asing dan dapat disingkirkan dari daftar kandidat.

---

## 4. Urutan Pekerjaan yang Disarankan

```
Prioritas 1 (rendah risiko, dampak segera):
  → Re-match orphan (Tipe 3): UPDATE etimologi SET entri_id = ...
    WHERE entri_id IS NULL AND EXISTS (SELECT 1 FROM entri WHERE indeks = etimologi.indeks)

Prioritas 2 (perlu audit):
  → Audit duplikat (Tipe 2): cek apakah kolom bahasa/kata_asal berbeda
    antar duplikat, lalu hapus yang benar-benar identik

Prioritas 3 (tergantung roadmap entri):
  → Tipe 1 (homonim melebihi entri): tangguhkan sampai konsolidasi homonim
    di tabel entri selesai
```

---

## 5. Query Diagnostik Cepat untuk Memulai Sesi Berikutnya

```javascript
// backend/temp_cek_etimologi.js
require('dotenv').config({ path: '.env' });
const db = require('./db');

async function main() {
  // Ringkasan masalah
  const r = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM etimologi WHERE entri_id IS NULL)          AS orphan,
      (SELECT COUNT(*) FROM (
         SELECT entri_id, homonim FROM etimologi WHERE aktif=FALSE
         GROUP BY entri_id, homonim HAVING COUNT(*) > 1) x)            AS duplikat,
      (SELECT COUNT(DISTINCT e2.indeks)
       FROM etimologi et JOIN entri e2 ON et.entri_id=e2.id
       WHERE et.aktif=FALSE
       GROUP BY e2.indeks
       HAVING COUNT(DISTINCT et.homonim) > COUNT(DISTINCT e2.id))      AS kelebihan_homonim
  `);
  console.log(r.rows[0]);
  await db.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
```

---

## 6. Referensi

- `_docs/202603/202603050001_deteksi-sisipan-dwipurwa-entri-dasar.md` §9.9
  — temuan dari cross-reference kandidat sisipan dengan data etimologi
- `_docs/struktur-data.sql` — skema tabel `etimologi`
