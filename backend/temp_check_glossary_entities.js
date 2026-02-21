require('dotenv').config({ path: '.env' });
const db = require('./db');

async function check() {
  // Count total glossary entries
  const total = await db.query("SELECT COUNT(*) FROM glossary");
  console.log("Total glossary:", total.rows[0].count);

  // Count entries with HTML entities in 'original' field
  const withEntities = await db.query(`
    SELECT COUNT(*) FROM glossary 
    WHERE original ~ '&#[0-9]+;'
  `);
  console.log("Entries with HTML entities:", withEntities.rows[0].count);

  // Find which entities are used and how many times
  const entityCounts = await db.query(`
    SELECT 
      regexp_matches(original, '&#[0-9]+;', 'g') AS entity,
      COUNT(*) AS cnt
    FROM glossary
    WHERE original ~ '&#[0-9]+;'
    GROUP BY entity
    ORDER BY cnt DESC
    LIMIT 20
  `);
  console.log("\nEntity usage counts:");
  entityCounts.rows.forEach(r => {
    const code = parseInt(r.entity[0].replace('&#', '').replace(';', ''));
    const char = String.fromCharCode(code);
    console.log(`  ${r.entity[0]} → '${char}' (U+${code.toString(16).toUpperCase().padStart(4,'0')}): ${r.cnt} times`);
  });

  // Show a few samples
  const samples = await db.query(`
    SELECT phrase, original FROM glossary 
    WHERE original ~ '&#[0-9]+;'
    LIMIT 10
  `);
  console.log("\nSamples:");
  samples.rows.forEach(r => console.log(`  "${r.phrase}" → "${r.original}"`));

  db.close();
}

check().catch(e => { console.error(e.message); db.close(); });
