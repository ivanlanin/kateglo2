/**
 * @fileoverview Route redaksi untuk pengelolaan tesaurus
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelTesaurus = require('../../models/modelTesaurus');
const {
  buildPaginatedResult,
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
router.get('/', periksaIzin('lihat_tesaurus'), async (req, res, next) => {
  try {
    const { limit, offset, cursor, direction, lastPage } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);
    const aktifFilter = ['0', '1'].includes(aktif) ? aktif : '';

    const result = await ModelTesaurus.daftarAdminCursor({
      limit,
      q,
      aktif: aktifFilter,
      cursor,
      direction,
      lastPage,
    });
    return res.json({
      success: true,
      ...buildPaginatedResult({
        data: result.data,
        total: result.total,
        pagination: { limit, offset },
        pageInfo: {
          hasPrev: result.hasPrev,
          hasNext: result.hasNext,
          prevCursor: result.prevCursor,
          nextCursor: result.nextCursor,
        },
      }),
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/tesaurus/:id
 */
router.get('/:id', periksaIzin('lihat_tesaurus'), async (req, res, next) => {
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
router.post('/', periksaIzin('tambah_tesaurus'), async (req, res, next) => {
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
router.put('/:id', periksaIzin('edit_tesaurus'), async (req, res, next) => {
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
router.delete('/:id', periksaIzin('hapus_tesaurus'), async (req, res, next) => {
  try {
    const deleted = await ModelTesaurus.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Tesaurus tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

