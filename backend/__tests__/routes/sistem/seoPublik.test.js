/**
 * @fileoverview Test routes SEO publik
 * @tested_in backend/routes/sistem/seoPublik.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../services/publik/layananSeoPublik', () => ({
  resolveSiteBaseUrl: jest.fn(),
  buildRobotsTxt: jest.fn(),
  buildSitemapXml: jest.fn(),
  generateSitemapPaths: jest.fn(),
  renderOgImagePng: jest.fn(),
}));

const layananSeoPublik = require('../../../services/publik/layananSeoPublik');
const seoPublikRouter = require('../../../routes/sistem/seoPublik');

function createApp() {
  const app = express();
  app.use('/', seoPublikRouter);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/sistem/seoPublik', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    layananSeoPublik.resolveSiteBaseUrl.mockReturnValue('https://kateglo.org');
  });

  it('GET /robots.txt mengembalikan text robots dengan header cache', async () => {
    layananSeoPublik.buildRobotsTxt.mockReturnValue('User-agent: *\nAllow: /\n');

    const response = await request(createApp()).get('/robots.txt');

    expect(response.status).toBe(200);
    expect(layananSeoPublik.resolveSiteBaseUrl).toHaveBeenCalledTimes(1);
    expect(layananSeoPublik.buildRobotsTxt).toHaveBeenCalledWith('https://kateglo.org');
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.headers['cache-control']).toBe('public, max-age=3600');
    expect(response.text).toContain('User-agent: *');
  });

  it('GET /sitemap.xml mengembalikan xml sitemap dengan header cache', async () => {
    layananSeoPublik.generateSitemapPaths.mockResolvedValue(['/kamus', '/glosarium']);
    layananSeoPublik.buildSitemapXml.mockReturnValue('<?xml version="1.0"?><urlset></urlset>');

    const response = await request(createApp()).get('/sitemap.xml');

    expect(response.status).toBe(200);
    expect(layananSeoPublik.resolveSiteBaseUrl).toHaveBeenCalledTimes(1);
    expect(layananSeoPublik.generateSitemapPaths).toHaveBeenCalledTimes(1);
    expect(layananSeoPublik.buildSitemapXml).toHaveBeenCalledWith('https://kateglo.org', ['/kamus', '/glosarium']);
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.headers['cache-control']).toBe('public, max-age=3600');
    expect(response.text).toContain('<urlset>');
  });

  it('GET /sitemap.xml meneruskan error ke middleware', async () => {
    layananSeoPublik.generateSitemapPaths.mockRejectedValue(new Error('gagal generate sitemap'));

    const response = await request(createApp()).get('/sitemap.xml');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'gagal generate sitemap' });
  });

  it('GET /og/gramatika/preposisi.png mengembalikan png dinamis dengan header cache', async () => {
    layananSeoPublik.renderOgImagePng.mockReturnValue(Buffer.from('png-binary'));

    const response = await request(createApp()).get('/og/gramatika/preposisi.png?title=Preposisi&context=Kata%20Tugas');

    expect(response.status).toBe(200);
    expect(layananSeoPublik.renderOgImagePng).toHaveBeenCalledWith({
      section: 'gramatika',
      slug: 'preposisi',
      title: 'Preposisi',
      context: 'Kata Tugas',
      stripRepeatedTitle: false,
    });
    expect(response.headers['content-type']).toContain('image/png');
    expect(response.headers['cache-control']).toBe('public, max-age=86400');
  });

  it('GET /og/default.png meneruskan error render ke middleware', async () => {
    layananSeoPublik.renderOgImagePng.mockImplementation(() => {
      throw new Error('gagal render og');
    });

    const response = await request(createApp()).get('/og/default.png');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'gagal render og' });
  });

  it('GET /og/kamus.png mengirim og image tanpa slug', async () => {
    layananSeoPublik.renderOgImagePng.mockReturnValue(Buffer.from('png-section'));

    const response = await request(createApp()).get('/og/kamus.png?title=Kamus');

    expect(response.status).toBe(200);
    expect(layananSeoPublik.renderOgImagePng).toHaveBeenCalledWith({
      section: 'kamus',
      slug: '',
      title: 'Kamus',
      context: undefined,
      stripRepeatedTitle: false,
    });
    expect(response.headers['content-type']).toContain('image/png');
  });
});
