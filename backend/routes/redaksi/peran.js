/**
 * @fileoverview Route redaksi untuk pengelolaan peran dan izin
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelPeran = require('../../models/modelPeran');
const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

function parseBooleanFlag(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'ya', 'yes', 'aktif'].includes(normalized);
  }
  return defaultValue;
}

function parseIzinIds(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;

  const ids = value.map((item) => Number(item));
  if (ids.some((item) => !Number.isInteger(item) || item <= 0)) return null;
  return Array.from(new Set(ids));
}

router.get('/', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const { data, total } = await ModelPeran.daftarPeran({ limit, offset, q });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

router.get('/izin', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const q = parseSearchQuery(req.query.q);
    const data = await ModelPeran.daftarIzin({ q });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const data = await ModelPeran.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Peran tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const kode = parseTrimmedString(req.body.kode);
    const nama = parseTrimmedString(req.body.nama);
    const keterangan = parseTrimmedString(req.body.keterangan);
    const aksesRedaksi = parseBooleanFlag(req.body.akses_redaksi, false);
    const izinIds = parseIzinIds(req.body.izin_ids);

    if (!kode) return res.status(400).json({ success: false, message: 'Kode peran wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama peran wajib diisi' });
    if (izinIds === null) return res.status(400).json({ success: false, message: 'izin_ids harus berupa array bilangan bulat' });

    const data = await ModelPeran.simpan({
      kode,
      nama,
      keterangan,
      akses_redaksi: aksesRedaksi,
      izin_ids: izinIds,
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const kode = parseTrimmedString(req.body.kode);
    const nama = parseTrimmedString(req.body.nama);
    const keterangan = parseTrimmedString(req.body.keterangan);
    const aksesRedaksi = parseBooleanFlag(req.body.akses_redaksi, false);
    const izinIds = parseIzinIds(req.body.izin_ids);

    if (!kode) return res.status(400).json({ success: false, message: 'Kode peran wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama peran wajib diisi' });
    if (izinIds === null) return res.status(400).json({ success: false, message: 'izin_ids harus berupa array bilangan bulat' });

    const data = await ModelPeran.simpan({
      id,
      kode,
      nama,
      keterangan,
      akses_redaksi: aksesRedaksi,
      izin_ids: izinIds,
    });
    if (!data) return res.status(404).json({ success: false, message: 'Peran tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;