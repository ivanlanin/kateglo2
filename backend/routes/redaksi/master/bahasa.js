/**
 * @fileoverview Route redaksi untuk master bahasa
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/otorisasi');
const ModelOpsi = require('../../../models/master/modelOpsi');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();

function parseAktifParam(value) {
  if (value === undefined || value === null || value === '') return '';
  if (value === true || value === '1' || value === 1) return '1';
  if (value === false || value === '0' || value === 0) return '0';
  return '';
}

function parseBahasaPayload(body) {
  return {
    kode:      parseTrimmedString(body?.kode),
    nama:      parseTrimmedString(body?.nama),
    iso2:      parseTrimmedString(body?.iso2),
    iso3:      parseTrimmedString(body?.iso3),
    keterangan:parseTrimmedString(body?.keterangan),
    aktif: parseAktifParam(body?.aktif) === '' ? true : parseAktifParam(body?.aktif) === '1',
  };
}

router.get('/opsi', async (req, res, next) => {
  try {
    const q = parseSearchQuery(req.query.q);
    const data = await ModelOpsi.daftarLookupBahasa({ q });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/', periksaIzin('kelola_bahasa'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseAktifParam(req.query.aktif);

    const { data, total } = await ModelOpsi.daftarMasterBahasa({ q, aktif, limit, offset });

    return res.json({
      success: true,
      ...buildPaginatedResult({ data, total, pagination: { limit, offset } }),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', periksaIzin('kelola_bahasa'), async (req, res, next) => {
  try {
    const data = await ModelOpsi.ambilMasterBahasaDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Bahasa tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/', periksaIzin('kelola_bahasa'), async (req, res, next) => {
  try {
    const payload = parseBahasaPayload(req.body);
    if (!payload.kode) return res.status(400).json({ success: false, message: 'Kode bahasa wajib diisi' });
    if (!payload.nama) return res.status(400).json({ success: false, message: 'Nama bahasa wajib diisi' });

    const data = await ModelOpsi.simpanMasterBahasa(payload);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', periksaIzin('kelola_bahasa'), async (req, res, next) => {
  try {
    const payload = parseBahasaPayload(req.body);
    if (!payload.kode) return res.status(400).json({ success: false, message: 'Kode bahasa wajib diisi' });
    if (!payload.nama) return res.status(400).json({ success: false, message: 'Nama bahasa wajib diisi' });

    const data = await ModelOpsi.simpanMasterBahasa({
      ...payload,
      id: parseIdParam(req.params.id),
    });
    if (!data) return res.status(404).json({ success: false, message: 'Bahasa tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', periksaIzin('kelola_bahasa'), async (req, res, next) => {
  try {
    const deleted = await ModelOpsi.hapusMasterBahasa(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Bahasa tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    if (error?.code === 'MASTER_IN_USE') {
      return res.status(409).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

module.exports = router;
