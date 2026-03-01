/**
 * @fileoverview Route redaksi untuk statistik dasbor
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelEntri = require('../../models/modelEntri');
const ModelGlosarium = require('../../models/modelGlosarium');
const ModelTesaurus = require('../../models/modelTesaurus');
const ModelEtimologi = require('../../models/modelEtimologi');
const ModelLabel = require('../../models/modelLabel');
const ModelPengguna = require('../../models/modelPengguna');
const ModelKomentar = require('../../models/modelKomentar');
const ModelPencarian = require('../../models/modelPencarian');

const router = express.Router();

/**
 * GET /api/redaksi/statistik
 * Ringkasan jumlah data untuk dasbor admin
 */
router.get('/', periksaIzin('lihat_statistik'), async (req, res, next) => {
  try {
    const [entri, glosarium, tesaurus, etimologi, label, bidang, sumber, pengguna, komentar] = await Promise.all([
      ModelEntri.hitungTotal(),
      ModelGlosarium.hitungTotal(),
      ModelTesaurus.hitungTotal(),
      ModelEtimologi.hitungTotal(),
      ModelLabel.hitungTotal(),
      ModelGlosarium.hitungTotalBidang(),
      ModelGlosarium.hitungTotalSumber(),
      ModelPengguna.hitungTotal(),
      ModelKomentar.hitungTotal(),
    ]);

    return res.json({
      success: true,
      data: {
        entri,
        glosarium,
        tesaurus,
        etimologi,
        label,
        bidang,
        sumber,
        pengguna,
        komentar,
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/redaksi/statistik/pencarian
 * Statistik kata pencarian terpopuler lintas domain
 */
router.get('/pencarian', periksaIzin('lihat_statistik'), async (req, res, next) => {
  try {
    const domain = req.query.domain;
    const periode = req.query.periode;
    const limit = req.query.limit;
    const tanggalMulai = req.query.tanggal_mulai;
    const tanggalSelesai = req.query.tanggal_selesai;

    const data = await ModelPencarian.ambilStatistikRedaksi({
      domain,
      periode,
      limit,
      tanggalMulai,
      tanggalSelesai,
    });

    return res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

