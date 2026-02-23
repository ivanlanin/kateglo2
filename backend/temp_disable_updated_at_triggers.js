require('dotenv').config({ path: '.env' });
const db = require('./db');

async function main() {
  await db.query('ALTER TABLE makna DISABLE TRIGGER trg_set_timestamp_fields__makna');
  await db.query('ALTER TABLE makna DISABLE TRIGGER trg_touch_entri_updated_at_from_makna');

  const result = await db.query(`
    SELECT tgname, tgenabled
    FROM pg_trigger
    WHERE tgname IN ('trg_set_timestamp_fields__makna', 'trg_touch_entri_updated_at_from_makna')
    ORDER BY tgname
  `);

  console.log(JSON.stringify(result.rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
