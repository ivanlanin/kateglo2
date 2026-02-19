/**
 * @fileoverview Route admin untuk pengelolaan glosarium
 */

const express = require('express');
const ModelGlosarium = require('../../models/modelGlosarium');
const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

/**
 * GET /api/redaksi/glosarium
 * Daftar glosarium dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);

    const { data, total } = await ModelGlosarium.cari({
      q,
      limit,
      offset,
      aktif: ['0', '1'].includes(aktif) ? aktif : '',
    });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/glosarium/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/glosarium
 */
router.post('/', async (req, res, next) => {
  try {
    const indonesia = parseTrimmedString(req.body.indonesia);
    const asing = parseTrimmedString(req.body.asing);
    if (!indonesia) return res.status(400).json({ success: false, message: 'Istilah Indonesia wajib diisi' });
    if (!asing) return res.status(400).json({ success: false, message: 'Istilah asing wajib diisi' });

    const updater = req.user?.email || 'admin';
    const data = await ModelGlosarium.simpan({ ...req.body, indonesia, asing }, updater);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/glosarium/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const indonesia = parseTrimmedString(req.body.indonesia);
    const asing = parseTrimmedString(req.body.asing);
    if (!indonesia) return res.status(400).json({ success: false, message: 'Istilah Indonesia wajib diisi' });
    if (!asing) return res.status(400).json({ success: false, message: 'Istilah asing wajib diisi' });

    const updater = req.user?.email || 'admin';
    const data = await ModelGlosarium.simpan({ ...req.body, id, indonesia, asing }, updater);
    if (!data) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/glosarium/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await ModelGlosarium.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

