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

function ambilNomorHomonim(lema = '') {
  const match = lema.match(/\((\d+)\)\s*$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function normalisasiUrutSerupa(lema = '') {
  return lema
    .toLowerCase()
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/-/g, '')
    .trim();
}

function urutkanSerupaNatural(items) {
  return [...items].sort((a, b) => {
    const nomorA = ambilNomorHomonim(a.lema);
    const nomorB = ambilNomorHomonim(b.lema);
    if (nomorA !== nomorB) return nomorA - nomorB;

    const keyA = normalisasiUrutSerupa(a.lema);
    const keyB = normalisasiUrutSerupa(b.lema);
    if (keyA !== keyB) return keyA.localeCompare(keyB, 'id');

    return (a.lema || '').localeCompare(b.lema || '', 'id');
  });
}

function unikSerupa(items) {
  const byLema = new Map();

  for (const item of items) {
    const key = (item.lema || '').toLowerCase();
    const existing = byLema.get(key);
    if (!existing) {
      byLema.set(key, item);
      continue;
    }

    if (!existing.lafal && item.lafal) {
      byLema.set(key, item);
    }
  }

  return urutkanSerupaNatural(Array.from(byLema.values()));
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

  const [maknaList, sublema, induk, tesaurusDetail, glosarium, lemaSerupa] = await Promise.all([
    ModelLema.ambilMakna(lema.id),
    ModelLema.ambilSublema(lema.id),
    ModelLema.ambilInduk(lema.induk),
    ModelTesaurus.ambilDetail(lema.lema),
    ModelGlosarium.cariFrasaMengandungKataUtuh(lema.lema),
    ModelLema.ambilLemaSerupa(lema.lema),
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
    ? {
      sinonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.sinonim)),
      antonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.antonim)),
    }
    : { sinonim: [], antonim: [] };

  const serupa = unikSerupa((lemaSerupa || [])
    .filter((item) => item.id !== lema.id)
    .map((item) => ({
      id: item.id,
      lema: item.lema,
      lafal: item.lafal || null,
    })));

  return {
    lema: lema.lema,
    jenis: lema.jenis,
    pemenggalan: lema.pemenggalan,
    lafal: lema.lafal,
    varian: lema.varian,
    induk: induk ? { id: induk.id, lema: induk.lema } : null,
    makna,
    sublema: sublemaPerJenis,
    tesaurus,
    serupa,
    glosarium,
    rujukan: false,
  };
}

module.exports = { cariKamus, ambilDetailKamus };
