/**
 * @fileoverview Route redaksi untuk kurasi WordNet (sinset, lema, relasi)
 *
 * Endpoints:
 *   GET    /api/redaksi/sinset/statistik       — dashboard statistik
 *   GET    /api/redaksi/sinset/tipe-relasi     — daftar tipe relasi
 *   GET    /api/redaksi/sinset                 — daftar synset (filter + paginasi)
 *   GET    /api/redaksi/sinset/:id             — detail synset + lema + relasi
 *   PUT    /api/redaksi/sinset/:id             — update synset (definisi, status, catatan)
 *   PUT    /api/redaksi/sinset/:id/lema/:lemaId — update pemetaan lema (makna_id)
 *   GET    /api/redaksi/sinset/:id/lema/:lemaId/kandidat — kandidat makna untuk lema
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelSinset = require('../../../models/wordnet/modelSinset');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();

// All wordnet routes require 'kelola_sinset' permission
const izin = periksaIzin('kelola_sinset');

/**
 * GET /api/redaksi/sinset/statistik
 */
router.get('/statistik', izin, async (req, res, next) => {
  try {
    const data = await ModelSinset.statistik();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/sinset/tipe-relasi
 */
router.get('/tipe-relasi', izin, async (req, res, next) => {
  try {
    const data = await ModelSinset.daftarTipeRelasi();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/sinset
 * Query: q, status, kelas_kata, ada_pemetaan (0|1), limit, cursor, direction, lastPage
 */
router.get('/', izin, async (req, res, next) => {
  try {
    const { limit, cursor, direction, lastPage } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const status = parseTrimmedString(req.query.status);
    const kelasKata = parseTrimmedString(req.query.kelas_kata);
    const adaPemetaan = parseTrimmedString(req.query.ada_pemetaan);

    const result = await ModelSinset.daftar({
      limit,
      q,
      status,
      kelasKata,
      adaPemetaan,
      cursor,
      direction,
      lastPage,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({
        data: result.data,
        total: result.total,
        pagination: { limit },
        pageInfo: {
          hasPrev: result.hasPrev,
          hasNext: result.hasNext,
          prevCursor: result.prevCursor,
          nextCursor: result.nextCursor,
        },
      }),
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/sinset/:id
 */
router.get('/:id', izin, async (req, res, next) => {
  try {
    const id = parseTrimmedString(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID sinset wajib diisi' });

    const data = await ModelSinset.ambilDenganId(id);
    if (!data) return res.status(404).json({ success: false, message: 'Sinset tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/sinset/:id
 * Body: { definisi_id?, contoh_id?, status?, catatan? }
 */
router.put('/:id', izin, async (req, res, next) => {
  try {
    const id = parseTrimmedString(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID sinset wajib diisi' });

    const { status } = req.body;
    if (status !== undefined && !['draf', 'tinjau', 'terverifikasi'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid (draf/tinjau/terverifikasi)' });
    }

    const data = await ModelSinset.simpan(id, {
      definisi_id: req.body.definisi_id,
      contoh_id: req.body.contoh_id,
      status: req.body.status,
      catatan: req.body.catatan,
    });
    if (!data) return res.status(404).json({ success: false, message: 'Sinset tidak ditemukan atau tidak ada perubahan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/sinset/:id/lema/:lemaId/kandidat
 */
router.get('/:id/lema/:lemaId/kandidat', izin, async (req, res, next) => {
  try {
    const sinsetId = parseTrimmedString(req.params.id);
    const lemaId = Number(req.params.lemaId);
    if (!sinsetId || !lemaId) {
      return res.status(400).json({ success: false, message: 'ID sinset dan lema wajib diisi' });
    }

    const data = await ModelSinset.ambilKandidatMakna(sinsetId, lemaId);
    if (!data) return res.status(404).json({ success: false, message: 'Lema tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/sinset/:id/lema/:lemaId
 * Body: { makna_id?, terverifikasi? }
 */
router.put('/:id/lema/:lemaId', izin, async (req, res, next) => {
  try {
    const lemaId = Number(req.params.lemaId);
    if (!lemaId) {
      return res.status(400).json({ success: false, message: 'ID lema wajib diisi' });
    }

    const data = await ModelSinset.simpanPemetaanLema(lemaId, {
      makna_id: req.body.makna_id,
      terverifikasi: req.body.terverifikasi,
    });
    if (!data) return res.status(404).json({ success: false, message: 'Lema tidak ditemukan atau tidak ada perubahan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
