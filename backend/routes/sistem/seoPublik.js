/**
 * @fileoverview Route root-level untuk file SEO publik (robots.txt & sitemap.xml)
 */

const express = require('express');
const {
  resolveSiteBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  generateSitemapPaths,
} = require('../../services/layananSeoPublik');

const router = express.Router();

router.get('/robots.txt', (req, res) => {
  const baseUrl = resolveSiteBaseUrl(req);
  const text = buildRobotsTxt(baseUrl);

  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  return res.send(text);
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const baseUrl = resolveSiteBaseUrl(req);
    const paths = await generateSitemapPaths();
    const xml = buildSitemapXml(baseUrl, paths);

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(xml);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
