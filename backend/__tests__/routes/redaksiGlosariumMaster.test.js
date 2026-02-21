/**
 * @fileoverview Test route master bidang/sumber glosarium redaksi
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/otorisasi', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../models/modelGlosarium', () => ({
  daftarMasterBidang: jest.fn(),
  ambilMasterBidangDenganId: jest.fn(),
  simpanMasterBidang: jest.fn(),
  hapusMasterBidang: jest.fn(),
  daftarMasterSumber: jest.fn(),
  ambilMasterSumberDenganId: jest.fn(),
  simpanMasterSumber: jest.fn(),
  hapusMasterSumber: jest.fn(),
}));

const router = require('../../routes/redaksi/glosarium');
const ModelGlosarium = require('../../models/modelGlosarium');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/glosarium', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/glosarium master', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /bidang-master mengembalikan data paginasi', async () => {
    ModelGlosarium.daftarMasterBidang.mockResolvedValue({
      data: [{ id: 1, kode: 'kimia', nama: 'Kimia' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/redaksi/glosarium/bidang-master?q=kim&limit=10&offset=0');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(ModelGlosarium.daftarMasterBidang).toHaveBeenCalled();
  });

  it('POST /bidang-master memvalidasi payload wajib', async () => {
    const response = await request(createApp())
      .post('/api/redaksi/glosarium/bidang-master')
      .send({ kode: '', nama: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /bidang-master/:id mengembalikan 409 saat masih dipakai', async () => {
    const error = new Error('Bidang masih dipakai');
    error.code = 'MASTER_IN_USE';
    ModelGlosarium.hapusMasterBidang.mockRejectedValue(error);

    const response = await request(createApp()).delete('/api/redaksi/glosarium/bidang-master/1');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('GET /sumber-master mengembalikan data paginasi', async () => {
    ModelGlosarium.daftarMasterSumber.mockResolvedValue({
      data: [{ id: 1, kode: 'kbbi', nama: 'KBBI' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/redaksi/glosarium/sumber-master?q=kb&limit=10&offset=0');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(ModelGlosarium.daftarMasterSumber).toHaveBeenCalled();
  });

  it('DELETE /sumber-master/:id mengembalikan 409 saat masih dipakai', async () => {
    const error = new Error('Sumber masih dipakai');
    error.code = 'MASTER_IN_USE';
    ModelGlosarium.hapusMasterSumber.mockRejectedValue(error);

    const response = await request(createApp()).delete('/api/redaksi/glosarium/sumber-master/1');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});
