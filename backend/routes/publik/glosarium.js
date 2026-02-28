/**
 * @fileoverview Route glosarium publik
 */

const express = require('express');
const ModelGlosarium = require('../../models/modelGlosarium');
const { ambilDetailGlosarium } = require('../../services/layananGlosariumPublik');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');
const { parseCursorPagination } = require('../../utils/routesPublikUtils');

const router = express.Router();

router.get('/detail/:asing', publicSearchLimiter, async (req, res, next) => {
  try {
    const asing = decodeURIComponent(req.params.asing || '').trim();
    if (!asing) {
      return res.status(400).json({ error: 'Parameter asing diperlukan' });
    }
    const { limit } = parseCursorPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const mengandungCursor = typeof req.query.mengandungCursor === 'string' ? req.query.mengandungCursor.trim() || null : null;
    const miripCursor = typeof req.query.miripCursor === 'string' ? req.query.miripCursor.trim() || null : null;
    const result = await ambilDetailGlosarium(asing, { limit, mengandungCursor, miripCursor });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

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
    const slug = decodeURIComponent(req.params.sumber);
    const sumberObj = await ModelGlosarium.resolveSlugSumber(slug);
    if (!sumberObj) {
      return res.status(404).json({ error: 'Sumber tidak ditemukan' });
    }

    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 100,
    });

    const result = await ModelGlosarium.cariCursor({
      sumberId: sumberObj.id,
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
