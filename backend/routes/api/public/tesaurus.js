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
    const results = await cariTesaurus(req.params.kata);
    return res.json({
      query: req.params.kata,
      count: results.length,
      data: results,
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
