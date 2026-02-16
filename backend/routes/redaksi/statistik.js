/**
 * @fileoverview Route admin untuk statistik dasbor
 */

const express = require('express');
const ModelLema = require('../../../models/modelLema');
const ModelGlosarium = require('../../../models/modelGlosarium');
const ModelTesaurus = require('../../../models/modelTesaurus');
const ModelPengguna = require('../../../models/modelPengguna');

const router = express.Router();

/**
 * GET /api/admin/statistik
 * Ringkasan jumlah data untuk dasbor admin
 */
router.get('/', async (req, res, next) => {
  try {
    const [lema, glosarium, tesaurus, pengguna] = await Promise.all([
      ModelLema.hitungTotal(),
      ModelGlosarium.hitungTotal(),
      ModelTesaurus.hitungTotal(),
      ModelPengguna.hitungTotal(),
    ]);

    return res.json({
      success: true,
      data: { lema, glosarium, tesaurus, pengguna },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
