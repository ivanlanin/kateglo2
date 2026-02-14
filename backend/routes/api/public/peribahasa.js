/**
 * @fileoverview Route peribahasa publik
 */

const express = require('express');
const ModelPeribahasa = require('../../../models/modelPeribahasa');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { q = '', limit = '20', offset = '0' } = req.query;
    const result = await ModelPeribahasa.cari({
      q,
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
