/**
 * @fileoverview Route admin untuk statistik dasbor
 */

const express = require('express');
const ModelEntri = require('../../models/modelEntri');
const ModelGlosarium = require('../../models/modelGlosarium');
const ModelTesaurus = require('../../models/modelTesaurus');
const ModelPengguna = require('../../models/modelPengguna');

const router = express.Router();

/**
 * GET /api/redaksi/statistik
 * Ringkasan jumlah data untuk dasbor admin
 */
router.get('/', async (req, res, next) => {
  try {
    const [entri, glosarium, tesaurus, pengguna] = await Promise.all([
      ModelEntri.hitungTotal(),
      ModelGlosarium.hitungTotal(),
      ModelTesaurus.hitungTotal(),
      ModelPengguna.hitungTotal(),
    ]);

    return res.json({
      success: true,
      data: { entri, glosarium, tesaurus, pengguna },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

