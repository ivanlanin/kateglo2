/**
 * @fileoverview Route singkatan/akronim publik
 */

const express = require('express');
const ModelSingkatan = require('../../../models/modelSingkatan');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { q = '', kependekan = '', tag = '', limit = '20', offset = '0' } = req.query;
    const result = await ModelSingkatan.cari({
      q,
      kependekan,
      tag,
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
