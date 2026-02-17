-- Normalisasi kolom redaksi agar menyimpan label.kode (bukan label.nama)
-- Tanggal: 2026-02-17

BEGIN;

-- 1) Sinkron label kategori kelas-kata dari legacy kelas_kata (kompatibilitas)
INSERT INTO label (kategori, kode, nama, keterangan, sumber)
SELECT
  'kelas-kata' AS kategori,
  l.kode,
  l.nama,
  COALESCE(l.keterangan, 'Sinkron dari kategori legacy kelas_kata'),
  'sinkron-redaksi-20260217'
FROM label l
WHERE l.kategori = 'kelas_kata'
ON CONFLICT (kategori, kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  keterangan = EXCLUDED.keterangan,
  sumber = EXCLUDED.sumber;

-- 2) Tambahkan label yang belum ada berdasarkan nilai distinct dari tabel sumber
WITH sumber_nilai AS (
  SELECT 'bentuk-kata'::text AS kategori, TRIM(jenis) AS nilai
  FROM entri
  WHERE jenis IS NOT NULL AND TRIM(jenis) <> ''

  UNION

  SELECT 'jenis-rujuk'::text AS kategori, TRIM(jenis_rujuk) AS nilai
  FROM entri
  WHERE jenis_rujuk IS NOT NULL AND TRIM(jenis_rujuk) <> ''

  UNION

  SELECT 'kelas-kata'::text AS kategori, TRIM(kelas_kata) AS nilai
  FROM makna
  WHERE kelas_kata IS NOT NULL AND TRIM(kelas_kata) <> ''

  UNION

  SELECT 'ragam'::text AS kategori, TRIM(ragam) AS nilai
  FROM makna
  WHERE ragam IS NOT NULL AND TRIM(ragam) <> ''

  UNION

  SELECT 'ragam'::text AS kategori, TRIM(ragam) AS nilai
  FROM contoh
  WHERE ragam IS NOT NULL AND TRIM(ragam) <> ''

  UNION

  SELECT 'bidang'::text AS kategori, TRIM(bidang) AS nilai
  FROM makna
  WHERE bidang IS NOT NULL AND TRIM(bidang) <> ''

  UNION

  SELECT 'bidang'::text AS kategori, TRIM(bidang) AS nilai
  FROM contoh
  WHERE bidang IS NOT NULL AND TRIM(bidang) <> ''

  UNION

  SELECT 'bahasa'::text AS kategori, TRIM(bahasa) AS nilai
  FROM makna
  WHERE bahasa IS NOT NULL AND TRIM(bahasa) <> ''

  UNION

  SELECT 'penyingkatan'::text AS kategori, TRIM(tipe_penyingkat) AS nilai
  FROM makna
  WHERE tipe_penyingkat IS NOT NULL AND TRIM(tipe_penyingkat) <> ''
)
INSERT INTO label (kategori, kode, nama, keterangan, sumber)
SELECT
  s.kategori,
  s.nilai AS kode,
  s.nilai AS nama,
  'Auto-generated dari nilai existing tabel redaksi' AS keterangan,
  'sinkron-redaksi-20260217' AS sumber
FROM sumber_nilai s
ON CONFLICT (kategori, kode) DO NOTHING;

-- 3) Normalisasi nilai tabel ke label.kode berdasarkan label.nama / label.kode

-- entri.jenis <= label(kategori='bentuk-kata')
UPDATE entri e
SET jenis = l.kode
FROM label l
WHERE l.kategori = 'bentuk-kata'
  AND LOWER(TRIM(e.jenis)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND e.jenis IS DISTINCT FROM l.kode;

-- entri.jenis_rujuk <= label(kategori='jenis-rujuk')
UPDATE entri e
SET jenis_rujuk = l.kode
FROM label l
WHERE l.kategori = 'jenis-rujuk'
  AND e.jenis_rujuk IS NOT NULL
  AND LOWER(TRIM(e.jenis_rujuk)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND e.jenis_rujuk IS DISTINCT FROM l.kode;

-- makna.kelas_kata <= label(kategori='kelas-kata' atau legacy 'kelas_kata')
UPDATE makna m
SET kelas_kata = l.kode
FROM label l
WHERE l.kategori IN ('kelas-kata', 'kelas_kata')
  AND m.kelas_kata IS NOT NULL
  AND LOWER(TRIM(m.kelas_kata)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND m.kelas_kata IS DISTINCT FROM l.kode;

-- makna.ragam <= label(kategori='ragam')
UPDATE makna m
SET ragam = l.kode
FROM label l
WHERE l.kategori = 'ragam'
  AND m.ragam IS NOT NULL
  AND LOWER(TRIM(m.ragam)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND m.ragam IS DISTINCT FROM l.kode;

-- contoh.ragam <= label(kategori='ragam')
UPDATE contoh c
SET ragam = l.kode
FROM label l
WHERE l.kategori = 'ragam'
  AND c.ragam IS NOT NULL
  AND LOWER(TRIM(c.ragam)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND c.ragam IS DISTINCT FROM l.kode;

-- makna.bidang <= label(kategori='bidang')
UPDATE makna m
SET bidang = l.kode
FROM label l
WHERE l.kategori = 'bidang'
  AND m.bidang IS NOT NULL
  AND LOWER(TRIM(m.bidang)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND m.bidang IS DISTINCT FROM l.kode;

-- contoh.bidang <= label(kategori='bidang')
UPDATE contoh c
SET bidang = l.kode
FROM label l
WHERE l.kategori = 'bidang'
  AND c.bidang IS NOT NULL
  AND LOWER(TRIM(c.bidang)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND c.bidang IS DISTINCT FROM l.kode;

-- makna.bahasa <= label(kategori='bahasa')
UPDATE makna m
SET bahasa = l.kode
FROM label l
WHERE l.kategori = 'bahasa'
  AND m.bahasa IS NOT NULL
  AND LOWER(TRIM(m.bahasa)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND m.bahasa IS DISTINCT FROM l.kode;

-- makna.tipe_penyingkat <= label(kategori='penyingkatan')
UPDATE makna m
SET tipe_penyingkat = l.kode
FROM label l
WHERE l.kategori = 'penyingkatan'
  AND m.tipe_penyingkat IS NOT NULL
  AND LOWER(TRIM(m.tipe_penyingkat)) IN (LOWER(TRIM(l.kode)), LOWER(TRIM(l.nama)))
  AND m.tipe_penyingkat IS DISTINCT FROM l.kode;

COMMIT;
