/**
 * @fileoverview Runtime SSR untuk melayani frontend build + render HTML di server
 */

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const express = require('express');
const logger = require('../../config/logger');
const { ambilDetailKamus } = require('../publik/layananKamusPublik');
const { ambilDetailTesaurus } = require('../publik/layananTesaurusPublik');
const { ambilDetailGlosarium } = require('../publik/layananGlosariumPublik');
const ModelGlosarium = require('../../models/leksikon/modelGlosarium');

const backendRootDir = path.resolve(__dirname, '..', '..');
const workspaceRootDir = path.resolve(backendRootDir, '..');
const ejaanDocsDir = path.join(workspaceRootDir, 'frontend', 'public', 'ejaan');
const gramatikaDocsDir = path.join(workspaceRootDir, 'frontend', 'public', 'gramatika');
const frontendBuildCandidates = [
  path.join(workspaceRootDir, 'frontend', 'dist'),
  path.join(backendRootDir, 'frontend', 'dist'),
];

function resolveFrontendDistDir() {
  return frontendBuildCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.html'))) || frontendBuildCandidates[0];
}

function getFrontendTemplatePath() {
  return path.join(resolveFrontendDistDir(), 'index.html');
}

function getFrontendServerEntryPath() {
  return path.join(resolveFrontendDistDir(), 'server', 'entry-server.js');
}

function punyaFrontendBuild() {
  return frontendBuildCandidates.some((candidate) => fs.existsSync(path.join(candidate, 'index.html')));
}

function punyaSsrBundle() {
  return fs.existsSync(getFrontendServerEntryPath());
}

function isAssetRequest(requestPath = '') {
  return /\.[a-zA-Z0-9]+$/.test(requestPath);
}

function isBypassPath(requestPath = '') {
  return requestPath.startsWith('/api')
    || requestPath.startsWith('/auth/google')
    || requestPath.startsWith('/health');
}

function isEjaanPagePath(requestPath = '') {
  return /^\/ejaan(?:\/[^/]+)?\/?$/.test(String(requestPath || '').trim());
}

function isGramatikaPagePath(requestPath = '') {
  return /^\/gramatika(?:\/[^/]+)?\/?$/.test(String(requestPath || '').trim());
}

function resolvePageCacheControl(requestPath = '') {
  if (!isEjaanPagePath(requestPath) && !isGramatikaPagePath(requestPath)) return '';

  const parsed = Number.parseInt(process.env.CACHE_TTL_SECONDS, 10);
  const ttl = Number.isFinite(parsed) && parsed > 0 ? parsed : 1800;
  return `public, max-age=${ttl}`;
}

function stripReplaceableMeta(html) {
  const patterns = [
    /<title>[^<]*<\/title>/gi,
    /<meta\s+name="description"[^>]*\/?>/gi,
    /<link\s+rel="canonical"[^>]*\/?>/gi,
    /<meta\s+property="og:[^"]*"[^>]*\/?>/gi,
    /<meta\s+name="twitter:[^"]*"[^>]*\/?>/gi,
  ];
  let result = html;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  // Clean up blank lines left by removal
  result = result.replace(/(\n\s*){3,}/g, '\n\n');
  return result;
}

function injectHeadTags(htmlTemplate, headTags = '') {
  if (!headTags) return htmlTemplate;
  const stripped = stripReplaceableMeta(htmlTemplate);
  return stripped.replace('</head>', `${headTags}\n  </head>`);
}

function injectAppHtml(htmlTemplate, appHtml = '') {
  return htmlTemplate.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

function parseMarkdownFrontmatter(markdown = '') {
  const content = String(markdown || '');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const pemisah = line.indexOf(':');
    if (pemisah <= 0) continue;
    const key = line.slice(0, pemisah).trim();
    const value = line.slice(pemisah + 1).trim();
    if (!key) continue;
    frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return {
    frontmatter,
    body: content.slice(match[0].length),
  };
}

function bersihkanTeksMarkdown(markdown = '') {
  return String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[#>*-]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function rapikanItemRingkasanDaftarIsi(text = '') {
  return String(text || '')
    .replace(/^\d+\)\s+/, '')
    .replace(/^\(?\d+(?:\.\d+)*\)?\s+/, '')
    .trim();
}

function extractMarkdownListSummary(markdown = '') {
  const lines = String(markdown || '')
    .split(/\r?\n/)
    .map((line) => String(line || '').trimEnd())
    .filter((line) => line.trim());

  if (lines.length < 2) return '';

  const isListOnlyDocument = lines.every((line) => /^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line));
  if (!isListOnlyDocument) return '';

  const items = lines
    .map((line) => bersihkanTeksMarkdown(line))
    .map((line) => rapikanItemRingkasanDaftarIsi(line))
    .filter(Boolean);

  return items.join(', ');
}

function truncateText(text = '', maxLen = 155) {
  if (text.length <= maxLen) return text;

  const potong = text.slice(0, maxLen);
  const batasKata = potong.lastIndexOf(' ');
  return `${(batasKata > maxLen * 0.6 ? potong.slice(0, batasKata) : potong).trim()} …`;
}

function extractMarkdownSummary(markdown = '', maxLen = 155) {
  const listSummary = extractMarkdownListSummary(markdown);
  if (listSummary) return truncateText(listSummary, maxLen);

  const paragraphs = String(markdown || '')
    .split(/\r?\n\s*\r?\n/)
    .map((bagian) => ({
      raw: String(bagian || '').trim(),
      cleaned: bersihkanTeksMarkdown(bagian),
    }))
    .filter((bagian) => bagian.cleaned);

  const preferredParagraph = paragraphs.find((bagian) => {
    if (/^#+\s/.test(bagian.raw)) return false;
    if (/^\d+\.?\s/.test(bagian.cleaned)) return false;
    return true;
  });

  const summary = preferredParagraph?.cleaned || paragraphs[0]?.cleaned || '';
  if (!summary) return '';
  return truncateText(summary, maxLen);
}

function listMarkdownDocumentPaths(docsDir = '') {
  if (!fs.existsSync(docsDir)) return [];

  return fs.readdirSync(docsDir, { recursive: true })
    .filter((entry) => typeof entry === 'string' && entry.toLowerCase().endsWith('.md'))
    .map((entry) => entry.replace(/\\/g, '/'))
    .filter((entry) => {
      const segments = entry.split('/').filter(Boolean);
      const basename = path.basename(entry, '.md').trim().toLowerCase();
      if (!basename || basename === 'readme') return false;
      return !segments.some((segment) => segment.startsWith('_'));
    });
}

function buildMarkdownSlugMap(docsDir = '') {
  const slugMap = new Map();

  for (const relativePath of listMarkdownDocumentPaths(docsDir)) {
    const basename = path.basename(relativePath, '.md').trim().toLowerCase();
    if (!basename || slugMap.has(basename)) continue;
    slugMap.set(basename, path.join(docsDir, relativePath));
  }

  return slugMap;
}

function readStaticMarkdownDocument(section = '', slug = '') {
  const sectionAman = String(section || '').trim().toLowerCase();
  const slugAman = decodeURIComponent(String(slug || '').trim()).toLowerCase();
  const docsDir = sectionAman === 'ejaan'
    ? ejaanDocsDir
    : sectionAman === 'gramatika'
      ? gramatikaDocsDir
      : '';

  if (!docsDir || !slugAman) return null;

  const slugMap = buildMarkdownSlugMap(docsDir);
  const filePath = slugMap.get(slugAman);
  if (!filePath) {
    return {
      type: 'static-markdown',
      section: sectionAman,
      slug: slugAman,
      markdown: '',
      frontmatter: {},
      description: '',
      notFound: true,
    };
  }

  const rawMarkdown = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseMarkdownFrontmatter(rawMarkdown);

  return {
    type: 'static-markdown',
    section: sectionAman,
    slug: slugAman,
    markdown: body,
    frontmatter,
    description: String(frontmatter.description || '').trim() || extractMarkdownSummary(body),
    notFound: false,
  };
}

async function loadSsrRenderer(options = {}) {
  const entryPath = options.entryPath || getFrontendServerEntryPath();
  const importModule = options.importModule || ((moduleUrl) => import(moduleUrl));
  const moduleUrl = pathToFileURL(entryPath).href;
  const ssrModule = await importModule(moduleUrl);
  return validateRendererModule(ssrModule);
}

function validateRendererModule(ssrModule) {
  if (typeof ssrModule.render !== 'function') {
    throw new Error('SSR bundle tidak mengekspor fungsi render(url)');
  }
  return ssrModule.render;
}

/**
 * Prefetch data dari DB berdasarkan route, untuk memperkaya meta SSR.
 * Mengembalikan objek data atau null jika route tidak memerlukan prefetch.
 */
async function prefetchSsrData(pathname = '/') {
  const decoded = decodeURIComponent(pathname);

  try {
    if (/^\/ejaan\/[^/]+\/?$/.test(decoded)) {
      return readStaticMarkdownDocument('ejaan', decoded.replace('/ejaan/', '').trim().replace(/\/+$/, ''));
    }

    if (/^\/gramatika\/[^/]+\/?$/.test(decoded)) {
      return readStaticMarkdownDocument('gramatika', decoded.replace('/gramatika/', '').trim().replace(/\/+$/, ''));
    }

    // /kamus/detail/:indeks
    if (decoded.startsWith('/kamus/detail/')) {
      const indeks = decoded.replace('/kamus/detail/', '').trim();
      if (!indeks) return null;
      const detail = await ambilDetailKamus(indeks);
      if (!detail || !detail.entri?.length) return null;
      // Kumpulkan makna dari semua entri
      const semuaMakna = [];
      for (const e of detail.entri) {
        if (e.makna) {
          for (const m of e.makna) {
            if (m.makna) semuaMakna.push({ makna: m.makna, kelas_kata: m.kelas_kata });
          }
        }
      }
      const lafal = detail.entri[0]?.lafal || null;
      const pemenggalan = detail.entri[0]?.pemenggalan || null;
      const sinonim = detail.tesaurus?.sinonim || [];
      const antonim = detail.tesaurus?.antonim || [];
      return { type: 'kamus-detail', indeks, semuaMakna, lafal, pemenggalan, sinonim, antonim };
    }

    // /tesaurus/cari/:kata — ambil detail tesaurus untuk kata tersebut
    if (decoded.startsWith('/tesaurus/cari/')) {
      const kata = decoded.replace('/tesaurus/cari/', '').trim();
      if (!kata) return null;
      const detail = await ambilDetailTesaurus(kata);
      if (!detail) return null;
      return { type: 'tesaurus-detail', kata: detail.indeks, sinonim: detail.sinonim || [], antonim: detail.antonim || [] };
    }

    // /tesaurus (tanpa parameter)
    if (decoded === '/tesaurus' || decoded === '/tesaurus/') {
      return null; // halaman statis, tidak perlu prefetch
    }

    // /glosarium/bidang/:bidang
    if (decoded.startsWith('/glosarium/bidang/')) {
      const bidang = decoded.replace('/glosarium/bidang/', '').trim();
      if (!bidang) return null;
      const bidangObj = await ModelGlosarium.resolveSlugBidang(bidang);
      const result = await ModelGlosarium.cari({
        bidangId: bidangObj?.id || null,
        bidang: bidangObj ? '' : bidang,
        limit: 3,
        hitungTotal: false,
      });
      const contoh = result.data?.slice(0, 3) || [];
      return {
        type: 'glosarium-bidang',
        bidang,
        bidangNama: bidangObj?.nama || contoh[0]?.bidang || bidang,
        total: result.total,
        contoh,
      };
    }

    // /glosarium/sumber/:sumber
    if (decoded.startsWith('/glosarium/sumber/')) {
      const sumber = decoded.replace('/glosarium/sumber/', '').trim();
      if (!sumber) return null;
      const result = await ModelGlosarium.cari({ sumber, limit: 3, hitungTotal: false });
      const contoh = result.data?.slice(0, 3) || [];
      return {
        type: 'glosarium-sumber',
        sumber,
        sumberNama: contoh[0]?.sumber || sumber,
        total: result.total,
        contoh,
      };
    }

    // /glosarium/cari/:kata
    if (decoded.startsWith('/glosarium/cari/')) {
      const kata = decoded.replace('/glosarium/cari/', '').trim();
      if (!kata) return null;
      const result = await ModelGlosarium.cari({ q: kata, limit: 3, hitungTotal: false });
      return { type: 'glosarium-cari', kata, total: result.total, contoh: result.data?.slice(0, 3) || [] };
    }

    // /glosarium/detail/:asing
    if (decoded.startsWith('/glosarium/detail/')) {
      const asing = decoded.replace('/glosarium/detail/', '').trim();
      if (!asing) return null;
      const detail = await ambilDetailGlosarium(asing, { limit: 1 });
      return {
        type: 'glosarium-detail',
        asing,
        persis: detail?.persis || [],
      };
    }

    // /kamus/cari/:kata — pencarian kamus
    if (decoded.startsWith('/kamus/cari/')) {
      const kata = decoded.replace('/kamus/cari/', '').trim();
      if (!kata) return null;
      // Cukup ambil detail singkat untuk deskripsi
      const detail = await ambilDetailKamus(kata);
      if (!detail || !detail.entri?.length) return null;
      const semuaMakna = [];
      for (const e of detail.entri) {
        if (e.makna) {
          for (const m of e.makna) {
            if (m.makna) semuaMakna.push({ makna: m.makna, kelas_kata: m.kelas_kata });
          }
        }
      }
      return { type: 'kamus-cari', kata, semuaMakna };
    }
  } catch (err) {
    logger.warn(`prefetchSsrData gagal untuk ${pathname}: ${err.message}`);
    return null;
  }

  return null;
}

function pasangFrontendRuntime(app, options = {}) {
  const loadRenderer = options.loadSsrRenderer || loadSsrRenderer;
  const prefetchData = options.prefetchSsrData || prefetchSsrData;
  const frontendDistDir = resolveFrontendDistDir();
  const frontendTemplatePath = getFrontendTemplatePath();

  if (!punyaFrontendBuild()) {
    logger.warn('Frontend build belum tersedia. Lewati pemasangan runtime frontend pada backend.');
    return;
  }

  app.use(express.static(frontendDistDir, {
    index: false,
    redirect: false,
    maxAge: '1h',
  }));

  app.get('*', async (req, res, next) => {
    try {
      if (isBypassPath(req.path) || isAssetRequest(req.path)) {
        return next();
      }

      const cacheControl = resolvePageCacheControl(req.path);

      const htmlTemplate = fs.readFileSync(frontendTemplatePath, 'utf8');

      if (!punyaSsrBundle()) {
        if (cacheControl) res.set('Cache-Control', cacheControl);
        return res.type('html').send(htmlTemplate);
      }

      const render = await loadRenderer();
      const prefetchedData = await prefetchData(req.path);
      const rendered = await render(req.originalUrl, prefetchedData);
      const appHtml = rendered?.appHtml || '';
      const headTags = rendered?.headTags || '';
      const statusCode = Number.isInteger(rendered?.statusCode) ? rendered.statusCode : 200;

      const withHead = injectHeadTags(htmlTemplate, headTags);
      const finalHtml = injectAppHtml(withHead, appHtml);
      if (cacheControl) res.set('Cache-Control', cacheControl);
      return res.status(statusCode).type('html').send(finalHtml);
    } catch (error) {
      logger.warn(`SSR runtime fallback ke template statis: ${error.message}`);
      try {
        const htmlTemplate = fs.readFileSync(frontendTemplatePath, 'utf8');
        const cacheControl = resolvePageCacheControl(req.path);
        if (cacheControl) res.set('Cache-Control', cacheControl);
        return res.type('html').send(htmlTemplate);
      } catch (templateError) {
        return next(templateError);
      }
    }
  });
}

module.exports = {
  pasangFrontendRuntime,
  __private: {
    backendRootDir,
    workspaceRootDir,
    frontendBuildCandidates,
    resolveFrontendDistDir,
    getFrontendTemplatePath,
    getFrontendServerEntryPath,
    punyaFrontendBuild,
    punyaSsrBundle,
    isAssetRequest,
    isBypassPath,
    isEjaanPagePath,
    isGramatikaPagePath,
    resolvePageCacheControl,
    stripReplaceableMeta,
    injectHeadTags,
    injectAppHtml,
    parseMarkdownFrontmatter,
    bersihkanTeksMarkdown,
    rapikanItemRingkasanDaftarIsi,
    extractMarkdownListSummary,
    truncateText,
    extractMarkdownSummary,
    listMarkdownDocumentPaths,
    buildMarkdownSlugMap,
    readStaticMarkdownDocument,
    loadSsrRenderer,
    validateRendererModule,
    prefetchSsrData,
  },
};
