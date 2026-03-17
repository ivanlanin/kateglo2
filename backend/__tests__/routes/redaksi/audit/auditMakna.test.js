/**
 * @fileoverview Test route redaksi audit makna
 * @tested_in backend/routes/redaksi/auditMakna.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/otorisasi', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../models/modelAuditMakna', () => ({
  daftarAdmin: jest.fn(),
  simpanStatus: jest.fn(),
}));

const router = require('../../routes/redaksi/auditMakna');
const ModelAuditMakna = require('../../models/modelAuditMakna');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/audit-makna', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/auditMakna', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / mengembalikan data paginasi dan menormalisasi status', async () => {
    ModelAuditMakna.daftarAdmin.mockResolvedValue({
      data: [{ id: 1, status: 'tinjau' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/redaksi/audit-makna?limit=10&offset=2&q= kata &status=SALAH');

    expect(response.status).toBe(200);
    expect(ModelAuditMakna.daftarAdmin).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      q: 'kata',
      status: 'salah',
    });
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(1);
  });

  it('GET / mengosongkan status invalid', async () => {
    ModelAuditMakna.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp()).get('/api/redaksi/audit-makna?status=invalid');

    expect(response.status).toBe(200);
    expect(ModelAuditMakna.daftarAdmin).toHaveBeenCalledWith({
      limit: 50,
      offset: 0,
      q: '',
      status: '',
    });
  });

  it('GET / meneruskan error', async () => {
    ModelAuditMakna.daftarAdmin.mockRejectedValue(new Error('audit gagal'));

    const response = await request(createApp()).get('/api/redaksi/audit-makna');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('audit gagal');
  });

  it('PUT /:id mengembalikan 400 untuk status invalid', async () => {
    const response = await request(createApp())
      .put('/api/redaksi/audit-makna/10')
      .send({ status: 'x', catatan: 'c' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Status tidak valid');
    expect(ModelAuditMakna.simpanStatus).not.toHaveBeenCalled();
  });

  it('PUT /:id mengembalikan 404 jika data tidak ditemukan', async () => {
    ModelAuditMakna.simpanStatus.mockResolvedValue(null);

    const response = await request(createApp())
      .put('/api/redaksi/audit-makna/10')
      .send({ status: 'tambah', catatan: 'uji' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Data audit tidak ditemukan');
  });

  it('PUT /:id mengembalikan data jika berhasil', async () => {
    ModelAuditMakna.simpanStatus.mockResolvedValue({ id: 10, status: 'nama', catatan: '' });

    const response = await request(createApp())
      .put('/api/redaksi/audit-makna/10')
      .send({ status: 'NAMA', catatan: '  ' });

    expect(response.status).toBe(200);
    expect(ModelAuditMakna.simpanStatus).toHaveBeenCalledWith({
      id: 10,
      status: 'nama',
      catatan: '',
    });
    expect(response.body.success).toBe(true);
  });

  it('PUT /:id meneruskan error', async () => {
    ModelAuditMakna.simpanStatus.mockRejectedValue(new Error('simpan audit gagal'));

    const response = await request(createApp())
      .put('/api/redaksi/audit-makna/10')
      .send({ status: 'salah', catatan: 'uji' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan audit gagal');
  });
});
