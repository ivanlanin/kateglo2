/**
 * @fileoverview Route redaksi untuk pengelolaan daftar hitam pencarian
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelPencarianHitam = require('../../models/modelPencarianHitam');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

function isValidAktifValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return value === 0 || value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['0', '1', 'true', 'false', 'ya', 'tidak', 'yes', 'no', 'aktif', 'nonaktif'].includes(normalized);
  }
  return false;
}

/**
 * GET /api/redaksi/pencarianHitam
 * Daftar kata pencarian hitam
 */
router.get('/', periksaIzin('lihat_pencarian'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 200, maxLimit: 1000 });
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);
    const aktifFilter = ['0', '1'].includes(aktif) ? aktif : '';

    const result = await ModelPencarianHitam.daftarAdmin({
      q,
      aktif: aktifFilter,
      limit,
      offset,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({
        data: result.data,
        total: result.total,
        pagination: { limit, offset },
      }),
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/pencarianHitam/:id
 */
router.get('/:id', periksaIzin('lihat_pencarian'), async (req, res, next) => {
  try {
    const data = await ModelPencarianHitam.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Kata daftar hitam tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/pencarianHitam
 */
router.post('/', periksaIzin('lihat_pencarian'), async (req, res, next) => {
  try {
    const kata = parseTrimmedString(req.body.kata);
    const { aktif, catatan } = req.body;

    if (!kata) {
      return res.status(400).json({ success: false, message: 'Kata wajib diisi' });
    }
    if (!isValidAktifValue(aktif)) {
      return res.status(400).json({ success: false, message: 'Status aktif tidak valid' });
    }

    const data = await ModelPencarianHitam.simpan({ kata, aktif, catatan });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/pencarianHitam/:id
 */
router.put('/:id', periksaIzin('lihat_pencarian'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const kata = parseTrimmedString(req.body.kata);
    const { aktif, catatan } = req.body;

    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }
    if (!kata) {
      return res.status(400).json({ success: false, message: 'Kata wajib diisi' });
    }
    if (!isValidAktifValue(aktif)) {
      return res.status(400).json({ success: false, message: 'Status aktif tidak valid' });
    }

    const data = await ModelPencarianHitam.simpan({ id, kata, aktif, catatan });
    if (!data) return res.status(404).json({ success: false, message: 'Kata daftar hitam tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/pencarianHitam/:id
 */
router.delete('/:id', periksaIzin('lihat_pencarian'), async (req, res, next) => {
  try {
    const deleted = await ModelPencarianHitam.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Kata daftar hitam tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
