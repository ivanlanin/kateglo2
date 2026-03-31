/**
 * @fileoverview Route gim Kuis Kata — satu ronde = 5 soal dari 5 domain
 */

const express = require('express');
const { authenticate, authenticateOptional } = require('../../../middleware/auth');
const ModelKuisKata = require('../../../models/gim/modelKuisKata');

const router = express.Router();

function parseRiwayat(rawRiwayat) {
  const kosong = {
    kamus: [],
    tesaurus: [],
    glosarium: [],
    makna: [],
    rima: [],
  };

  if (!rawRiwayat || typeof rawRiwayat !== 'string') {
    return kosong;
  }

  try {
    const parsed = JSON.parse(rawRiwayat);
    if (!Array.isArray(parsed)) {
      return kosong;
    }

    for (const item of parsed) {
      const mode = String(item?.mode || '').trim().toLowerCase();
      const nilai = String(item?.kunciSoal || '').trim();
      if (!Object.prototype.hasOwnProperty.call(kosong, mode) || !nilai) {
        continue;
      }
      kosong[mode].push(nilai);
    }
  } catch (_error) {
    return kosong;
  }

  return kosong;
}

function parseLimit(value, fallback = 10) {
  return ModelKuisKata.parseLimit(value, fallback, 50);
}

router.get('/ronde', async (req, res, next) => {
  try {
    const ronde = await ModelKuisKata.ambilRonde({ riwayat: parseRiwayat(req.query.riwayat) });
    if (ronde.length === 0) {
      return res.status(503).json({ error: 'Soal tidak tersedia saat ini' });
    }
    return res.json({ ronde });
  } catch (error) {
    return next(error);
  }
});

router.get('/klasemen', async (req, res, next) => {
  try {
    const data = await ModelKuisKata.ambilKlasemenHarian({
      limit: parseLimit(req.query.limit, 10),
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/status', authenticateOptional, async (req, res, next) => {
  try {
    const penggunaId = ModelKuisKata.parsePenggunaId(req.user?.pid);

    if (!penggunaId) {
      return res.json({ success: true, data: null });
    }

    const data = await ModelKuisKata.ambilSkorPenggunaHarian({ penggunaId });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/submit', authenticate, async (req, res, next) => {
  try {
    const penggunaId = ModelKuisKata.parsePenggunaId(req.user?.pid);

    if (!penggunaId) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    }

    const jumlahPertanyaan = ModelKuisKata.parseJumlahPertanyaan(req.body?.jumlahPertanyaan, 0);
    const jumlahBenar = ModelKuisKata.parseJumlahBenar(req.body?.jumlahBenar, 0);
    const durasiDetik = ModelKuisKata.parseDurasiDetik(req.body?.durasiDetik, 0);

    if (jumlahPertanyaan <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah pertanyaan harus lebih dari 0' });
    }

    if (jumlahBenar > jumlahPertanyaan) {
      return res.status(400).json({ success: false, message: 'Jumlah benar tidak boleh melebihi jumlah pertanyaan' });
    }

    const data = await ModelKuisKata.simpanRekapHarian({
      penggunaId,
      jumlahBenar,
      jumlahPertanyaan,
      durasiDetik,
      jumlahMain: 1,
    });

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error?.message?.includes('tidak valid')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.message?.includes('lebih dari 0')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.message?.includes('melebihi')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

router.__private = { parseRiwayat, parseLimit };
module.exports = router;
