/**
 * @fileoverview Route glosarium publik
 */

const express = require('express');
const ModelGlosarium = require('../../models/modelGlosarium');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');
const { parsePagination, rejectTooLargeOffset } = require('../../utils/routesPublikUtils');

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
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 100, maxLimit: 100 });
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const result = await ModelGlosarium.cari({
      q: req.params.kata,
      limit,
      offset,
      aktifSaja: true,
      hitungTotal: false,
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
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 100, maxLimit: 100 });
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const result = await ModelGlosarium.cari({
      bidang: decodeURIComponent(req.params.bidang),
      limit,
      offset,
      aktifSaja: true,
      hitungTotal: false,
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
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 100, maxLimit: 100 });
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const result = await ModelGlosarium.cari({
      sumber: decodeURIComponent(req.params.sumber),
      limit,
      offset,
      aktifSaja: true,
      hitungTotal: false,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
