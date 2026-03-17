/**
 * @fileoverview Test route publik tagar
 * @tested_in backend/routes/publik/tagar.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../models/modelTagar', () => ({
  ambilSemuaTagar: jest.fn(),
  cariEntriPerTagar: jest.fn(),
}));

const router = require('../../routes/publik/tagar');
const ModelTagar = require('../../models/modelTagar');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/publik/tagar', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/publik/tagar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / mengembalikan daftar tagar', async () => {
    ModelTagar.ambilSemuaTagar.mockResolvedValue([{ id: 1, kode: 'pref' }]);

    const response = await request(createApp()).get('/api/publik/tagar');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [{ id: 1, kode: 'pref' }] });
  });

  it('GET / meneruskan error', async () => {
    ModelTagar.ambilSemuaTagar.mockRejectedValue(new Error('list gagal'));

    const response = await request(createApp()).get('/api/publik/tagar');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list gagal');
  });

  it('GET /:kode validasi kode, 404 saat tagar null, dan sukses payload paginasi', async () => {
    const bad = await request(createApp()).get('/api/publik/tagar/%20%20');
    expect(bad.status).toBe(400);

    ModelTagar.cariEntriPerTagar.mockResolvedValueOnce({ tagar: null, total: 0, data: [] });
    const notFound = await request(createApp()).get('/api/publik/tagar/pref');
    expect(notFound.status).toBe(404);

    ModelTagar.cariEntriPerTagar.mockResolvedValueOnce({
      tagar: { id: 1, kode: 'pref', nama: 'Prefiks' },
      total: 2,
      data: [{ id: 11, entri: 'mengajar' }],
      hasPrev: true,
      hasNext: false,
      prevCursor: 'p1',
      nextCursor: null,
    });
    const success = await request(createApp()).get('/api/publik/tagar/pref?limit=55&cursor=abc&direction=prev&lastPage=1');

    expect(success.status).toBe(200);
    expect(ModelTagar.cariEntriPerTagar).toHaveBeenLastCalledWith('pref', expect.objectContaining({
      limit: 55,
      cursor: 'abc',
      direction: 'prev',
      lastPage: true,
      hitungTotal: true,
    }));
    expect(success.body.pageInfo).toEqual({ hasPrev: true, hasNext: false, prevCursor: 'p1', nextCursor: null });

    ModelTagar.cariEntriPerTagar.mockResolvedValueOnce({
      tagar: { id: 1, kode: 'pref', nama: 'Prefiks' },
      total: 1,
      data: [],
      hasPrev: false,
      hasNext: true,
      prevCursor: '',
      nextCursor: 'n1',
    });
    const cursorFallback = await request(createApp()).get('/api/publik/tagar/pref');
    expect(cursorFallback.status).toBe(200);
    expect(cursorFallback.body.pageInfo.prevCursor).toBeNull();
    expect(cursorFallback.body.pageInfo.nextCursor).toBe('n1');
  });

  it('handler :kode memvalidasi fallback params.kode kosong (langsung panggil handler)', async () => {
    const layer = router.stack.find((item) => item.route && item.route.path === '/:kode');
    const handler = layer.route.stack[0].handle;

    const req = { params: {}, query: {} };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    const next = jest.fn();

    await handler(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Kode tagar wajib diisi' });
  });

  it('GET /:kode meneruskan error', async () => {
    ModelTagar.cariEntriPerTagar.mockRejectedValue(new Error('detail gagal'));

    const response = await request(createApp()).get('/api/publik/tagar/pref');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail gagal');
  });
});
