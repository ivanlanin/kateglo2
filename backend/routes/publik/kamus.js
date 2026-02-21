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
const { parseCursorPagination } = require('../../utils/routesPublikUtils');

const router = express.Router();

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
    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 200,
    });

    const data = await ModelLabel.cariEntriPerLabelCursor(
      req.params.kategori,
      decodeURIComponent(req.params.kode),
      {
        limit,
        cursor,
        direction,
        lastPage,
        hitungTotal: true,
      }
    );
    return res.json({
      ...data,
      pageInfo: {
        hasPrev: Boolean(data.hasPrev),
        hasNext: Boolean(data.hasNext),
        prevCursor: data.prevCursor || null,
        nextCursor: data.nextCursor || null,
      },
    });
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
    const { limit, cursor, direction, lastPage } = parseCursorPagination(req.query, {
      defaultLimit: 100,
      maxLimit: 200,
    });

    const result = await cariKamus(req.params.kata, { limit, cursor, direction, lastPage });
    const response = {
      query: req.params.kata,
      total: result.total,
      data: result.data,
      pageInfo: {
        hasPrev: Boolean(result.hasPrev),
        hasNext: Boolean(result.hasNext),
        prevCursor: result.prevCursor || null,
        nextCursor: result.nextCursor || null,
      },
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
    const { limit, cursor, direction } = parseCursorPagination(req.query, {
      defaultLimit: 20,
      maxLimit: 100,
    });

    const data = await ambilDetailKamus(req.params.indeks, {
      glosariumLimit: limit,
      glosariumCursor: cursor,
      glosariumDirection: direction,
    });
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
