/**
 * @fileoverview Route admin untuk pengelolaan glosarium
 */

const express = require('express');
const ModelGlosarium = require('../../../models/modelGlosarium');

const router = express.Router();

/**
 * GET /api/admin/glosarium
 * Daftar glosarium dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = (req.query.q || '').trim();

    const { data, total } = await ModelGlosarium.cari({ q, limit, offset });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/admin/glosarium/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilDenganId(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/admin/glosarium
 */
router.post('/', async (req, res, next) => {
  try {
    const { indonesia, asing } = req.body;
    if (!indonesia?.trim()) return res.status(400).json({ success: false, message: 'Istilah Indonesia wajib diisi' });
    if (!asing?.trim()) return res.status(400).json({ success: false, message: 'Istilah asing wajib diisi' });

    const updater = req.user?.email || 'admin';
    const data = await ModelGlosarium.simpan(req.body, updater);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/admin/glosarium/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { indonesia, asing } = req.body;
    if (!indonesia?.trim()) return res.status(400).json({ success: false, message: 'Istilah Indonesia wajib diisi' });
    if (!asing?.trim()) return res.status(400).json({ success: false, message: 'Istilah asing wajib diisi' });

    const updater = req.user?.email || 'admin';
    const data = await ModelGlosarium.simpan({ ...req.body, id }, updater);
    if (!data) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/admin/glosarium/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await ModelGlosarium.hapus(Number(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
