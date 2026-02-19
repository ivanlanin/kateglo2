/**
 * @fileoverview Main API router
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { redaksiSaja } = require('../middleware/otorisasi');

const router = express.Router();
const publikRouter = require('./publik');
const redaksiRouter = require('./redaksi');

// Public routes
router.use('/publik', publikRouter);

// Redaksi routes — akses: admin & penyunting; otorisasi per endpoint via periksaIzin
router.use('/redaksi', authenticate, redaksiSaja, redaksiRouter);

module.exports = router;
