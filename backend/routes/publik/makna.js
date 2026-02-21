/**
 * @fileoverview Route kamus terbalik — cari kata berdasarkan makna
 */

const express = require('express');
const ModelEntri = require('../../models/modelEntri');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');
const { parseCursorPagination } = require('../../utils/routesPublikUtils');

const router = express.Router();

router.get('/cari/:kata', publicSearchLimiter, async (req, res, next) => {
  try {
    const kata = decodeURIComponent(req.params.kata).trim();
    if (!kata) {
      return res.status(400).json({ error: 'Query tidak boleh kosong' });
    }

    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 50,
      maxLimit: 100,
    });

    const result = await ModelEntri.cariMakna(kata, { limit, cursor, direction, lastPage });

    return res.json({
      query: kata,
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

module.exports = router;
