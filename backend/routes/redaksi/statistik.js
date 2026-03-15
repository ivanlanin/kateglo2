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
const ModelSusunKata = require('../../models/modelSusunKata');
const ModelKuisKata = require('../../models/modelKuisKata');
const ModelPencarian = require('../../models/modelPencarian');
const ModelPencarianHitam = require('../../models/modelPencarianHitam');
const ModelAuditMakna = require('../../models/modelAuditMakna');
const ModelTagar = require('../../models/modelTagar');
const ModelPeran = require('../../models/modelPeran');
const ModelIzin = require('../../models/modelIzin');
const ModelKandidatEntri = require('../../models/kadi/modelKandidatEntri');
const {
  buildPaginatedResult,
  parsePagination,
} = require('../../utils/routesRedaksiUtils');

const router = express.Router();

/**
 * GET /api/redaksi/statistik
 * Ringkasan jumlah data untuk dasbor admin
 */
router.get('/', periksaIzin('lihat_statistik'), async (req, res, next) => {
  try {
    const [
      entri,
      glosarium,
      tesaurus,
      etimologi,
      susunKataHarian,
      susunKataBebas,
      kuisKata,
      auditMakna,
      auditTagar,
      tagar,
      label,
      bidang,
      bahasa,
      sumber,
      peran,
      izin,
      pengguna,
      komentar,
      kandidatKata,
      pencarian,
      pencarianHitam,
    ] = await Promise.all([
      ModelEntri.hitungTotal(),
      ModelGlosarium.hitungTotal(),
      ModelTesaurus.hitungTotal(),
      ModelEtimologi.hitungTotal(),
      ModelSusunKata.hitungPesertaHarian(),
      ModelSusunKata.hitungPesertaBebasHarian(),
      ModelKuisKata.hitungPesertaHarian(),
      ModelAuditMakna.hitungTotal(),
      ModelTagar.hitungTotalBelumBertagar(),
      ModelTagar.hitungTotal(),
      ModelLabel.hitungTotal(),
      ModelGlosarium.hitungTotalBidang(),
      ModelGlosarium.hitungTotalBahasa(),
      ModelGlosarium.hitungTotalSumber(),
      ModelPeran.hitungTotal(),
      ModelIzin.hitungTotal(),
      ModelPengguna.hitungTotal(),
      ModelKomentar.hitungTotal(),
      ModelKandidatEntri.hitungTotal(),
      ModelPencarian.hitungTotalKataHarian(),
      ModelPencarianHitam.hitungTotal(),
    ]);

    return res.json({
      success: true,
      data: {
        entri,
        glosarium,
        tesaurus,
        etimologi,
        susunKataHarian,
        susunKataBebas,
        kuisKata,
        auditMakna,
        auditTagar,
        tagar,
        label,
        bidang,
        bahasa,
        sumber,
        peran,
        izin,
        pengguna,
        komentar,
        kandidatKata,
        pencarian,
        pencarianHitam,
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
router.get('/pencarian', periksaIzin('lihat_pencarian'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 1000 });
    const domain = req.query.domain;
    const periode = req.query.periode;
    const tanggalMulai = req.query.tanggal_mulai;
    const tanggalSelesai = req.query.tanggal_selesai;

    const data = await ModelPencarian.ambilStatistikRedaksi({
      domain,
      periode,
      limit,
      offset,
      tanggalMulai,
      tanggalSelesai,
    });

    return res.json({
      success: true,
      ...buildPaginatedResult({
        data: data.data,
        total: data.total,
        pagination: { limit, offset },
      }),
      filter: data.filter,
      ringkasanDomain: data.ringkasanDomain,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

