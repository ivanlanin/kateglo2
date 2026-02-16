BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lema'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'entri'
  ) THEN
    EXECUTE 'ALTER TABLE public.lema RENAME TO entri';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'makna' AND column_name = 'lema_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'makna' AND column_name = 'entri_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.makna RENAME COLUMN lema_id TO entri_id';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lema_pkey' AND conrelid = 'public.entri'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.entri RENAME CONSTRAINT lema_pkey TO entri_pkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lema_legacy_eid_key' AND conrelid = 'public.entri'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.entri RENAME CONSTRAINT lema_legacy_eid_key TO entri_legacy_eid_key';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lema_lema_check' AND conrelid = 'public.entri'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.entri RENAME CONSTRAINT lema_lema_check TO entri_entri_check';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lema_jenis_check' AND conrelid = 'public.entri'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.entri RENAME CONSTRAINT lema_jenis_check TO entri_jenis_check';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lema_induk_fkey' AND conrelid = 'public.entri'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.entri RENAME CONSTRAINT lema_induk_fkey TO entri_induk_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'makna_lema_id_fkey' AND conrelid = 'public.makna'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.makna RENAME CONSTRAINT makna_lema_id_fkey TO makna_entri_id_fkey';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_lema_induk' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.idx_lema_induk RENAME TO idx_entri_induk';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_lema_induk_aktif_jenis_lema' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.idx_lema_induk_aktif_jenis_lema RENAME TO idx_entri_induk_aktif_jenis_entri';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_lema_jenis' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.idx_lema_jenis RENAME TO idx_entri_jenis';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_lema_lower' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.idx_lema_lower RENAME TO idx_entri_lower';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_lema_serupa_norm_aktif' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.idx_lema_serupa_norm_aktif RENAME TO idx_entri_serupa_norm_aktif';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_lema_trgm' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.idx_lema_trgm RENAME TO idx_entri_trgm';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'lema_legacy_eid_key' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.lema_legacy_eid_key RENAME TO entri_legacy_eid_key';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_makna_lema' AND relkind = 'i') THEN
    EXECUTE 'ALTER INDEX public.idx_makna_lema RENAME TO idx_makna_entri';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entri' AND column_name = 'lema'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entri' AND column_name = 'entri'
  ) THEN
    EXECUTE 'ALTER TABLE public.entri RENAME COLUMN lema TO entri';
  END IF;
END
$$;

COMMIT;
