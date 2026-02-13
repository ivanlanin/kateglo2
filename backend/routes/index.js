/**
 * @fileoverview Main API router
 */

const express = require('express');
const router = express.Router();

// Public routes (no authentication required)
router.use('/public', require('./api/public'));

// Admin routes (authentication required)
// TODO: Add authentication middleware
// const { authenticate, adminOnly } = require('../middleware/auth');
// router.use('/admin', authenticate, adminOnly, require('./api/admin'));
router.use('/admin', require('./api/admin'));

module.exports = router;
