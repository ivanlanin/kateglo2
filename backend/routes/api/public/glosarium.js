/**
 * @fileoverview Route glosarium publik
 */

const express = require('express');
const ModelGlosarium = require('../../../models/modelGlosarium');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { q = '', bidang = '', sumber = '', bahasa = '', limit = '20', offset = '0' } = req.query;
    const result = await ModelGlosarium.cari({
      q,
      bidang,
      sumber,
      bahasa,
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get('/bidang', async (_req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilDaftarBidang();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/sumber', async (_req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilDaftarSumber();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
