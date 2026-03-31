/**
 * @fileoverview Route redaksi untuk pengelolaan arsip Kata Hari Ini
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelEntri = require('../../../models/leksikon/modelEntri');
const ModelKataHariIni = require('../../../models/leksikon/modelKataHariIni');
const {
  ambilDetailKamus,
  hapusCacheKataHariIni,
  __private: kataHariIniUtils,
} = require('../../../services/publik/layananKamusPublik');
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

function isKataHariIniEntriConflict(error) {
  return error?.code === '23505' && error?.constraint === 'kata_hari_ini_entri_id_key';
}

async function resolveEntriKataHariIni({ entriId, indeks, tanggal }) {
  const entriIdAman = Number.parseInt(entriId, 10);
  let indeksAman = parseTrimmedString(indeks);

  if (Number.isInteger(entriIdAman) && entriIdAman > 0) {
    const entri = await ModelEntri.ambilDenganId(entriIdAman);
    if (!entri?.id || !entri?.indeks) return null;
    indeksAman = entri.indeks;
  }

  if (!indeksAman) return null;

  const detail = await ambilDetailKamus(indeksAman);
  if (!detail?.indeks || !Array.isArray(detail.entri) || detail.entri.length === 0) {
    return null;
  }

  const kandidatUtama = Number.isInteger(entriIdAman) && entriIdAman > 0
    ? { entri: detail.entri.find((item) => Number(item?.id) === entriIdAman) || null }
    : kataHariIniUtils.ambilMaknaUtama(detail.entri);
  const entriIdFinal = Number(kandidatUtama?.entri?.id) || null;
  const payload = kataHariIniUtils.bentukPayloadKataHariIni(detail, tanggal, entriIdFinal);

  if (!payload || !entriIdFinal) {
    return null;
  }

  return {
    entriId: entriIdFinal,
    detail,
  };
}

router.get('/opsi-entri', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const q = parseSearchQuery(req.query.q);
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
    if (!q) return res.json({ success: true, data: [] });

    const data = await ModelEntri.cariIndukAdmin(q, { limit });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

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
    const entriId = Number.parseInt(req.body.entri_id, 10);

    if (!tanggal) return res.status(400).json({ success: false, message: 'Tanggal wajib diisi' });
    if (!Number.isInteger(entriId) || entriId <= 0) return res.status(400).json({ success: false, message: 'Entri wajib dipilih' });

    const target = await resolveEntriKataHariIni({ entriId, tanggal });
    if (!target) {
      return res.status(400).json({ success: false, message: 'Entri tidak ditemukan atau detail kamus belum siap' });
    }

    const data = await ModelKataHariIni.simpanByTanggal({
      tanggal,
      entriId: target.entriId,
      sumber: parseTrimmedString(req.body.sumber) || 'admin',
      catatan: normalizeOptionalBodyValue(req.body, 'catatan', null),
    });

    await hapusCacheKataHariIni(data?.tanggal || tanggal);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (isKataHariIniEntriConflict(error)) {
      return res.status(409).json({ success: false, message: 'Entri ini sudah terdaftar sebagai Kata Hari Ini pada tanggal lain' });
    }
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
    const entriId = Number.parseInt(req.body.entri_id, 10);
    const target = await resolveEntriKataHariIni({
      entriId: Number.isInteger(entriId) && entriId > 0 ? entriId : existing.entri_id,
      tanggal,
    });
    if (!target) {
      return res.status(400).json({ success: false, message: 'Entri tidak ditemukan atau detail kamus belum siap' });
    }

    const data = await ModelKataHariIni.simpanByTanggal({
      tanggal,
      entriId: target.entriId,
      sumber: parseTrimmedString(req.body.sumber) || existing.sumber || 'admin',
      catatan: normalizeOptionalBodyValue(req.body, 'catatan', existing.catatan || null),
    });

    await hapusCacheKataHariIni(data?.tanggal || tanggal);

    return res.json({ success: true, data });
  } catch (error) {
    if (isKataHariIniEntriConflict(error)) {
      return res.status(409).json({ success: false, message: 'Entri ini sudah terdaftar sebagai Kata Hari Ini pada tanggal lain' });
    }
    return next(error);
  }
});

router.delete('/:id', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const existing = await ModelKataHariIni.ambilDenganId(parseIdParam(req.params.id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Arsip Kata Hari Ini tidak ditemukan' });
    }

    const deleted = await ModelKataHariIni.hapus(parseIdParam(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Arsip Kata Hari Ini tidak ditemukan' });
    }

    await hapusCacheKataHariIni(existing.tanggal);

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;