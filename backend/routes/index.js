/**
 * @fileoverview Main API router
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { adminSaja } = require('../middleware/otorisasi');

const router = express.Router();

// Public routes (no authentication required)
router.use('/public', require('./api/public'));

// Admin routes (authentication + admin role required)
router.use('/admin', authenticate, adminSaja, require('./api/admin'));

module.exports = router;
