/**
 * @fileoverview Route kamus publik (pencarian + detail + kategori)
 */

const express = require('express');
const { authenticate, authenticateOptional } = require('../../../middleware/auth');
const { cariKamus, ambilDetailKamus, ambilKataHariIni } = require('../../../services/publik/layananKamusPublik');
const ModelLabel = require('../../../models/master/modelLabel');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const ModelTagar = require('../../../models/master/modelTagar');
const ModelEntri = require('../../../models/leksikon/modelEntri');
const ModelKomentar = require('../../../models/interaksi/modelKomentar');
const ModelPencarian = require('../../../models/interaksi/modelPencarian');
const { publicSearchLimiter } = require('../../../middleware/rateLimiter');
const { parseCursorPagination } = require('../../../utils/routesPublikUtils');

const router = express.Router();
const domainKamus = 1;

function parseLimitTerpopuler(value, defaultValue) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, 1), 100);
}

function parsePeriodeTerpopuler(value) {
  const normalized = String(value || 'all').trim().toLowerCase();
  return normalized === '7hari' ? '7hari' : 'all';
}

function parseSumberPelacakan(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'susun-kata' ? 'susun-kata' : null;
}

function parseTanggalReferensi(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function setCacheHeaders(res, maxAge = 300, staleWhileRevalidate = 900) {
  const maxAgeAman = Math.max(Number(maxAge) || 0, 0);
  const staleAman = Math.max(Number(staleWhileRevalidate) || 0, 0);
  res.set('Cache-Control', `public, max-age=${maxAgeAman}, stale-while-revalidate=${staleAman}`);
}

router.get('/kategori', async (_req, res, next) => {
  try {
    const [label, tagar, daftarBidang, daftarBahasa] = await Promise.all([
      ModelLabel.ambilSemuaKategori(),
      ModelTagar.ambilSemuaTagar(),
      ModelGlosarium.ambilDaftarBidang(true),
      ModelGlosarium.ambilDaftarBahasa(true),
    ]);
    return res.json({
      ...label,
      bidang: daftarBidang.map((b) => ({ kode: b.kode, nama: b.nama })),
      bahasa: daftarBahasa.map((b) => ({ kode: b.kode, nama: b.nama })),
      tagar,
    });
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

router.get('/terpopuler', async (req, res, next) => {
  try {
    const periode = parsePeriodeTerpopuler(req.query.periode);
    const limit = parseLimitTerpopuler(req.query.limit, 10);
    const data = await ModelPencarian.ambilKataTerpopuler({ periode, limit });

    return res.json({
      periode,
      limit,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/kata-hari-ini', async (req, res, next) => {
  try {
    const tanggal = parseTanggalReferensi(req.query.tanggal);
    const data = await ambilKataHariIni({ tanggal });
    setCacheHeaders(res);

    if (!data) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Kata Hari Ini belum tersedia',
        tanggal,
      });
    }

    return res.json(data);
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

    await ModelPencarian.catatPencarian(req.params.kata, { domain: domainKamus });

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

router.get('/detail/:indeks', authenticateOptional, async (req, res, next) => {
  try {
    const { limit, cursor, direction } = parseCursorPagination(req.query, {
      defaultLimit: 20,
      maxLimit: 100,
    });

    const data = await ambilDetailKamus(req.params.indeks, {
      glosariumLimit: limit,
      glosariumCursor: cursor,
      glosariumDirection: direction,
      includeEtimologiNonaktif: req.user?.peran === 'admin',
    });

    const sumberPelacakan = parseSumberPelacakan(req.query.sumber);
    if (sumberPelacakan !== 'susun-kata') {
      await ModelPencarian.catatPencarian(req.params.indeks, { domain: domainKamus });
    }

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
