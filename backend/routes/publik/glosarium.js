/**
 * @fileoverview Route glosarium publik
 */

const express = require('express');
const ModelGlosarium = require('../../models/modelGlosarium');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();
const maxOffset = Math.max(Number(process.env.PUBLIC_MAX_OFFSET) || 1000, 0);

function parsePagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 100, 1), 100);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);

  return {
    limit,
    offset,
  };
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
    const data = await ModelGlosarium.autocomplete(req.params.kata);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/cari/:kata', publicSearchLimiter, async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const result = await ModelGlosarium.cari({
      q: req.params.kata,
      limit,
      offset,
      aktifSaja: true,
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

router.get('/bidang/:bidang', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const result = await ModelGlosarium.cari({
      bidang: decodeURIComponent(req.params.bidang),
      limit,
      offset,
      aktifSaja: true,
    });
    return res.json(result);
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
    const { limit, offset } = parsePagination(req.query);
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const result = await ModelGlosarium.cari({
      sumber: decodeURIComponent(req.params.sumber),
      limit,
      offset,
      aktifSaja: true,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
