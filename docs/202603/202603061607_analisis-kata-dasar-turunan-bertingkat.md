# Analisis Kata Dasar dengan Turunan Terbanyak (Turunan Bertingkat)

## Tujuan
Menyusun daftar kata dasar yang memiliki jumlah turunan terbanyak dengan memperhitungkan penurunan bertingkat pada tabel `entri`.

Fokus analisis:
- Unit akar: `entri` dengan `jenis = 'dasar'` dan `aktif = 1`
- Unit hitung: hanya node `jenis = 'turunan'` dan `aktif = 1`
- Relasi hierarki: `anak.induk = parent.id`
- Bertingkat: turunan dihitung pada seluruh kedalaman keturunan (bukan hanya anak langsung)

## Definisi Operasional
- `total_turunan_langsung`: jumlah anak level-1 dari kata dasar yang `jenis = 'turunan'`
- `total_turunan_bertingkat`: jumlah seluruh keturunan (level-1 dan seterusnya) yang `jenis = 'turunan'`
- `kedalaman_maks`: kedalaman maksimum pohon turunan yang tercapai dari kata dasar

## Metode (SQL Rekursif)
Analisis menggunakan `WITH RECURSIVE` untuk menelusuri semua keturunan dari setiap kata dasar, dengan pencegahan siklus (`NOT c.id = ANY(jalur)`) dan batas kedalaman aman (`depth < 20`).

```sql
WITH RECURSIVE pohon AS (
  SELECT
    d.id AS dasar_id,
    d.entri AS kata_dasar,
    d.indeks AS indeks_dasar,
    c.id AS node_id,
    c.induk,
    c.jenis,
    1 AS depth,
    ARRAY[d.id, c.id]::int[] AS jalur
  FROM entri d
  JOIN entri c ON c.induk = d.id
  WHERE d.jenis = 'dasar'
    AND d.aktif = 1
    AND c.aktif = 1

  UNION ALL

  SELECT
    p.dasar_id,
    p.kata_dasar,
    p.indeks_dasar,
    c.id AS node_id,
    c.induk,
    c.jenis,
    p.depth + 1 AS depth,
    p.jalur || c.id
  FROM pohon p
  JOIN entri c ON c.induk = p.node_id
  WHERE c.aktif = 1
    AND NOT c.id = ANY(p.jalur)
    AND p.depth < 20
),
ringkas AS (
  SELECT
    dasar_id,
    kata_dasar,
    indeks_dasar,
    COUNT(*) FILTER (WHERE jenis = 'turunan') AS total_turunan_bertingkat,
    COUNT(*) AS total_semua_turunan_struktural,
    COUNT(*) FILTER (WHERE depth = 1 AND jenis = 'turunan') AS total_turunan_langsung,
    MAX(depth) AS kedalaman_maks
  FROM pohon
  GROUP BY dasar_id, kata_dasar, indeks_dasar
)
SELECT *
FROM ringkas
WHERE total_turunan_bertingkat > 0
ORDER BY total_turunan_bertingkat DESC, total_turunan_langsung DESC, kata_dasar ASC;
```

## Ringkasan Global Data (snapshot)
Waktu eksekusi: `2026-03-06T09:11:34.014Z`

- Total kata dasar aktif: `39.671`
- Total entri turunan aktif: `24.586`
- Kata dasar yang memiliki minimal satu turunan: `8.294`
- Turunan aktif yang tercakup dalam pohon berakar `dasar`: `21.861`
- Turunan aktif yang tidak menemukan akar `dasar`: `2.725`
- Kedalaman maksimum global yang ditemukan: `2`

## Top 30 Kata Dasar Berdasarkan Jumlah Turunan Bertingkat
| Peringkat | Kata Dasar | total_turunan_bertingkat | total_turunan_langsung | kedalaman_maks |
|---|---|---:|---:|---:|
| 1 | dua (1) | 22 | 22 | 2 |
| 2 | sama (1) | 18 | 18 | 1 |
| 3 | ajar | 18 | 17 | 2 |
| 4 | kira | 17 | 17 | 2 |
| 5 | rupa | 17 | 17 | 2 |
| 6 | hati | 17 | 16 | 2 |
| 7 | baik | 16 | 16 | 1 |
| 8 | lebih | 16 | 16 | 1 |
| 9 | tahan (1) | 16 | 16 | 2 |
| 10 | tali (1) | 16 | 16 | 2 |
| 11 | timbang (1) | 16 | 16 | 2 |
| 12 | tuju (1) | 16 | 16 | 2 |
| 13 | sambung | 16 | 12 | 2 |
| 14 | benar | 15 | 15 | 1 |
| 15 | cepat | 15 | 15 | 2 |
| 16 | imbang (1) | 15 | 15 | 1 |
| 17 | kirim | 15 | 15 | 2 |
| 18 | tua | 15 | 15 | 2 |
| 19 | angin | 14 | 14 | 2 |
| 20 | balik | 14 | 14 | 2 |
| 21 | bantah | 14 | 14 | 2 |
| 22 | banyak | 14 | 14 | 1 |
| 23 | belah (1) | 14 | 14 | 2 |
| 24 | ingat | 14 | 14 | 1 |
| 25 | manis | 14 | 14 | 2 |
| 26 | pikir | 14 | 14 | 2 |
| 27 | satu | 14 | 14 | 2 |
| 28 | tukar | 14 | 14 | 2 |
| 29 | turut | 14 | 14 | 2 |
| 30 | ubah | 14 | 14 | 2 |

## Lampiran
Daftar turunan untuk masing-masing entri dasar pada Top 30 tersedia di:

- `docs/202603/202603061607_lampiran-daftar-turunan-top30.md`

## Interpretasi Awal
- Peringkat pertama pada snapshot ini adalah `dua (1)` dengan `22` turunan.
- Sebagian entri menunjukkan perbedaan turunan langsung vs bertingkat, menandakan adanya cabang level lanjutan.
- Ada subset turunan aktif yang belum terhubung ke akar `jenis='dasar'`, sehingga audit relasi `induk` tetap disarankan untuk analisis morfologi yang lebih bersih.

## Reproducibility
Dokumen ini dihasilkan dari query rekursif terhadap PostgreSQL melalui koneksi backend (`backend/db/index.js`) dengan `DATABASE_URL` dari `backend/.env`.
