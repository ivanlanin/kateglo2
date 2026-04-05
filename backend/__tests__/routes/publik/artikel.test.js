/**
 * @fileoverview Test route publik artikel
 * @tested_in backend/routes/publik/artikel.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../models/artikel/modelArtikel', () => ({
  ambilTopikPublik: jest.fn(),
}));

jest.mock('../../../services/publik/layananArtikelPublik', () => ({
  ambilDaftarArtikelPublik: jest.fn(),
  ambilDetailArtikelPublik: jest.fn(),
}));

const router = require('../../../routes/publik/artikel');
const ModelArtikel = require('../../../models/artikel/modelArtikel');
const { ambilDaftarArtikelPublik, ambilDetailArtikelPublik } = require('../../../services/publik/layananArtikelPublik');

function ambilDetailHandler() {
  return router.stack.find((layer) => layer.route?.path === '/:slug').route.stack[0].handle;
}

function createApp() {
  const app = express();
  app.use('/api/publik/artikel', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/publik/artikel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelArtikel.ambilTopikPublik.mockResolvedValue([{ topik: 'bahasa', jumlah: 2 }]);
    ambilDaftarArtikelPublik.mockResolvedValue({ total: 1, data: [{ slug: 'artikel-satu' }] });
    ambilDetailArtikelPublik.mockResolvedValue({ slug: 'artikel-satu', judul: 'Artikel Satu' });
  });

  it('helper private setCacheHeaders menormalkan nilai', () => {
    const res = { set: jest.fn() };

    router.__private.setCacheHeaders(res, -1, -5);
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=0, stale-while-revalidate=0');

    router.__private.setCacheHeaders(res);
    expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
  });

  it('GET /topik mengambil daftar topik dari model', async () => {
    const response = await request(createApp()).get('/api/publik/artikel/topik');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ topik: 'bahasa', jumlah: 2 }]);
  });

  it('GET /topik meneruskan error model ke middleware', async () => {
    ModelArtikel.ambilTopikPublik.mockRejectedValueOnce(new Error('topik gagal'));

    const response = await request(createApp()).get('/api/publik/artikel/topik');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('topik gagal');
  });

  it('GET / memakai layanan cache artikel dan mengirim cache-control', async () => {
    const response = await request(createApp()).get('/api/publik/artikel?topik=bahasa&q=tes');

    expect(response.status).toBe(200);
    expect(ambilDaftarArtikelPublik).toHaveBeenCalledWith({
      topik: ['bahasa'],
      q: 'tes',
      limit: 20,
      offset: 0,
    });
    expect(response.headers['cache-control']).toBe('public, max-age=120, stale-while-revalidate=600');
  });

  it('GET / menangani topik array dan q kosong', async () => {
    const response = await request(createApp()).get('/api/publik/artikel?topik=bahasa&topik=sastra&limit=5');

    expect(response.status).toBe(200);
    expect(ambilDaftarArtikelPublik).toHaveBeenCalledWith({
      topik: ['bahasa', 'sastra'],
      q: undefined,
      limit: 5,
      offset: 0,
    });
  });

  it('GET / meneruskan error layanan daftar', async () => {
    ambilDaftarArtikelPublik.mockRejectedValueOnce(new Error('daftar artikel gagal'));

    const response = await request(createApp()).get('/api/publik/artikel?q=tes');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('daftar artikel gagal');
  });

  it('GET /:slug memakai layanan cache artikel dan mengirim 404 saat kosong', async () => {
    const okResponse = await request(createApp()).get('/api/publik/artikel/artikel-satu');
    expect(okResponse.status).toBe(200);
    expect(okResponse.headers['cache-control']).toBe('public, max-age=120, stale-while-revalidate=600');

    ambilDetailArtikelPublik.mockResolvedValueOnce(null);
    const notFound = await request(createApp()).get('/api/publik/artikel/hilang');
    expect(notFound.status).toBe(404);
  });

  it('GET /:slug mengembalikan 400 untuk slug kosong dan meneruskan error layanan detail', async () => {
    const blank = await request(createApp()).get('/api/publik/artikel/%20');
    ambilDetailArtikelPublik.mockRejectedValueOnce(new Error('detail artikel gagal'));
    const error = await request(createApp()).get('/api/publik/artikel/artikel-gagal');

    expect(blank.status).toBe(400);
    expect(blank.body.message).toBe('Slug diperlukan');
    expect(error.status).toBe(500);
    expect(error.body.error).toBe('detail artikel gagal');
  });

  it('GET /:slug men-trim slug normal sebelum meneruskan ke layanan', async () => {
    await request(createApp()).get('/api/publik/artikel/%20artikel-satu%20');

    expect(ambilDetailArtikelPublik).toHaveBeenCalledWith('artikel-satu');
  });

  it('handler detail artikel menangani slug yang benar-benar tidak ada di params', async () => {
    const req = { params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await ambilDetailHandler()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Slug diperlukan' });
    expect(next).not.toHaveBeenCalled();
  });
});