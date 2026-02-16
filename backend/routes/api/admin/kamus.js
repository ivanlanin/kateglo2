/**
 * @fileoverview Route admin untuk pengelolaan kamus (lema)
 */

const express = require('express');
const ModelLema = require('../../../models/modelLema');

const router = express.Router();

/**
 * GET /api/admin/kamus
 * Daftar lema dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = (req.query.q || '').trim();

    const { data, total } = await ModelLema.daftarAdmin({ limit, offset, q });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/admin/kamus/:id
 * Ambil detail lema untuk penyuntingan
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelLema.ambilDenganId(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Lema tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/admin/kamus
 * Tambah lema baru
 */
router.post('/', async (req, res, next) => {
  try {
    const { lema, jenis } = req.body;
    if (!lema?.trim()) return res.status(400).json({ success: false, message: 'Lema wajib diisi' });
    if (!jenis) return res.status(400).json({ success: false, message: 'Jenis wajib diisi' });

    const data = await ModelLema.simpan(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/admin/kamus/:id
 * Sunting lema
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { lema, jenis } = req.body;
    if (!lema?.trim()) return res.status(400).json({ success: false, message: 'Lema wajib diisi' });
    if (!jenis) return res.status(400).json({ success: false, message: 'Jenis wajib diisi' });

    const data = await ModelLema.simpan({ ...req.body, id });
    if (!data) return res.status(404).json({ success: false, message: 'Lema tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/admin/kamus/:id
 * Hapus lema
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await ModelLema.hapus(Number(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Lema tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Makna
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/kamus/:lemaId/makna
 * Daftar makna + contoh untuk sebuah lema
 */
router.get('/:lemaId/makna', async (req, res, next) => {
  try {
    const lemaId = Number(req.params.lemaId);
    const daftarMakna = await ModelLema.ambilMakna(lemaId);
    const maknaIds = daftarMakna.map((m) => m.id);
    const daftarContoh = await ModelLema.ambilContoh(maknaIds);

    // Group contoh by makna_id
    const contohMap = {};
    for (const c of daftarContoh) {
      if (!contohMap[c.makna_id]) contohMap[c.makna_id] = [];
      contohMap[c.makna_id].push(c);
    }

    const data = daftarMakna.map((m) => ({
      ...m,
      contoh: contohMap[m.id] || [],
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/admin/kamus/:lemaId/makna
 * Tambah makna baru
 */
router.post('/:lemaId/makna', async (req, res, next) => {
  try {
    const lema_id = Number(req.params.lemaId);
    const { makna } = req.body;
    if (!makna?.trim()) return res.status(400).json({ success: false, message: 'Makna wajib diisi' });

    const data = await ModelLema.simpanMakna({ ...req.body, lema_id });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/admin/kamus/:lemaId/makna/:maknaId
 * Sunting makna
 */
router.put('/:lemaId/makna/:maknaId', async (req, res, next) => {
  try {
    const lema_id = Number(req.params.lemaId);
    const id = Number(req.params.maknaId);
    const { makna } = req.body;
    if (!makna?.trim()) return res.status(400).json({ success: false, message: 'Makna wajib diisi' });

    const data = await ModelLema.simpanMakna({ ...req.body, id, lema_id });
    if (!data) return res.status(404).json({ success: false, message: 'Makna tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/admin/kamus/:lemaId/makna/:maknaId
 * Hapus makna (cascade hapus contoh)
 */
router.delete('/:lemaId/makna/:maknaId', async (req, res, next) => {
  try {
    const deleted = await ModelLema.hapusMakna(Number(req.params.maknaId));
    if (!deleted) return res.status(404).json({ success: false, message: 'Makna tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Contoh
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/kamus/:lemaId/makna/:maknaId/contoh
 * Tambah contoh baru
 */
router.post('/:lemaId/makna/:maknaId/contoh', async (req, res, next) => {
  try {
    const makna_id = Number(req.params.maknaId);
    const { contoh } = req.body;
    if (!contoh?.trim()) return res.status(400).json({ success: false, message: 'Contoh wajib diisi' });

    const data = await ModelLema.simpanContoh({ ...req.body, makna_id });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/admin/kamus/:lemaId/makna/:maknaId/contoh/:contohId
 * Sunting contoh
 */
router.put('/:lemaId/makna/:maknaId/contoh/:contohId', async (req, res, next) => {
  try {
    const makna_id = Number(req.params.maknaId);
    const id = Number(req.params.contohId);
    const { contoh } = req.body;
    if (!contoh?.trim()) return res.status(400).json({ success: false, message: 'Contoh wajib diisi' });

    const data = await ModelLema.simpanContoh({ ...req.body, id, makna_id });
    if (!data) return res.status(404).json({ success: false, message: 'Contoh tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/admin/kamus/:lemaId/makna/:maknaId/contoh/:contohId
 * Hapus contoh
 */
router.delete('/:lemaId/makna/:maknaId/contoh/:contohId', async (req, res, next) => {
  try {
    const deleted = await ModelLema.hapusContoh(Number(req.params.contohId));
    if (!deleted) return res.status(404).json({ success: false, message: 'Contoh tidak ditemukan' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
