/**
 * @fileoverview Route API publik — semua endpoint tanpa autentikasi
 */

const express = require('express');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Public API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/beranda', require('./beranda'));
router.use('/pencarian', require('./pencarian'));
router.use('/kamus', require('./kamus'));
router.use('/glosarium', require('./glosarium'));
router.use('/peribahasa', require('./peribahasa'));
router.use('/singkatan', require('./singkatan'));

// Legacy aliases (backward compatibility)
router.use('/search', require('./pencarian'));
router.use('/dictionary', require('./kamus'));

module.exports = router;
