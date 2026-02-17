/**
 * @fileoverview Layanan kamus publik — business logic untuk pencarian dan detail kamus
 */

const ModelEntri = require('../models/modelEntri');
const ModelTesaurus = require('../models/modelTesaurus');
const ModelGlosarium = require('../models/modelGlosarium');

function bacaTeksEntri(item) {
  return item?.entri ?? '';
}

function parseDaftarRelasi(teks) {
  if (!teks) return [];
  return teks.split(';').map((item) => item.trim()).filter(Boolean);
}

function unikTanpaBedaKapitalisasi(items) {
  const loweredSet = new Set();
  const hasil = [];

  for (const item of items) {
    const lowered = item.toLowerCase();
    if (!loweredSet.has(lowered)) {
      loweredSet.add(lowered);
      hasil.push(item);
    }
  }

  return hasil;
}

async function cariKamus(query, { limit = 100, offset = 0 } = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) return { data: [], total: 0 };
  return ModelEntri.cariEntri(trimmed, limit, offset);
}

async function ambilDetailKamus(entri) {
  const decodedEntri = decodeURIComponent((entri || '').trim());
  if (!decodedEntri) return null;

  const dataEntri = await ModelEntri.ambilEntri(decodedEntri);
  if (!dataEntri) return null;

  // Jika ini rujukan, kembalikan info rujukan
  const entriTeks = bacaTeksEntri(dataEntri);
  const entriRujuk = dataEntri.entri_rujuk;

  if (dataEntri.jenis_rujuk && entriRujuk) {
    return {
      entri: entriTeks,
      jenis: dataEntri.jenis,
      jenis_rujuk: dataEntri.jenis_rujuk,
      entri_rujuk: entriRujuk,
      rujukan: true,
    };
  }

  const [maknaList, subentri, rantaiInduk, tesaurusDetail, glosarium] = await Promise.all([
    ModelEntri.ambilMakna(dataEntri.id),
    ModelEntri.ambilSubentri(dataEntri.id),
    ModelEntri.ambilRantaiInduk(dataEntri.induk),
    ModelTesaurus.ambilDetail(entriTeks),
    ModelGlosarium.cariFrasaMengandungKataUtuh(entriTeks),
  ]);

  // Ambil contoh untuk semua makna
  const maknaIds = maknaList.map((m) => m.id);
  const contohList = await ModelEntri.ambilContoh(maknaIds);

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

  // Kelompokkan subentri per jenis
  const subentriPerJenis = {};
  for (const s of subentri) {
    if (!subentriPerJenis[s.jenis]) {
      subentriPerJenis[s.jenis] = [];
    }
    subentriPerJenis[s.jenis].push(s);
  }

  const tesaurus = tesaurusDetail
    ? {
      sinonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.sinonim)),
      antonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.antonim)),
    }
    : { sinonim: [], antonim: [] };

  return {
    entri: entriTeks,
    jenis: dataEntri.jenis,
    pemenggalan: dataEntri.pemenggalan,
    lafal: dataEntri.lafal,
    varian: dataEntri.varian,
    induk: rantaiInduk.length > 0 ? rantaiInduk.map((r) => ({ id: r.id, entri: bacaTeksEntri(r) })) : null,
    makna,
    subentri: subentriPerJenis,
    tesaurus,
    glosarium,
    rujukan: false,
  };
}

module.exports = { cariKamus, ambilDetailKamus };
