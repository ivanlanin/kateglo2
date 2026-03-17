/**
 * @fileoverview Route API publik — semua endpoint tanpa autentikasi
 */

const express = require('express');
const { publicApiLimiter } = require('../../middleware/rateLimiter');
const router = express.Router();

router.use(publicApiLimiter);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Public API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/', require('./leksikon'));
router.use('/pencarian', require('./pencarian'));
router.use('/gim', require('./gim'));
router.use('/auth', require('./auth'));

module.exports = router;
