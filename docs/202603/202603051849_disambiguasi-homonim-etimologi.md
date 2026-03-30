# Disambiguasi Homonim Etimologi

**Tanggal**: 2026-03-05
**Status**: Selesai
**File terkait**:
- `docs/202603/202603051849_rematch-homonim-etimologi.sql` (migrasi yang diterapkan)
- `docs/202603/202603051849_rematch-homonim-etimologi.csv` (hasil analisis lengkap)
- `backend/scripts/analisis-homonim-etimologi.js` (skrip analisis lama — lihat §4)

---

## 1. Latar Belakang

Setiap kata yang memiliki beberapa makna tidak berkerabat di KBBI dicatat sebagai
homonim terpisah di tabel `entri` (kolom `homonim`: 1, 2, 3, ...).
Tabel `etimologi` juga punya kolom `homonim` yang merekam nomor homonim dari sumber
LWIM asli. Setelah pemetaan `entri_id`, ada risiko bahwa `etimologi.entri_id` menunjuk
ke homonim yang salah — misalnya etimologi untuk "abah (1)" justru tertaut ke "abah (2)".

---

## 2. Definisi Mismatch yang Benar

```sql
-- MISMATCH SEJATI: kedua kolom punya nilai dan berbeda
WHERE et.homonim IS NOT NULL
  AND en.homonim IS NOT NULL
  AND et.homonim != en.homonim
```

**Bukan mismatch**:

```sql
-- en.homonim IS NULL berarti kata tunggal (tidak ada homonim lain di entri)
-- Kolom et.homonim dalam kasus ini adalah metadata dari LWIM, bukan kesalahan pemetaan
WHERE et.homonim IS NOT NULL AND en.homonim IS NULL  -- 14.571 baris, semua valid
```

### Kesalahan di Skrip Analisis Lama

Skrip `analisis-homonim-etimologi.js` menggunakan kondisi:

```sql
WHERE et.homonim IS NOT NULL
  AND et.homonim != COALESCE(en.homonim, 0)  -- ← SALAH
```

`COALESCE(en.homonim, 0)` mengubah `NULL` menjadi `0`. Karena sebagian besar
`et.homonim` bernilai ≥ 1, hampir semua kata tunggal (14.571 baris) terbaca sebagai
mismatch — padahal tidak. Inilah yang menyebabkan skrip lama melaporkan "500 baris
perubahan" meski dibatasi `LIMIT 500`.

---

## 3. Hasil Analisis

```
Mismatch sejati        :  1 baris
  YAKIN (homonim cocok):  1 → entri_id diperbarui + aktif = true
  PROBABLE (Jaccard)   :  0
  MANUAL               :  0
```

Satu-satunya kasus: etimologi `id=7`, kata "abah" homonim 1 (Arab).
Sebelumnya salah tunjuk ke entri "abah (2)" (id=15), diperbaiki ke "abah (1)" (id=14).

**Kondisi akhir setelah migrasi**:

```
aktif=TRUE,  meragukan=FALSE : 15.475
aktif=FALSE, meragukan=FALSE :    891
aktif=FALSE, meragukan=TRUE  :    146
─────────────────────────────────────
Total                        : 16.512
```

---

## 4. Metode Disambiguasi

Skrip Python `temp_disambiguasi_homonim.py` (hapus setelah dipakai) menerapkan
tiga lapis pencocokan, dari yang paling yakin ke paling lemah:

### Lapis 1: Cocok via Homonim Persis (YAKIN)

```python
cocok = [s for s in siblings if s.homonim == et.homonim]
if len(cocok) == 1:
    kategori = 'YAKIN'
```

Ada tepat satu entri sibling dengan `homonim = et.homonim`. Tidak ada ambiguitas.
Untuk kasus ini: `UPDATE entri_id` **dan** `aktif = true` (jika bahasa terisi
dan bukan meragukan).

### Lapis 2: Jaccard Similarity (PROBABLE)

```python
def jaccard(a, b):
    tok = lambda s: set(re.findall(r'\b\w{3,}\b', s.lower()))
    irisan = len(tok(a) & tok(b))
    return irisan / (len(tok(a)) + len(tok(b)) - irisan)
```

Bandingkan `sumber_definisi + arti_asal` di etimologi dengan `makna.makna` di
setiap sibling entri. Skor ≥ 0.08 → kategori PROBABLE.
Untuk kasus ini: `UPDATE entri_id` saja, **aktif tidak diubah** (perlu review manual).

### Lapis 3: Tidak Bisa Diotomasi (MANUAL)

Skor < 0.08 atau tidak ada sibling entri sama sekali.
Tidak ada perubahan ke database.

### Aturan Aktivasi

Etimologi hanya diaktifkan (`aktif = true`) jika **semua** kondisi terpenuhi:
1. Kategori = YAKIN (cocok homonim persis)
2. `bahasa IS NOT NULL AND bahasa != ''`
3. `meragukan = false`

---

## 5. Pelajaran untuk Data Mendatang

- Selalu gunakan definisi mismatch yang ketat: cek `en.homonim IS NOT NULL` sebelum
  membandingkan nilai homonim
- `COALESCE(en.homonim, 0)` tidak cocok untuk deteksi mismatch karena menghasilkan
  false positive massal pada kata tunggal
- 14.571 baris dengan `et.homonim IS NOT NULL` dan `en.homonim IS NULL` adalah
  **normal** — etimologi merekam nomor homonim dari sumber LWIM, sementara entri
  di Kateglo memang hanya punya satu bentuk untuk kata tersebut
