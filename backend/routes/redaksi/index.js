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

router.use('/pengguna', require('./pengguna'));
router.use('/statistik', require('./statistik'));
router.use('/pencarianHitam', require('./pencarianHitam'));
router.use('/kamus', require('./kamus'));
router.use('/komentar', require('./komentar'));
router.use('/tesaurus', require('./tesaurus'));
router.use('/etimologi', require('./etimologi'));
router.use('/audit-tagar', require('./auditTagar'));
router.use('/glosarium', require('./glosarium'));
router.use('/bidang', require('./bidang'));
router.use('/bahasa', require('./bahasa'));
router.use('/sumber', require('./sumber'));
router.use('/label', require('./label'));
router.use('/tagar', require('./tagar'));
router.use('/peran', require('./peran'));
router.use('/izin', require('./izin'));
router.use('/audit-makna', require('./auditMakna'));
router.use('/susun-kata', require('./susunKata'));
router.use('/kuis-kata', require('./kuisKata'));

// KADI — Kamus Deskriptif Indonesia
router.use('/kandidat-kata', require('./kadi/kandidatKata'));

module.exports = router;
