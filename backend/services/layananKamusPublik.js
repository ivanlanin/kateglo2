/**
 * @fileoverview Layanan kamus publik — business logic untuk pencarian dan detail kamus
 */

const ModelLema = require('../models/modelLema');
const ModelTesaurus = require('../models/modelTesaurus');
const ModelGlosarium = require('../models/modelGlosarium');

function parseDaftarRelasi(teks) {
  if (!teks) return [];
  return teks.split(';').map((item) => item.trim()).filter(Boolean);
}

async function cariKamus(query, { limit = 100, offset = 0 } = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) return { data: [], total: 0 };
  return ModelLema.cariLema(trimmed, limit, offset);
}

async function ambilDetailKamus(entri) {
  const decodedEntri = decodeURIComponent((entri || '').trim());
  if (!decodedEntri) return null;

  const lema = await ModelLema.ambilLema(decodedEntri);
  if (!lema) return null;

  // Jika ini rujukan, kembalikan info rujukan
  if (lema.jenis_rujuk && lema.lema_rujuk) {
    return {
      lema: lema.lema,
      jenis: lema.jenis,
      jenis_rujuk: lema.jenis_rujuk,
      lema_rujuk: lema.lema_rujuk,
      rujukan: true,
    };
  }

  const [maknaList, sublema, induk, terjemahan, tesaurusDetail, glosarium] = await Promise.all([
    ModelLema.ambilMakna(lema.id),
    ModelLema.ambilSublema(lema.id),
    ModelLema.ambilInduk(lema.induk),
    ModelLema.ambilTerjemahan(lema.lema),
    ModelTesaurus.ambilDetail(lema.lema),
    ModelGlosarium.cariFrasaMengandungKataUtuh(lema.lema),
  ]);

  // Ambil contoh untuk semua makna
  const maknaIds = maknaList.map((m) => m.id);
  const contohList = await ModelLema.ambilContoh(maknaIds);

  // Kelompokkan contoh per makna
  const contohPerMakna = new Map();
  for (const c of contohList) {
    if (!contohPerMakna.has(c.makna_id)) {
      contohPerMakna.set(c.makna_id, []);
    }
    contohPerMakna.get(c.makna_id).push(c);
  }

  const makna = maknaList.map((m) => ({
    ...m,
    contoh: contohPerMakna.get(m.id) || [],
  }));

  // Kelompokkan sublema per jenis
  const sublemaPerJenis = {};
  for (const s of sublema) {
    if (!sublemaPerJenis[s.jenis]) {
      sublemaPerJenis[s.jenis] = [];
    }
    sublemaPerJenis[s.jenis].push(s);
  }

  const tesaurus = tesaurusDetail
    ? [
      ...parseDaftarRelasi(tesaurusDetail.sinonim),
      ...parseDaftarRelasi(tesaurusDetail.antonim),
      ...parseDaftarRelasi(tesaurusDetail.turunan),
      ...parseDaftarRelasi(tesaurusDetail.gabungan),
      ...parseDaftarRelasi(tesaurusDetail.berkaitan),
    ]
    : [];

  const tesaurusUnik = [...new Set(tesaurus.map((item) => item.toLowerCase()))]
    .map((lowered) => tesaurus.find((item) => item.toLowerCase() === lowered))
    .filter(Boolean);

  return {
    lema: lema.lema,
    jenis: lema.jenis,
    pemenggalan: lema.pemenggalan,
    lafal: lema.lafal,
    varian: lema.varian,
    induk: induk ? { id: induk.id, lema: induk.lema } : null,
    makna,
    sublema: sublemaPerJenis,
    terjemahan,
    tesaurus: tesaurusUnik,
    glosarium,
    rujukan: false,
  };
}

module.exports = { cariKamus, ambilDetailKamus };
