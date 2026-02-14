/**
 * @fileoverview Route beranda publik (statistik, lema acak, populer, salah eja)
 */

const express = require('express');
const ModelBeranda = require('../../../models/modelBeranda');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const [statistik, lemaAcak, salahEja, populer] = await Promise.all([
      ModelBeranda.ambilStatistik(),
      ModelBeranda.ambilLemaAcak(10),
      ModelBeranda.ambilSalahEja(5),
      ModelBeranda.ambilPopuler(5),
    ]);
    return res.json({ statistik, lemaAcak, salahEja, populer });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
