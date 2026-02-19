/**
 * @fileoverview Route admin untuk pengelolaan komentar kamus
 */

const express = require('express');
const ModelKomentar = require('../../models/modelKomentar');
const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);

    const { data, total } = await ModelKomentar.daftarAdmin({
      limit,
      offset,
      q,
      aktif: ['0', '1'].includes(aktif) ? aktif : '',
    });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelKomentar.ambilDenganId(parseIdParam(req.params.id));
    if (!data) {
      return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const komentar = parseTrimmedString(req.body?.komentar);

    if (!komentar) {
      return res.status(400).json({ success: false, message: 'Komentar wajib diisi' });
    }

    const data = await ModelKomentar.simpanAdmin({ id, komentar, aktif: req.body?.aktif });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
