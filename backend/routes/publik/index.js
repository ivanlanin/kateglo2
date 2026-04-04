/**
 * @fileoverview Route API publik — semua endpoint tanpa autentikasi
 */

const express = require('express');
const { publicApiLimiter } = require('../../middleware/rateLimiter');
const router = express.Router();

function tandaiAuthPublikDeprecated(_req, res, next) {
  res.set('Deprecation', 'true');
  res.set('Link', '</api/pengguna/me>; rel="successor-version"');
  return next();
}

router.use(publicApiLimiter);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Public API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/leipzig', require('./leipzig'));
router.use('/', require('./leksikon'));
router.use('/', require('./interaksi'));
router.use('/gim', require('./gim'));
router.use('/artikel', require('./artikel'));
router.use('/auth', tandaiAuthPublikDeprecated, require('../sistem/authPengguna'));

module.exports = router;
