/**
 * @fileoverview Route gim Pilih Ganda — satu ronde = 5 soal dari 5 domain
 */

const express = require('express');
const { ambilRonde } = require('../../models/modelPilihGanda');

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

router.get('/ronde', async (req, res, next) => {
  try {
    const ronde = await ambilRonde({ riwayat: parseRiwayat(req.query.riwayat) });
    if (ronde.length === 0) {
      return res.status(503).json({ error: 'Soal tidak tersedia saat ini' });
    }
    return res.json({ ronde });
  } catch (error) {
    return next(error);
  }
});

router.__private = { parseRiwayat };
module.exports = router;
