/**
 * @fileoverview Restore e-taling data from old KBBI4 SQLite into PostgreSQL lafal.
 *
 * The old KBBI4 database marks e-taling with acute accent (é) in the `lafal` column.
 * This script:
 *   1. Reads all kata with é from SQLite
 *   2. Identifies which 'e' positions are taling (é) vs pepet (plain e)
 *   3. Updates the PostgreSQL lafal column: replaces /ə/ with /e/ at matching positions
 *
 * Usage:
 *   node backend/scripts/analisis/restore_etaling.js [--dry-run] [--limit N]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../../db');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PY = path.join(__dirname, '..', '..', '..', '.venv', 'Scripts', 'python.exe');
const SQLITE_DB = path.join(__dirname, '..', '..', '..', '.data', 'kbbi', 'db', 'kbbi4.db');
const TEMP_JSON = path.join(__dirname, '..', '..', 'temp_etaling.json');
const EXTRACT_PY = path.join(__dirname, '..', '..', 'temp_extract_etaling.py');

/**
 * Extract e-taling map from SQLite via Python script.
 * Returns array of { kata, positions } where positions are character indices of e-taling.
 */
function extractEtalingFromSqlite() {
  // Write a Python script to extract data
  const pyCode = `
import sqlite3, json, re, sys

conn = sqlite3.connect(sys.argv[1])
cur = conn.cursor()
rows = cur.execute(
    "SELECT kata, lafal FROM kata WHERE lafal IS NOT NULL AND lafal != '' AND lafal LIKE '%é%'"
).fetchall()

result = []
for kata, lafal in rows:
    clean_kata = re.sub(r'\\s*\\(\\d+\\)$', '', kata).strip().lower()
    clean_lafal = lafal.strip().lower()
    if len(clean_kata) != len(clean_lafal):
        continue
    positions = [i for i, (ck, cl) in enumerate(zip(clean_kata, clean_lafal)) if ck == 'e' and cl == 'é']
    if positions:
        result.append({'kata': clean_kata, 'positions': positions})

conn.close()
with open(sys.argv[2], 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False)
print(f'Exported {len(result)} entries')
`;
  fs.writeFileSync(EXTRACT_PY, pyCode, 'utf-8');
  execFileSync(PY, [EXTRACT_PY, SQLITE_DB, TEMP_JSON], { encoding: 'utf-8', stdio: 'inherit' });
  const data = JSON.parse(fs.readFileSync(TEMP_JSON, 'utf-8'));
  // Cleanup temp files
  fs.unlinkSync(EXTRACT_PY);
  fs.unlinkSync(TEMP_JSON);
  return data;
}

/**
 * Given a kata and its current IPA lafal, plus the e-taling positions from SQLite,
 * replace the corresponding /ə/ in the IPA with /e/.
 *
 * @param {string} kata - the word (lowercase, no homonym suffix)
 * @param {string} currentIpa - current IPA from PostgreSQL (e.g. "a.bam.pə.rə")
 * @param {number[]} etalingPositions - character positions in kata where e is taling
 * @returns {string} updated IPA with e-taling corrections
 */
function applyEtalingToIpa(kata, currentIpa, etalingPositions) {
  if (!currentIpa || !etalingPositions.length) return currentIpa;

  // Map: for each 'e' in kata, find corresponding ə in IPA
  // Strategy: walk kata and IPA in parallel, skipping IPA dots/diacritics
  const kataLower = kata.toLowerCase();
  const ipaChars = [...currentIpa];

  let kataIdx = 0; // position in kata
  let ipaIdx = 0;  // position in IPA string

  // Build a mapping: kata position → IPA position for each 'e'
  const eToIpaMap = {};

  while (kataIdx < kataLower.length && ipaIdx < ipaChars.length) {
    const kc = kataLower[kataIdx];
    const ic = ipaChars[ipaIdx];

    // Skip IPA-only characters (dots, diacritics, etc.)
    if (ic === '.' || ic === '\u032F' || ic === 'ˈ' || ic === 'ˌ') {
      ipaIdx++;
      continue;
    }

    // Handle digraphs in kata → single IPA: ng→ŋ, ny→ɲ, kh→x, sy→ʃ, ngg→ŋɡ, ngk→ŋk
    // and consonant mappings: c→tʃ, j→dʒ, etc.
    // We need to advance kata and IPA differently for these

    if (kc === 'e') {
      // This is an 'e' in kata — record mapping to current IPA position
      if (ic === 'ə' || ic === 'e') {
        eToIpaMap[kataIdx] = ipaIdx;
      }
      kataIdx++;
      ipaIdx++;
      continue;
    }

    // For non-e characters, we need to handle digraphs
    // Check multi-char kata sequences
    const remaining = kataLower.substring(kataIdx);
    const ipaRemaining = currentIpa.substring(ipaIdx);

    let kataAdvance = 1;
    let ipaAdvance = 1;

    if (remaining.startsWith('ngg') && ipaRemaining.startsWith('ŋɡ')) {
      kataAdvance = 3; ipaAdvance = 2;
    } else if (remaining.startsWith('ngk') && ipaRemaining.startsWith('ŋk')) {
      kataAdvance = 3; ipaAdvance = 2;
    } else if (remaining.startsWith('ng') && ic === 'ŋ') {
      kataAdvance = 2; ipaAdvance = 1;
    } else if (remaining.startsWith('ny') && ic === 'ɲ') {
      kataAdvance = 2; ipaAdvance = 1;
    } else if (remaining.startsWith('kh') && ic === 'x') {
      kataAdvance = 2; ipaAdvance = 1;
    } else if (remaining.startsWith('sy') && ic === 'ʃ') {
      kataAdvance = 2; ipaAdvance = 1;
    } else if (kc === 'c' && ipaRemaining.startsWith('tʃ')) {
      kataAdvance = 1; ipaAdvance = 2;
    } else if (kc === 'j' && ipaRemaining.startsWith('dʒ')) {
      kataAdvance = 1; ipaAdvance = 2;
    } else if (kc === 'y' && ic === 'j') {
      kataAdvance = 1; ipaAdvance = 1;
    } else if (kc === 'v' && ic === 'f') {
      kataAdvance = 1; ipaAdvance = 1;
    } else if (kc === 'x' && (ic === 's' || ipaRemaining.startsWith('ks'))) {
      kataAdvance = 1;
      ipaAdvance = ipaRemaining.startsWith('ks') ? 2 : 1;
    } else if (kc === 'k' && (ic === 'ʔ' || ipaRemaining.startsWith('kʔ'))) {
      kataAdvance = 1;
      ipaAdvance = ipaRemaining.startsWith('kʔ') ? 2 : 1;
    } else if (kc === "'" && ic === 'ʔ') {
      kataAdvance = 1; ipaAdvance = 1;
    } else {
      // Check for allophone: i→ɪ, u→ʊ
      if (kc === 'i' && ic === 'ɪ') {
        kataAdvance = 1; ipaAdvance = 1;
      } else if (kc === 'u' && ic === 'ʊ') {
        kataAdvance = 1; ipaAdvance = 1;
      } else if (kc === '-' && ic === '.') {
        kataAdvance = 1; ipaAdvance = 1;
      } else {
        // Default 1:1
        kataAdvance = 1; ipaAdvance = 1;
      }
    }

    kataIdx += kataAdvance;
    ipaIdx += ipaAdvance;
  }

  // Now apply e-taling: replace ə with e at the mapped positions
  const result = [...currentIpa];
  let applied = 0;
  for (const pos of etalingPositions) {
    if (pos in eToIpaMap) {
      const ipaPos = eToIpaMap[pos];
      if (result[ipaPos] === 'ə') {
        result[ipaPos] = 'e';
        applied++;
      }
    }
  }

  if (applied === 0) return currentIpa;

  // Apply ɛ lowering (TBBBI §3.2.1.3):
  // /e/ → [ɛ] in final closed syllable + backward harmony
  const ipaStr = result.join('');
  return applyEpsilonHarmony(ipaStr);
}

/**
 * Apply /e/ → [ɛ] lowering with backward harmony on a dot-separated IPA string.
 *
 * TBBBI §3.2.1.3: /e/ → [ɛ] if in final closed syllable.
 * If last syllable has [ɛ], preceding open syllables with /e/ also lower to [ɛ].
 *
 * @param {string} ipa - dot-separated IPA string
 * @returns {string} IPA with ɛ lowering applied
 */
function applyEpsilonHarmony(ipa) {
  const consonants = 'bpdtɡkfszʃxhmnɲŋrlwjʔ';
  const syllables = ipa.split('.');
  const len = syllables.length;
  if (len === 0) return ipa;

  const lastSyl = syllables[len - 1];
  // Check if last syllable is closed
  let lastBase = lastSyl[lastSyl.length - 1];
  if (lastBase === '\u032F' && lastSyl.length > 1) lastBase = lastSyl[lastSyl.length - 2];
  const lastClosed = consonants.includes(lastBase);

  if (!lastClosed) return ipa;

  // Lower /e/ → [ɛ] in last closed syllable
  if (!syllables[len - 1].includes('e')) return ipa;
  syllables[len - 1] = syllables[len - 1].replace(/e/g, 'ɛ');

  // Backward harmony: propagate ɛ to preceding open syllables with /e/
  for (let i = len - 2; i >= 0; i--) {
    const syl = syllables[i];
    let sLast = syl[syl.length - 1];
    if (sLast === '\u032F' && syl.length > 1) sLast = syl[syl.length - 2];
    const closed = consonants.includes(sLast);
    if (closed) break; // harmony stops at closed syllable

    if (syl.includes('e')) {
      syllables[i] = syl.replace(/e/g, 'ɛ');
    } else {
      break; // no matching vowel to harmonize
    }
  }

  return syllables.join('.');
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;

  console.log('\n🔤 Restore e-taling from KBBI4 SQLite');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (limit) console.log(`   Limit: ${limit}`);

  // Step 1: Extract e-taling data from SQLite
  console.log('   Extracting e-taling data from SQLite...');
  const etalingData = extractEtalingFromSqlite();
  console.log(`   Found ${etalingData.length} kata with e-taling markers`);

  // Build lookup map: kata → positions
  const etalingMap = new Map();
  for (const item of etalingData) {
    // Some kata may appear multiple times (homonyms) — same lafal applies
    etalingMap.set(item.kata, item.positions);
  }

  // Step 2: Fetch matching entries from PostgreSQL
  const fetchLimit = limit || etalingMap.size * 2; // some entries have homonyms
  const pgResult = await db.query(
    `SELECT id, entri, indeks, lafal
     FROM entri
     WHERE aktif = 1
       AND lafal IS NOT NULL AND BTRIM(lafal) != ''
       AND entri ~* 'e'
     ORDER BY id
     LIMIT $1`,
    [fetchLimit]
  );

  console.log(`   PostgreSQL entries with 'e' and lafal: ${pgResult.rows.length}`);

  let matched = 0;
  let updated = 0;
  let unchanged = 0;
  const samples = [];
  const pendingUpdates = [];

  for (const row of pgResult.rows) {
    const kata = String(row.entri || '').trim().replace(/\s*\(\d+\)$/, '').toLowerCase();
    const positions = etalingMap.get(kata);
    if (!positions) continue;

    matched++;
    const oldIpa = row.lafal;
    const newIpa = applyEtalingToIpa(kata, oldIpa, positions);

    if (newIpa !== oldIpa) {
      pendingUpdates.push({ id: row.id, ipa: newIpa });
      updated++;
      if (samples.length < 30) {
        samples.push({ kata, old: oldIpa, new: newIpa, positions });
      }
    } else {
      unchanged++;
    }
  }

  console.log(`   Matched: ${matched}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Unchanged: ${unchanged}`);

  // Show samples
  if (samples.length > 0) {
    console.log('\n   Sample corrections:');
    console.log('   ' + '-'.repeat(70));
    for (const s of samples) {
      console.log(`   ${s.kata.padEnd(22)} /${s.old}/ → /${s.new}/   (pos: ${s.positions.join(',')})`);
    }
    console.log('   ' + '-'.repeat(70));
  }

  // Batch update
  if (!dryRun && pendingUpdates.length > 0) {
    const BATCH_SIZE = 500;
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
      process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, pendingUpdates.length)}/${pendingUpdates.length}`);
    }
    console.log();
  }

  if (dryRun) console.log('\n   (dry run — no changes written)\n');
  await db.close();
}

module.exports = { applyEtalingToIpa, applyEpsilonHarmony };

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal:', err.message);
    db.close();
    process.exit(1);
  });
}
