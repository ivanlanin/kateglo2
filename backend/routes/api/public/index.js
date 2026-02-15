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

router.use('/kamus', require('./kamus'));
router.use('/tesaurus', require('./tesaurus'));
router.use('/glosarium', require('./glosarium'));

module.exports = router;
