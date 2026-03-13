/**
 * @fileoverview Script standalone: jalankan proses Wikipedia KADI
 *
 * Penggunaan:
 *   node scripts/kadi/baca_wikipedia.js
 *   node scripts/kadi/baca_wikipedia.js --limit 10
 *   node scripts/kadi/baca_wikipedia.js --dry-run
 *   node scripts/kadi/baca_wikipedia.js --limit 5 --dry-run
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../../db');
const { jalankanProsesWikipedia } = require('../../jobs/kadi/jobWikipedia');

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const batasArtikel = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 50 : 50;
const dryRun = args.includes('--dry-run');

console.log(`\n=== KADI Wikipedia Scraper ===`);
console.log(`Batas artikel: ${batasArtikel}`);
console.log(`Dry run: ${dryRun ? 'YA' : 'TIDAK'}`);
console.log('');

jalankanProsesWikipedia({ batasArtikel, dryRun })
  .then((stats) => {
    console.log('\n=== Hasil ===');
    console.log(JSON.stringify(stats, null, 2));
    return db.close();
  })
  .catch((err) => {
    console.error('FATAL:', err);
    return db.close().then(() => process.exit(1));
  });
