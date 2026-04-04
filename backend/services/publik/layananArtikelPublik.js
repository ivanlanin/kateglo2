/**
 * @fileoverview Layanan publik artikel dengan cache daftar/detail dan invalidasi versi.
 */

const ModelArtikel = require('../../models/artikel/modelArtikel');
const {
  getJson,
  setJson,
  getTtlSeconds,
} = require('../sistem/layananCache');

const cachePrefixDaftarArtikel = 'artikel:browse:';
const cacheKeyVersiDaftarArtikel = 'artikel:browse:version';
const cachePrefixDetailArtikel = 'artikel:detail:';
const cachePrefixVersiDetailArtikel = 'artikel:detail:version:';

function normalisasiSlug(slug = '') {
  return decodeURIComponent(String(slug || '').trim()).toLowerCase();
}

function normalisasiQueryTeks(value = '') {
  return String(value || '').trim();
}

function normalisasiTopikFilter(topik) {
  if (!topik) return [];

  const daftarTopik = Array.isArray(topik) ? topik : [topik];
  return [...new Set(
    daftarTopik
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .map((item) => item.toLowerCase())
      .sort((kiri, kanan) => kiri.localeCompare(kanan, 'id'))
  )];
}

function normalisasiLimit(limit, fallback = 20) {
  const parsed = Number.parseInt(limit, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalisasiOffset(offset) {
  const parsed = Number.parseInt(offset, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function buatCacheKeyVersiDetailArtikel(slug = '') {
  return `${cachePrefixVersiDetailArtikel}${encodeURIComponent(normalisasiSlug(slug))}`;
}

async function ambilVersiCacheDaftarArtikel() {
  const versi = await getJson(cacheKeyVersiDaftarArtikel);
  return Number.isFinite(Number(versi)) ? Number(versi) : 0;
}

async function ambilVersiCacheDetailArtikel(slug = '') {
  const versi = await getJson(buatCacheKeyVersiDetailArtikel(slug));
  return Number.isFinite(Number(versi)) ? Number(versi) : 0;
}

function buatCacheKeyDaftarArtikel(params = {}, versi = 0) {
  const limit = normalisasiLimit(params.limit, 20);
  const offset = normalisasiOffset(params.offset);
  const q = normalisasiQueryTeks(params.q);
  const topik = normalisasiTopikFilter(params.topik);

  return `${cachePrefixDaftarArtikel}v-${Number.isFinite(Number(versi)) ? Number(versi) : 0}:l-${limit}:o-${offset}:q-${encodeURIComponent(q)}:t-${encodeURIComponent(topik.join('|'))}`;
}

function buatCacheKeyDetailArtikel(slug = '', versi = 0) {
  return `${cachePrefixDetailArtikel}${encodeURIComponent(normalisasiSlug(slug))}:v-${Number.isFinite(Number(versi)) ? Number(versi) : 0}`;
}

async function invalidasiCacheDaftarArtikel() {
  const now = Date.now();
  const ttl = Math.max(getTtlSeconds() * 4, 3600);
  await setJson(cacheKeyVersiDaftarArtikel, now, ttl);
}

async function invalidasiCacheDetailArtikel(slug = '') {
  const slugNormal = normalisasiSlug(slug);
  if (!slugNormal) return;

  const now = Date.now();
  const ttl = Math.max(getTtlSeconds() * 4, 3600);
  await setJson(buatCacheKeyVersiDetailArtikel(slugNormal), now, ttl);
}

async function invalidasiCacheArtikelPublik(slugs = []) {
  await invalidasiCacheDaftarArtikel();

  const daftarSlug = Array.isArray(slugs) ? slugs : [slugs];
  const slugUnik = [...new Set(daftarSlug.map(normalisasiSlug).filter(Boolean))];
  await Promise.all(slugUnik.map((slug) => invalidasiCacheDetailArtikel(slug)));
}

async function ambilDaftarArtikelPublik(params = {}) {
  const opsiQuery = {
    topik: normalisasiTopikFilter(params.topik),
    q: normalisasiQueryTeks(params.q) || undefined,
    limit: normalisasiLimit(params.limit, 20),
    offset: normalisasiOffset(params.offset),
  };

  const versi = await ambilVersiCacheDaftarArtikel();
  const cacheKey = buatCacheKeyDaftarArtikel(opsiQuery, versi);
  const cached = await getJson(cacheKey);
  if (cached) return cached;

  const hasil = await ModelArtikel.ambilDaftarPublik(opsiQuery);
  await setJson(cacheKey, hasil, getTtlSeconds());
  return hasil;
}

async function ambilDetailArtikelPublik(slug = '') {
  const slugNormal = normalisasiSlug(slug);
  if (!slugNormal) return null;

  const versi = await ambilVersiCacheDetailArtikel(slugNormal);
  const cacheKey = buatCacheKeyDetailArtikel(slugNormal, versi);
  const cached = await getJson(cacheKey);
  if (cached) return cached;

  const hasil = await ModelArtikel.ambilSatuPublik(slugNormal);
  if (!hasil) return null;

  await setJson(cacheKey, hasil, getTtlSeconds());
  return hasil;
}

module.exports = {
  ambilDaftarArtikelPublik,
  ambilDetailArtikelPublik,
  invalidasiCacheArtikelPublik,
  invalidasiCacheDaftarArtikel,
  invalidasiCacheDetailArtikel,
  buatCacheKeyDaftarArtikel,
  buatCacheKeyDetailArtikel,
  __private: {
    normalisasiSlug,
    normalisasiTopikFilter,
    normalisasiLimit,
    normalisasiOffset,
    normalisasiQueryTeks,
    buatCacheKeyVersiDetailArtikel,
    ambilVersiCacheDaftarArtikel,
    ambilVersiCacheDetailArtikel,
  },
};