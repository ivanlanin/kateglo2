/**
 * @fileoverview Layanan glosarium publik — business logic detail glosarium + cache
 */

const ModelGlosarium = require('../models/modelGlosarium');
const ModelEntri = require('../models/modelEntri');
const { getJson, setJson, getTtlSeconds } = require('./layananCache');

const cachePrefixDetailGlosarium = 'glosarium:detail:';
const cachePrefixDetailGlosariumVersion = 'glosarium:detail:version:';
const cachePrefixBrowseGlosarium = 'glosarium:browse:';
const cacheKeyBrowseGlosariumVersion = 'glosarium:browse:version';
const cachePrefixMasterGlosarium = 'glosarium:master:';

function normalisasiAsing(teks) {
  return decodeURIComponent((teks || '').trim());
}

function normalisasiIndeksKamus(teks = '') {
  const nilai = String(teks || '').trim();
  if (!nilai) return '';

  const tanpaNomor = nilai.replace(/\s*\([0-9]+\)\s*$/, '');
  const tanpaStripTepi = tanpaNomor.replace(/^-+/, '').replace(/-+$/, '');
  return tanpaStripTepi.trim() || nilai;
}

function splitEntriGlosarium(value = '') {
  const text = String(value || '').trim();
  if (!text) return [];

  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

function tokenizeKurung(value = '') {
  const text = String(value || '');
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

function ekstrakKandidatTautanIndonesia(value = '') {
  const hasil = [];

  for (const part of splitEntriGlosarium(value)) {
    const tokens = tokenizeKurung(part);
    for (const token of tokens) {
      if (token.isKurung) continue;

      const textUtama = String(token.text || '').trim();
      if (!textUtama) continue;

      const indeks = normalisasiIndeksKamus(textUtama).toLowerCase();
      if (indeks) {
        hasil.push(indeks);
      }
    }
  }

  return hasil;
}

function kumpulkanKandidatTautanIndonesia(items = []) {
  return [...new Set(
    (Array.isArray(items) ? items : []).flatMap((item) => ekstrakKandidatTautanIndonesia(item?.indonesia || ''))
  )];
}

async function tambahkanTautanIndonesiaValid(payload = {}, items = []) {
  const kandidat = kumpulkanKandidatTautanIndonesia(items);
  const tautanIndonesiaValid = await ModelEntri.ambilIndeksValidBatch(kandidat);

  return {
    ...payload,
    tautan_indonesia_valid: tautanIndonesiaValid,
  };
}

function buatCacheKeyVersion(asing) {
  return `${cachePrefixDetailGlosariumVersion}${encodeURIComponent((asing || '').toLowerCase())}`;
}

function buatCacheKeyVersionBrowseGlosarium() {
  return cacheKeyBrowseGlosariumVersion;
}

function buatCacheKeyMasterGlosarium(resource, filterMode = '') {
  const resourcePart = encodeURIComponent(String(resource || '').trim().toLowerCase());
  const filterPart = encodeURIComponent(String(filterMode || '').trim().toLowerCase());
  return `${cachePrefixMasterGlosarium}${resourcePart}:m-${filterPart}`;
}

async function ambilVersiCache(asing) {
  const raw = await getJson(buatCacheKeyVersion(asing));
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

async function ambilVersiCacheBrowseGlosarium() {
  const raw = await getJson(buatCacheKeyVersionBrowseGlosarium());
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

function buatCacheKeyDetailGlosarium(asing, options = {}, versi = 0) {
  const baseKey = `${cachePrefixDetailGlosarium}${encodeURIComponent((asing || '').toLowerCase())}`;
  const {
    limit = 20,
    mengandungCursor = null,
    miripCursor = null,
  } = options;

  const mengandungCursorPart = mengandungCursor ? encodeURIComponent(mengandungCursor) : '';
  const miripCursorPart = miripCursor ? encodeURIComponent(miripCursor) : '';
  const versiPart = Number.isFinite(Number(versi)) ? Number(versi) : 0;
  return `${baseKey}:v-${versiPart}:l-${Number(limit) || 20}:mc-${mengandungCursorPart}:rc-${miripCursorPart}`;
}

function buatCacheKeyBrowseGlosarium(scope, options = {}, versi = 0) {
  const baseKey = `${cachePrefixBrowseGlosarium}${encodeURIComponent(String(scope || '').toLowerCase())}`;
  const {
    limit = 100,
    cursor = null,
    direction = 'next',
    lastPage = false,
  } = options;

  const versiPart = Number.isFinite(Number(versi)) ? Number(versi) : 0;
  const cursorPart = cursor ? encodeURIComponent(cursor) : '';
  const directionPart = direction === 'prev' ? 'prev' : 'next';
  const lastPagePart = lastPage ? '1' : '0';

  return `${baseKey}:v-${versiPart}:l-${Number(limit) || 100}:c-${cursorPart}:d-${directionPart}:lp-${lastPagePart}`;
}

function shouldCacheBrowseGlosarium(scope, options = {}) {
  const { cursor = null, direction = 'next', lastPage = false } = options;

  if (scope === 'cari') {
    return !cursor && direction !== 'prev' && !lastPage;
  }

  return scope === 'bidang' || scope === 'sumber';
}

function bentukResponsCursor(result = {}) {
  return {
    ...result,
    pageInfo: {
      hasPrev: Boolean(result.hasPrev),
      hasNext: Boolean(result.hasNext),
      prevCursor: result.prevCursor || null,
      nextCursor: result.nextCursor || null,
    },
  };
}

async function invalidasiCacheBrowseGlosarium() {
  const nextVersion = Date.now();
  const versionTtl = Math.max(getTtlSeconds() * 4, 3600);
  await setJson(buatCacheKeyVersionBrowseGlosarium(), nextVersion, versionTtl);
}

async function ambilMasterGlosariumPublik(resource, filterMode, loader) {
  const cacheKey = buatCacheKeyMasterGlosarium(resource, filterMode);
  const cached = await getJson(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await loader();
  await setJson(cacheKey, result, getTtlSeconds());
  return result;
}

async function invalidasiCacheDetailGlosarium(asing) {
  const trimmed = normalisasiAsing(asing);
  await invalidasiCacheBrowseGlosarium();
  if (!trimmed) return;

  const versionKey = buatCacheKeyVersion(trimmed);
  const nextVersion = Date.now();
  const versionTtl = Math.max(getTtlSeconds() * 4, 3600);
  await setJson(versionKey, nextVersion, versionTtl);
}

async function ambilDaftarGlosariumPublik(scope, query, opsiModel = {}, opsiCache = {}) {
  const resultModel = async () => {
    const result = await ModelGlosarium.cariCursor(opsiModel);
    return tambahkanTautanIndonesiaValid(bentukResponsCursor(result), result?.data || []);
  };

  if (!shouldCacheBrowseGlosarium(scope, opsiCache)) {
    return resultModel();
  }

  const versi = await ambilVersiCacheBrowseGlosarium();
  const cacheKey = buatCacheKeyBrowseGlosarium(
    `${scope}:${String(query || '').trim().toLowerCase()}`,
    opsiCache,
    versi
  );
  const cached = await getJson(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await resultModel();
  await setJson(cacheKey, result, getTtlSeconds());
  return result;
}

async function cariGlosariumPublik(kata, { limit = 100, cursor = null, direction = 'next', lastPage = false } = {}) {
  return ambilDaftarGlosariumPublik('cari', kata, {
    q: kata,
    limit,
    aktifSaja: true,
    hitungTotal: true,
    cursor,
    direction,
    lastPage,
  }, {
    limit,
    cursor,
    direction,
    lastPage,
  });
}

async function ambilGlosariumPerBidangPublik(queryKey, { bidangId = null, bidang = '', limit = 100, cursor = null, direction = 'next', lastPage = false } = {}) {
  return ambilDaftarGlosariumPublik('bidang', queryKey, {
    bidangId,
    bidang,
    limit,
    aktifSaja: true,
    hitungTotal: true,
    cursor,
    direction,
    lastPage,
    sortBy: 'asing',
  }, {
    limit,
    cursor,
    direction,
    lastPage,
  });
}

async function ambilGlosariumPerSumberPublik(queryKey, { sumberId, limit = 100, cursor = null, direction = 'next', lastPage = false } = {}) {
  return ambilDaftarGlosariumPublik('sumber', queryKey, {
    sumberId,
    limit,
    aktifSaja: true,
    hitungTotal: true,
    cursor,
    direction,
    lastPage,
    sortBy: 'asing',
  }, {
    limit,
    cursor,
    direction,
    lastPage,
  });
}

async function ambilDaftarBidangPublik(filterMode = 'glosarium') {
  return ambilMasterGlosariumPublik('bidang', filterMode, () => ModelGlosarium.ambilDaftarBidang(filterMode));
}

async function ambilDaftarSumberPublik(filterMode = 'konteks') {
  return ambilMasterGlosariumPublik('sumber', filterMode, () => ModelGlosarium.ambilDaftarSumber(filterMode));
}

async function ambilDetailGlosarium(asing, { limit = 20, mengandungCursor = null, miripCursor = null } = {}) {
  const trimmed = normalisasiAsing(asing);
  if (!trimmed) {
    return ModelGlosarium.ambilDetailAsing(trimmed, { limit, mengandungCursor, miripCursor });
  }

  const options = {
    limit,
    mengandungCursor,
    miripCursor,
  };

  const versi = await ambilVersiCache(trimmed);
  const cacheKey = buatCacheKeyDetailGlosarium(trimmed, options, versi);
  const cached = await getJson(cacheKey);
  if (cached) {
    return cached;
  }

  const resultMentah = await ModelGlosarium.ambilDetailAsing(trimmed, options);
  const result = await tambahkanTautanIndonesiaValid(resultMentah, [
    ...(resultMentah?.persis || []),
    ...(resultMentah?.mengandung || []),
    ...(resultMentah?.mirip || []),
  ]);
  await setJson(cacheKey, result, getTtlSeconds());
  return result;
}

module.exports = {
  cariGlosariumPublik,
  ambilDaftarBidangPublik,
  ambilDaftarSumberPublik,
  ambilGlosariumPerBidangPublik,
  ambilGlosariumPerSumberPublik,
  ambilDetailGlosarium,
  invalidasiCacheDetailGlosarium,
  buatCacheKeyDetailGlosarium,
  buatCacheKeyBrowseGlosarium,
};

module.exports.__private = {
  normalisasiAsing,
  normalisasiIndeksKamus,
  splitEntriGlosarium,
  tokenizeKurung,
  ekstrakKandidatTautanIndonesia,
  kumpulkanKandidatTautanIndonesia,
  shouldCacheBrowseGlosarium,
  buatCacheKeyVersion,
  buatCacheKeyVersionBrowseGlosarium,
  buatCacheKeyMasterGlosarium,
  ambilVersiCache,
  ambilVersiCacheBrowseGlosarium,
};
