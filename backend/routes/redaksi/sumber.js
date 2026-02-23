/**
 * @fileoverview Route redaksi untuk master sumber
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

router.get('/', periksaIzin('kelola_sumber'), async (req, res, next) => {
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

router.get('/:id', periksaIzin('kelola_sumber'), async (req, res, next) => {
  try {
    const data = await ModelGlosarium.ambilMasterSumberDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Sumber tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/', periksaIzin('kelola_sumber'), async (req, res, next) => {
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

router.put('/:id', periksaIzin('kelola_sumber'), async (req, res, next) => {
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

router.delete('/:id', periksaIzin('kelola_sumber'), async (req, res, next) => {
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

module.exports = router;
