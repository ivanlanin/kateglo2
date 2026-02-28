-- ============================================================
-- Migrasi: sumber_id di entri, tesaurus, etimologi
-- + kolom konteks di sumber (glosarium, kamus, tesaurus, etimologi)
-- + rename sumber.aktif → sumber.glosarium
-- + rename etimologi.sumber_id text → lwim_ref
-- + drop kolom sumber text di entri dan etimologi
-- Tanggal: 2026-03-01
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- FASE 1: Perubahan struktur tabel sumber
-- ────────────────────────────────────────────────────────────

-- 1a. Rename sumber.aktif → sumber.glosarium
ALTER TABLE sumber RENAME COLUMN aktif TO glosarium;

-- 1b. Tambah kolom konteks baru
ALTER TABLE sumber ADD COLUMN kamus    boolean NOT NULL DEFAULT false;
ALTER TABLE sumber ADD COLUMN tesaurus boolean NOT NULL DEFAULT false;
ALTER TABLE sumber ADD COLUMN etimologi boolean NOT NULL DEFAULT false;

-- ────────────────────────────────────────────────────────────
-- FASE 2: Insert/update sumber entries
-- ────────────────────────────────────────────────────────────

-- KBBI IV
INSERT INTO sumber (kode, nama, glosarium, kamus, keterangan)
VALUES ('KBBI4', 'KBBI IV', false, true, 'Kamus Besar Bahasa Indonesia edisi IV')
ON CONFLICT (kode) DO UPDATE SET kamus = true;

-- KBBI V
INSERT INTO sumber (kode, nama, glosarium, kamus, keterangan)
VALUES ('KBBI5', 'KBBI V', false, true, 'Kamus Besar Bahasa Indonesia edisi V')
ON CONFLICT (kode) DO UPDATE SET kamus = true;

-- LWIM
INSERT INTO sumber (kode, nama, glosarium, etimologi, keterangan)
VALUES ('LWIM', 'Loan-words in Indonesian and Malay', false, true, 'Loan-words in Indonesian and Malay')
ON CONFLICT (kode) DO UPDATE SET etimologi = true;

-- KTG – sudah ada, aktifkan flag tesaurus
UPDATE sumber SET tesaurus = true WHERE kode = 'KTG';

-- ────────────────────────────────────────────────────────────
-- FASE 3: entri — tambah sumber_id, backfill, drop sumber text
-- ────────────────────────────────────────────────────────────

-- 3a. Tambah kolom
ALTER TABLE entri
  ADD COLUMN sumber_id integer REFERENCES sumber(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3b. Backfill bertahap (matikan trigger agar updated_at tidak berubah)
ALTER TABLE entri DISABLE TRIGGER trg_set_timestamp_fields__entri;

DO $$
DECLARE
  kbbi4_id integer;
  kbbi5_id integer;
  updated  integer;
BEGIN
  SELECT id INTO kbbi4_id FROM sumber WHERE kode = 'KBBI4';
  SELECT id INTO kbbi5_id FROM sumber WHERE kode = 'KBBI5';

  -- Backfill KBBI IV
  LOOP
    UPDATE entri
    SET    sumber_id = kbbi4_id
    WHERE  id IN (
      SELECT id FROM entri
      WHERE  sumber = 'KBBI IV' AND sumber_id IS NULL
      LIMIT  10000
    );
    GET DIAGNOSTICS updated = ROW_COUNT;
    EXIT WHEN updated = 0;
  END LOOP;

  -- Backfill KBBI V
  LOOP
    UPDATE entri
    SET    sumber_id = kbbi5_id
    WHERE  id IN (
      SELECT id FROM entri
      WHERE  sumber = 'KBBI V' AND sumber_id IS NULL
      LIMIT  10000
    );
    GET DIAGNOSTICS updated = ROW_COUNT;
    EXIT WHEN updated = 0;
  END LOOP;
END $$;

ALTER TABLE entri ENABLE TRIGGER trg_set_timestamp_fields__entri;

-- 3c. Index
CREATE INDEX idx_entri_sumber_id ON entri USING btree (sumber_id);

-- 3d. Drop kolom lama
ALTER TABLE entri DROP COLUMN sumber;

-- ────────────────────────────────────────────────────────────
-- FASE 4: tesaurus — tambah sumber_id, backfill ke KTG
-- ────────────────────────────────────────────────────────────

-- 4a. Tambah kolom
ALTER TABLE tesaurus
  ADD COLUMN sumber_id integer REFERENCES sumber(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4b. Backfill (matikan trigger)
ALTER TABLE tesaurus DISABLE TRIGGER trg_set_timestamp_fields__tesaurus;

UPDATE tesaurus
SET    sumber_id = (SELECT id FROM sumber WHERE kode = 'KTG');

ALTER TABLE tesaurus ENABLE TRIGGER trg_set_timestamp_fields__tesaurus;

-- 4c. Index
CREATE INDEX idx_tesaurus_sumber_id ON tesaurus USING btree (sumber_id);

-- ────────────────────────────────────────────────────────────
-- FASE 5: etimologi — rename lwim_ref, tambah sumber_id, backfill, drop sumber text
-- ────────────────────────────────────────────────────────────

-- 5a. Rename kolom lama (sumber_id text → lwim_ref)
ALTER TABLE etimologi RENAME COLUMN sumber_id TO lwim_ref;

-- 5b. Update index lama
DROP INDEX IF EXISTS idx_etimologi_sumber_id;
CREATE INDEX idx_etimologi_lwim_ref ON etimologi USING btree (lwim_ref);

-- 5c. Tambah kolom sumber_id integer baru
ALTER TABLE etimologi
  ADD COLUMN sumber_id integer REFERENCES sumber(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5d. Backfill (etimologi tidak punya trigger timestamp, update langsung)
UPDATE etimologi
SET    sumber_id = (SELECT id FROM sumber WHERE kode = 'LWIM');

-- 5e. Index
CREATE INDEX idx_etimologi_sumber_id ON etimologi USING btree (sumber_id);

-- 5f. Drop kolom sumber text (sebelumnya NOT NULL default 'LWIM')
ALTER TABLE etimologi DROP COLUMN sumber;
