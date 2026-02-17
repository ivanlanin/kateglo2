BEGIN;

DO $$
DECLARE
  rec RECORD;
  old_trigger_name TEXT;
BEGIN
  FOR rec IN
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()',
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()',
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'UPDATE %I.%I
       SET created_at = COALESCE(created_at, NOW()),
           updated_at = COALESCE(updated_at, created_at, NOW())
       WHERE created_at IS NULL
          OR updated_at IS NULL',
      rec.table_schema,
      rec.table_name
    );

    old_trigger_name := format('trg_set_created_fields__%s', rec.table_name);
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I.%I',
      old_trigger_name,
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'ALTER TABLE %I.%I DROP COLUMN IF EXISTS created_by',
      rec.table_schema,
      rec.table_name
    );
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS set_created_fields();

CREATE OR REPLACE FUNCTION set_timestamp_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, NOW());
    NEW.updated_at := COALESCE(NEW.updated_at, NEW.created_at, NOW());
    RETURN NEW;
  END IF;

  NEW.created_at := COALESCE(NEW.created_at, OLD.created_at, NOW());
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$;

DO $$
DECLARE
  rec RECORD;
  trigger_name TEXT;
BEGIN
  FOR rec IN
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  LOOP
    trigger_name := format('trg_set_timestamp_fields__%s', rec.table_name);

    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I.%I',
      trigger_name,
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'CREATE TRIGGER %I
       BEFORE INSERT OR UPDATE ON %I.%I
       FOR EACH ROW
       EXECUTE FUNCTION set_timestamp_fields()',
      trigger_name,
      rec.table_schema,
      rec.table_name
    );
  END LOOP;
END;
$$;

COMMIT;
