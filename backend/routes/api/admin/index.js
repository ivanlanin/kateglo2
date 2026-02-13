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

// TODO: Add admin routes
// router.use('/phrases', require('./phrases'));
// router.use('/definitions', require('./definitions'));
// router.use('/users', require('./users'));
// router.use('/analytics', require('./analytics'));

module.exports = router;
