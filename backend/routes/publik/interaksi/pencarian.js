/**
 * @fileoverview Route pencarian populer lintas domain publik
 */

const express = require('express');
const ModelPencarian = require('../../models/interaksi/modelPencarian');
const cacheService = require('../../services/layananCache');

const router = express.Router();
const popularCacheTtlDefault = 300;

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function tanggalHariIni() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function parsePopularCacheTtl() {
  const parsed = Number.parseInt(process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS, 10);
  if (Number.isNaN(parsed)) return popularCacheTtlDefault;
  return Math.min(Math.max(parsed, 60), 3600);
}

function setCacheHeaders(res, maxAge = 60, staleWhileRevalidate = 300) {
  const maxAgeAman = Math.max(Number(maxAge) || 0, 0);
  const staleAman = Math.max(Number(staleWhileRevalidate) || 0, 0);
  res.set('Cache-Control', `public, max-age=${maxAgeAman}, stale-while-revalidate=${staleAman}`);
}

function mapDataPopuler(items = []) {
  const peta = new Map(items.map((item) => [item.domain_nama, item.kata || null]));
  return {
    kamus: peta.get('kamus') || null,
    tesaurus: peta.get('tesaurus') || null,
    glosarium: peta.get('glosarium') || null,
    makna: peta.get('makna') || null,
    rima: peta.get('rima') || null,
  };
}

function normalisasiTanggalOutput(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

router.get('/populer', async (req, res, next) => {
  try {
    const tanggal = parseTanggal(req.query.tanggal) || tanggalHariIni();
    const ttl = parsePopularCacheTtl();
    const cacheKey = `publik:pencarian:populer:v2:${tanggal}`;

    const cached = await cacheService.getJson(cacheKey);
    if (cached) {
      setCacheHeaders(res, Math.min(ttl, 60), ttl);
      return res.json(cached);
    }

    const dataMentah = await ModelPencarian.ambilFrasaPopulerPerDomain({ tanggalReferensi: tanggal });
    const tanggalEfektif = dataMentah
      .map((item) => normalisasiTanggalOutput(item.tanggal))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] || null;

    const payload = {
      tanggal,
      tanggalData: tanggalEfektif,
      data: mapDataPopuler(dataMentah),
    };

    await cacheService.setJson(cacheKey, payload, ttl);
    setCacheHeaders(res, Math.min(ttl, 60), ttl);

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

module.exports.__private = {
  parseTanggal,
  tanggalHariIni,
  parsePopularCacheTtl,
  setCacheHeaders,
  mapDataPopuler,
  normalisasiTanggalOutput,
};
