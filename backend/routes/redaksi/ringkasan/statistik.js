/**
 * @fileoverview Route redaksi untuk statistik dasbor
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelEntri = require('../../../models/leksikon/modelEntri');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const ModelTesaurus = require('../../../models/leksikon/modelTesaurus');
const ModelEtimologi = require('../../../models/leksikon/modelEtimologi');
const ModelLabel = require('../../../models/master/modelLabel');
const ModelPengguna = require('../../../models/akses/modelPengguna');
const ModelKomentar = require('../../../models/interaksi/modelKomentar');
const ModelSusunKata = require('../../../models/gim/modelSusunKata');
const ModelKuisKata = require('../../../models/gim/modelKuisKata');
const ModelPencarian = require('../../../models/interaksi/modelPencarian');
const ModelPencarianHitam = require('../../../models/interaksi/modelPencarianHitam');
const ModelAuditMakna = require('../../../models/audit/modelAuditMakna');
const ModelTagar = require('../../../models/master/modelTagar');
const ModelPeran = require('../../../models/akses/modelPeran');
const ModelIzin = require('../../../models/akses/modelIzin');
const ModelKandidatEntri = require('../../../models/kadi/modelKandidatEntri');
const ModelSinset = require('../../../models/wordnet/modelSinset');
const {
  buildPaginatedResult,
  parsePagination,
} = require('../../../utils/routesRedaksiUtils');

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
      sinset,
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
      ModelSinset.hitungTotal(),
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
        sinset,
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

