/**
 * @fileoverview Route redaksi untuk rekap harian Kuis Kata.
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelKuisKata = require('../../../models/gim/modelKuisKata');

const router = express.Router();

function parseTanggal(value) {
  return ModelKuisKata.parseTanggal(value);
}

function parseLimit(value, fallback = 200) {
  return ModelKuisKata.parseLimit(value, fallback, 1000);
}

router.get('/', periksaIzin('kelola_susun_kata'), async (req, res, next) => {
  try {
    const tanggal = parseTanggal(req.query.tanggal);
    const limit = parseLimit(req.query.limit, 200);
    const data = await ModelKuisKata.daftarRekapAdmin({ tanggal, limit });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
module.exports.__private = {
  parseTanggal,
  parseLimit,
};