/**
 * @fileoverview Test route redaksi akses pengguna
 * @tested_in backend/routes/redaksi/akses/pengguna.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../middleware/authorization', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../../models/akses/modelPengguna', () => ({
  daftarPengguna: jest.fn(),
  daftarPeran: jest.fn(),
  autocomplete: jest.fn(),
  ambilDenganId: jest.fn(),
  ubahPeran: jest.fn(),
  simpanPengguna: jest.fn(),
}));

const router = require('../../../../routes/redaksi/akses/pengguna');
const ModelPengguna = require('../../../../models/akses/modelPengguna');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/pengguna', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/akses/pengguna', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / meneruskan filter pengguna dan menangani error', async () => {
    ModelPengguna.daftarPengguna
      .mockResolvedValueOnce({ data: [{ id: 1 }], total: 1 })
      .mockResolvedValueOnce({ data: [], total: 0 })
      .mockRejectedValueOnce(new Error('list pengguna gagal'));

    const ok = await request(createApp()).get('/api/redaksi/pengguna?q=%20ivan%20&aktif=1&peran_id=2&limit=10&offset=5');
    const invalidFilter = await request(createApp()).get('/api/redaksi/pengguna?aktif=x&peran_id=0');
    const error = await request(createApp()).get('/api/redaksi/pengguna');

    expect(ok.status).toBe(200);
    expect(ModelPengguna.daftarPengguna).toHaveBeenNthCalledWith(1, {
      limit: 10,
      offset: 0,
      q: 'ivan',
      aktif: '1',
      peran_id: 2,
    });
    expect(invalidFilter.status).toBe(200);
    expect(ModelPengguna.daftarPengguna).toHaveBeenNthCalledWith(2, {
      limit: 50,
      offset: 0,
      q: '',
      aktif: '',
      peran_id: '',
    });
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('list pengguna gagal');
  });

  it('GET /peran dan /autocomplete mengembalikan data dan meneruskan error', async () => {
    ModelPengguna.daftarPeran
      .mockResolvedValueOnce([{ id: 1, kode: 'admin' }])
      .mockRejectedValueOnce(new Error('peran gagal'));
    ModelPengguna.autocomplete
      .mockResolvedValueOnce([{ id: 2, nama: 'Ivan' }])
      .mockRejectedValueOnce(new Error('autocomplete gagal'));

    const peranOk = await request(createApp()).get('/api/redaksi/pengguna/peran');
    const peranError = await request(createApp()).get('/api/redaksi/pengguna/peran');
    const autoOk = await request(createApp()).get('/api/redaksi/pengguna/autocomplete?q=%20iva%20');
    const autoError = await request(createApp()).get('/api/redaksi/pengguna/autocomplete?q=iva');

    expect(peranOk.status).toBe(200);
    expect(peranOk.body.data).toEqual([{ id: 1, kode: 'admin' }]);
    expect(peranError.status).toBe(500);
    expect(autoOk.status).toBe(200);
    expect(ModelPengguna.autocomplete).toHaveBeenNthCalledWith(1, 'iva');
    expect(autoError.status).toBe(500);
  });

  it('GET /:id menangani 404, sukses, id invalid, dan error', async () => {
    ModelPengguna.ambilDenganId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 4, nama: 'Ivan' })
      .mockRejectedValueOnce(new Error('detail pengguna gagal'));

    const invalidId = await request(createApp()).get('/api/redaksi/pengguna/abc');
    const notFound = await request(createApp()).get('/api/redaksi/pengguna/4');
    const ok = await request(createApp()).get('/api/redaksi/pengguna/4');
    const error = await request(createApp()).get('/api/redaksi/pengguna/4');

    expect(invalidId.status).toBe(404);
    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ok.body.data.id).toBe(4);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('detail pengguna gagal');
  });

  it('PATCH /:id/peran memvalidasi payload, menangani 404, sukses, dan error', async () => {
    ModelPengguna.ubahPeran
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 7, peran_id: 3 })
      .mockRejectedValueOnce(new Error('ubah peran gagal'));

    const invalid = await request(createApp())
      .patch('/api/redaksi/pengguna/7/peran')
      .send({ peran_id: '3' });
    const notFound = await request(createApp())
      .patch('/api/redaksi/pengguna/7/peran')
      .send({ peran_id: 3 });
    const ok = await request(createApp())
      .patch('/api/redaksi/pengguna/7/peran')
      .send({ peran_id: 3 });
    const error = await request(createApp())
      .patch('/api/redaksi/pengguna/7/peran')
      .send({ peran_id: 3 });

    expect(invalid.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ok.body.data).toEqual({ id: 7, peran_id: 3 });
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('ubah peran gagal');
  });

  it('PUT /:id menangani 404, sukses, dan error', async () => {
    ModelPengguna.simpanPengguna
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 8, nama: 'Baru' })
      .mockRejectedValueOnce(new Error('simpan pengguna gagal'));

    const notFound = await request(createApp())
      .put('/api/redaksi/pengguna/8')
      .send({ nama: 'Baru' });
    const ok = await request(createApp())
      .put('/api/redaksi/pengguna/8')
      .send({ nama: 'Baru', aktif: true });
    const error = await request(createApp())
      .put('/api/redaksi/pengguna/8')
      .send({ nama: 'Baru' });

    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ModelPengguna.simpanPengguna).toHaveBeenNthCalledWith(2, 8, { nama: 'Baru', aktif: true });
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('simpan pengguna gagal');
  });
});