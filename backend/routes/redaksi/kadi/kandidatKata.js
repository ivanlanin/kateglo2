/**
 * @fileoverview Route redaksi untuk pengelolaan kandidat kata (KADI)
 */

const express = require('express');
const ModelKandidatEntri = require('../../../models/kadi/modelKandidatEntri');
const { periksaIzin } = require('../../../middleware/otorisasi');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();

const statusValid = ['menunggu', 'ditinjau', 'disetujui', 'ditolak', 'tunda'];

/**
 * GET /api/redaksi/kandidat-kata/stats
 * Statistik antrian per status
 */
router.get('/stats', periksaIzin('lihat_kandidat'), async (req, res, next) => {
  try {
    const stats = await ModelKandidatEntri.statistikAntrian();
    return res.json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/kandidat-kata
 * Daftar kandidat kata dengan filter + paginasi
 */
router.get('/', periksaIzin('lihat_kandidat'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const status = parseTrimmedString(req.query.status);
    const jenis = parseTrimmedString(req.query.jenis);
    const sumberScraper = parseTrimmedString(req.query.sumber_scraper);
    const prioritas = parseTrimmedString(req.query.prioritas);

    const { data, total } = await ModelKandidatEntri.daftarAdmin({
      limit,
      offset,
      q,
      status: statusValid.includes(status) ? status : '',
      jenis,
      sumber_scraper: sumberScraper,
      prioritas,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({ data, total, pagination: { limit, offset } }),
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/kandidat-kata/:id
 * Detail kandidat kata
 */
router.get('/:id', periksaIzin('lihat_kandidat'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const kandidat = await ModelKandidatEntri.ambilDenganId(id);
    if (!kandidat) return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });

    return res.json({ success: true, data: kandidat });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/kandidat-kata/:id
 * Sunting data kandidat
 */
router.put('/:id', periksaIzin('edit_kandidat'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const existing = await ModelKandidatEntri.ambilDenganId(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });

    const saved = await ModelKandidatEntri.simpan({ ...req.body, id });
    return res.json({ success: true, data: saved });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/kandidat-kata/:id/status
 * Ubah status kandidat (dengan audit trail)
 */
router.put('/:id/status', periksaIzin('ubah_status_kandidat'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const { status, catatan } = req.body || {};
    if (!status || !statusValid.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Pilihan: ${statusValid.join(', ')}`,
      });
    }

    const updated = await ModelKandidatEntri.ubahStatus(id, status, req.user.id, catatan || null);
    return res.json({ success: true, data: updated });
  } catch (error) {
    if (error.message === 'Kandidat tidak ditemukan') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/kandidat-kata/:id
 * Hapus kandidat kata
 */
router.delete('/:id', periksaIzin('hapus_kandidat'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const deleted = await ModelKandidatEntri.hapus(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan' });

    return res.json({ success: true, message: 'Kandidat berhasil dihapus' });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/kandidat-kata/:id/atestasi
 * Daftar atestasi untuk satu kandidat
 */
router.get('/:id/atestasi', periksaIzin('lihat_kandidat'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const atestasi = await ModelKandidatEntri.daftarAtestasi(id);
    return res.json({ success: true, data: atestasi });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/kandidat-kata/:id/atestasi
 * Tambah atestasi secara manual
 */
router.post('/:id/atestasi', periksaIzin('edit_kandidat'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const { kutipan, sumber_tipe } = req.body || {};
    if (!kutipan || !sumber_tipe) {
      return res.status(400).json({
        success: false,
        message: 'Kutipan dan sumber_tipe wajib diisi',
      });
    }

    const atestasi = await ModelKandidatEntri.tambahAtestasi({
      ...req.body,
      kandidat_id: id,
    });
    return res.status(201).json({ success: true, data: atestasi });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/kandidat-kata/:id/riwayat
 * Riwayat kurasi untuk satu kandidat
 */
router.get('/:id/riwayat', periksaIzin('lihat_kandidat'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const riwayat = await ModelKandidatEntri.daftarRiwayat(id);
    return res.json({ success: true, data: riwayat });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
