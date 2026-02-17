/**
 * @fileoverview Route kamus publik (pencarian + detail + kategori)
 */

const express = require('express');
const { authenticate, authenticateOptional } = require('../../middleware/auth');
const { cariKamus, ambilDetailKamus } = require('../../services/layananKamusPublik');
const ModelLabel = require('../../models/modelLabel');
const ModelEntri = require('../../models/modelEntri');
const ModelKomentar = require('../../models/modelKomentar');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();
const maxOffset = Math.max(Number(process.env.PUBLIC_MAX_OFFSET) || 1000, 0);

function parseSearchPagination(query, defaultLimit = 100, maxLimit = 200) {
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const offset = Math.max(Number(query.offset) || 0, 0);

  return { limit, offset };
}

function rejectTooLargeOffset(res, offset) {
  if (offset <= maxOffset) return false;
  res.status(400).json({
    error: 'Invalid Query',
    message: `Offset maksimal adalah ${maxOffset}`,
  });
  return true;
}

router.get('/kategori', async (_req, res, next) => {
  try {
    const data = await ModelLabel.ambilSemuaKategori();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/kategori/:kategori/:kode', async (req, res, next) => {
  try {
    const { limit, offset } = parseSearchPagination(req.query);
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const data = await ModelLabel.cariEntriPerLabel(
      req.params.kategori,
      decodeURIComponent(req.params.kode),
      limit,
      offset
    );
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get('/autocomplete/:kata', async (req, res, next) => {
  try {
    const data = await ModelEntri.autocomplete(req.params.kata);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

router.get('/cari/:kata', publicSearchLimiter, async (req, res, next) => {
  try {
    const { limit, offset } = parseSearchPagination(req.query);
    if (rejectTooLargeOffset(res, offset)) {
      return;
    }

    const result = await cariKamus(req.params.kata, { limit, offset });
    const response = {
      query: req.params.kata,
      total: result.total,
      data: result.data,
    };
    if (result.total === 0) {
      response.saran = await ModelEntri.saranEntri(decodeURIComponent(req.params.kata));
    }
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

router.get('/komentar/:indeks', authenticateOptional, async (req, res, next) => {
  try {
    const indeks = decodeURIComponent(req.params.indeks).trim();
    if (!indeks) {
      return res.status(400).json({
        success: false,
        message: 'Indeks wajib diisi',
      });
    }

    const activeCount = await ModelKomentar.hitungKomentarAktif(indeks);
    const penggunaId = Number(req.user?.pid || 0);

    if (!penggunaId) {
      return res.json({
        success: true,
        data: {
          indeks,
          loggedIn: false,
          activeCount,
          komentar: [],
        },
      });
    }

    const komentar = await ModelKomentar.ambilKomentarTerbaca(indeks, penggunaId);

    return res.json({
      success: true,
      data: {
        indeks,
        loggedIn: true,
        activeCount,
        komentar,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/komentar/:indeks', authenticate, async (req, res, next) => {
  try {
    const indeks = decodeURIComponent(req.params.indeks).trim();
    const komentar = String(req.body?.komentar || '').trim();
    const penggunaId = Number(req.user?.pid || 0);

    if (!penggunaId) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    }

    if (!indeks) {
      return res.status(400).json({ success: false, message: 'Indeks wajib diisi' });
    }

    if (!komentar) {
      return res.status(400).json({ success: false, message: 'Komentar wajib diisi' });
    }

    const data = await ModelKomentar.upsertKomentarPengguna({ indeks, penggunaId, komentar });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/detail/:indeks', async (req, res, next) => {
  try {
    const data = await ambilDetailKamus(req.params.indeks);
    if (!data) {
      const saran = await ModelEntri.saranEntri(decodeURIComponent(req.params.indeks));
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Indeks tidak ditemukan',
        saran,
      });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
