/**
 * @fileoverview Public API routes
 */

const express = require('express');
const router = express.Router();

// Example route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Public API is running',
    timestamp: new Date().toISOString()
  });
});

// TODO: Add public routes
// router.use('/search', require('./search'));
// router.use('/dictionary', require('./dictionary'));
// router.use('/glossary', require('./glossary'));
// router.use('/proverb', require('./proverb'));

module.exports = router;
