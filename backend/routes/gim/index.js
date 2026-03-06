/**
 * @fileoverview Route publik untuk modul gim
 */

const express = require('express');

const router = express.Router();

router.use('/susun-kata', require('./susunKata'));
router.use('/pilih-ganda', require('./pilihGanda'));

module.exports = router;
