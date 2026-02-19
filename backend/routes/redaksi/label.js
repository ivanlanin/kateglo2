/**
 * @fileoverview Route admin untuk pengelolaan label
 */

const express = require('express');
const ModelLabel = require('../../models/modelLabel');
const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

function isValidAktifValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return value === 0 || value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['0', '1', 'true', 'false', 'ya', 'tidak', 'yes', 'no', 'aktif', 'nonaktif'].includes(normalized);
  }
  return false;
}

/**
 * GET /api/redaksi/label
 * Daftar label dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const aktif = parseTrimmedString(req.query.aktif);

    const { data, total } = await ModelLabel.daftarAdmin({
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

/**
 * GET /api/redaksi/label/kategori
 * Ambil daftar label per kategori untuk kebutuhan dropdown redaksi.
 * Query optional: ?nama=bentuk-kata,jenis-rujuk,kelas-kata,ragam,bidang,bahasa,penyingkatan
 */
router.get('/kategori', async (req, res, next) => {
  try {
    const rawNama = parseSearchQuery(req.query.nama);
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
    const data = await ModelLabel.ambilDenganId(parseIdParam(req.params.id));
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
    const kategori = parseTrimmedString(req.body.kategori);
    const kode = parseTrimmedString(req.body.kode);
    const nama = parseTrimmedString(req.body.nama);
    const { urutan, aktif } = req.body;
    if (!kategori) return res.status(400).json({ success: false, message: 'Kategori wajib diisi' });
    if (!kode) return res.status(400).json({ success: false, message: 'Kode wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    if (urutan !== undefined && (!Number.isFinite(Number(urutan)) || Number(urutan) < 1)) {
      return res.status(400).json({ success: false, message: 'Urutan harus bilangan bulat >= 1' });
    }
    if (!isValidAktifValue(aktif)) {
      return res.status(400).json({ success: false, message: 'Status aktif tidak valid' });
    }

    const data = await ModelLabel.simpan({ ...req.body, kategori, kode, nama });
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
    const id = parseIdParam(req.params.id);
    const kategori = parseTrimmedString(req.body.kategori);
    const kode = parseTrimmedString(req.body.kode);
    const nama = parseTrimmedString(req.body.nama);
    const { urutan, aktif } = req.body;
    if (!kategori) return res.status(400).json({ success: false, message: 'Kategori wajib diisi' });
    if (!kode) return res.status(400).json({ success: false, message: 'Kode wajib diisi' });
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    if (urutan !== undefined && (!Number.isFinite(Number(urutan)) || Number(urutan) < 1)) {
      return res.status(400).json({ success: false, message: 'Urutan harus bilangan bulat >= 1' });
    }
    if (!isValidAktifValue(aktif)) {
      return res.status(400).json({ success: false, message: 'Status aktif tidak valid' });
    }

    const data = await ModelLabel.simpan({ ...req.body, id, kategori, kode, nama });
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
    const deleted = await ModelLabel.hapus(parseIdParam(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Label tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
