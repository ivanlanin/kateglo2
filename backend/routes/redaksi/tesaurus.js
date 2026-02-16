/**
 * @fileoverview Route admin untuk pengelolaan tesaurus
 */

const express = require('express');
const ModelTesaurus = require('../../models/modelTesaurus');

const router = express.Router();

/**
 * GET /api/redaksi/tesaurus
 * Daftar tesaurus dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = (req.query.q || '').trim();

    const { data, total } = await ModelTesaurus.daftarAdmin({ limit, offset, q });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/tesaurus/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelTesaurus.ambilDenganId(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Tesaurus tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/tesaurus
 */
router.post('/', async (req, res, next) => {
  try {
    const { lema } = req.body;
    if (!lema?.trim()) return res.status(400).json({ success: false, message: 'Lema wajib diisi' });

    const data = await ModelTesaurus.simpan(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/tesaurus/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { lema } = req.body;
    if (!lema?.trim()) return res.status(400).json({ success: false, message: 'Lema wajib diisi' });

    const data = await ModelTesaurus.simpan({ ...req.body, id });
    if (!data) return res.status(404).json({ success: false, message: 'Tesaurus tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/tesaurus/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await ModelTesaurus.hapus(Number(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Tesaurus tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

