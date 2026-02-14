/**
 * @fileoverview Route pencarian kamus publik
 */

const express = require('express');
const { cariKamus } = require('../../../services/layananKamusPublik');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { q = '', limit = '20' } = req.query;
    const results = await cariKamus(q, limit);
    return res.json({
      query: q,
      count: results.length,
      data: results,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
