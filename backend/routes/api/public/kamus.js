/**
 * @fileoverview Route kamus publik (pencarian + detail + kategori)
 */

const express = require('express');
const { cariKamus, ambilDetailKamus } = require('../../../services/layananKamusPublik');
const ModelLabel = require('../../../models/modelLabel');
const ModelLema = require('../../../models/modelLema');

const router = express.Router();

router.get('/kategori', async (_req, res, next) => {
  try {
    const data = await ModelLabel.ambilSemuaKategori();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/kategori/:kategori/:kode', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const data = await ModelLabel.cariLemaPerLabel(
      req.params.kategori,
      decodeURIComponent(req.params.kode),
      limit,
      offset
    );
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/autocomplete/:kata', async (req, res, next) => {
  try {
    const data = await ModelLema.autocomplete(req.params.kata);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/cari/:kata', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const result = await cariKamus(req.params.kata, { limit, offset });
    const response = {
      query: req.params.kata,
      total: result.total,
      data: result.data,
    };
    if (result.total === 0) {
      response.saran = await ModelLema.saranLema(decodeURIComponent(req.params.kata));
    }
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

router.get('/detail/:entri', async (req, res, next) => {
  try {
    const data = await ambilDetailKamus(req.params.entri);
    if (!data) {
      const saran = await ModelLema.saranLema(decodeURIComponent(req.params.entri));
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Entri tidak ditemukan',
        saran,
      });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
