/**
 * @fileoverview Route admin untuk pengelolaan kamus (lema)
 */

const express = require('express');
const ModelEntri = require('../../models/modelEntri');
const { hapusCacheDetailKamus } = require('../../services/layananKamusPublik');
const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

async function invalidasiCacheByIndeks(indeks) {
  if (!indeks) return;
  await hapusCacheDetailKamus(indeks);
}

async function ambilIndeksAmanByEntriId(entriId) {
  try {
    const entri = await ModelEntri.ambilDenganId(parseIdParam(entriId));
    return entri?.indeks || null;
  } catch (_error) {
    return null;
  }
}

async function invalidasiCacheByEntriId(entriId) {
  const indeks = await ambilIndeksAmanByEntriId(entriId);
  await invalidasiCacheByIndeks(indeks);
}

/**
 * GET /api/redaksi/kamus
 * Daftar entri dengan pencarian opsional (paginasi)
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);

    const { data, total } = await ModelEntri.daftarAdmin({ limit, offset, q });
    return res.json({ success: true, data, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/kamus/:id
 * Ambil detail entri untuk penyuntingan
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await ModelEntri.ambilDenganId(parseIdParam(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Entri tidak ditemukan' });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/redaksi/kamus
 * Tambah entri baru
 */
router.post('/', async (req, res, next) => {
  try {
    const entri = parseTrimmedString(req.body.entri ?? req.body.lema);
    const { jenis } = req.body;
    if (!entri) return res.status(400).json({ success: false, message: 'Entri wajib diisi' });
    if (!jenis) return res.status(400).json({ success: false, message: 'Jenis wajib diisi' });

    const data = await ModelEntri.simpan({ ...req.body, entri });
    await invalidasiCacheByIndeks(data?.indeks);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/kamus/:id
 * Sunting entri
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const entri = parseTrimmedString(req.body.entri ?? req.body.lema);
    const { jenis } = req.body;
    if (!entri) return res.status(400).json({ success: false, message: 'Entri wajib diisi' });
    if (!jenis) return res.status(400).json({ success: false, message: 'Jenis wajib diisi' });

    const indeksSebelum = await ambilIndeksAmanByEntriId(id);
    const data = await ModelEntri.simpan({ ...req.body, id, entri });
    if (!data) return res.status(404).json({ success: false, message: 'Entri tidak ditemukan' });
    await invalidasiCacheByIndeks(indeksSebelum);
    await invalidasiCacheByIndeks(data?.indeks);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/kamus/:id
 * Hapus entri
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const entriId = parseIdParam(req.params.id);
    const indeksSebelum = await ambilIndeksAmanByEntriId(entriId);
    const deleted = await ModelEntri.hapus(entriId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Entri tidak ditemukan' });
    await invalidasiCacheByIndeks(indeksSebelum);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Makna
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/redaksi/kamus/:entriId/makna
 * Daftar makna + contoh untuk sebuah entri
 */
router.get('/:entriId/makna', async (req, res, next) => {
  try {
    const entriId = parseIdParam(req.params.entriId);
    const daftarMakna = await ModelEntri.ambilMakna(entriId);
    const maknaIds = daftarMakna.map((m) => m.id);
    const daftarContoh = await ModelEntri.ambilContoh(maknaIds);

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
 * POST /api/redaksi/kamus/:entriId/makna
 * Tambah makna baru
 */
router.post('/:entriId/makna', async (req, res, next) => {
  try {
    const entri_id = parseIdParam(req.params.entriId);
    const { makna } = req.body;
    if (!makna?.trim()) return res.status(400).json({ success: false, message: 'Makna wajib diisi' });

    const data = await ModelEntri.simpanMakna({ ...req.body, entri_id });
    await invalidasiCacheByEntriId(entri_id);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/kamus/:entriId/makna/:maknaId
 * Sunting makna
 */
router.put('/:entriId/makna/:maknaId', async (req, res, next) => {
  try {
    const entri_id = parseIdParam(req.params.entriId);
    const id = parseIdParam(req.params.maknaId);
    const { makna } = req.body;
    if (!makna?.trim()) return res.status(400).json({ success: false, message: 'Makna wajib diisi' });

    const data = await ModelEntri.simpanMakna({ ...req.body, id, entri_id });
    if (!data) return res.status(404).json({ success: false, message: 'Makna tidak ditemukan' });
    await invalidasiCacheByEntriId(entri_id);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/kamus/:entriId/makna/:maknaId
 * Hapus makna (cascade hapus contoh)
 */
router.delete('/:entriId/makna/:maknaId', async (req, res, next) => {
  try {
    const entriId = parseIdParam(req.params.entriId);
    const deleted = await ModelEntri.hapusMakna(parseIdParam(req.params.maknaId));
    if (!deleted) return res.status(404).json({ success: false, message: 'Makna tidak ditemukan' });
    await invalidasiCacheByEntriId(entriId);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Contoh
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/redaksi/kamus/:entriId/makna/:maknaId/contoh
 * Tambah contoh baru
 */
router.post('/:entriId/makna/:maknaId/contoh', async (req, res, next) => {
  try {
    const entriId = parseIdParam(req.params.entriId);
    const makna_id = parseIdParam(req.params.maknaId);
    const { contoh } = req.body;
    if (!contoh?.trim()) return res.status(400).json({ success: false, message: 'Contoh wajib diisi' });

    const data = await ModelEntri.simpanContoh({ ...req.body, makna_id });
    await invalidasiCacheByEntriId(entriId);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/redaksi/kamus/:entriId/makna/:maknaId/contoh/:contohId
 * Sunting contoh
 */
router.put('/:entriId/makna/:maknaId/contoh/:contohId', async (req, res, next) => {
  try {
    const entriId = parseIdParam(req.params.entriId);
    const makna_id = parseIdParam(req.params.maknaId);
    const id = parseIdParam(req.params.contohId);
    const { contoh } = req.body;
    if (!contoh?.trim()) return res.status(400).json({ success: false, message: 'Contoh wajib diisi' });

    const data = await ModelEntri.simpanContoh({ ...req.body, id, makna_id });
    if (!data) return res.status(404).json({ success: false, message: 'Contoh tidak ditemukan' });
    await invalidasiCacheByEntriId(entriId);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/redaksi/kamus/:entriId/makna/:maknaId/contoh/:contohId
 * Hapus contoh
 */
router.delete('/:entriId/makna/:maknaId/contoh/:contohId', async (req, res, next) => {
  try {
    const entriId = parseIdParam(req.params.entriId);
    const deleted = await ModelEntri.hapusContoh(parseIdParam(req.params.contohId));
    if (!deleted) return res.status(404).json({ success: false, message: 'Contoh tidak ditemukan' });
    await invalidasiCacheByEntriId(entriId);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

