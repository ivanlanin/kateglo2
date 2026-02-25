/**
 * @fileoverview Route redaksi untuk pengelolaan etimologi
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelEtimologi = require('../../models/modelEtimologi');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

router.get('/opsi-entri', periksaIzin('kelola_etimologi'), async (req, res, next) => {
  try {
    const q = parseSearchQuery(req.query.q);
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
    if (!q) return res.json({ success: true, data: [] });

    const data = await ModelEtimologi.cariEntriUntukTautan(q, { limit });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/', periksaIzin('kelola_etimologi'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const { data, total } = await ModelEtimologi.daftarAdmin({ limit, offset, q });
    return res.json({ success: true, ...buildPaginatedResult({ data, total, pagination: { limit, offset } }) });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', periksaIzin('kelola_etimologi'), async (req, res, next) => {
  try {
    const data = await ModelEtimologi.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Etimologi tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/', periksaIzin('kelola_etimologi'), async (req, res, next) => {
  try {
    const indeks = parseTrimmedString(req.body.indeks);
    if (!indeks) return res.status(400).json({ success: false, message: 'Indeks wajib diisi' });
    const entriId = req.body.entri_id === '' || req.body.entri_id === null || req.body.entri_id === undefined
      ? null
      : Number(req.body.entri_id);
    if (entriId !== null && !Number.isInteger(entriId)) {
      return res.status(400).json({ success: false, message: 'entri_id tidak valid' });
    }

    const sumber = parseTrimmedString(req.body.sumber) || 'LWIM';
    const data = await ModelEtimologi.simpan({ ...req.body, indeks, sumber, entri_id: entriId });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', periksaIzin('kelola_etimologi'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const indeks = parseTrimmedString(req.body.indeks);
    if (!indeks) return res.status(400).json({ success: false, message: 'Indeks wajib diisi' });
    const entriId = req.body.entri_id === '' || req.body.entri_id === null || req.body.entri_id === undefined
      ? null
      : Number(req.body.entri_id);
    if (entriId !== null && !Number.isInteger(entriId)) {
      return res.status(400).json({ success: false, message: 'entri_id tidak valid' });
    }

    const sumber = parseTrimmedString(req.body.sumber) || 'LWIM';
    const data = await ModelEtimologi.simpan({ ...req.body, id, indeks, sumber, entri_id: entriId });
    if (!data) return res.status(404).json({ success: false, message: 'Etimologi tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', periksaIzin('kelola_etimologi'), async (req, res, next) => {
  try {
    const deleted = await ModelEtimologi.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Etimologi tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
