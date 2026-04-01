/**
 * @fileoverview Unggah artefak SQLite Leipzig ke Cloudflare R2.
 *
 * Penggunaan:
 *   node scripts/leipzig/uploadKorpusR2.js ind_news_2024_10K
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env'), override: true });
const { uploadCorpusSqliteToR2 } = require('../../services/sistem/layananLeipzigR2');

async function main() {
  const corpusId = process.argv[2];
  if (!corpusId) throw new Error('Gunakan: node scripts/leipzig/uploadKorpusR2.js <korpusId>');

  const result = await uploadCorpusSqliteToR2(corpusId);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});