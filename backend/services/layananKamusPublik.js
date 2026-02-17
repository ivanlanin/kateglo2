/**
 * @fileoverview Layanan kamus publik — business logic untuk pencarian dan detail kamus
 */

const ModelEntri = require('../models/modelEntri');
const ModelTesaurus = require('../models/modelTesaurus');
const ModelGlosarium = require('../models/modelGlosarium');
const { getJson, setJson, delKey, getTtlSeconds } = require('./layananCache');

const cachePrefixDetailKamus = 'kamus:detail:';

function bacaTeksEntri(item) {
  return item?.entri ?? '';
}

function normalisasiIndeksKamus(teks) {
  const tanpaNomor = teks.replace(/\s*\([0-9]+\)\s*$/, '');
  const tanpaStripTepi = tanpaNomor.replace(/^-+/, '').replace(/-+$/, '');
  return tanpaStripTepi.trim() || teks.trim();
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

function buatCacheKeyDetailKamus(indeks) {
  return `${cachePrefixDetailKamus}${encodeURIComponent((indeks || '').toLowerCase())}`;
}

async function hapusCacheDetailKamus(indeks) {
  const trimmed = (indeks || '').trim();
  if (!trimmed) return;
  await delKey(buatCacheKeyDetailKamus(trimmed));
}

async function cariKamus(query, { limit = 100, offset = 0 } = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) return { data: [], total: 0 };
  return ModelEntri.cariEntri(trimmed, limit, offset);
}

async function ambilDetailKamus(indeksAtauEntri) {
  const decoded = decodeURIComponent((indeksAtauEntri || '').trim());
  if (!decoded) return null;

  const indeksTarget = normalisasiIndeksKamus(decoded);
  const cacheKey = buatCacheKeyDetailKamus(indeksTarget);
  const cached = await getJson(cacheKey);
  if (cached) {
    return cached;
  }

  const daftarEntri = await ModelEntri.ambilEntriPerIndeks(indeksTarget);
  if (daftarEntri.length === 0) return null;

  const detailEntri = await Promise.all(
    daftarEntri.map(async (dataEntri) => {
      const [maknaList, subentri, rantaiInduk] = await Promise.all([
        ModelEntri.ambilMakna(dataEntri.id),
        ModelEntri.ambilSubentri(dataEntri.id),
        ModelEntri.ambilRantaiInduk(dataEntri.induk),
      ]);

      const maknaIds = maknaList.map((m) => m.id);
      const contohList = await ModelEntri.ambilContoh(maknaIds);

      const contohPerMakna = new Map();
      for (const contoh of contohList) {
        if (!contohPerMakna.has(contoh.makna_id)) {
          contohPerMakna.set(contoh.makna_id, []);
        }
        contohPerMakna.get(contoh.makna_id).push(contoh);
      }

      const makna = maknaList.map((m) => ({
        ...m,
        contoh: contohPerMakna.get(m.id) || [],
      }));

      const subentriPerJenis = {};
      for (const s of subentri) {
        if (!subentriPerJenis[s.jenis]) {
          subentriPerJenis[s.jenis] = [];
        }
        subentriPerJenis[s.jenis].push(s);
      }

      return {
        id: dataEntri.id,
        induk_id: dataEntri.induk || null,
        entri: bacaTeksEntri(dataEntri),
        indeks: dataEntri.indeks,
        homonim: dataEntri.homonim,
        urutan: dataEntri.urutan,
        jenis: dataEntri.jenis,
        pemenggalan: dataEntri.pemenggalan,
        lafal: dataEntri.lafal,
        varian: dataEntri.varian,
        jenis_rujuk: dataEntri.jenis_rujuk,
        entri_rujuk: dataEntri.entri_rujuk,
        entri_rujuk_indeks: dataEntri.entri_rujuk ? normalisasiIndeksKamus(dataEntri.entri_rujuk) : null,
        rujukan: Boolean(dataEntri.jenis_rujuk && dataEntri.entri_rujuk),
        induk: (rantaiInduk || []).map((r) => ({ id: r.id, entri: r.entri, indeks: r.indeks })),
        makna,
        subentri: subentriPerJenis,
      };
    })
  );

  const entriNonVarian = detailEntri.filter((item) => item.jenis !== 'varian');
  const entriVarian = detailEntri.filter((item) => item.jenis === 'varian');

  if (entriNonVarian.length > 0 && entriVarian.length > 0) {
    const petaInduk = new Map(entriNonVarian.map((item) => [item.id, item]));

    for (const itemVarian of entriVarian) {
      const induk = petaInduk.get(itemVarian.induk_id);
      if (!induk) continue;

      if (!induk.subentri.varian) {
        induk.subentri.varian = [];
      }

      const sudahAda = induk.subentri.varian.some((s) => s.id === itemVarian.id);
      if (!sudahAda) {
        induk.subentri.varian.push({
          id: itemVarian.id,
          entri: itemVarian.entri,
          indeks: itemVarian.indeks,
          urutan: itemVarian.urutan,
          jenis: itemVarian.jenis,
          lafal: itemVarian.lafal,
        });
      }
    }
  }

  const entriUntukRespons = entriNonVarian.length > 0 ? entriNonVarian : detailEntri;

  const [tesaurusDetail, glosarium] = await Promise.all([
    ModelTesaurus.ambilDetail(indeksTarget),
    ModelGlosarium.cariFrasaMengandungKataUtuh(indeksTarget),
  ]);

  const tesaurus = tesaurusDetail
    ? {
      sinonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.sinonim)),
      antonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.antonim)),
    }
    : { sinonim: [], antonim: [] };

  const result = {
    indeks: indeksTarget,
    entri: entriUntukRespons,
    tesaurus,
    glosarium,
  };

  await setJson(cacheKey, result, getTtlSeconds());
  return result;
}

module.exports = {
  cariKamus,
  ambilDetailKamus,
  hapusCacheDetailKamus,
  buatCacheKeyDetailKamus,
};
