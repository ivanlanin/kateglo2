/**
 * @fileoverview Route redaksi untuk pengelolaan glosarium
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelGlosarium = require('../../models/modelGlosarium');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

function parseAktifParam(value) {
  if (value === undefined || value === null || value === '') return '';
  if (value === true || value === '1' || value === 1) return '1';
  if (value === false || value === '0' || value === 0) return '0';
  return '';
}

function parseMasterPayload(body) {
  const kode = parseTrimmedString(body?.kode);
  const nama = parseTrimmedString(body?.nama);
  const keterangan = parseTrimmedString(body?.keterangan);
  const aktif = parseAktifParam(body?.aktif);

  return {
    kode,
    nama,
    keterangan,
    aktif: aktif === '' ? true : aktif === '1',
  };
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

    const { data, total } = await ModelGlosarium.cari({
      q,
      limit,
      offset,
      aktif: ['0', '1'].includes(aktif) ? aktif : '',
    });
    return res.json({ success: true, ...buildPaginatedResult({ data, total, pagination: { limit, offset } }) });
  } catch (error) {
    return next(error);
  }
});

router.get('/bidang-master', periksaIzin('kelola_bidang'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseAktifParam(req.query.aktif);

    const { data, total } = await ModelGlosarium.daftarMasterBidang({
      q,
      aktif,
      limit,
      offset,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({ data, total, pagination: { limit, offset } }),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/bidang-master/:id', periksaIzin('kelola_bidang'), async (req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilMasterBidangDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Bidang tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/bidang-master', periksaIzin('kelola_bidang'), async (req, res, next) => {
  try {
    const payload = parseMasterPayload(req.body);
    if (!payload.kode) return res.status(400).json({ success: false, message: 'Kode bidang wajib diisi' });
    if (!payload.nama) return res.status(400).json({ success: false, message: 'Nama bidang wajib diisi' });

    const data = await ModelGlosarium.simpanMasterBidang(payload);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.put('/bidang-master/:id', periksaIzin('kelola_bidang'), async (req, res, next) => {
  try {
    const payload = parseMasterPayload(req.body);
    if (!payload.kode) return res.status(400).json({ success: false, message: 'Kode bidang wajib diisi' });
    if (!payload.nama) return res.status(400).json({ success: false, message: 'Nama bidang wajib diisi' });

    const data = await ModelGlosarium.simpanMasterBidang({
      ...payload,
      id: parseIdParam(req.params.id),
    });
    if (!data) return res.status(404).json({ success: false, message: 'Bidang tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.delete('/bidang-master/:id', periksaIzin('kelola_bidang'), async (req, res, next) => {
  try {
    const deleted = await ModelGlosarium.hapusMasterBidang(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Bidang tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    if (error?.code === 'MASTER_IN_USE') {
      return res.status(409).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

router.get('/sumber-master', periksaIzin('kelola_sumber'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseAktifParam(req.query.aktif);

    const { data, total } = await ModelGlosarium.daftarMasterSumber({
      q,
      aktif,
      limit,
      offset,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({ data, total, pagination: { limit, offset } }),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/sumber-master/:id', periksaIzin('kelola_sumber'), async (req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilMasterSumberDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Sumber tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/sumber-master', periksaIzin('kelola_sumber'), async (req, res, next) => {
  try {
    const payload = parseMasterPayload(req.body);
    if (!payload.kode) return res.status(400).json({ success: false, message: 'Kode sumber wajib diisi' });
    if (!payload.nama) return res.status(400).json({ success: false, message: 'Nama sumber wajib diisi' });

    const data = await ModelGlosarium.simpanMasterSumber(payload);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.put('/sumber-master/:id', periksaIzin('kelola_sumber'), async (req, res, next) => {
  try {
    const payload = parseMasterPayload(req.body);
    if (!payload.kode) return res.status(400).json({ success: false, message: 'Kode sumber wajib diisi' });
    if (!payload.nama) return res.status(400).json({ success: false, message: 'Nama sumber wajib diisi' });

    const data = await ModelGlosarium.simpanMasterSumber({
      ...payload,
      id: parseIdParam(req.params.id),
    });
    if (!data) return res.status(404).json({ success: false, message: 'Sumber tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.delete('/sumber-master/:id', periksaIzin('kelola_sumber'), async (req, res, next) => {
  try {
    const deleted = await ModelGlosarium.hapusMasterSumber(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Sumber tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    if (error?.code === 'MASTER_IN_USE') {
      return res.status(409).json({ success: false, message: error.message });
    }
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
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error?.code === 'INVALID_BIDANG') {
      return res.status(400).json({ success: false, message: 'Bidang tidak valid' });
    }
    if (error?.code === 'INVALID_SUMBER') {
      return res.status(400).json({ success: false, message: 'Sumber tidak valid' });
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
    return res.json({ success: true, data });
  } catch (error) {
    if (error?.code === 'INVALID_BIDANG') {
      return res.status(400).json({ success: false, message: 'Bidang tidak valid' });
    }
    if (error?.code === 'INVALID_SUMBER') {
      return res.status(400).json({ success: false, message: 'Sumber tidak valid' });
    }
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/glosarium/:id
 */
router.delete('/:id', periksaIzin('hapus_glosarium'), async (req, res, next) => {
  try {
    const deleted = await ModelGlosarium.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Glosarium tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

