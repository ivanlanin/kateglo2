/**
 * @fileoverview Route admin untuk pengelolaan label
 */

const express = require('express');
const ModelLabel = require('../../models/modelLabel');

const router = express.Router();

/**
 * GET /api/redaksi/label
 * Daftar label dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = (req.query.q || '').trim();

    const { data, total } = await ModelLabel.daftarAdmin({ limit, offset, q });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/label/kategori
 * Ambil daftar label per kategori untuk kebutuhan dropdown redaksi.
 * Query optional: ?nama=bentuk-kata,jenis-rujuk,kelas-kata,ragam,bidang,bahasa,penyingkatan
 */
router.get('/kategori', async (req, res, next) => {
  try {
    const rawNama = String(req.query.nama || '').trim();
    const kategori = rawNama
      ? rawNama.split(',').map((item) => item.trim()).filter(Boolean)
      : undefined;

    const data = await ModelLabel.ambilKategoriUntukRedaksi(kategori);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/label/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelLabel.ambilDenganId(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Label tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/label
 */
router.post('/', async (req, res, next) => {
  try {
    const { kategori, kode, nama, urutan } = req.body;
    if (!kategori?.trim()) return res.status(400).json({ success: false, message: 'Kategori wajib diisi' });
    if (!kode?.trim()) return res.status(400).json({ success: false, message: 'Kode wajib diisi' });
    if (!nama?.trim()) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    if (urutan !== undefined && (!Number.isFinite(Number(urutan)) || Number(urutan) < 1)) {
      return res.status(400).json({ success: false, message: 'Urutan harus bilangan bulat >= 1' });
    }

    const data = await ModelLabel.simpan(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/label/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { kategori, kode, nama, urutan } = req.body;
    if (!kategori?.trim()) return res.status(400).json({ success: false, message: 'Kategori wajib diisi' });
    if (!kode?.trim()) return res.status(400).json({ success: false, message: 'Kode wajib diisi' });
    if (!nama?.trim()) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    if (urutan !== undefined && (!Number.isFinite(Number(urutan)) || Number(urutan) < 1)) {
      return res.status(400).json({ success: false, message: 'Urutan harus bilangan bulat >= 1' });
    }

    const data = await ModelLabel.simpan({ ...req.body, id });
    if (!data) return res.status(404).json({ success: false, message: 'Label tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/label/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await ModelLabel.hapus(Number(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Label tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
