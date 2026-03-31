/**
 * @fileoverview Route redaksi untuk pengelolaan arsip Kata Hari Ini
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelKataHariIni = require('../../../models/leksikon/modelKataHariIni');
const { ambilDetailKamus, __private: kataHariIniUtils } = require('../../../services/publik/layananKamusPublik');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();

function normalizeOptionalBodyValue(body, key, fallback = null) {
  if (!Object.prototype.hasOwnProperty.call(body || {}, key)) return fallback;
  return parseTrimmedString(body[key]) || null;
}

async function resolveEntriKataHariIni(indeks, tanggal) {
  const indeksAman = parseTrimmedString(indeks);
  if (!indeksAman) return null;

  const detail = await ambilDetailKamus(indeksAman);
  if (!detail?.indeks || !Array.isArray(detail.entri) || detail.entri.length === 0) {
    return null;
  }

  const kandidatUtama = kataHariIniUtils.ambilMaknaUtama(detail.entri);
  const entriId = Number(kandidatUtama?.entri?.id) || null;
  const payload = kataHariIniUtils.bentukPayloadKataHariIni(detail, tanggal, entriId);

  if (!payload || !entriId) {
    return null;
  }

  return {
    entriId,
    detail,
  };
}

router.get('/', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const sumber = parseTrimmedString(req.query.sumber);

    const result = await ModelKataHariIni.daftarAdmin({
      limit,
      offset,
      q,
      sumber,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({
        data: result.data,
        total: result.total,
        pagination: { limit, offset },
      }),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const data = await ModelKataHariIni.ambilDenganId(parseIdParam(req.params.id));
    if (!data) {
      return res.status(404).json({ success: false, message: 'Arsip Kata Hari Ini tidak ditemukan' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const tanggal = parseTrimmedString(req.body.tanggal);
    const indeks = parseTrimmedString(req.body.indeks);

    if (!tanggal) return res.status(400).json({ success: false, message: 'Tanggal wajib diisi' });
    if (!indeks) return res.status(400).json({ success: false, message: 'Indeks wajib diisi' });

    const target = await resolveEntriKataHariIni(indeks, tanggal);
    if (!target) {
      return res.status(400).json({ success: false, message: 'Indeks tidak ditemukan atau detail kamus belum siap' });
    }

    const data = await ModelKataHariIni.simpanByTanggal({
      tanggal,
      entriId: target.entriId,
      sumber: parseTrimmedString(req.body.sumber) || 'admin',
      catatan: normalizeOptionalBodyValue(req.body, 'catatan', null),
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const existing = await ModelKataHariIni.ambilDenganId(parseIdParam(req.params.id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Arsip Kata Hari Ini tidak ditemukan' });
    }

    const tanggal = existing.tanggal;
    const indeks = parseTrimmedString(req.body.indeks) || existing.indeks;
    const target = await resolveEntriKataHariIni(indeks, tanggal);
    if (!target) {
      return res.status(400).json({ success: false, message: 'Indeks tidak ditemukan atau detail kamus belum siap' });
    }

    const data = await ModelKataHariIni.simpanByTanggal({
      tanggal,
      entriId: target.entriId,
      sumber: parseTrimmedString(req.body.sumber) || existing.sumber || 'admin',
      catatan: normalizeOptionalBodyValue(req.body, 'catatan', existing.catatan || null),
    });

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const deleted = await ModelKataHariIni.hapus(parseIdParam(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Arsip Kata Hari Ini tidak ditemukan' });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;