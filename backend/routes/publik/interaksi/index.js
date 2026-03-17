/**
 * @fileoverview Route API publik domain interaksi
 */

const express = require('express');

const router = express.Router();

router.use('/pencarian', require('./pencarian'));

module.exports = router;