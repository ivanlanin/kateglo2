/**
 * @fileoverview Route root-level untuk file SEO publik (robots.txt & sitemap.xml)
 */

const express = require('express');
const {
  resolveSiteBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  generateSitemapPaths,
  renderOgImagePng,
} = require('../../services/publik/layananSeoPublik');

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

function kirimOgImage(section, slug, req, res, next) {
  try {
    const imageBuffer = renderOgImagePng({
      section,
      slug,
      title: req.query.title,
      context: req.query.context,
    });

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(imageBuffer);
  } catch (error) {
    return next(error);
  }
}

router.get('/og/default.png', (req, res, next) => kirimOgImage('default', '', req, res, next));
router.get('/og/:section/:slug.png', (req, res, next) => kirimOgImage(req.params.section, req.params.slug, req, res, next));
router.get('/og/:section.png', (req, res, next) => kirimOgImage(req.params.section, '', req, res, next));

module.exports = router;
