/**
 * @fileoverview Runtime SSR untuk melayani frontend build + render HTML di server
 */

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const express = require('express');
const logger = require('../config/logger');

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
    || requestPath.startsWith('/share')
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
      const rendered = await render(req.originalUrl);
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
