/**
 * @fileoverview Route publik untuk rumpun leksikon
 */

const express = require('express');

const router = express.Router();

router.use('/kamus', require('./kamus'));
router.use('/tagar', require('./tagar'));
router.use('/makna', require('./makna'));
router.use('/rima', require('./rima'));
router.use('/tesaurus', require('./tesaurus'));
router.use('/glosarium', require('./glosarium'));

module.exports = router;