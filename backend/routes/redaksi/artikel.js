/**
 * @fileoverview Route redaksi untuk pengelolaan artikel editorial
 * Izin: artikel:tulis (buat/edit/unggah gambar), artikel:terbitkan (terbitkan/tarik)
 */

const express = require('express');
const multer = require('multer');
const { periksaIzin } = require('../../middleware/authorization');
const ModelArtikel = require('../../models/artikel/modelArtikel');
const { unggahGambarArtikel } = require('../../services/sistem/layananGambarR2');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * POST /api/redaksi/artikel/unggah-gambar
 * Unggah gambar ke R2, kembalikan URL publik
 */
router.post('/unggah-gambar', periksaIzin('tulis_artikel'), upload.single('gambar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File gambar diperlukan (JPEG, PNG, atau WebP, maks 2 MB)' });
    }
    const result = await unggahGambarArtikel(req.file.buffer, req.file.originalname, req.file.mimetype);
    return res.json({ success: true, url: result.url });
  } catch (error) {
    if (error.code === 'R2_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, message: 'Layanan penyimpanan gambar belum dikonfigurasi' });
    }
    if (error.code === 'INVALID_TYPE') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

/**
 * GET /api/redaksi/artikel
 * Daftar semua artikel (draf + terbit)
 */
router.get('/', periksaIzin('tulis_artikel'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const topik = req.query.topik
      ? (Array.isArray(req.query.topik) ? req.query.topik : [req.query.topik])
      : undefined;
    const status = parseTrimmedString(req.query.status);
    let diterbitkan = parseTrimmedString(req.query.diterbitkan);

    if (!diterbitkan && status) {
      if (status === 'diterbitkan' || status === 'terbit') diterbitkan = 'true';
      if (status === 'draf') diterbitkan = 'false';
    }

    const { data, total } = await ModelArtikel.ambilDaftarRedaksi({
      topik,
      diterbitkan: diterbitkan !== '' ? diterbitkan : undefined,
      q,
      limit,
      offset,
    });

    return res.json({ success: true, ...buildPaginatedResult({ data, total, pagination: { limit, offset } }) });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/artikel/:id
 * Detail satu artikel berdasarkan ID
 */
router.get('/:id', periksaIzin('tulis_artikel'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = await ModelArtikel.ambilSatuRedaksi(id);
    if (!data) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/artikel
 * Buat artikel baru (sebagai draf)
 */
router.post('/', periksaIzin('tulis_artikel'), async (req, res, next) => {
  try {
    const judul = parseTrimmedString(req.body.judul);
    if (!judul) return res.status(400).json({ success: false, message: 'Judul artikel wajib diisi' });

    const topikInput = req.body.topik;
    const topik = Array.isArray(topikInput)
      ? topikInput
      : (topikInput ? [topikInput] : ['lainnya']);
    const topikValid = topik.filter((t) => ModelArtikel.topikValid.includes(t));
    if (topikValid.length === 0) topikValid.push('lainnya');

    const data = await ModelArtikel.buat({
      judul,
      konten: parseTrimmedString(req.body.konten),
      topik: topikValid,
      penulis_id: Number(req.body.penulis_id) > 0 ? Number(req.body.penulis_id) : req.user.pid,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/artikel/:id
 * Perbarui artikel (slug tidak dapat diubah)
 */
router.put('/:id', periksaIzin('tulis_artikel'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const existing = await ModelArtikel.ambilSatuRedaksi(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });

    const updateData = {};
    if (req.body.judul !== undefined) updateData.judul = parseTrimmedString(req.body.judul);
    if (req.body.konten !== undefined) updateData.konten = req.body.konten;
    if (req.body.topik !== undefined) {
      const t = Array.isArray(req.body.topik) ? req.body.topik : [req.body.topik];
      updateData.topik = t.filter((v) => ModelArtikel.topikValid.includes(v));
      if (updateData.topik.length === 0) updateData.topik = ['lainnya'];
    }
    if (req.body.penulis_id !== undefined) {
      const penulisId = Number(req.body.penulis_id);
      if (penulisId > 0) updateData.penulis_id = penulisId;
    }
    if (req.body.penyunting_id !== undefined) {
      updateData.penyunting_id = Number(req.body.penyunting_id) || null;
    } else {
      updateData.penyunting_id = req.user.pid !== existing.penulis_id ? req.user.pid : existing.penyunting_id;
    }
    if (req.body.diterbitkan_pada !== undefined) {
      updateData.diterbitkan_pada = req.body.diterbitkan_pada || null;
    }

    const data = await ModelArtikel.perbarui(id, updateData, req.user.pid);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/artikel/:id/terbitkan
 * Terbitkan atau tarik artikel
 */
router.put('/:id/terbitkan', periksaIzin('terbitkan_artikel'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const existing = await ModelArtikel.ambilSatuRedaksi(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });

    const diterbitkan = req.body.diterbitkan !== undefined ? Boolean(req.body.diterbitkan) : !existing.diterbitkan;
    const data = await ModelArtikel.terbitkan(id, diterbitkan);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/artikel/:id
 * Hapus artikel
 */
router.delete('/:id', periksaIzin('tulis_artikel'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const existing = await ModelArtikel.ambilSatuRedaksi(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });

    await ModelArtikel.hapus(id);
    return res.json({ success: true, message: 'Artikel berhasil dihapus' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
