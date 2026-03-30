/**
 * @fileoverview Generate IPA pronunciation for Indonesian entries that lack `lafal`.
 *
 * Uses standard IPA notation with allophonic detail based on TBBBI rules:
 *   - 6 vowels:      /i, e, ə, a, o, u/
 *   - 22 consonants (IPA): /b, p, d, t, ɡ, k, dʒ, tʃ, f, s, z, ʃ, x, h, m, n, ɲ, ŋ, r, l, w, j/
 *   - 4 diphthongs:  /ai̯, au̯, oi̯, ei̯/
 *
 * Allophone rules (TBBBI §3.2.1 & §3.2.4):
 *   - /i/ → [ɪ] in final closed syllable (unstressed) (§3.2.1.1)
 *   - /u/ → [ʊ] in final closed syllable (unstressed) (§3.2.1.2)
 *   - /e/ → [ɛ] in final closed syllable + backward harmony (§3.2.1.3)
 *   - /o/ → [ɔ] in final closed syllable + backward harmony (§3.2.1.4)
 *   - /k/ → [kʔ] word-finally — unreleased velar + glottal (§3.2.4.3)
 *   - <v>  → /f/ (standard Indonesian realization)
 *   - <x>  → /s/ at word start (e.g. xilofon → silofon), /ks/ elsewhere
 *
 * The main ambiguity is the letter 'e' which can be /ə/ (pepet) or /e/ (taling).
 * This distinction is lexical (TBBBI §3.2.1.3 vs §3.2.1.5) — cannot be fully
 * resolved by rules. Defaults to /ə/; editors review for correct e/ə assignment.
 *
 * Usage:
 *   node backend/scripts/analisis/generate_lafal_ipa.js [--dry-run] [--limit N]
 *
 * Flags:
 *   --dry-run    Preview without writing to DB
 *   --limit N    Process only N entries (default: all)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../../db');

// ── IPA Mapping (with Indonesian allophone rules) ───────────────────────

/**
 * Consonant digraphs — orthographic sequences that map to single phonemes.
 * Order matters: check longer sequences first (ngg before ng).
 */
const DIGRAPH_MAP = [
  ['ngg', 'ŋɡ'],
  ['ngk', 'ŋk'],
  ['ng', 'ŋ'],
  ['ny', 'ɲ'],
  ['kh', 'x'],
  ['sy', 'ʃ'],
];

/**
 * Single consonant → IPA.
 * Note: 'v' → /f/ (standard Indonesian realization per TBBBI).
 * Note: 'x' is handled specially in graphemeToIpa (word-initial → /s/, else → /ks/).
 */
const CONSONANT_MAP = {
  b: 'b',
  c: 'tʃ',
  d: 'd',
  f: 'f',
  g: 'ɡ',   // IPA ɡ (U+0261)
  h: 'h',
  j: 'dʒ',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  p: 'p',
  q: 'k',
  r: 'r',
  s: 's',
  t: 't',
  v: 'f',   // Indonesian realization of <v> is [f]
  w: 'w',
  // x: handled in graphemeToIpa (word-initial /s/, else /ks/)
  y: 'j',   // IPA /j/ for palatal semivowel
  z: 'z',
};

/** Vowel → IPA (e is ambiguous, handled separately) */
const VOWEL_MAP = {
  a: 'a',
  i: 'i',
  o: 'o',
  u: 'u',
};

/**
 * Diphthongs → IPA with non-syllabic diacritic.
 * Ref: TBBBI §3.2.2 — /ai̯, au̯, oi̯, ei̯/
 */
const DIPHTHONG_MAP = {
  ai: 'ai̯',
  au: 'au̯',
  oi: 'oi̯',
  ei: 'ei̯',
};

// ── Core Conversion ─────────────────────────────────────────────────────

/**
 * Convert a grapheme chunk to IPA.
 *
 * Unmarked 'e' defaults to /ə/ (pepet). The /e/ vs /ə/ distinction is lexical
 * and cannot be determined from orthography alone.
 * Explicitly marked é/è are treated as taling /e/.
 *
 * @param {string} text - grapheme text to convert
 * @param {boolean} [isWordStart=false] - true when this chunk is at word start (for x→s rule)
 */
function graphemeToIpa(text, isWordStart = false) {
  let result = '';
  let i = 0;
  const lower = text.toLowerCase();

  while (i < lower.length) {
    let matched = false;

    // Try diphthongs (only if next char is not a consonant that starts a new syllable)
    for (const [digraph, ipa] of Object.entries(DIPHTHONG_MAP)) {
      if (lower.startsWith(digraph, i)) {
        // Only treat as diphthong if at word end or followed by consonant
        const afterIdx = i + digraph.length;
        if (afterIdx >= lower.length || !isVowel(lower[afterIdx])) {
          result += ipa;
          i += digraph.length;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;

    // Try consonant digraphs
    for (const [digraph, ipa] of DIGRAPH_MAP) {
      if (lower.startsWith(digraph, i)) {
        result += ipa;
        i += digraph.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = lower[i];

    // Vowels
    if (ch === 'e' || ch === 'é' || ch === 'è') {
      // é/è explicitly marked → taling
      if (ch === 'é' || ch === 'è') {
        result += 'e';
      } else {
        // Default: schwa for unmarked 'e'
        result += 'ə';
      }
      i++;
      continue;
    }

    if (VOWEL_MAP[ch]) {
      result += VOWEL_MAP[ch];
      i++;
      continue;
    }

    // Single consonants
    if (CONSONANT_MAP[ch]) {
      result += CONSONANT_MAP[ch];
      i++;
      continue;
    }

    // 'x': word-initial → /s/ (e.g. xilofon → silofon), otherwise → /ks/
    if (ch === 'x') {
      result += (i === 0 && isWordStart) ? 's' : 'ks';
      i++;
      continue;
    }

    // Apostrophe → glottal stop
    if (ch === '\'' || ch === '\u2019') {
      result += 'ʔ';
      i++;
      continue;
    }

    // Hyphen (compound word separator) → keep as .
    if (ch === '-') {
      result += '.';
      i++;
      continue;
    }

    // Skip unknown characters
    i++;
  }

  return result;
}

function isVowel(ch) {
  return 'aiueoéè'.includes(ch);
}

/**
 * Generate IPA for an Indonesian word.
 * Uses pemenggalan (syllabification) if available to add syllable dots.
 * Applies allophone rules per TBBBI §3.2.1 & §3.2.4:
 *   - /i/ → [ɪ] in final closed syllable (unstressed) (§3.2.1.1)
 *   - /u/ → [ʊ] in final closed syllable (unstressed) (§3.2.1.2)
 *   - /e/ → [ɛ] in final closed syllable, with backward harmony (§3.2.1.3)
 *   - /o/ → [ɔ] in final closed syllable, with backward harmony (§3.2.1.4)
 *   - Word-final /k/ kept as /k/ (broad transcription; TBBBI §3.2.4.3 notes
 *     free variation [k] ~ [k̚] ~ [ʔ])
 */
function generateIpa(entri, pemenggalan = '') {
  const kata = String(entri || '').trim().toLowerCase();
  if (!kata) return '';

  let ipa;

  // If pemenggalan available, process syllable by syllable
  if (pemenggalan) {
    const syllables = pemenggalan
      .split(/[·.]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (syllables.length > 1) {
      // Step 1: Convert each syllable to base IPA
      const ipaSyllables = syllables.map((syl, idx) =>
        graphemeToIpa(syl, idx === 0)
      );

      // Step 2: Apply allophones with syllable context
      applyAllSyllableAllophones(ipaSyllables);

      ipa = ipaSyllables.join('.');
    }
  }

  if (!ipa) {
    // No syllabification — process whole word, basic allophones only
    ipa = graphemeToIpa(kata, true);
  }

  // Word-final /k/: kept as /k/ (broad transcription).
  // TBBBI §3.2.4.3: free variation [k] ~ [k̚] ~ [ʔ] — no single correct form.

  return ipa;
}

/**
 * Check if an IPA syllable is closed (ends with consonant).
 */
function isSyllableClosed(syl) {
  if (!syl) return false;
  const consonants = 'bpdtɡkfszʃxhmnɲŋrlwjʔ';
  // Check last base char (skip combining diacritics like ̯ U+032F)
  let last = syl[syl.length - 1];
  if (last === '\u032F' && syl.length > 1) last = syl[syl.length - 2]; // non-syllabic
  return consonants.includes(last);
}

/**
 * Apply allophone rules across all syllables of a word.
 * Mutates the ipaSyllables array in place.
 *
 * TBBBI rules:
 *   - /i/ → [ɪ] and /u/ → [ʊ]: only in LAST closed syllable (unstressed)
 *   - /e/ → [ɛ]: in last closed syllable + backward harmony to preceding open /e/
 *   - /o/ → [ɔ]: in last closed syllable + backward harmony to preceding open /o/
 *   - Harmony: if last syllable has [ɛ]/[ɔ], any /e//o/ in preceding open syllables
 *     with the SAME vowel also lower. E.g. nenek → nɛnɛk, rokok → rɔkɔk
 *
 * @param {string[]} ipaSyllables - array of IPA syllables (mutated in place)
 */
function applyAllSyllableAllophones(ipaSyllables) {
  const len = ipaSyllables.length;
  if (len === 0) return;

  const lastIdx = len - 1;
  const lastSyl = ipaSyllables[lastIdx];

  // Only apply vowel lowering if last syllable is closed
  if (!isSyllableClosed(lastSyl)) return;

  // /i/ → [ɪ] in last closed syllable only
  if (lastSyl.includes('i')) {
    ipaSyllables[lastIdx] = lastSyl.replace(/i/g, 'ɪ');
  }
  // /u/ → [ʊ] in last closed syllable only
  if (ipaSyllables[lastIdx].includes('u')) {
    ipaSyllables[lastIdx] = ipaSyllables[lastIdx].replace(/u/g, 'ʊ');
  }

  // /e/ → [ɛ] in last closed syllable + backward harmony
  let hasELowering = false;
  if (ipaSyllables[lastIdx].includes('e')) {
    ipaSyllables[lastIdx] = ipaSyllables[lastIdx].replace(/e/g, 'ɛ');
    hasELowering = true;
  }

  // /o/ → [ɔ] in last closed syllable + backward harmony
  let hasOLowering = false;
  if (ipaSyllables[lastIdx].includes('o')) {
    ipaSyllables[lastIdx] = ipaSyllables[lastIdx].replace(/o/g, 'ɔ');
    hasOLowering = true;
  }

  // Backward vowel harmony: propagate lowering to preceding OPEN syllables
  for (let i = lastIdx - 1; i >= 0; i--) {
    const syl = ipaSyllables[i];
    if (isSyllableClosed(syl)) break; // harmony stops at closed syllable

    let changed = false;
    if (hasELowering && syl.includes('e')) {
      ipaSyllables[i] = syl.replace(/e/g, 'ɛ');
      changed = true;
    }
    if (hasOLowering && ipaSyllables[i].includes('o')) {
      ipaSyllables[i] = ipaSyllables[i].replace(/o/g, 'ɔ');
      changed = true;
    }
    if (!changed) break; // no matching vowel to harmonize
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : null;

  console.log(`\n🔤 Generate IPA lafal for Indonesian entries`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no DB writes)' : 'LIVE'}${force ? ' (FORCE regenerate all)' : ''}`);
  if (limit) console.log(`   Limit: ${limit} entries`);

  // Count target entries
  const whereClause = force
    ? 'WHERE aktif = 1'
    : "WHERE aktif = 1 AND (lafal IS NULL OR BTRIM(lafal) = '')";
  const countRes = await db.query(`SELECT COUNT(*) AS total FROM entri ${whereClause}`);
  const total = parseInt(countRes.rows[0].total, 10);
  console.log(`   Target entries: ${total}`);

  if (total === 0) {
    console.log('   Nothing to do.\n');
    await db.close();
    return;
  }

  // Fetch entries
  const fetchLimit = limit || total;
  const res = await db.query(
    `SELECT id, entri, indeks, pemenggalan
     FROM entri
     ${whereClause}
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
    // Strip trailing homonym number suffix, e.g. "seri (1)" → "seri"
    const kata = String(row.entri || '').trim().replace(/\s*\(\d+\)$/, '');
    if (!kata || /\s/.test(kata)) {
      skipped++;
      continue;
    }

    const ipa = generateIpa(kata, row.pemenggalan);
    if (!ipa) {
      skipped++;
      continue;
    }

    if (samples.length < 20) {
      samples.push({ entri: kata, pemenggalan: row.pemenggalan || '-', ipa });
    }

    pendingUpdates.push({ id: row.id, ipa });
    updated++;
  }

  // Batch UPDATE using unnest for efficiency with remote DB
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

  console.log('   Sample output:');
  console.log('   ' + '-'.repeat(60));
  for (const s of samples) {
    console.log(`   ${s.entri.padEnd(20)} ${s.pemenggalan.padEnd(20)} → /${s.ipa}/`);
  }
  console.log('   ' + '-'.repeat(60));
  console.log(`\n   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  if (dryRun) console.log('   (dry run — no changes written)\n');

  await db.close();
}

// Export for reuse by normalize_lafal.js
module.exports = { generateIpa, graphemeToIpa };

// Run main only when executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal:', err.message);
    db.close();
    process.exit(1);
  });
}
