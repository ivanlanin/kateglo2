/**
 * @fileoverview Test route share preview
 * @tested_in backend/routes/share.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../models/modelLabel', () => ({
  cariEntriPerLabel: jest.fn(),
}));

jest.mock('../../services/layananKamusPublik', () => ({
  ambilDetailKamus: jest.fn(),
}));

jest.mock('../../services/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  getTtlSeconds: jest.fn(() => 900),
}));

const ModelLabel = require('../../models/modelLabel');
const { ambilDetailKamus } = require('../../services/layananKamusPublik');
const { getJson, setJson } = require('../../services/layananCache');
const shareRouter = require('../../routes/share');
const { __private } = require('../../routes/share');

function createApp() {
  const app = express();
  app.use('/share', shareRouter);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PUBLIC_SITE_URL = 'https://kateglo.org';
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
  });

  afterAll(() => {
    delete process.env.PUBLIC_SITE_URL;
  });

  it('GET /share/kamus/detail/:indeks mengembalikan HTML preview dinamis', async () => {
    ambilDetailKamus.mockResolvedValue({
      indeks: 'kata',
      entri: [
        {
          entri: 'kata',
          makna: [{ makna: 'unsur bahasa yang diucapkan atau dituliskan' }],
        },
      ],
    });

    const response = await request(createApp()).get('/share/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['cache-control']).toContain('s-maxage=900');
    expect(response.text).toContain('<meta property="og:title" content="kata - Kateglo" />');
    expect(response.text).toContain('https://kateglo.org/kamus/detail/kata');
  });

  it('GET /share/:section mengembalikan preview untuk path menu dasar', async () => {
    const kamus = await request(createApp()).get('/share/kamus');
    const tesaurus = await request(createApp()).get('/share/tesaurus');
    const glosarium = await request(createApp()).get('/share/glosarium');

    expect(kamus.status).toBe(200);
    expect(tesaurus.status).toBe(200);
    expect(glosarium.status).toBe(200);

    expect(kamus.text).toContain('<meta property="og:title" content="Kamus - Kateglo" />');
    expect(tesaurus.text).toContain('<meta property="og:title" content="Tesaurus - Kateglo" />');
    expect(glosarium.text).toContain('<meta property="og:title" content="Glosarium - Kateglo" />');
  });

  it('GET /share/kamus/:kategori/:kode mengembalikan HTML preview kategori', async () => {
    ModelLabel.cariEntriPerLabel.mockResolvedValue({
      total: 25,
      label: { nama: 'nomina' },
    });

    const response = await request(createApp()).get('/share/kamus/kelas-kata/nomina');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<meta property="og:title" content="Kamus Kelas Kata: nomina - Kateglo" />');
    expect(response.text).toContain('25 entri ditemukan untuk kategori nomina.');
  });

  it('GET /share/kamus/detail/:indeks memakai cache jika tersedia', async () => {
    getJson.mockResolvedValue({ html: '<html><body>cached</body></html>' });

    const response = await request(createApp()).get('/share/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.text).toContain('cached');
    expect(ambilDetailKamus).not.toHaveBeenCalled();
  });

  it('GET /share/:section memakai cache menu jika tersedia', async () => {
    getJson.mockResolvedValue({ html: '<html><body>cached-menu</body></html>' });

    const response = await request(createApp()).get('/share/tesaurus');

    expect(response.status).toBe(200);
    expect(response.text).toContain('cached-menu');
    expect(setJson).not.toHaveBeenCalled();
  });

  it('GET /share/kamus/detail/:indeks fallback metadata saat detail tidak ditemukan', async () => {
    ambilDetailKamus.mockResolvedValue(null);

    const response = await request(createApp()).get('/share/kamus/detail/kosong');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<meta property="og:title" content="Kateglo" />');
    expect(response.text).toContain('Kamus, Tesaurus, dan Glosarium Bahasa Indonesia');
  });

  it('GET /share/kamus/detail/:indeks memakai deskripsi fallback saat makna kosong', async () => {
    ambilDetailKamus.mockResolvedValue({
      indeks: 'kata',
      entri: [{ entri: 'kata', makna: [] }],
    });

    const response = await request(createApp()).get('/share/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Lihat entri kamus kata di Kateglo.');
  });

  it('GET /share/kamus/detail/:indeks memangkas deskripsi sangat panjang', async () => {
    ambilDetailKamus.mockResolvedValue({
      indeks: 'panjang',
      entri: [{ entri: 'panjang', makna: [{ makna: 'x'.repeat(400) }] }],
    });

    const response = await request(createApp()).get('/share/kamus/detail/panjang');

    expect(response.status).toBe(200);
    expect(response.text).toContain('…');
  });

  it('GET /share/kamus/:kategori/:kode aman untuk parameter yang gagal decode', async () => {
    ModelLabel.cariEntriPerLabel.mockResolvedValue({ total: 0, label: null });

    const response = await request(createApp()).get('/share/kamus/%25E0%25A4%25A/x');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<meta property="og:title" content="Kamus Kategori: x - Kateglo" />');
  });

  it('GET /share/kamus/:kategori/:kode memakai deskripsi fallback saat total 0', async () => {
    ModelLabel.cariEntriPerLabel.mockResolvedValue({ total: 0, label: { nama: 'nomina' } });

    const response = await request(createApp()).get('/share/kamus/kelas-kata/nomina');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Daftar entri kamus untuk kategori nomina.');
  });

  it('GET /share/kamus/detail/:indeks meneruskan error builder ke middleware', async () => {
    ambilDetailKamus.mockRejectedValue(new Error('detail share gagal'));

    const response = await request(createApp()).get('/share/kamus/detail/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail share gagal');
  });

  it('GET /share/:section meneruskan error cache ke middleware', async () => {
    getJson.mockRejectedValue(new Error('cache menu gagal'));

    const response = await request(createApp()).get('/share/kamus');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cache menu gagal');
  });

  it('GET /share/kamus/:kategori/:kode meneruskan error model ke middleware', async () => {
    ModelLabel.cariEntriPerLabel.mockRejectedValue(new Error('kategori gagal')); 

    const response = await request(createApp()).get('/share/kamus/ragam/cak');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('kategori gagal');
  });

  it('helper private share menutup semua branch utilitas', async () => {
    process.env.PUBLIC_SITE_URL = 'https://contoh.org///';
    delete process.env.PUBLIC_SITE_URL;
    expect(__private.getSiteBaseUrl()).toBe('https://kateglo.org');
    process.env.PUBLIC_SITE_URL = 'https://contoh.org///';
    expect(__private.sanitizeBaseUrl()).toBe('https://kateglo.org');
    expect(__private.sanitizeBaseUrl('https://abc.com///')).toBe('https://abc.com');
    expect(__private.sanitizeBaseUrl('')).toBe('https://kateglo.org');
    expect(__private.getSiteBaseUrl()).toBe('https://contoh.org');
    expect(__private.getCacheControlHeader()).toContain('s-maxage=900');

    expect(__private.escapeHtml()).toBe('');
    expect(__private.escapeHtml(`<a>&"'</a>`)).toContain('&lt;a&gt;&amp;&quot;&#39;&lt;/a&gt;');
    expect(__private.safeDecode()).toBe('');
    expect(__private.safeDecode('kata%20dasar')).toBe('kata dasar');
    expect(__private.safeDecode('%E0%A4%A')).toBe('%E0%A4%A');
    expect(__private.ringkasTeks()).toBe('');
    expect(__private.ringkasTeks('  kata   dasar  ', 99)).toBe('kata dasar');
    expect(__private.ringkasTeks('x'.repeat(40), 10)).toMatch(/…$/);

    const html = __private.renderHtmlPreview({
      title: '',
      description: '',
      canonicalUrl: 'https://a.test/x',
      imageUrl: 'https://a.test/i.png',
      redirectUrl: 'https://a.test/x',
    });
    expect(html).toContain('<title>Kateglo</title>');
    expect(html).toContain('Kamus, Tesaurus, dan Glosarium Bahasa Indonesia');

    expect(__private.buatJudulKategori('ragam', 'cakapan')).toBe('Kamus Ragam: cakapan - Kateglo');
    expect(__private.buatJudulKategori('asing', '')).toBe('Kamus Kategori: asing - Kateglo');
    expect(__private.buatJudulKategori()).toBe('Kamus Kategori:  - Kateglo');

    const mdKamus = __private.buildBaseSectionMetadata('kamus');
    const mdDefault = __private.buildBaseSectionMetadata();
    const mdUnknown = __private.buildBaseSectionMetadata('lain');
    expect(mdKamus.title).toBe('Kamus - Kateglo');
    expect(mdDefault.title).toBe('Kateglo');
    expect(mdUnknown.title).toBe('Kateglo');

    getJson.mockResolvedValueOnce({ html: '<html>cache</html>' });
    const fromCache = await __private.ambilAtauSetCacheHtml('x', async () => '<html>baru</html>');
    expect(fromCache).toBe('<html>cache</html>');

    getJson.mockResolvedValueOnce(null);
    setJson.mockResolvedValueOnce(undefined);
    const built = await __private.ambilAtauSetCacheHtml('y', async () => '<html>baru</html>');
    expect(built).toBe('<html>baru</html>');
    expect(setJson).toHaveBeenCalledWith('y', { html: '<html>baru</html>' }, 900);
  });

  it('GET /share/kamus/detail/:indeks menangani indeks kosong setelah decode', async () => {
    const response = await request(createApp()).get('/share/kamus/detail/%20');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<meta property="og:title" content="Kateglo" />');
  });

  it('GET /share/kamus/:kategori/:kode menangani kategori/kode kosong setelah decode', async () => {
    const response = await request(createApp()).get('/share/kamus/%20/%20');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Daftar entri kamus untuk kategori .');
  });
});
