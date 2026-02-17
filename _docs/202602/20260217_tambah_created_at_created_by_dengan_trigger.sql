BEGIN;

CREATE OR REPLACE FUNCTION set_created_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  actor TEXT;
BEGIN
  actor := NULLIF(current_setting('app.user_id', true), '');

  IF actor IS NULL THEN
    actor := NULLIF(current_setting('app.username', true), '');
  END IF;

  IF actor IS NULL THEN
    actor := session_user;
  END IF;

  NEW.created_at := COALESCE(NEW.created_at, NOW());
  NEW.created_by := COALESCE(NULLIF(BTRIM(NEW.created_by), ''), actor, 'system');

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
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()',
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT ''system''',
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'UPDATE %I.%I
       SET created_at = COALESCE(created_at, NOW()),
           created_by = COALESCE(NULLIF(BTRIM(created_by), ''''), ''system'')
       WHERE created_at IS NULL
          OR created_by IS NULL
          OR BTRIM(created_by) = ''''',
      rec.table_schema,
      rec.table_name
    );

    trigger_name := format('trg_set_created_fields__%s', rec.table_name);

    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I.%I',
      trigger_name,
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'CREATE TRIGGER %I
       BEFORE INSERT ON %I.%I
       FOR EACH ROW
       EXECUTE FUNCTION set_created_fields()',
      trigger_name,
      rec.table_schema,
      rec.table_name
    );
  END LOOP;
END;
$$;

COMMIT;
