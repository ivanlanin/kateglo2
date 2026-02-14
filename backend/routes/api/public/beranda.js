/**
 * @fileoverview Route beranda publik (statistik, lema acak, populer, salah eja)
 */

const express = require('express');
const ModelBeranda = require('../../../models/modelBeranda');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const [statistik, lemaAcak, rujukan, populer] = await Promise.all([
      ModelBeranda.ambilStatistik(),
      ModelBeranda.ambilLemaAcak(10),
      ModelBeranda.ambilRujukan(5),
      ModelBeranda.ambilPopuler(5),
    ]);
    return res.json({ statistik, lemaAcak, rujukan, populer });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
