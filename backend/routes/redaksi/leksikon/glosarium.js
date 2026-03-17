/**
 * @fileoverview Route redaksi untuk pengelolaan glosarium
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const { invalidasiCacheDetailGlosarium } = require('../../../services/layananGlosariumPublik');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();

async function ambilAsingAmanById(id) {
  try {
    const data = await ModelGlosarium.ambilDenganId(parseIdParam(id));
    return data?.asing || null;
  } catch (_error) {
    return null;
  }
}

/**
 * GET /api/redaksi/glosarium
 * Daftar glosarium dengan pencarian opsional (paginasi)
 */
router.get('/', periksaIzin('lihat_glosarium'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);
    const bidangId = Number(req.query.bidang_id);
    const bahasaId = Number(req.query.bahasa_id);
    const sumberId = Number(req.query.sumber_id);

    const { data, total } = await ModelGlosarium.cari({
      q,
      limit,
      offset,
      aktif: ['0', '1'].includes(aktif) ? aktif : '',
      ...(Number.isInteger(bidangId) && bidangId > 0 ? { bidangId } : {}),
      ...(Number.isInteger(bahasaId) && bahasaId > 0 ? { bahasaId } : {}),
      ...(Number.isInteger(sumberId) && sumberId > 0 ? { sumberId } : {}),
    });
    return res.json({ success: true, ...buildPaginatedResult({ data, total, pagination: { limit, offset } }) });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/glosarium/:id
 */
router.get('/:id', periksaIzin('lihat_glosarium'), async (req, res, next) => {
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
router.post('/', periksaIzin('tambah_glosarium'), async (req, res, next) => {
  try {
    const indonesia = parseTrimmedString(req.body.indonesia);
    const asing = parseTrimmedString(req.body.asing);
    const bidangId = Number(req.body.bidang_id);
    const sumberId = Number(req.body.sumber_id);
    const bidang = parseTrimmedString(req.body.bidang);
    const sumber = parseTrimmedString(req.body.sumber);
    if (!indonesia) return res.status(400).json({ success: false, message: 'Istilah Indonesia wajib diisi' });
    if (!asing) return res.status(400).json({ success: false, message: 'Istilah asing wajib diisi' });

    const updater = req.user?.email || 'admin';
    const data = await ModelGlosarium.simpan({
      ...req.body,
      bidang: bidang || req.body.bidang,
      sumber: sumber || req.body.sumber,
      bidang_id: Number.isInteger(bidangId) && bidangId > 0 ? bidangId : undefined,
      sumber_id: Number.isInteger(sumberId) && sumberId > 0 ? sumberId : undefined,
      indonesia,
      asing,
    }, updater);
    await invalidasiCacheDetailGlosarium(data?.asing);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error?.code === 'INVALID_BIDANG') {
      return res.status(400).json({ success: false, message: 'Bidang tidak valid' });
    }
    if (error?.code === 'INVALID_SUMBER') {
      return res.status(400).json({ success: false, message: 'Sumber tidak valid' });
    }
    if (error?.code === 'INVALID_BAHASA') {
      return res.status(400).json({ success: false, message: 'Bahasa tidak valid' });
    }
    return next(error);
  }
});

/**
 * PUT /api/redaksi/glosarium/:id
 */
router.put('/:id', periksaIzin('edit_glosarium'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const asingSebelum = await ambilAsingAmanById(id);
    const indonesia = parseTrimmedString(req.body.indonesia);
    const asing = parseTrimmedString(req.body.asing);
    const bidangId = Number(req.body.bidang_id);
    const sumberId = Number(req.body.sumber_id);
    const bidang = parseTrimmedString(req.body.bidang);
    const sumber = parseTrimmedString(req.body.sumber);
    if (!indonesia) return res.status(400).json({ success: false, message: 'Istilah Indonesia wajib diisi' });
    if (!asing) return res.status(400).json({ success: false, message: 'Istilah asing wajib diisi' });

    const updater = req.user?.email || 'admin';
    const data = await ModelGlosarium.simpan({
      ...req.body,
      id,
      bidang: bidang || req.body.bidang,
      sumber: sumber || req.body.sumber,
      bidang_id: Number.isInteger(bidangId) && bidangId > 0 ? bidangId : undefined,
      sumber_id: Number.isInteger(sumberId) && sumberId > 0 ? sumberId : undefined,
      indonesia,
      asing,
    }, updater);
    if (!data) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    await invalidasiCacheDetailGlosarium(asingSebelum);
    await invalidasiCacheDetailGlosarium(data?.asing);
    return res.json({ success: true, data });
  } catch (error) {
    if (error?.code === 'INVALID_BIDANG') {
      return res.status(400).json({ success: false, message: 'Bidang tidak valid' });
    }
    if (error?.code === 'INVALID_SUMBER') {
      return res.status(400).json({ success: false, message: 'Sumber tidak valid' });
    }
    if (error?.code === 'INVALID_BAHASA') {
      return res.status(400).json({ success: false, message: 'Bahasa tidak valid' });
    }
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/glosarium/:id
 */
router.delete('/:id', periksaIzin('hapus_glosarium'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const asingSebelum = await ambilAsingAmanById(id);
    const deleted = await ModelGlosarium.hapus(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    await invalidasiCacheDetailGlosarium(asingSebelum);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

