/**
 * @fileoverview Runtime SSR untuk melayani frontend build + render HTML di server
 */

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const express = require('express');
const logger = require('../config/logger');
const { ambilDetailKamus } = require('./layananKamusPublik');
const { ambilDetailTesaurus } = require('./layananTesaurusPublik');
const ModelGlosarium = require('../models/modelGlosarium');

const rootDir = path.resolve(__dirname, '..', '..');
const frontendDistDir = path.join(rootDir, 'frontend', 'dist');
const frontendTemplatePath = path.join(frontendDistDir, 'index.html');
const frontendServerEntryPath = path.join(frontendDistDir, 'server', 'entry-server.js');

function punyaFrontendBuild() {
  return fs.existsSync(frontendTemplatePath);
}

function punyaSsrBundle() {
  return fs.existsSync(frontendServerEntryPath);
}

function isAssetRequest(requestPath = '') {
  return /\.[a-zA-Z0-9]+$/.test(requestPath);
}

function isBypassPath(requestPath = '') {
  return requestPath.startsWith('/api')
    || requestPath.startsWith('/auth/google')
    || requestPath.startsWith('/health');
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

async function loadSsrRenderer() {
  const moduleUrl = pathToFileURL(frontendServerEntryPath).href;
  const ssrModule = await import(moduleUrl);
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
      return { type: 'tesaurus-detail', kata: detail.lema, sinonim: detail.sinonim || [], antonim: detail.antonim || [] };
    }

    // /tesaurus (tanpa parameter)
    if (decoded === '/tesaurus' || decoded === '/tesaurus/') {
      return null; // halaman statis, tidak perlu prefetch
    }

    // /glosarium/bidang/:bidang
    if (decoded.startsWith('/glosarium/bidang/')) {
      const bidang = decoded.replace('/glosarium/bidang/', '').trim();
      if (!bidang) return null;
      const result = await ModelGlosarium.cari({ bidang, limit: 3 });
      return { type: 'glosarium-bidang', bidang, total: result.total, contoh: result.data?.slice(0, 3) || [] };
    }

    // /glosarium/sumber/:sumber
    if (decoded.startsWith('/glosarium/sumber/')) {
      const sumber = decoded.replace('/glosarium/sumber/', '').trim();
      if (!sumber) return null;
      const result = await ModelGlosarium.cari({ sumber, limit: 3 });
      return { type: 'glosarium-sumber', sumber, total: result.total, contoh: result.data?.slice(0, 3) || [] };
    }

    // /glosarium/cari/:kata
    if (decoded.startsWith('/glosarium/cari/')) {
      const kata = decoded.replace('/glosarium/cari/', '').trim();
      if (!kata) return null;
      const result = await ModelGlosarium.cari({ q: kata, limit: 3 });
      return { type: 'glosarium-cari', kata, total: result.total, contoh: result.data?.slice(0, 3) || [] };
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

function pasangFrontendRuntime(app) {
  if (!punyaFrontendBuild()) {
    logger.warn('Frontend build belum tersedia. Lewati pemasangan runtime frontend pada backend.');
    return;
  }

  app.use(express.static(frontendDistDir, {
    index: false,
    maxAge: '1h',
  }));

  app.get('*', async (req, res, next) => {
    try {
      if (isBypassPath(req.path) || isAssetRequest(req.path)) {
        return next();
      }

      const htmlTemplate = fs.readFileSync(frontendTemplatePath, 'utf8');

      if (!punyaSsrBundle()) {
        return res.type('html').send(htmlTemplate);
      }

      const render = await loadSsrRenderer();
      const prefetchedData = await prefetchSsrData(req.path);
      const rendered = await render(req.originalUrl, prefetchedData);
      const appHtml = rendered?.appHtml || '';
      const headTags = rendered?.headTags || '';

      const withHead = injectHeadTags(htmlTemplate, headTags);
      const finalHtml = injectAppHtml(withHead, appHtml);
      return res.type('html').send(finalHtml);
    } catch (error) {
      logger.warn(`SSR runtime fallback ke template statis: ${error.message}`);
      try {
        const htmlTemplate = fs.readFileSync(frontendTemplatePath, 'utf8');
        return res.type('html').send(htmlTemplate);
      } catch (templateError) {
        return next(templateError);
      }
    }
  });
}

module.exports = {
  pasangFrontendRuntime,
};
