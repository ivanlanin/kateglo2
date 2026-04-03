/**
 * @fileoverview Route publik Leipzig corpus.
 */

const express = require('express');
const ModelKorpus = require('../../models/leipzig/modelKorpus');
const ModelKata = require('../../models/leipzig/modelKata');
const ModelKalimat = require('../../models/leipzig/modelKalimat');
const ModelKookurensi = require('../../models/leipzig/modelKookurensi');
const { publicSearchLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

function setCacheHeaders(res, maxAge = 300, staleWhileRevalidate = 900) {
  if (!isProduction) {
    res.set('Cache-Control', 'no-store');
    return;
  }

  res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
}

function handleLeipzigError(error, res, next) {
  if (error.code === 'LEIPZIG_CORPUS_NOT_FOUND') {
    return res.status(404).json({ error: 'Tidak Ditemukan', message: error.message });
  }
  if (error.code === 'LEIPZIG_CORPUS_NOT_READY') {
    return res.status(503).json({ success: false, message: `${error.message}. Jalankan impor SQLite terlebih dahulu.` });
  }
  if (error.code === 'LEIPZIG_CORPUS_INVALID') {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.code === 'LEIPZIG_RUNTIME_UNSUPPORTED') {
    return res.status(503).json({ success: false, message: error.message });
  }
  return next(error);
}

async function resolveKorpusOnly(req, res) {
  const korpusId = String(req.params.korpusId || '').trim();

  if (!korpusId) {
    res.status(400).json({ success: false, message: 'ID korpus wajib diisi' });
    return null;
  }

  const korpus = await ModelKorpus.ambilDetail(korpusId);
  if (!korpus) {
    res.status(404).json({
      error: 'Tidak Ditemukan',
      message: 'Korpus Leipzig tidak ditemukan',
    });
    return null;
  }

  if (!korpus.hasSqlite) {
    res.status(503).json({
      success: false,
      message: 'Korpus Leipzig belum siap. Jalankan impor SQLite terlebih dahulu.',
    });
    return null;
  }

  return korpus;
}

async function resolveKorpus(req, res) {
  const korpus = await resolveKorpusOnly(req, res);
  const kata = decodeURIComponent(String(req.params.kata || '')).trim();

  if (!korpus) {
    return null;
  }

  if (!kata) {
    res.status(400).json({ success: false, message: 'Kata wajib diisi' });
    return null;
  }

  return { korpus, kata };
}

router.get('/korpus', async (_req, res, next) => {
  try {
    const data = await ModelKorpus.ambilDaftarTersedia();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get('/korpus/:korpusId/kata/:kata', publicSearchLimiter, async (req, res, next) => {
  try {
    const resolved = await resolveKorpus(req, res);
    if (!resolved) return undefined;

    const hasil = await ModelKata.ambilInfoKata(resolved.korpus.id, resolved.kata);
    if (!hasil.frekuensi) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Kata tidak ditemukan pada korpus Leipzig',
      });
    }

    setCacheHeaders(res);
    return res.json({ success: true, korpus: resolved.korpus, ...hasil });
  } catch (error) {
    return handleLeipzigError(error, res, next);
  }
});

router.get('/korpus/:korpusId/peringkat', publicSearchLimiter, async (req, res, next) => {
  try {
    const korpus = await resolveKorpusOnly(req, res);
    if (!korpus) return undefined;

    const hasil = await ModelKata.ambilPeringkat(korpus.id, req.query);
    setCacheHeaders(res);
    return res.json({ success: true, korpus, ...hasil });
  } catch (error) {
    return handleLeipzigError(error, res, next);
  }
});

router.get('/korpus/:korpusId/kata/:kata/contoh', publicSearchLimiter, async (req, res, next) => {
  try {
    const resolved = await resolveKorpus(req, res);
    if (!resolved) return undefined;

    const hasil = await ModelKalimat.cariContohKata(resolved.korpus.id, resolved.kata, req.query);
    if (!hasil.total) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Kata tidak ditemukan pada korpus Leipzig',
      });
    }

    setCacheHeaders(res);
    return res.json({
      success: true,
      korpus: resolved.korpus,
      ...hasil,
    });
  } catch (error) {
    return handleLeipzigError(error, res, next);
  }
});

router.get('/korpus/:korpusId/kata/:kata/kookurensi-sekalimat', publicSearchLimiter, async (req, res, next) => {
  try {
    const resolved = await resolveKorpus(req, res);
    if (!resolved) return undefined;

    const hasil = await ModelKookurensi.ambilSekalimat(resolved.korpus.id, resolved.kata, req.query);
    if (!hasil.total) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Kookurensi sekalimat belum ditemukan untuk kata ini',
      });
    }

    setCacheHeaders(res);
    return res.json({ success: true, korpus: resolved.korpus, ...hasil });
  } catch (error) {
    return handleLeipzigError(error, res, next);
  }
});

router.get('/korpus/:korpusId/kata/:kata/kookurensi-tetangga', publicSearchLimiter, async (req, res, next) => {
  try {
    const resolved = await resolveKorpus(req, res);
    if (!resolved) return undefined;

    const hasil = await ModelKookurensi.ambilTetangga(resolved.korpus.id, resolved.kata, req.query);
    if (hasil.kiri.length === 0 && hasil.kanan.length === 0) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Tetangga kata belum ditemukan untuk kata ini',
      });
    }

    setCacheHeaders(res);
    return res.json({ success: true, korpus: resolved.korpus, ...hasil });
  } catch (error) {
    return handleLeipzigError(error, res, next);
  }
});

router.get('/korpus/:korpusId/kata/:kata/graf', publicSearchLimiter, async (req, res, next) => {
  try {
    const resolved = await resolveKorpus(req, res);
    if (!resolved) return undefined;

    const hasil = await ModelKookurensi.ambilGraf(resolved.korpus.id, resolved.kata, req.query);
    if (!hasil.nodes.length) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Graf asosiasi belum tersedia untuk kata ini',
      });
    }

    setCacheHeaders(res);
    return res.json({ success: true, korpus: resolved.korpus, ...hasil });
  } catch (error) {
    return handleLeipzigError(error, res, next);
  }
});

router.get('/korpus/:korpusId/kata/:kata/mirip-konteks', publicSearchLimiter, async (req, res, next) => {
  try {
    const resolved = await resolveKorpus(req, res);
    if (!resolved) return undefined;

    const hasil = await ModelKookurensi.ambilMiripKonteks(resolved.korpus.id, resolved.kata, req.query);
    if (!hasil.total) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Belum ada kata dengan konteks mirip untuk kata ini',
      });
    }

    setCacheHeaders(res);
    return res.json({ success: true, korpus: resolved.korpus, ...hasil });
  } catch (error) {
    return handleLeipzigError(error, res, next);
  }
});

module.exports = router;