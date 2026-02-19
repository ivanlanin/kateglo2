/**
 * @fileoverview Route admin untuk pengelolaan tesaurus
 */

const express = require('express');
const ModelTesaurus = require('../../models/modelTesaurus');
const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

/**
 * GET /api/redaksi/tesaurus
 * Daftar tesaurus dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);

    const { data, total } = await ModelTesaurus.daftarAdmin({
      limit,
      offset,
      q,
      aktif: ['0', '1'].includes(aktif) ? aktif : '',
    });
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
    const data = await ModelTesaurus.ambilDenganId(parseIdParam(req.params.id));
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
    const indeks = parseTrimmedString(req.body.indeks);
    if (!indeks) return res.status(400).json({ success: false, message: 'Indeks wajib diisi' });

    const data = await ModelTesaurus.simpan({ ...req.body, indeks });
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
    const id = parseIdParam(req.params.id);
    const indeks = parseTrimmedString(req.body.indeks);
    if (!indeks) return res.status(400).json({ success: false, message: 'Indeks wajib diisi' });

    const data = await ModelTesaurus.simpan({ ...req.body, id, indeks });
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
    const deleted = await ModelTesaurus.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Tesaurus tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

