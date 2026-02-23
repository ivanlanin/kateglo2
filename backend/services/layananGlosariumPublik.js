/**
 * @fileoverview Layanan glosarium publik — business logic detail glosarium + cache
 */

const ModelGlosarium = require('../models/modelGlosarium');
const { getJson, setJson, getTtlSeconds } = require('./layananCache');

const cachePrefixDetailGlosarium = 'glosarium:detail:';
const cachePrefixDetailGlosariumVersion = 'glosarium:detail:version:';

function normalisasiAsing(teks) {
  return decodeURIComponent((teks || '').trim());
}

function buatCacheKeyVersion(asing) {
  return `${cachePrefixDetailGlosariumVersion}${encodeURIComponent((asing || '').toLowerCase())}`;
}

async function ambilVersiCache(asing) {
  const raw = await getJson(buatCacheKeyVersion(asing));
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

async function invalidasiCacheDetailGlosarium(asing) {
  const trimmed = normalisasiAsing(asing);
  if (!trimmed) return;

  const versionKey = buatCacheKeyVersion(trimmed);
  const nextVersion = Date.now();
  const versionTtl = Math.max(getTtlSeconds() * 4, 3600);
  await setJson(versionKey, nextVersion, versionTtl);
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

  const result = await ModelGlosarium.ambilDetailAsing(trimmed, options);
  await setJson(cacheKey, result, getTtlSeconds());
  return result;
}

module.exports = {
  ambilDetailGlosarium,
  invalidasiCacheDetailGlosarium,
  buatCacheKeyDetailGlosarium,
};
