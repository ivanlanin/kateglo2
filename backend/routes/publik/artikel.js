/**
 * @fileoverview Route publik artikel editorial
 */

const express = require('express');
const ModelArtikel = require('../../models/artikel/modelArtikel');
const { parsePagination } = require('../../utils/routesPublikUtils');

const router = express.Router();

/**
 * GET /api/publik/artikel/topik
 * Daftar topik dengan jumlah artikel terbit
 */
router.get('/topik', async (_req, res, next) => {
  try {
    const data = await ModelArtikel.ambilTopikPublik();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/publik/artikel
 * Daftar artikel terbit, filter opsional ?topik=&q=
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const q = String(req.query.q || '').trim() || undefined;
    const topik = req.query.topik
      ? (Array.isArray(req.query.topik) ? req.query.topik : [req.query.topik])
      : undefined;

    const { data, total } = await ModelArtikel.ambilDaftarPublik({ topik, q, limit, offset });
    return res.json({ success: true, data, total, limit, offset });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/publik/artikel/:slug
 * Detail satu artikel terbit berdasarkan slug
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ success: false, message: 'Slug diperlukan' });

    const data = await ModelArtikel.ambilSatuPublik(slug);
    if (!data) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
