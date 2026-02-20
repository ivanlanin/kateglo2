/**
 * @fileoverview Route redaksi untuk pengelolaan izin dan peran
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelIzin = require('../../models/modelIzin');
const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

function parsePeranIds(value) {
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
    const { data, total } = await ModelIzin.daftarIzin({ limit, offset, q });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

router.get('/peran', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const q = parseSearchQuery(req.query.q);
    const data = await ModelIzin.daftarPeran({ q });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const data = await ModelIzin.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/', periksaIzin('kelola_peran'), async (req, res, next) => {
  try {
    const kode = parseTrimmedString(req.body.kode);
    const nama = parseTrimmedString(req.body.nama);
    const kelompok = parseTrimmedString(req.body.kelompok);
    const peranIds = parsePeranIds(req.body.peran_ids);

    if (!kode) return res.status(400).json({ success: false, message: 'Kode izin wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama izin wajib diisi' });
    if (peranIds === null) return res.status(400).json({ success: false, message: 'peran_ids harus berupa array bilangan bulat' });

    const data = await ModelIzin.simpan({ kode, nama, kelompok, peran_ids: peranIds });
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
    const kelompok = parseTrimmedString(req.body.kelompok);
    const peranIds = parsePeranIds(req.body.peran_ids);

    if (!kode) return res.status(400).json({ success: false, message: 'Kode izin wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama izin wajib diisi' });
    if (peranIds === null) return res.status(400).json({ success: false, message: 'peran_ids harus berupa array bilangan bulat' });

    const data = await ModelIzin.simpan({ id, kode, nama, kelompok, peran_ids: peranIds });
    if (!data) return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;