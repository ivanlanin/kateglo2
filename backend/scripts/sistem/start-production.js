/**
 * @fileoverview Menjalankan backend dalam mode production untuk simulasi lokal.
 */

process.env.NODE_ENV = 'production';

const logger = require('../../config/logger');
const { sinkronkanKorpusLeipzigSaatStartup } = require('../../services/sistem/layananLeipzigR2');

async function main() {
	await sinkronkanKorpusLeipzigSaatStartup();
	require('../../index');
}

main().catch((error) => {
	logger.error('Gagal menyiapkan startup production', error);
	process.exit(1);
});
