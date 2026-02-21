/**
 * @fileoverview Route tesaurus publik
 */

const express = require('express');
const { cariTesaurus, ambilDetailTesaurus } = require('../../services/layananTesaurusPublik');
const ModelTesaurus = require('../../models/modelTesaurus');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');
const { parseCursorPagination } = require('../../utils/routesPublikUtils');

const router = express.Router();

router.get('/contoh', async (_req, res, next) => {
  try {
    const data = await ModelTesaurus.contohAcak(5);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/autocomplete/:kata', async (req, res, next) => {
  try {
    const data = await ModelTesaurus.autocomplete(req.params.kata);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/cari/:kata', publicSearchLimiter, async (req, res, next) => {
  try {
    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 200,
    });

    const result = await cariTesaurus(req.params.kata, { limit, cursor, direction, lastPage });
    return res.json({
      query: req.params.kata,
      total: result.total,
      data: result.data,
      pageInfo: {
        hasPrev: Boolean(result.hasPrev),
        hasNext: Boolean(result.hasNext),
        prevCursor: result.prevCursor || null,
        nextCursor: result.nextCursor || null,
      },
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
