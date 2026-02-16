/**
 * @fileoverview Main API router
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { adminSaja } = require('../middleware/otorisasi');

const router = express.Router();
const publikRouter = require('./publik');
const redaksiRouter = require('./redaksi');

// Public routes
router.use('/publik', publikRouter);

// Redaksi routes
router.use('/redaksi', authenticate, adminSaja, redaksiRouter);

module.exports = router;
