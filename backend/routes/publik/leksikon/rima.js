/**
 * @fileoverview Route pencarian rima — rima akhir dan rima awal (aliterasi)
 */

const express = require('express');
const ModelEntri = require('../../models/modelEntri');
const ModelPencarian = require('../../models/modelPencarian');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();
const domainRima = 5;

router.get('/contoh', async (_req, res, next) => {
  try {
    const data = await ModelEntri.contohAcakRima(5);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/autocomplete/:kata', async (req, res, next) => {
  try {
    const kata = decodeURIComponent(req.params.kata).trim();
    if (!kata) return res.json({ data: [] });
    const hasil = await ModelEntri.autocomplete(kata, 8);
    return res.json({ data: hasil });
  } catch (error) {
    return next(error);
  }
});

router.get('/cari/:kata', publicSearchLimiter, async (req, res, next) => {
  try {
    const kata = decodeURIComponent(req.params.kata).trim();
    if (!kata) {
      return res.status(400).json({ error: 'Query tidak boleh kosong' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const cursorAkhir = typeof req.query.cursor_akhir === 'string' && req.query.cursor_akhir.trim()
      ? req.query.cursor_akhir.trim() : null;
    const directionAkhir = req.query.dir_akhir === 'prev' ? 'prev' : 'next';
    const cursorAwal = typeof req.query.cursor_awal === 'string' && req.query.cursor_awal.trim()
      ? req.query.cursor_awal.trim() : null;
    const directionAwal = req.query.dir_awal === 'prev' ? 'prev' : 'next';

    const result = await ModelEntri.cariRima(kata, { limit, cursorAkhir, directionAkhir, cursorAwal, directionAwal });

    await ModelPencarian.catatPencarian(kata, { domain: domainRima });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
