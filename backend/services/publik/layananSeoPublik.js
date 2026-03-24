/**
 * @fileoverview Layanan SEO publik untuk robots.txt dan sitemap.xml
 */

const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const ModelLabel = require('../../models/master/modelLabel');
const ModelGlosarium = require('../../models/leksikon/modelGlosarium');

const rootDir = path.resolve(__dirname, '..', '..', '..');
const ejaanDocsDir = path.join(rootDir, 'frontend', 'public', 'ejaan');
const gramatikaDocsDir = path.join(rootDir, 'frontend', 'public', 'gramatika');
const ogLogoPath = path.join(rootDir, 'frontend', 'public', 'images', 'logo-persegi.png');

const KATEGORI_SLUG_NAMA = new Set(['kelas_kata', 'kelas-kata', 'kelas', 'ragam', 'bahasa', 'bidang']);
const ogImageDimensions = { width: 1200, height: 630 };
const ogSectionPalette = {
  default: {
    start: '#F8FBFF',
    end: '#FFF4E6',
    accent: '#1F2B8F',
    accentSoft: '#E8EEFF',
    badgeText: '#B45309',
    badgeBg: '#FFF1DC',
    title: '#12205D',
    body: '#475569',
    border: '#D8E1F6',
  },
  ejaan: {
    start: '#F4FBFF',
    end: '#E9FFF7',
    accent: '#0F766E',
    accentSoft: '#DDF8F2',
    badgeText: '#0F766E',
    badgeBg: '#DDF8F2',
    title: '#134E4A',
    body: '#4B5563',
    border: '#C9F0E8',
  },
  gramatika: {
    start: '#FFF9F2',
    end: '#F6F6FF',
    accent: '#9A3412',
    accentSoft: '#FFE7D6',
    badgeText: '#9A3412',
    badgeBg: '#FFE7D6',
    title: '#7C2D12',
    body: '#57534E',
    border: '#F7D7C1',
  },
  kamus: {
    start: '#EEF6FF',
    end: '#FFF6EC',
    accent: '#1D4ED8',
    accentSoft: '#DCEAFE',
    badgeText: '#1D4ED8',
    badgeBg: '#DBEAFE',
    title: '#1E3A8A',
    body: '#475569',
    border: '#C7D8FB',
  },
  tesaurus: {
    start: '#F3F0FF',
    end: '#FFF5FB',
    accent: '#7C3AED',
    accentSoft: '#E9DDFF',
    badgeText: '#7C3AED',
    badgeBg: '#EDE9FE',
    title: '#5B21B6',
    body: '#5B556C',
    border: '#DCCBFF',
  },
  glosarium: {
    start: '#ECFEF7',
    end: '#F2FFFC',
    accent: '#0F766E',
    accentSoft: '#CCFBF1',
    badgeText: '#0F766E',
    badgeBg: '#CCFBF1',
    title: '#115E59',
    body: '#4B5563',
    border: '#BFEDE3',
  },
  makna: {
    start: '#FFF7ED',
    end: '#FFFDF5',
    accent: '#C2410C',
    accentSoft: '#FFEDD5',
    badgeText: '#C2410C',
    badgeBg: '#FFEDD5',
    title: '#9A3412',
    body: '#57534E',
    border: '#F8D6BB',
  },
  rima: {
    start: '#F4F7FF',
    end: '#F7FBFF',
    accent: '#2563EB',
    accentSoft: '#DBEAFE',
    badgeText: '#2563EB',
    badgeBg: '#DBEAFE',
    title: '#1D4ED8',
    body: '#475569',
    border: '#CCDBFF',
  },
  alat: {
    start: '#FFF8F0',
    end: '#F5FCFF',
    accent: '#B45309',
    accentSoft: '#FFEDD5',
    badgeText: '#B45309',
    badgeBg: '#FEF3C7',
    title: '#92400E',
    body: '#57534E',
    border: '#F6DEB5',
  },
  gim: {
    start: '#FFF7F7',
    end: '#F5FFF8',
    accent: '#BE123C',
    accentSoft: '#FFE4E6',
    badgeText: '#BE123C',
    badgeBg: '#FFE4E6',
    title: '#9F1239',
    body: '#5B556C',
    border: '#F8CDD6',
  },
};

let cachedOgLogoDataUri;

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

function pickQueryValue(value = '') {
  if (Array.isArray(value)) return String(value[0] || '');
  return String(value || '');
}

function truncatePlainText(value = '', maxLen = 80) {
  return truncatePlainTextWithOptions(value, maxLen);
}

function truncatePlainTextWithOptions(value = '', maxLen = 80, options = {}) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  const ellipsis = options.leadingSpaceBeforeEllipsis ? ' …' : '…';
  if (options.forceEllipsis && normalized) {
    if (normalized.length <= maxLen) return `${normalized}${ellipsis}`;
  }
  if (normalized.length <= maxLen) return normalized;

  const cut = normalized.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const safeCut = lastSpace > Math.floor(maxLen * 0.6) ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trim()}${ellipsis}`;
}

function formatTitleFromSlug(value = '') {
  const decoded = decodeURIComponent(String(value || '').trim())
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!decoded) return '';

  return decoded
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeOgSection(value = '') {
  const normalized = normalisasiSlug(value);
  if (Object.prototype.hasOwnProperty.call(ogSectionPalette, normalized)) return normalized;
  return 'default';
}

function getOgLogoDataUri() {
  if (cachedOgLogoDataUri !== undefined) return cachedOgLogoDataUri;

  try {
    const imageBuffer = fs.readFileSync(ogLogoPath);
    cachedOgLogoDataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  } catch {
    cachedOgLogoDataUri = '';
  }

  return cachedOgLogoDataUri;
}

function escapeRegex(value = '') {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripRepeatedOgContextTitle(title = '', context = '') {
  const normalizedTitle = String(title || '').replace(/\s+/g, ' ').trim();
  const normalizedContext = String(context || '').replace(/\s+/g, ' ').trim();
  if (!normalizedTitle || !normalizedContext) return normalizedContext;

  const titlePattern = new RegExp(`^${escapeRegex(normalizedTitle)}\\s*(?:[:;,]|-|–|—)\\s*`, 'i');
  const stripped = normalizedContext.replace(titlePattern, '').trim();
  if (stripped && stripped !== normalizedContext) return stripped;

  if (normalizedContext.toLowerCase() === normalizedTitle.toLowerCase()) {
    return normalizedContext;
  }

  const leadingTitlePattern = new RegExp(`^${escapeRegex(normalizedTitle)}\\b\\s+`, 'i');
  return normalizedContext.replace(leadingTitlePattern, '').trim();
}

function normalizeOgContext(title = '', context = '', fallbackContext = '', options = {}) {
  const rawContext = pickQueryValue(context) || fallbackContext;
  if (options.stripRepeatedTitle !== true) return rawContext;
  return stripRepeatedOgContextTitle(title, rawContext);
}

function buildOgImagePayload({ section = 'default', slug = '', title = '', context = '', stripRepeatedTitle = false } = {}) {
  const sectionKey = normalizeOgSection(section);
  const sectionLabel = sectionKey === 'ejaan'
    ? 'Ejaan'
    : sectionKey === 'gramatika'
      ? 'Gramatika'
      : sectionKey === 'kamus'
        ? 'Kamus'
        : sectionKey === 'tesaurus'
          ? 'Tesaurus'
          : sectionKey === 'glosarium'
            ? 'Glosarium'
            : sectionKey === 'makna'
              ? 'Makna'
              : sectionKey === 'rima'
                ? 'Rima'
                : sectionKey === 'alat'
                  ? 'Alat'
                  : sectionKey === 'gim'
                    ? 'Gim'
      : 'Bahasa Indonesia';
  const fallbackTitle = sectionKey === 'ejaan'
    ? (slug ? formatTitleFromSlug(slug) : 'Panduan Ejaan Bahasa Indonesia')
    : sectionKey === 'gramatika'
      ? (slug ? formatTitleFromSlug(slug) : 'Panduan Tata Bahasa Indonesia')
      : sectionKey === 'kamus'
        ? 'Kamus Bahasa Indonesia'
        : sectionKey === 'tesaurus'
          ? 'Tesaurus Bahasa Indonesia'
          : sectionKey === 'glosarium'
            ? 'Glosarium Bahasa Indonesia'
            : sectionKey === 'makna'
              ? 'Pencarian Makna'
              : sectionKey === 'rima'
                ? 'Pencarian Rima'
                : sectionKey === 'alat'
                  ? 'Alat Bahasa Indonesia'
                  : sectionKey === 'gim'
                    ? 'Gim Kata Indonesia'
      : 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia';
  const fallbackContext = sectionKey === 'ejaan'
    ? (slug ? 'Kaidah Bahasa Indonesia' : 'Pedoman Bahasa Indonesia')
    : sectionKey === 'gramatika'
      ? (slug ? 'Tata Bahasa Indonesia' : 'Panduan Bahasa Indonesia')
      : sectionKey === 'kamus'
        ? 'Entri dan pencarian kamus'
        : sectionKey === 'tesaurus'
          ? 'Sinonim, antonim, dan relasi kata'
          : sectionKey === 'glosarium'
            ? 'Istilah dan padanan bidang ilmu'
            : sectionKey === 'makna'
              ? 'Cari kata berdasarkan makna'
              : sectionKey === 'rima'
                ? 'Cari kata berdasarkan rima'
                : sectionKey === 'alat'
                  ? 'Penganalisis teks dan penghitung huruf'
                  : sectionKey === 'gim'
                    ? 'Kuis kata dan susun kata'
      : 'kateglo.org';

  return {
    section: sectionKey,
    sectionLabel,
    title: truncatePlainText(pickQueryValue(title) || fallbackTitle, 88),
    context: normalizeOgContext(pickQueryValue(title) || fallbackTitle, context, fallbackContext, {
      stripRepeatedTitle,
    }),
    cta: 'Baca di Kateglo',
    logoDataUri: getOgLogoDataUri(),
  };
}

function splitOgTextIntoLines(text = '', maxChars = 26, maxLines = 3, options = {}) {
  const normalizedText = String(text ?? '');
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  if (!lines.length) return ['Kateglo'];

  const joined = lines.join(' ');
  const overflowed = joined.length < normalizedText.trim().length;
  if (overflowed) {
    lines[lines.length - 1] = truncatePlainTextWithOptions(
      lines[lines.length - 1],
      Math.max(12, maxChars - 2),
      {
        leadingSpaceBeforeEllipsis: options.leadingSpaceBeforeEllipsis === true,
        forceEllipsis: true,
      }
    );
  }

  return lines.slice(0, maxLines);
}

function renderSvgTextLines(lines = [], { x = 72, y = 220, lineHeight = 78 } = {}) {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${y + (index * lineHeight)}">${escapeXml(line)}</tspan>`)
    .join('');
}

function buildOgImageSvg(payload = {}) {
  const palette = ogSectionPalette[payload.section] || ogSectionPalette.default;
  const titleLines = splitOgTextIntoLines(payload.title, 28, 3);
  const titleLineHeight = titleLines.length >= 3 ? 70 : 78;
  const contextLines = splitOgTextIntoLines(payload.context, 50, 5, { leadingSpaceBeforeEllipsis: true });
  const contextLineHeight = 28;
  const titleStartY = 208;
  const lastTitleY = titleStartY + ((titleLines.length - 1) * titleLineHeight);
  const contextStartY = lastTitleY + 58;
  const ctaY = 472;
  const hasLogo = Boolean(payload.logoDataUri);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ogImageDimensions.width}" height="${ogImageDimensions.height}" viewBox="0 0 ${ogImageDimensions.width} ${ogImageDimensions.height}" role="img" aria-label="${escapeXml(payload.title)}">`,
    '  <defs>',
    `    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">`,
    `      <stop offset="0%" stop-color="${palette.start}" />`,
    `      <stop offset="100%" stop-color="${palette.end}" />`,
    '    </linearGradient>',
    '  </defs>',
    `  <rect width="${ogImageDimensions.width}" height="${ogImageDimensions.height}" rx="36" fill="url(#bg)" />`,
    `  <circle cx="1030" cy="92" r="160" fill="${palette.accentSoft}" opacity="0.7" />`,
    `  <circle cx="980" cy="520" r="190" fill="${palette.accentSoft}" opacity="0.42" />`,
    `  <rect x="44" y="44" width="1112" height="542" rx="30" fill="none" stroke="${palette.border}" stroke-width="2" />`,
    hasLogo ? `  <rect x="1016" y="68" width="100" height="100" rx="30" fill="#ffffff" opacity="0.9" />` : '',
    hasLogo ? `  <image href="${payload.logoDataUri}" x="1030" y="82" width="72" height="72" preserveAspectRatio="xMidYMid meet" />` : '',
    `  <rect x="72" y="92" width="220" height="46" rx="23" fill="${palette.badgeBg}" />`,
    `  <text x="182" y="122" fill="${palette.badgeText}" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle">${escapeXml(payload.sectionLabel)}</text>`,
    `  <text fill="${palette.title}" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="700">${renderSvgTextLines(titleLines, { x: 72, y: titleStartY, lineHeight: titleLineHeight })}</text>`,
    `  <text fill="${palette.body}" font-family="Segoe UI, Arial, sans-serif" font-size="22">${renderSvgTextLines(contextLines, { x: 72, y: contextStartY, lineHeight: contextLineHeight })}</text>`,
    `  <rect x="874" y="${ctaY}" width="236" height="58" rx="29" fill="${palette.accent}" />`,
    `  <text x="992" y="${ctaY + 36}" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle">${escapeXml(payload.cta)}</text>`,
    '</svg>',
  ].filter(Boolean).join('\n');
}

function renderOgImagePng(options = {}) {
  const payload = buildOgImagePayload(options);
  const svg = buildOgImageSvg(payload);
  const renderer = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: ogImageDimensions.width,
    },
  });

  return renderer.render().asPng();
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
    '/sumber',
    '/alat',
    '/alat/penganalisis-teks',
    '/alat/penghitung-huruf',
    '/gim',
    '/gim/kuis-kata',
    '/gim/susun-kata/harian',
    '/gim/susun-kata/bebas',
    '/makna',
    '/rima',
    '/ejaan',
    '/gramatika',
    '/kebijakan-privasi',
  ];
}

function ambilPathEjaan() {
  if (!fs.existsSync(ejaanDocsDir)) return [];

  const entries = fs.readdirSync(ejaanDocsDir, { recursive: true, withFileTypes: true });
  const detailPaths = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => {
      const basename = path.basename(entry.name, '.md').trim();
      if (!basename || basename.toLowerCase() === 'readme') return '';
      return `/ejaan/${encodePathSegment(basename)}`;
    })
    .filter(Boolean);

  return [...new Set(detailPaths)];
}

function ambilPathGramatika() {
  if (!fs.existsSync(gramatikaDocsDir)) return [];

  const entries = fs.readdirSync(gramatikaDocsDir, { recursive: true, withFileTypes: true });
  const detailPaths = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => {
      const basename = path.basename(entry.name, '.md').trim();
      if (!basename || basename.toLowerCase() === 'readme') return '';
      return `/gramatika/${encodePathSegment(basename)}`;
    })
    .filter(Boolean);

  return [...new Set(detailPaths)];
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
    const value = item?.slug || normalisasiSlug(item?.nama || item?.bidang) || item?.kode;
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

  const ejaanPaths = ambilPathEjaan();
  const gramatikaPaths = ambilPathGramatika();

  return [
    ...ambilPathStatis(),
    ...kamusKategori,
    ...glosariumKategori,
    ...ejaanPaths,
    ...gramatikaPaths,
  ];
}

module.exports = {
  resolveSiteBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  generateSitemapPaths,
  buildOgImagePayload,
  buildOgImageSvg,
  renderOgImagePng,
  __private: {
    normalisasiBaseUrl,
    normalisasiSlug,
    normalisasiKategoriPath,
    tentukanSlugLabel,
    encodePathSegment,
    pickQueryValue,
    truncatePlainText,
    truncatePlainTextWithOptions,
    formatTitleFromSlug,
    normalizeOgSection,
    escapeRegex,
    stripRepeatedOgContextTitle,
    normalizeOgContext,
    ambilPathStatis,
    buildPathKamusKategori,
    ambilPathKamusKategori,
    ambilPathGlosariumKategori,
    ambilPathEjaan,
    ambilPathGramatika,
    escapeXml,
    splitOgTextIntoLines,
    renderSvgTextLines,
    getOgLogoDataUri,
    ogImageDimensions,
  },
};
