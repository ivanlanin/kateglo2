# Audit Pemenggalan Entri (2026-02-25)

## Tujuan
Mengidentifikasi entri yang **belum memiliki `entri.pemenggalan`** (`NULL` atau string kosong), lalu memetakannya berdasarkan `entri.jenis`.

## Referensi Skema
- Sumber skema: `_docs/data/struktur.sql`
- Tabel: `entri`
- Kolom kunci: `jenis`, `pemenggalan`, `aktif`

## Kriteria Data Kosong
```sql
pemenggalan IS NULL OR BTRIM(pemenggalan) = ''
```

## Query Rekap per Jenis
```sql
SELECT
  jenis,
  COUNT(*) FILTER (WHERE pemenggalan IS NULL OR BTRIM(pemenggalan) = '') AS tanpa_pemenggalan,
  COUNT(*) AS total_entri,
  ROUND(
    (COUNT(*) FILTER (WHERE pemenggalan IS NULL OR BTRIM(pemenggalan) = '')::numeric
    / NULLIF(COUNT(*), 0)::numeric) * 100,
    2
  ) AS persen_tanpa_pemenggalan
FROM entri
GROUP BY jenis
HAVING COUNT(*) FILTER (WHERE pemenggalan IS NULL OR BTRIM(pemenggalan) = '') > 0
ORDER BY tanpa_pemenggalan DESC, jenis ASC;
```

## Cakupan Jenis Entri (`distinct(entri.jenis)`)
Hasil pengecekan terbaru menunjukkan terdapat **13** jenis entri:

| jenis | total_entri |
|---|---:|
| dasar | 39659 |
| gabungan | 23536 |
| idiom | 272 |
| infiks | 6 |
| klitik | 5 |
| konfiks | 6 |
| peribahasa | 2033 |
| prakategorial | 1669 |
| prefiks | 11 |
| sufiks | 14 |
| terikat | 103 |
| turunan | 24607 |
| varian | 91 |

## Hasil Rekap Awal (Sebelum Perubahan)
| jenis | tanpa_pemenggalan | total_entri | persen_tanpa_pemenggalan |
|---|---:|---:|---:|
| gabungan | 23536 | 23536 | 100.00% |
| peribahasa | 2033 | 2033 | 100.00% |
| idiom | 272 | 272 | 100.00% |
| varian | 91 | 91 | 100.00% |
| dasar | 3 | 39659 | 0.01% |
| terikat | 1 | 103 | 0.97% |

**Total entri tanpa pemenggalan: 25.936**.

## Distribusi Status Aktif
Semua entri tanpa pemenggalan berada pada `aktif = 1`.

## Contoh Entri Tanpa Pemenggalan (per jenis)
- **dasar**: `si (1)`, `si (2)`, `si (3)`
- **gabungan**: `abad keemasan`, `abad komputer`, `abad modern`, `abad Pertengahan`, `abah-abah kuda`
- **idiom**: `ada berair juga rupanya`, `ada nyawa, ada rezeki`, `ada nyawa, nyawa ikan`, `adat lama pusaka usang`, `akal bulus`
- **peribahasa**: `ada angin ada pohonnya (hujan berpohon, panas berasal)`, `ada bangkai ada hering`, `ada beras, taruh dalam padi`, `ada biduk serempu pula`
- **terikat**: `si- (2)`
- **varian**: `a`, `alfu`, `an-`, `ap-`, `-asi`

## Keputusan Sementara (2026-02-25)
- `dasar`, `terikat`, dan `varian` **wajib memiliki `pemenggalan`**.
- Untuk sementara, nilai `pemenggalan` disamakan dengan `entri` setelah menghapus sufiks angka pola ` (x)` di akhir teks.
- `idiom` dan `peribahasa` **tidak diwajibkan** memiliki `pemenggalan` saat ini.
- `gabungan` tetap belum diisi otomatis; pengisian akan dilakukan terpisah berdasarkan unsur pembentuk.

## Eksekusi Perubahan Data

### SQL Update yang Dijalankan
```sql
UPDATE entri
SET pemenggalan = REGEXP_REPLACE(entri, '\s*\(\d+\)$', '')
WHERE (pemenggalan IS NULL OR BTRIM(pemenggalan) = '')
  AND jenis IN ('dasar','terikat','varian');
```

### Hasil Eksekusi
- Jumlah baris ter-update: **95**.
- Contoh normalisasi:
  - `si (1)` -> `si`
  - `si (2)` -> `si`
  - `si (3)` -> `si`
  - `si- (2)` -> `si-`

## Rekap Setelah Perubahan
Sisa entri tanpa `pemenggalan` (berdasarkan seluruh `distinct(entri.jenis)`):

| jenis | tanpa_pemenggalan |
|---|---:|
| gabungan | 23536 |
| idiom | 272 |
| peribahasa | 2033 |

Jenis berikut sudah tidak memiliki data kosong `pemenggalan` (0 baris):
`dasar`, `infiks`, `klitik`, `konfiks`, `prakategorial`, `prefiks`, `sufiks`, `terikat`, `turunan`, `varian`.

## Validasi Tambahan
- Distribusi `aktif` untuk entri yang masih kosong `pemenggalan`:
  - `gabungan`: `aktif = 1` (23536)
  - `idiom`: `aktif = 1` (272)
  - `peribahasa`: `aktif = 1` (2033)
- Tidak ditemukan entri `aktif = 0` pada kelompok yang masih kosong.

## Tindak Lanjut
1. Dokumentasi kebijakan di level backend/frontend validation agar konsisten:
   - wajib: `dasar`, `terikat`, `varian`
   - opsional: `idiom`, `peribahasa`
   - tertunda: `gabungan`
2. Lanjutkan strategi pengisian `gabungan` berbasis unsur pembentuk (manual/aturan khusus).
