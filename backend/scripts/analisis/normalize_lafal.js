/**
 * @fileoverview Normalize old-format lafal entries to consistent IPA with syllable dots.
 *
 * Old entries use ê (circumflex) for schwa and lack syllable dot separators.
 * This script regenerates lafal for those entries using the same IPA rules as
 * generate_lafal_ipa.js, producing consistent ə notation with dots from pemenggalan.
 *
 * Usage:
 *   node backend/scripts/analisis/normalize_lafal.js [--dry-run] [--limit N]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../../db');

// Reuse generateIpa from the generator
const { generateIpa } = require('./generate_lafal_ipa');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;

  console.log('\n🔄 Normalize old-format lafal entries');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (limit) console.log(`   Limit: ${limit} entries`);

  // Old format: contains ê OR has no dots (single-char lafal exempt)
  const countRes = await db.query(
    `SELECT COUNT(*) AS total FROM entri
     WHERE aktif = 1 AND lafal IS NOT NULL AND BTRIM(lafal) != ''
       AND (lafal LIKE '%ê%' OR (LENGTH(lafal) > 1 AND lafal NOT LIKE '%.%'))`
  );
  const total = parseInt(countRes.rows[0].total, 10);
  console.log(`   Old-format entries found: ${total}`);

  if (total === 0) {
    console.log('   Nothing to normalize.\n');
    await db.close();
    return;
  }

  const fetchLimit = limit || total;
  const res = await db.query(
    `SELECT id, entri, indeks, pemenggalan, lafal
     FROM entri
     WHERE aktif = 1 AND lafal IS NOT NULL AND BTRIM(lafal) != ''
       AND (lafal LIKE '%ê%' OR (LENGTH(lafal) > 1 AND lafal NOT LIKE '%.%'))
     ORDER BY id
     LIMIT $1`,
    [fetchLimit]
  );

  const entries = res.rows;
  console.log(`   Processing ${entries.length} entries...\n`);

  let updated = 0;
  let skipped = 0;
  const samples = [];
  const BATCH_SIZE = 500;
  const pendingUpdates = [];

  for (const row of entries) {
    const kata = String(row.entri || '').trim().replace(/\s*\(\d+\)$/, '');
    if (!kata || /\s/.test(kata)) {
      skipped++;
      continue;
    }

    const newIpa = generateIpa(kata, row.pemenggalan);
    if (!newIpa) {
      skipped++;
      continue;
    }

    // Skip if already identical
    if (newIpa === row.lafal) {
      skipped++;
      continue;
    }

    if (samples.length < 20) {
      samples.push({ entri: kata, old: row.lafal, new: newIpa });
    }

    pendingUpdates.push({ id: row.id, ipa: newIpa });
    updated++;
  }

  // Batch UPDATE
  if (!dryRun && pendingUpdates.length > 0) {
    for (let i = 0; i < pendingUpdates.length; i += BATCH_SIZE) {
      const batch = pendingUpdates.slice(i, i + BATCH_SIZE);
      const ids = batch.map((r) => r.id);
      const ipas = batch.map((r) => r.ipa);
      await db.query(
        `UPDATE entri SET lafal = t.ipa
         FROM unnest($1::int[], $2::text[]) AS t(id, ipa)
         WHERE entri.id = t.id`,
        [ids, ipas]
      );
      const done = Math.min(i + BATCH_SIZE, pendingUpdates.length);
      process.stdout.write(`\r   Progress: ${done}/${pendingUpdates.length}`);
    }
    console.log();
  }

  console.log('   Sample changes:');
  console.log('   ' + '-'.repeat(70));
  for (const s of samples) {
    console.log(`   ${s.entri.padEnd(18)} ${s.old.padEnd(22)} → ${s.new}`);
  }
  console.log('   ' + '-'.repeat(70));
  console.log(`\n   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  if (dryRun) console.log('   (dry run — no changes written)\n');

  await db.close();
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  db.close();
  process.exit(1);
});
