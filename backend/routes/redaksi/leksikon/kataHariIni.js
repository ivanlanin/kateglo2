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

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key);
}

function normalizeOptionalBodyValue(body, key, fallback = null) {
  if (!hasOwn(body, key)) return fallback;
  return parseTrimmedString(body[key]) || null;
}

async function bangunSnapshotDariIndeks(indeks, tanggal) {
  const indeksAman = parseTrimmedString(indeks);
  if (!indeksAman) return null;

  const detail = await ambilDetailKamus(indeksAman);
  if (!detail?.indeks || !Array.isArray(detail.entri) || detail.entri.length === 0) {
    return null;
  }

  const kandidatUtama = kataHariIniUtils.ambilMaknaUtama(detail.entri);
  const payload = kataHariIniUtils.bentukPayloadKataHariIni(detail, tanggal);
  const entriId = Number(kandidatUtama?.entri?.id) || null;

  if (!payload || !entriId) {
    return null;
  }

  return {
    entriId,
    payload,
  };
}

function bentukPayloadAkhir({ body, basisPayload, indeks }) {
  const etimologiBahasa = normalizeOptionalBodyValue(body, 'etimologi_bahasa', basisPayload?.etimologi?.bahasa || null);
  const etimologiKataAsal = normalizeOptionalBodyValue(body, 'etimologi_kata_asal', basisPayload?.etimologi?.kata_asal || null);

  return {
    indeks,
    entri: normalizeOptionalBodyValue(body, 'entri', basisPayload?.entri || indeks),
    kelas_kata: normalizeOptionalBodyValue(body, 'kelas_kata', basisPayload?.kelas_kata || null),
    makna: normalizeOptionalBodyValue(body, 'makna', basisPayload?.makna || null),
    contoh: normalizeOptionalBodyValue(body, 'contoh', basisPayload?.contoh || null),
    pemenggalan: normalizeOptionalBodyValue(body, 'pemenggalan', basisPayload?.pemenggalan || null),
    lafal: normalizeOptionalBodyValue(body, 'lafal', basisPayload?.lafal || null),
    etimologi: etimologiBahasa || etimologiKataAsal
      ? {
        bahasa: etimologiBahasa,
        kata_asal: etimologiKataAsal,
      }
      : null,
  };
}

router.get('/', periksaIzin('edit_entri'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const modePemilihan = parseTrimmedString(req.query.mode_pemilihan);

    const result = await ModelKataHariIni.daftarAdmin({
      limit,
      offset,
      q,
      modePemilihan,
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

    const snapshot = await bangunSnapshotDariIndeks(indeks, tanggal);
    if (!snapshot) {
      return res.status(400).json({ success: false, message: 'Indeks tidak ditemukan atau detail kamus belum siap' });
    }

    const payload = bentukPayloadAkhir({ body: req.body, basisPayload: snapshot.payload, indeks });
    const data = await ModelKataHariIni.simpanByTanggal({
      tanggal,
      entriId: snapshot.entriId,
      payload,
      modePemilihan: parseTrimmedString(req.body.mode_pemilihan) || 'admin',
      catatanAdmin: normalizeOptionalBodyValue(req.body, 'catatan_admin', null),
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
    const snapshot = await bangunSnapshotDariIndeks(indeks, tanggal);
    if (!snapshot) {
      return res.status(400).json({ success: false, message: 'Indeks tidak ditemukan atau detail kamus belum siap' });
    }

    const payload = bentukPayloadAkhir({ body: req.body, basisPayload: existing, indeks });
    const data = await ModelKataHariIni.simpanByTanggal({
      tanggal,
      entriId: snapshot.entriId,
      payload,
      modePemilihan: parseTrimmedString(req.body.mode_pemilihan) || existing.mode_pemilihan || 'admin',
      catatanAdmin: normalizeOptionalBodyValue(req.body, 'catatan_admin', existing.catatan_admin || null),
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