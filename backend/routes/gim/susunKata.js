/**
 * @fileoverview Route gim Susun Kata publik
 */

const express = require('express');
const ModelEntri = require('../../models/modelEntri');

const router = express.Router();

function parsePanjang(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 5;
  return Math.min(Math.max(parsed, 4), 8);
}

router.get('/puzzle', async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.query.panjang);
    const kamus = await ModelEntri.ambilKamusSusunKata({ panjang, limit: 5000 });

    if (kamus.length === 0) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: `Kata untuk Susun Kata ${panjang} huruf belum tersedia`,
      });
    }

    const target = kamus[Math.floor(Math.random() * kamus.length)];
    const arti = await ModelEntri.ambilArtiSusunKataByIndeks(target);

    return res.json({
      panjang,
      total: kamus.length,
      target,
      arti,
      kamus,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/validasi/:kata', async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.query.panjang);
    const kata = String(req.params.kata || '').trim().toLowerCase();
    const valid = await ModelEntri.cekKataSusunKataValid(kata, { panjang });

    return res.json({
      kata,
      panjang,
      valid,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
