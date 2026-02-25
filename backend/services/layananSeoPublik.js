/**
 * @fileoverview Layanan SEO publik untuk robots.txt dan sitemap.xml
 */

const ModelLabel = require('../models/modelLabel');
const ModelGlosarium = require('../models/modelGlosarium');

const KATEGORI_SLUG_NAMA = new Set(['kelas_kata', 'kelas-kata', 'kelas', 'ragam', 'bahasa', 'bidang']);

function normalisasiBaseUrl(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return trimmed.replace(/\/+$/, '');
}

function resolveSiteBaseUrl(req) {
  const candidates = [
    process.env.SITE_URL,
    process.env.PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.FRONTEND_URL,
  ];

  for (const value of candidates) {
    const normalized = normalisasiBaseUrl(value);
    if (normalized) return normalized;
  }

  const host = req?.get?.('host') || 'localhost:3000';
  const protocol = req?.protocol || 'http';
  return `${protocol}://${host}`;
}

function normalisasiSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalisasiKategoriPath(kategori = '') {
  const key = String(kategori || '').trim().toLowerCase();
  if (key === 'kelas_kata' || key === 'kelas-kata' || key === 'kelas') {
    return 'kelas';
  }
  if (key === 'unsur_terikat') {
    return 'bentuk';
  }
  return key;
}

function tentukanSlugLabel(kategori = '', label = {}) {
  const kategoriKey = String(kategori || '').trim().toLowerCase();
  const kode = String(label?.kode || '').trim();
  const nama = String(label?.nama || '').trim();

  if (KATEGORI_SLUG_NAMA.has(kategoriKey) && nama) {
    return normalisasiSlug(nama);
  }

  return normalisasiSlug(kode || nama);
}

function encodePathSegment(value = '') {
  return encodeURIComponent(String(value || '').trim());
}

function escapeXml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRobotsTxt(baseUrl) {
  const normalizedBaseUrl = normalisasiBaseUrl(baseUrl) || 'http://localhost:3000';
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /redaksi/',
    'Disallow: /api/',
    'Disallow: /auth/',
    `Sitemap: ${normalizedBaseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

function buildSitemapXml(baseUrl, paths = []) {
  const normalizedBaseUrl = normalisasiBaseUrl(baseUrl) || 'http://localhost:3000';
  const tanggal = new Date().toISOString().slice(0, 10);
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const urls = uniquePaths.map((path) => {
    const loc = `${normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${tanggal}</lastmod>`,
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

function ambilPathStatis() {
  return [
    '/',
    '/kamus',
    '/tesaurus',
    '/glosarium',
    '/makna',
    '/rima',
    '/kebijakan-privasi',
  ];
}

function buildPathKamusKategori(kategori, label = {}) {
  const pathKategori = normalisasiKategoriPath(kategori);
  const slug = tentukanSlugLabel(kategori, label);
  if (!pathKategori || !slug) return '';
  return `/kamus/${encodePathSegment(pathKategori)}/${encodePathSegment(slug)}`;
}

async function ambilPathKamusKategori() {
  const kategoriMap = await ModelLabel.ambilSemuaKategori();
  const kategoriTarget = ['abjad', 'kelas_kata', 'bentuk', 'unsur_terikat', 'ekspresi', 'ragam', 'bahasa', 'bidang'];

  const paths = [];
  for (const kategori of kategoriTarget) {
    const daftarLabel = Array.isArray(kategoriMap?.[kategori]) ? kategoriMap[kategori] : [];
    for (const label of daftarLabel) {
      const path = buildPathKamusKategori(kategori, label);
      if (path) paths.push(path);
    }
  }

  return paths;
}

async function ambilPathGlosariumKategori() {
  const [bidangList, sumberList] = await Promise.all([
    ModelGlosarium.ambilDaftarBidang(true),
    ModelGlosarium.ambilDaftarSumber(true),
  ]);

  const bidangPaths = (bidangList || []).map((item) => {
    const value = item?.kode || item?.bidang || item?.nama;
    if (!value) return '';
    return `/glosarium/bidang/${encodePathSegment(value)}`;
  });

  const sumberPaths = (sumberList || []).map((item) => {
    const value = item?.kode || item?.sumber || item?.nama;
    if (!value) return '';
    return `/glosarium/sumber/${encodePathSegment(value)}`;
  });

  return [...bidangPaths, ...sumberPaths].filter(Boolean);
}

async function generateSitemapPaths() {
  const [kamusKategori, glosariumKategori] = await Promise.all([
    ambilPathKamusKategori(),
    ambilPathGlosariumKategori(),
  ]);

  return [
    ...ambilPathStatis(),
    ...kamusKategori,
    ...glosariumKategori,
  ];
}

module.exports = {
  resolveSiteBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  generateSitemapPaths,
  __private: {
    normalisasiBaseUrl,
    normalisasiSlug,
    normalisasiKategoriPath,
    tentukanSlugLabel,
    encodePathSegment,
    ambilPathStatis,
    buildPathKamusKategori,
    ambilPathKamusKategori,
    ambilPathGlosariumKategori,
    escapeXml,
  },
};
