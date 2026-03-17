/**
 * @fileoverview Redaksi API routes — akses: admin & penyunting (otentikasi + redaksiSaja diterapkan di routes/index.js)
 */

const express = require('express');
const router = express.Router();

// Example route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Admin API is running',
    timestamp: new Date().toISOString()
  });
});

router.use('/pengguna', require('./akses/pengguna'));
router.use('/statistik', require('./ringkasan/statistik'));
router.use('/pencarianHitam', require('./interaksi/pencarianHitam'));
router.use('/kamus', require('./leksikon/kamus'));
router.use('/komentar', require('./interaksi/komentar'));
router.use('/tesaurus', require('./leksikon/tesaurus'));
router.use('/etimologi', require('./leksikon/etimologi'));
router.use('/audit-tagar', require('./audit/auditTagar'));
router.use('/glosarium', require('./leksikon/glosarium'));
router.use('/bidang', require('./master/bidang'));
router.use('/bahasa', require('./master/bahasa'));
router.use('/sumber', require('./master/sumber'));
router.use('/label', require('./master/label'));
router.use('/tagar', require('./master/tagar'));
router.use('/peran', require('./akses/peran'));
router.use('/izin', require('./akses/izin'));
router.use('/audit-makna', require('./audit/auditMakna'));
router.use('/susun-kata', require('./gim/susunKata'));
router.use('/kuis-kata', require('./gim/kuisKata'));

// KADI — Kamus Deskriptif Indonesia
router.use('/kandidat-kata', require('./kadi/kandidatKata'));

module.exports = router;
