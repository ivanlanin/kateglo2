/**
 * @fileoverview Route admin untuk pengelolaan pengguna
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelPengguna = require('../../models/modelPengguna');
const {
  buildPaginatedResult,
  parsePagination,
  parseIdParam,
  parseSearchQuery,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

/**
 * GET /api/redaksi/pengguna
 * Daftar semua pengguna (paginasi)
 */
router.get('/', periksaIzin('kelola_pengguna'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);
    const { data, total } = await ModelPengguna.daftarPengguna({
      limit,
      offset,
      q,
      aktif: ['0', '1'].includes(aktif) ? aktif : '',
    });

    return res.json({ success: true, ...buildPaginatedResult({ data, total, pagination: { limit, offset } }) });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/pengguna/peran
 * Daftar semua peran yang tersedia
 */
router.get('/peran', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const data = await ModelPengguna.daftarPeran();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/pengguna/:id
 * Ambil detail pengguna untuk penyuntingan
 */
router.get('/:id', periksaIzin('kelola_pengguna'), async (req, res, next) => {
  try {
    const data = await ModelPengguna.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /api/redaksi/pengguna/:id/peran
 * Ubah peran pengguna
 * Body: { peran_id: number }
 */
router.patch('/:id/peran', periksaIzin('kelola_pengguna'), async (req, res, next) => {
  try {
    const penggunaId = parseIdParam(req.params.id);
    const { peran_id: peranId } = req.body;

    if (!peranId || !Number.isInteger(peranId)) {
      return res.status(400).json({
        success: false,
        message: 'peran_id harus berupa bilangan bulat',
      });
    }

    const pengguna = await ModelPengguna.ubahPeran(penggunaId, peranId);

    if (!pengguna) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan',
      });
    }

    return res.json({ success: true, data: pengguna });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/pengguna/:id
 * Sunting pengguna (nama, aktif, peran_id)
 */
router.put('/:id', periksaIzin('kelola_pengguna'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const pengguna = await ModelPengguna.simpanPengguna(id, req.body);

    if (!pengguna) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    return res.json({ success: true, data: pengguna });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

