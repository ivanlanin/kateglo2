/**
 * @fileoverview Internal cron routes
 */

const express = require('express');
const { jalankanPrefillSusunKataHarian, parseTanggal, parseTotalHari } = require('../jobs/jobSusunKataHarian');
const { jalankanProsesWikipedia } = require('../jobs/jobWikipedia');

const router = express.Router();

function ambilSecretRequest(req) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme === 'Bearer' && token) {
    return token.trim();
  }

  return String(req.get('x-cron-secret') || '').trim();
}

function autentikasiCron(req, res, next) {
  const cronSecret = String(process.env.CRON_SECRET || '').trim();
  if (!cronSecret) {
    return res.status(503).json({
      success: false,
      message: 'Konfigurasi cron belum lengkap',
    });
  }

  const secretRequest = ambilSecretRequest(req);
  if (!secretRequest || secretRequest !== cronSecret) {
    return res.status(403).json({
      success: false,
      message: 'Secret cron tidak valid',
    });
  }

  return next();
}

router.post('/susun-kata/harian', autentikasiCron, async (req, res, next) => {
  try {
    const tanggalMulai = parseTanggal(req.body?.tanggalMulai ?? req.query?.tanggalMulai);
    const totalHari = parseTotalHari(req.body?.totalHari ?? req.query?.totalHari, 30);
    const hasil = await jalankanPrefillSusunKataHarian({ tanggalMulai, totalHari });

    return res.json({
      success: true,
      message: 'Job Susun Kata harian berhasil dijalankan',
      data: {
        tanggalMulai: hasil.tanggalMulai,
        totalHari: hasil.totalHari,
        jumlah: hasil.jumlah,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/kadi/wikipedia', autentikasiCron, async (req, res, next) => {
  try {
    const batasArtikel = Math.min(Math.max(Number(req.body?.batasArtikel) || 50, 1), 500);
    const hasil = await jalankanProsesWikipedia({ batasArtikel });

    return res.json({
      success: true,
      message: 'Job Wikipedia KADI berhasil dijalankan',
      data: hasil,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
module.exports.__private = {
  ambilSecretRequest,
  autentikasiCron,
};