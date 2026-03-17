/**
 * @fileoverview Route tagar publik — daftar tagar dan entri per tagar
 */

const express = require('express');
const ModelTagar = require('../../../models/master/modelTagar');
const { parseCursorPagination } = require('../../../utils/routesPublikUtils');

const router = express.Router();

/**
 * GET /api/publik/tagar
 * Semua tagar aktif sebagai flat array (untuk kotak kategori halaman kamus).
 */
router.get('/', async (_req, res, next) => {
  try {
    const data = await ModelTagar.ambilSemuaTagar();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/publik/tagar/:kode
 * Daftar entri yang memiliki tagar dengan kode tertentu (cursor pagination).
 */
router.get('/:kode', async (req, res, next) => {
  try {
    const kode = String(req.params.kode || '').trim();
    if (!kode) return res.status(400).json({ success: false, message: 'Kode tagar wajib diisi' });

    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 200,
    });

    const data = await ModelTagar.cariEntriPerTagar(kode, { limit, cursor, direction, lastPage, hitungTotal: true });

    if (!data.tagar) {
      return res.status(404).json({ success: false, message: 'Tagar tidak ditemukan' });
    }

    return res.json({
      success: true,
      tagar: data.tagar,
      total: data.total,
      data: data.data,
      pageInfo: {
        hasPrev: Boolean(data.hasPrev),
        hasNext: Boolean(data.hasNext),
        prevCursor: data.prevCursor || null,
        nextCursor: data.nextCursor || null,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
