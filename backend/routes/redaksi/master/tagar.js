/**
 * @fileoverview Route redaksi untuk pengelolaan tagar morfologis
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelTagar = require('../../../models/master/modelTagar');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();

/**
 * GET /api/redaksi/tagar
 * Daftar tagar dengan filter opsional (cursor pagination).
 */
router.get('/', periksaIzin('kelola_tagar'), async (req, res, next) => {
  try {
    const { limit, cursor, direction, lastPage } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const kategori = parseTrimmedString(req.query.kategori);
    const aktif = parseTrimmedString(req.query.aktif);
    const aktifFilter = ['0', '1'].includes(aktif) ? aktif : '';
    const kategoriValid = await ModelTagar.ambilDaftarKategori();
    const kategoriFilter = kategoriValid.includes(kategori) ? kategori : '';

    const result = await ModelTagar.daftarAdminCursor({
      limit,
      cursor,
      direction,
      lastPage,
      q,
      kategori: kategoriFilter,
      aktif: aktifFilter,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({
        data: result.data,
        total: result.total,
        pagination: { limit },
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
 * GET /api/redaksi/tagar/kategori
 */
router.get('/kategori', periksaIzin('kelola_tagar'), async (_req, res, next) => {
  try {
    const data = await ModelTagar.ambilDaftarKategori();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/tagar/opsi-pilih
 * Semua tagar (aktif + nonaktif) untuk autocomplete/dropdown redaksi.
 */
router.get('/opsi-pilih', periksaIzin('kelola_tagar', 'edit_entri', 'audit_tagar'), async (_req, res, next) => {
  try {
    const data = await ModelTagar.ambilSemuaTagarRedaksi();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/tagar/:id
 */
router.get('/:id', periksaIzin('kelola_tagar'), async (req, res, next) => {
  try {
    const data = await ModelTagar.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Tagar tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/tagar
 */
router.post('/', periksaIzin('kelola_tagar'), async (req, res, next) => {
  try {
    const kode = parseTrimmedString(req.body.kode);
    const nama = parseTrimmedString(req.body.nama);
    const kategori = parseTrimmedString(req.body.kategori);
    const { urutan, aktif, deskripsi } = req.body;

    if (!kode) return res.status(400).json({ success: false, message: 'Kode wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    if (!kategori) return res.status(400).json({ success: false, message: 'Kategori wajib diisi' });
    const kategoriValid = await ModelTagar.ambilDaftarKategori();
    if (!kategoriValid.includes(kategori)) {
      return res.status(400).json({ success: false, message: `Kategori tidak valid. Pilihan: ${kategoriValid.join(', ')}` });
    }

    const data = await ModelTagar.simpan({ kode, nama, kategori, deskripsi, urutan, aktif });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/tagar/:id
 */
router.put('/:id', periksaIzin('kelola_tagar'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const kode = parseTrimmedString(req.body.kode);
    const nama = parseTrimmedString(req.body.nama);
    const kategori = parseTrimmedString(req.body.kategori);
    const { urutan, aktif, deskripsi } = req.body;

    if (!kode) return res.status(400).json({ success: false, message: 'Kode wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    if (!kategori) return res.status(400).json({ success: false, message: 'Kategori wajib diisi' });
    const kategoriValid = await ModelTagar.ambilDaftarKategori();
    if (!kategoriValid.includes(kategori)) {
      return res.status(400).json({ success: false, message: `Kategori tidak valid. Pilihan: ${kategoriValid.join(', ')}` });
    }

    const data = await ModelTagar.simpan({ id, kode, nama, kategori, deskripsi, urutan, aktif });
    if (!data) return res.status(404).json({ success: false, message: 'Tagar tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/tagar/:id
 */
router.delete('/:id', periksaIzin('kelola_tagar'), async (req, res, next) => {
  try {
    const deleted = await ModelTagar.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Tagar tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
