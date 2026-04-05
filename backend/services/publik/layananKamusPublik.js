/**
 * @fileoverview Layanan kamus publik — business logic untuk pencarian dan detail kamus
 */

const ModelEntri = require('../../models/leksikon/modelEntri');
const ModelKataHariIni = require('../../models/leksikon/modelKataHariIni');
const ModelTesaurus = require('../../models/leksikon/modelTesaurus');
const ModelGlosarium = require('../../models/leksikon/modelGlosarium');
const ModelEtimologi = require('../../models/leksikon/modelEtimologi');
const ModelTagar = require('../../models/master/modelTagar');
const { getJson, setJson, delKey, getTtlSeconds } = require('../sistem/layananCache');

const cachePrefixDetailKamus = 'kamus:detail:';
const cachePrefixKataHariIni = 'kamus:kata-hari-ini:';
const candidatePoolCache = new Map();
const candidatePoolPromises = new Map();

function bacaTeksEntri(item) {
  return item?.entri ?? '';
}

function normalisasiIndeksKamus(teks) {
  const tanpaNomor = teks.replace(/\s*\([0-9]+\)\s*$/, '');
  const tanpaStripTepi = tanpaNomor.replace(/^-+/, '').replace(/-+$/, '');
  return tanpaStripTepi.trim() || teks.trim();
}

function ekstrakKandidatTautanMakna(segmen = '') {
  const trimmed = String(segmen || '').trim();
  if (!trimmed || /\*/.test(trimmed)) return null;

  const match = trimmed.match(/^([^()]+?)(\s*(?:\([^)]*\)\s*)*)$/);
  if (!match) return null;

  const baseText = String(match[1]).trim();
  const wordCount = baseText.split(/\s+/).filter(Boolean).length;

  if (wordCount < 1 || wordCount > 2) return null;
  return baseText;
}

function kumpulkanKandidatTautanMakna(entriList = []) {
  const hasil = [];

  for (const entri of entriList) {
    for (const makna of entri?.makna || []) {
      for (const segmen of String(makna?.makna || '').split(';')) {
        const kandidat = ekstrakKandidatTautanMakna(segmen);
        if (!kandidat) continue;

        const indeks = normalisasiIndeksKamus(kandidat).toLowerCase();
        hasil.push(indeks);
      }
    }
  }

  return [...new Set(hasil)];
}

function kumpulkanKandidatTautanTesaurus(tesaurus = {}) {
  return [...new Set([
    ...(tesaurus?.sinonim || []),
    ...(tesaurus?.antonim || []),
  ].map((item) => normalisasiIndeksKamus(String(item || '')).toLowerCase()).filter(Boolean))];
}

function splitEntriGlosarium(value = '') {
  const text = String(value).trim();
  if (!text) return [];

  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

function tokenizeKurung(value = '') {
  const text = String(value);
  if (!text) return [];

  const regex = /\([^()]*\)/g;
  const chunks = [];
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      chunks.push({ text: text.slice(lastIndex, match.index), isKurung: false });
    }
    chunks.push({ text: match[0], isKurung: true });
    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    chunks.push({ text: text.slice(lastIndex), isKurung: false });
  }

  return chunks;
}

function kumpulkanKandidatTautanGlosarium(items = []) {
  const hasil = [];

  for (const item of items) {
    for (const part of splitEntriGlosarium(item?.indonesia || '')) {
      for (const token of tokenizeKurung(part)) {
        if (token.isKurung) continue;

        const indeks = normalisasiIndeksKamus(String(token.text)).toLowerCase();
        hasil.push(indeks);
      }
    }
  }

  return [...new Set(hasil)];
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

function tanggalHariIniJakarta() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function parseTanggalReferensi(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return tanggalHariIniJakarta();
  return raw;
}

function buatCacheKeyKataHariIni(tanggal) {
  return `${cachePrefixKataHariIni}${encodeURIComponent(parseTanggalReferensi(tanggal))}`;
}

async function hapusCacheKataHariIni(tanggal) {
  const tanggalAman = String(tanggal || '').trim();
  if (!tanggalAman) return;
  await delKey(buatCacheKeyKataHariIni(tanggalAman));
}

function hashTanggal(value = '') {
  let h = Array.from(String(value || '')).reduce(
    (acc, karakter) => ((acc * 33) + karakter.charCodeAt(0)) >>> 0,
    5381
  );
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

function buatCacheKeyKandidatAcak({ requireEtimologi = true } = {}) {
  return requireEtimologi ? 'kamus:kandidat:dengan-etimologi' : 'kamus:kandidat:tanpa-etimologi';
}

function getCandidatePoolTtlMs() {
  return Math.max(Math.min(getTtlSeconds(), 300), 30) * 1000;
}

function bacaCacheKandidatAcak({ requireEtimologi = true } = {}) {
  const cacheKey = buatCacheKeyKandidatAcak({ requireEtimologi });
  const entry = candidatePoolCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    candidatePoolCache.delete(cacheKey);
    return null;
  }

  return entry.items;
}

function simpanCacheKandidatAcak(items, { requireEtimologi = true } = {}) {
  const daftar = Array.isArray(items) ? items : [];
  candidatePoolCache.set(buatCacheKeyKandidatAcak({ requireEtimologi }), {
    items: daftar,
    expiresAt: Date.now() + getCandidatePoolTtlMs(),
  });
  return daftar;
}

function resetCacheKandidatAcak() {
  candidatePoolCache.clear();
  candidatePoolPromises.clear();
}

async function ambilPoolKandidatAcak({ requireEtimologi = true } = {}) {
  const cached = bacaCacheKandidatAcak({ requireEtimologi });
  if (cached) {
    return cached;
  }

  const cacheKey = buatCacheKeyKandidatAcak({ requireEtimologi });
  const pending = candidatePoolPromises.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request = ModelEntri.ambilDaftarKandidatKataHariIni({ requireEtimologi })
    .then((rows) => simpanCacheKandidatAcak(rows, { requireEtimologi }))
    .finally(() => {
      candidatePoolPromises.delete(cacheKey);
    });

  candidatePoolPromises.set(cacheKey, request);
  return request;
}

function ambilKandidatDariPool(pool, offset = 0) {
  if (!Array.isArray(pool) || pool.length === 0) {
    return null;
  }

  const index = ((Number(offset) || 0) % pool.length + pool.length) % pool.length;
  return pool[index] || null;
}

function normalisasiCuplikan(value = '', maxLength = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function buatUrlDetailKamus(indeks = '') {
  const indeksAman = normalisasiIndeksKamus(String(indeks || ''));
  if (!indeksAman) {
    return null;
  }

  return `/kamus/detail/${encodeURIComponent(indeksAman)}`;
}

function ambilMaknaUtama(entriList = [], preferredEntriId = null) {
  const preferredId = Number(preferredEntriId) || null;

  if (preferredId) {
    const entriPilihan = entriList.find((item) => Number(item?.id) === preferredId);
    if (entriPilihan) {
      for (const makna of entriPilihan?.makna || []) {
        if (normalisasiCuplikan(makna?.makna, 1000)) {
          return { entri: entriPilihan, makna };
        }
      }
    }
  }

  for (const entri of entriList) {
    for (const makna of entri?.makna || []) {
      if (normalisasiCuplikan(makna?.makna, 1000)) {
        return { entri, makna };
      }
    }
  }

  return {
    entri: entriList.find((item) => Number(item?.id) === preferredId) || entriList[0] || null,
    makna: null,
  };
}

function ambilContohUtama(entri = null) {
  for (const makna of entri?.makna || []) {
    for (const contoh of makna?.contoh || []) {
      if (normalisasiCuplikan(contoh?.contoh, 1000)) {
        return contoh;
      }
    }
  }

  return null;
}

function ambilRingkasanMakna(entri = null) {
  const hasil = [];

  for (const makna of entri?.makna || []) {
    const teksMakna = normalisasiCuplikan(makna?.makna, 240);
    if (!teksMakna) {
      continue;
    }

    const contohUtama = (makna?.contoh || [])
      .map((item) => normalisasiCuplikan(item?.contoh, 220))
      .find(Boolean) || null;

    hasil.push({
      makna: teksMakna,
      contoh: contohUtama,
    });
  }

  return hasil;
}

function ambilEtimologiUtama(entriList = [], entriUtama = null) {
  const daftarTarget = [
    ...(entriUtama ? [entriUtama] : []),
    ...entriList.filter((item) => item !== entriUtama),
  ];

  for (const entri of daftarTarget) {
    for (const etimologi of entri?.etimologi || []) {
      const bahasa = String(etimologi?.bahasa || '').trim();
      const kataAsal = String(etimologi?.kata_asal || '').trim();
      if (bahasa || kataAsal) {
        return {
          bahasa: bahasa || null,
          bahasa_kode: etimologi?.bahasa_kode || null,
          kata_asal: kataAsal || null,
          sumber: etimologi?.sumber || null,
          sumber_kode: etimologi?.sumber_kode || null,
        };
      }
    }
  }

  return null;
}

function bentukPayloadKataHariIni(detail = null, tanggal = null, preferredEntriId = null) {
  if (!detail || !Array.isArray(detail.entri) || detail.entri.length === 0) {
    return null;
  }

  const { entri, makna } = ambilMaknaUtama(detail.entri, preferredEntriId);
  if (!entri || !makna) return null;

  const daftarMakna = ambilRingkasanMakna(entri);
  const contoh = ambilContohUtama(entri);
  const etimologi = ambilEtimologiUtama(detail.entri, entri);
  const homonimRaw = entri?.homonim;
  const homonim = homonimRaw === null || homonimRaw === undefined || String(homonimRaw).trim() === ''
    ? null
    : Number(homonimRaw);

  return {
    tanggal: parseTanggalReferensi(tanggal),
    indeks: detail.indeks,
    entri: entri.entri || detail.indeks,
    homonim: Number.isFinite(homonim) ? homonim : null,
    url: buatUrlDetailKamus(detail.indeks),
    kelas_kata: makna?.kelas_kata || null,
    makna: normalisasiCuplikan(makna?.makna, 180),
    contoh: normalisasiCuplikan(contoh?.contoh, 220),
    daftar_makna: daftarMakna,
    pemenggalan: entri?.pemenggalan || null,
    lafal: entri?.lafal || null,
    etimologi,
  };
}

async function pilihKandidatRingan(tanggalReferensi) {
  const pool = await ambilPoolKandidatAcak({ requireEtimologi: true });
  const total = pool.length;
  if (total <= 0) {
    return null;
  }

  const offsetAwal = hashTanggal(tanggalReferensi) % total;
  const kandidat = ambilKandidatDariPool(pool, offsetAwal);
  if (!kandidat?.indeks) {
    return null;
  }

  const entriId = Number(kandidat.entri_id) || null;
  if (!entriId) {
    return null;
  }

  return { entriId, indeks: kandidat.indeks };
}

async function pilihKandidatKataHariIniOtomatis(tanggalReferensi) {
  const pool = await ambilPoolKandidatAcak({ requireEtimologi: true });
  const total = pool.length;
  if (total <= 0) {
    return null;
  }

  const offsetAwal = hashTanggal(tanggalReferensi) % total;
  const batasPercobaan = Math.min(total, 7);

  for (let langkah = 0; langkah < batasPercobaan; langkah += 1) {
    const offset = (offsetAwal + langkah) % total;
    const kandidat = ambilKandidatDariPool(pool, offset);
    if (!kandidat?.indeks) {
      continue;
    }

    const detail = await ambilDetailKamus(kandidat.indeks);
    if (!detail || !Array.isArray(detail.entri) || detail.entri.length === 0) {
      continue;
    }

    const kandidatUtama = ambilMaknaUtama(detail.entri);
    const entriId = Number(kandidatUtama?.entri?.id) || null;
    const payload = bentukPayloadKataHariIni(detail, tanggalReferensi, entriId);

    if (!payload || !entriId) {
      continue;
    }

    return {
      entriId,
      payload,
    };
  }

  return null;
}

function buatCacheKeyDetailKamus(indeks, options) {
  const baseKey = `${cachePrefixDetailKamus}${encodeURIComponent((indeks || '').toLowerCase())}`;
  if (!options || typeof options !== 'object') {
    return baseKey;
  }

  const {
    glosariumLimit = 20,
    glosariumCursor = null,
    glosariumDirection = 'next',
    includeEtimologiNonaktif = false,
  } = options;

  const cursorPart = glosariumCursor ? encodeURIComponent(glosariumCursor) : '';
  const directionPart = glosariumDirection === 'prev' ? 'prev' : 'next';
  const etimologiPart = includeEtimologiNonaktif ? ':et-all' : '';
  return `${baseKey}:g-${Number(glosariumLimit) || 20}:${directionPart}:${cursorPart}${etimologiPart}`;
}

async function hapusCacheDetailKamus(indeks) {
  const trimmed = (indeks || '').trim();
  if (!trimmed) return;
  await delKey(buatCacheKeyDetailKamus(trimmed));
}

async function cariKamus(query, {
  limit = 100,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) return { data: [], total: 0, hasNext: false, hasPrev: false };
  return ModelEntri.cariEntriCursor(trimmed, {
    limit,
    cursor,
    direction,
    lastPage,
    hitungTotal: true,
  });
}

async function ambilDetailKamus(indeksAtauEntri, {
  glosariumLimit = 20,
  glosariumCursor = null,
  glosariumDirection = 'next',
  includeEtimologiNonaktif = false,
} = {}) {
  const decoded = decodeURIComponent((indeksAtauEntri || '').trim());
  if (!decoded) return null;

  const indeksTarget = normalisasiIndeksKamus(decoded);
  const cacheKey = buatCacheKeyDetailKamus(indeksTarget, {
    glosariumLimit,
    glosariumCursor,
    glosariumDirection,
    includeEtimologiNonaktif,
  });
  const cached = await getJson(cacheKey);
  if (cached) {
    return cached;
  }

  const daftarEntri = await ModelEntri.ambilEntriPerIndeks(indeksTarget);
  if (daftarEntri.length === 0) return null;

  const detailEntri = await Promise.all(
    daftarEntri.map(async (dataEntri) => {
      const [maknaList, subentri, bentukTidakBaku, rantaiInduk, etimologi, tagar] = await Promise.all([
        ModelEntri.ambilMakna(dataEntri.id, true),
        ModelEntri.ambilSubentri(dataEntri.id),
        ModelEntri.ambilBentukTidakBakuByRujukId(dataEntri.id),
        ModelEntri.ambilRantaiInduk(dataEntri.induk),
        ModelEtimologi.ambilAktifPublikByEntriId(dataEntri.id, {
          aktifSaja: !includeEtimologiNonaktif,
        }),
        ModelTagar.ambilTagarEntri(dataEntri.id, { aktifSaja: true }),
      ]);

      const maknaIds = maknaList.map((m) => m.id);
      const contohList = await ModelEntri.ambilContoh(maknaIds, true);

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

      if (bentukTidakBaku?.length) {
        subentriPerJenis.bentuk_tidak_baku = bentukTidakBaku;
      }

      return {
        id: dataEntri.id,
        induk_id: dataEntri.induk || null,
        entri: bacaTeksEntri(dataEntri),
        indeks: dataEntri.indeks,
        sumber_id: dataEntri.sumber_id || null,
        sumber_kode: dataEntri.sumber_kode || null,
        sumber: dataEntri.sumber || null,
        created_at: dataEntri.created_at || null,
        updated_at: dataEntri.updated_at || null,
        homograf: dataEntri.homograf,
        homonim: dataEntri.homonim,
        jenis: dataEntri.jenis,
        pemenggalan: dataEntri.pemenggalan,
        lafal: dataEntri.lafal,
        varian: dataEntri.varian,
        jenis_rujuk: dataEntri.jenis_rujuk,
        lema_rujuk: dataEntri.lema_rujuk || null,
        entri_rujuk: dataEntri.entri_rujuk,
        entri_rujuk_indeks: dataEntri.entri_rujuk_indeks || (dataEntri.entri_rujuk ? normalisasiIndeksKamus(dataEntri.entri_rujuk) : null),
        rujukan: Boolean(dataEntri.entri_rujuk),
        induk: (rantaiInduk || []).map((r) => ({ id: r.id, entri: r.entri, indeks: r.indeks })),
        makna,
        subentri: subentriPerJenis,
        etimologi: etimologi || [],
        tagar: tagar || [],
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
          homograf: itemVarian.homograf,
          homonim: itemVarian.homonim,
          jenis: itemVarian.jenis,
          lafal: itemVarian.lafal,
        });
      }
    }
  }

  const entriUntukRespons = entriNonVarian.length > 0 ? entriNonVarian : detailEntri;

  const kandidatTautanMakna = kumpulkanKandidatTautanMakna(entriUntukRespons);

  const [tesaurusDetail, glosariumResult, navigasiIndeks] = await Promise.all([
    ModelTesaurus.ambilDetail(indeksTarget),
    ModelGlosarium.cariFrasaMengandungKataUtuh(indeksTarget, {
      limit: glosariumLimit,
      cursor: glosariumCursor,
      direction: glosariumDirection,
      hitungTotal: true,
    }),
    ModelEntri.ambilNavigasiIndeks(indeksTarget),
  ]);

  const glosariumData = Array.isArray(glosariumResult)
    ? glosariumResult
    : (glosariumResult?.data || []);

  const glosariumPageInfo = Array.isArray(glosariumResult)
    ? {
      total: glosariumData.length,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    }
    : {
      total: Number(glosariumResult?.total || 0),
      hasPrev: Boolean(glosariumResult?.hasPrev),
      hasNext: Boolean(glosariumResult?.hasNext),
      prevCursor: glosariumResult?.prevCursor || null,
      nextCursor: glosariumResult?.nextCursor || null,
    };

  const tesaurus = tesaurusDetail
    ? {
      sinonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.sinonim)),
      antonim: unikTanpaBedaKapitalisasi(parseDaftarRelasi(tesaurusDetail.antonim)),
    }
    : { sinonim: [], antonim: [] };

  const kandidatTautanSidebar = kumpulkanKandidatTautanTesaurus(tesaurus);
  const kandidatTautanGlosarium = kumpulkanKandidatTautanGlosarium(glosariumData);
  const tautanMaknaValid = await ModelEntri.ambilIndeksValidBatch([...new Set([
    ...kandidatTautanMakna,
    ...kandidatTautanSidebar,
    ...kandidatTautanGlosarium,
  ])]);

  const result = {
    indeks: indeksTarget,
    entri: entriUntukRespons,
    tautan_makna_valid: tautanMaknaValid,
    tautan_indonesia_valid: kandidatTautanGlosarium.length > 0
      ? tautanMaknaValid.filter((item) => kandidatTautanGlosarium.includes(item))
      : [],
    tesaurus,
    glosarium: glosariumData,
    glosarium_page: glosariumPageInfo,
    navigasi: {
      prev: navigasiIndeks?.prev || null,
      next: navigasiIndeks?.next || null,
    },
  };

  await setJson(cacheKey, result, getTtlSeconds());
  return result;
}

async function ambilKataHariIni({ tanggal = null } = {}) {
  const tanggalReferensi = parseTanggalReferensi(tanggal);
  const cacheKey = buatCacheKeyKataHariIni(tanggalReferensi);
  const cached = await getJson(cacheKey);
  if (cached) {
    return cached;
  }

  const tersimpan = await ModelKataHariIni.ambilByTanggal(tanggalReferensi);
  if (tersimpan) {
    const detailTersimpan = await ambilDetailKamus(tersimpan.indeks);
    const payloadTersimpan = bentukPayloadKataHariIni(detailTersimpan, tanggalReferensi, tersimpan.entri_id);
    if (!payloadTersimpan) {
      return null;
    }

    await setJson(cacheKey, payloadTersimpan, getTtlSeconds());
    return payloadTersimpan;
  }

  return null;
}

async function generateKataHariIni({ tanggal = null } = {}) {
  const tanggalReferensi = parseTanggalReferensi(tanggal);

  const tersimpan = await ModelKataHariIni.ambilByTanggal(tanggalReferensi);
  if (tersimpan) {
    return { tanggal: tanggalReferensi, indeks: tersimpan.indeks };
  }

  const kandidat = await pilihKandidatRingan(tanggalReferensi);
  if (!kandidat) {
    return null;
  }

  await ModelKataHariIni.simpanByTanggal({
    tanggal: tanggalReferensi,
    entriId: kandidat.entriId,
    sumber: 'auto',
  });

  return { tanggal: tanggalReferensi, indeks: kandidat.indeks };
}

async function ambilEntriAcak() {
  const pool = await ambilPoolKandidatAcak({ requireEtimologi: false });
  const total = pool.length;
  if (total <= 0) {
    return null;
  }

  const offsetAwal = Math.floor(Math.random() * total);
  const batasPercobaan = Math.min(total, 3);

  for (let langkah = 0; langkah < batasPercobaan; langkah += 1) {
    const offset = (offsetAwal + langkah) % total;
    const kandidat = ambilKandidatDariPool(pool, offset);
    const indeks = normalisasiIndeksKamus(String(kandidat?.indeks || ''));
    const url = buatUrlDetailKamus(indeks);

    if (!indeks || !url) {
      continue;
    }

    return {
      indeks,
      url,
    };
  }

  return null;
}

module.exports = {
  cariKamus,
  ambilDetailKamus,
  ambilKataHariIni,
  ambilEntriAcak,
  generateKataHariIni,
  hapusCacheDetailKamus,
  hapusCacheKataHariIni,
  buatCacheKeyDetailKamus,
};

module.exports.__private = {
  bacaTeksEntri,
  normalisasiIndeksKamus,
  ekstrakKandidatTautanMakna,
  kumpulkanKandidatTautanMakna,
  kumpulkanKandidatTautanTesaurus,
  splitEntriGlosarium,
  tokenizeKurung,
  kumpulkanKandidatTautanGlosarium,
  parseDaftarRelasi,
  unikTanpaBedaKapitalisasi,
  tanggalHariIniJakarta,
  parseTanggalReferensi,
  buatCacheKeyKataHariIni,
  hapusCacheKataHariIni,
  hashTanggal,
  buatCacheKeyKandidatAcak,
  getCandidatePoolTtlMs,
  bacaCacheKandidatAcak,
  simpanCacheKandidatAcak,
  resetCacheKandidatAcak,
  ambilPoolKandidatAcak,
  ambilKandidatDariPool,
  normalisasiCuplikan,
  buatUrlDetailKamus,
  ambilMaknaUtama,
  ambilContohUtama,
  ambilRingkasanMakna,
  ambilEtimologiUtama,
  bentukPayloadKataHariIni,
  pilihKandidatRingan,
  pilihKandidatKataHariIniOtomatis,
};
