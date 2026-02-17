/**
 * @fileoverview Route admin untuk pengelolaan komentar kamus
 */

const express = require('express');
const ModelKomentar = require('../../models/modelKomentar');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = String(req.query.q || '').trim();

    const { data, total } = await ModelKomentar.daftarAdmin({ limit, offset, q });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelKomentar.ambilDenganId(Number(req.params.id));
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
    const id = Number(req.params.id);
    const komentar = String(req.body?.komentar || '').trim();

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
