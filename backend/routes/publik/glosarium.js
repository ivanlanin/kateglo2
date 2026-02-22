/**
 * @fileoverview Route glosarium publik
 */

const express = require('express');
const ModelGlosarium = require('../../models/modelGlosarium');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');
const { parseCursorPagination } = require('../../utils/routesPublikUtils');

const router = express.Router();

router.get('/autocomplete/:kata', async (req, res, next) => {
  try {
    const data = await ModelGlosarium.autocomplete(req.params.kata);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/cari/:kata', publicSearchLimiter, async (req, res, next) => {
  try {
    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 100,
    });

    const result = await ModelGlosarium.cariCursor({
      q: req.params.kata,
      limit,
      aktifSaja: true,
      hitungTotal: true,
      cursor,
      direction,
      lastPage,
    });
    return res.json({
      ...result,
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

router.get('/bidang', async (_req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilDaftarBidang();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/bidang/:bidang', async (req, res, next) => {
  try {
    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 100,
    });

    const result = await ModelGlosarium.cariCursor({
      bidang: decodeURIComponent(req.params.bidang),
      limit,
      aktifSaja: true,
      hitungTotal: true,
      cursor,
      direction,
      lastPage,
      sortBy: 'asing',
    });
    return res.json({
      ...result,
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

router.get('/sumber', async (_req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilDaftarSumber();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/sumber/:sumber', async (req, res, next) => {
  try {
    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 100,
    });

    const result = await ModelGlosarium.cariCursor({
      sumber: decodeURIComponent(req.params.sumber),
      limit,
      aktifSaja: true,
      hitungTotal: true,
      cursor,
      direction,
      lastPage,
      sortBy: 'asing',
    });
    return res.json({
      ...result,
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
