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

  it('GET /:slug memakai layanan cache artikel dan mengirim 404 saat kosong', async () => {
    const okResponse = await request(createApp()).get('/api/publik/artikel/artikel-satu');
    expect(okResponse.status).toBe(200);
    expect(okResponse.headers['cache-control']).toBe('public, max-age=120, stale-while-revalidate=600');

    ambilDetailArtikelPublik.mockResolvedValueOnce(null);
    const notFound = await request(createApp()).get('/api/publik/artikel/hilang');
    expect(notFound.status).toBe(404);
  });
});