/**
 * @fileoverview Route admin untuk statistik dasbor
 */

const express = require('express');
const ModelEntri = require('../../models/modelEntri');
const ModelGlosarium = require('../../models/modelGlosarium');
const ModelTesaurus = require('../../models/modelTesaurus');
const ModelLabel = require('../../models/modelLabel');
const ModelPengguna = require('../../models/modelPengguna');
const ModelKomentar = require('../../models/modelKomentar');

const router = express.Router();

/**
 * GET /api/redaksi/statistik
 * Ringkasan jumlah data untuk dasbor admin
 */
router.get('/', async (req, res, next) => {
  try {
    const [entri, glosarium, tesaurus, label, pengguna, komentar] = await Promise.all([
      ModelEntri.hitungTotal(),
      ModelGlosarium.hitungTotal(),
      ModelTesaurus.hitungTotal(),
      ModelLabel.hitungTotal(),
      ModelPengguna.hitungTotal(),
      ModelKomentar.hitungTotal(),
    ]);

    return res.json({
      success: true,
      data: { entri, glosarium, tesaurus, label, pengguna, komentar },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

