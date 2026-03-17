/**
 * @fileoverview Route redaksi untuk master sumber
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelOpsi = require('../../models/modelOpsi');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

function parseKonteksParam(value) {
  if (value === '1') return '1';
  if (value === '0') return '0';
  return '';
}

function parseBooleanField(value) {
  if (value === true || value === '1' || value === 1) return true;
  return false;
}

function parseMasterPayload(body) {
  return {
    kode: parseTrimmedString(body?.kode),
    nama: parseTrimmedString(body?.nama),
    keterangan: parseTrimmedString(body?.keterangan),
    glosarium: parseBooleanField(body?.glosarium),
    kamus: parseBooleanField(body?.kamus),
    tesaurus: parseBooleanField(body?.tesaurus),
    etimologi: parseBooleanField(body?.etimologi),
  };
}

router.get('/opsi', async (req, res, next) => {
  try {
    const q = parseSearchQuery(req.query.q);

    const data = await ModelOpsi.daftarLookupSumber({
      q,
      glosarium: parseKonteksParam(req.query.glosarium),
      kamus: parseKonteksParam(req.query.kamus),
      tesaurus: parseKonteksParam(req.query.tesaurus),
      etimologi: parseKonteksParam(req.query.etimologi),
    });

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/', periksaIzin('kelola_sumber'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);

    const { data, total } = await ModelOpsi.daftarMasterSumber({
      q,
      glosarium: parseKonteksParam(req.query.glosarium),
      kamus: parseKonteksParam(req.query.kamus),
      tesaurus: parseKonteksParam(req.query.tesaurus),
      etimologi: parseKonteksParam(req.query.etimologi),
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
    const data = await ModelOpsi.ambilMasterSumberDenganId(parseIdParam(req.params.id));
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

    const data = await ModelOpsi.simpanMasterSumber(payload);
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

    const data = await ModelOpsi.simpanMasterSumber({
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
    const deleted = await ModelOpsi.hapusMasterSumber(parseIdParam(req.params.id));
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
