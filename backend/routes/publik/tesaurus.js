/**
 * @fileoverview Route tesaurus publik
 */

const express = require('express');
const { cariTesaurus, ambilDetailTesaurus } = require('../../../services/layananTesaurusPublik');
const ModelTesaurus = require('../../../models/modelTesaurus');
const { publicSearchLimiter } = require('../../../middleware/rateLimiter');

const router = express.Router();
const maxOffset = Math.max(Number(process.env.PUBLIC_MAX_OFFSET) || 1000, 0);

function parseSearchPagination(query, defaultLimit = 100, maxLimit = 200) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const offset = Math.max(Number(query.offset) || 0, 0);

  return { limit, offset };
}

function rejectTooLargeOffset(res, offset) {
  if (offset <= maxOffset) return false;
  res.status(400).json({
    error: 'Invalid Query',
    message: `Offset maksimal adalah ${maxOffset}`,
  });
  return true;
}

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
    const { limit, offset } = parseSearchPagination(req.query);
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

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
