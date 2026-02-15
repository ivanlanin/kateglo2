/**
 * @fileoverview Route tesaurus publik
 */

const express = require('express');
const { cariTesaurus, ambilDetailTesaurus } = require('../../../services/layananTesaurusPublik');
const ModelTesaurus = require('../../../models/modelTesaurus');

const router = express.Router();

router.get('/autocomplete/:kata', async (req, res, next) => {
  try {
    const data = await ModelTesaurus.autocomplete(req.params.kata);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/cari/:kata', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const result = await cariTesaurus(req.params.kata, { limit, offset });
    return res.json({
      query: req.params.kata,
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:kata', async (req, res, next) => {
  try {
    const data = await ambilDetailTesaurus(req.params.kata);
    if (!data) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Entri tesaurus tidak ditemukan',
      });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
