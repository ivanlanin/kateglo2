-- Membersihkan data lama glosarium yang ditulis seluruhnya dengan huruf kapital.
-- Terdapat 74 baris dengan kolom asing dan/atau indonesia berupa teks multi-kata all-caps.
-- Sumber utama: bidang_id=16, sumber_id=7.
--
-- Pendekatan:
--   1. INITCAP (+ TRIM) untuk semua baris multi-kata all-caps, kecuali yang memang harus kapital.
--   2. Koreksi khusus untuk kasus yang INITCAP hasilkan tidak tepat.
--
-- Dikecualikan dari perubahan (tetap kapital):
--   id 121504 — RPG III (bahasa pemrograman)
--   id 125065 — ECO RI (enzim restriksi)
--   id 125066 — ECO RII (enzim restriksi)


-- ============================================================
-- Langkah 1: INITCAP semua baris multi-kata all-caps
-- ============================================================

UPDATE glosarium
SET
  asing = CASE
    WHEN asing ~ '[A-Z]' AND asing = UPPER(asing) AND asing ~ '[A-Za-z]+ +[A-Za-z]+'
    THEN REPLACE(INITCAP(TRIM(asing)), '''S ', '''s ')
    ELSE asing
  END,
  indonesia = CASE
    WHEN indonesia ~ '[A-Z]' AND indonesia = UPPER(indonesia) AND indonesia ~ '[A-Za-z]+ +[A-Za-z]+'
    THEN INITCAP(TRIM(indonesia))
    ELSE indonesia
  END
WHERE aktif = true
  AND id NOT IN (121504, 125065, 125066)
  AND (
    (asing ~ '[A-Z]' AND asing = UPPER(asing) AND asing ~ '[A-Za-z]+ +[A-Za-z]+')
    OR
    (indonesia ~ '[A-Z]' AND indonesia = UPPER(indonesia) AND indonesia ~ '[A-Za-z]+ +[A-Za-z]+')
  );


-- ============================================================
-- Langkah 2: Koreksi khusus pasca-INITCAP
-- ============================================================

-- TATA BOX: bukan judul, bukan singkatan → huruf kecil semua
UPDATE glosarium SET asing = 'tata box' WHERE id = 128972;

-- MPR: ubah format "- MPR" → "(MPR)"
UPDATE glosarium SET indonesia = 'Majelis Permusyawaratan Rakyat (MPR)' WHERE id = 46617;

-- DPR: ubah format "- DPR" → "(DPR)"
UPDATE glosarium SET indonesia = 'Dewan Perwakilan Rakyat (DPR)' WHERE id = 46634;

-- DPD: ubah format "- DPD" → "(DPD)"
UPDATE glosarium SET indonesia = 'Dewan Perwakilan Daerah (DPD)' WHERE id = 46666;

-- PPAT (id 47583): hilangkan spasi ganda + pertahankan akronim (INITCAP → Ppat)
UPDATE glosarium SET indonesia = 'Pejabat Pembuat Akta Tanah (PPAT)' WHERE id = 47583;

-- PPAT (id 43888): kolom asing, INITCAP mengubah PPAT → Ppat
UPDATE glosarium SET asing = '(Pejabat Pembuat Akta Tanah - PPAT)' WHERE id = 43888;

-- IBRA: INITCAP mengubah IBRA → Ibra, kembalikan akronim
UPDATE glosarium SET indonesia = 'Badan Penyehatan Perbankan Nasional (IBRA)' WHERE id = 48098;
