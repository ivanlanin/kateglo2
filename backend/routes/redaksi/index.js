/**
 * @fileoverview Admin API routes (protected)
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
router.use('/kamus', require('./kamus'));
router.use('/komentar', require('./komentar'));
router.use('/tesaurus', require('./tesaurus'));
router.use('/glosarium', require('./glosarium'));
router.use('/label', require('./label'));

module.exports = router;
