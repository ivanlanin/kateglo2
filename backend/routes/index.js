/**
 * @fileoverview Main API router
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { redaksiSaja } = require('../middleware/authorization');

const router = express.Router();
const authPenggunaRouter = require('./sistem/authPengguna');
const publikRouter = require('./publik');
const redaksiRouter = require('./redaksi');

router.use('/pengguna', authPenggunaRouter);

// Public routes
router.use('/publik', publikRouter);

// Redaksi routes — akses: admin & penyunting; otorisasi per endpoint via periksaIzin
router.use('/redaksi', authenticate, redaksiSaja, redaksiRouter);

module.exports = router;
