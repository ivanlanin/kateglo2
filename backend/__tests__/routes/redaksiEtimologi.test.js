/**
 * @fileoverview Test route redaksi etimologi
 * @tested_in backend/routes/redaksi/etimologi.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/otorisasi', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../models/modelEtimologi', () => ({
  cariEntriUntukTautan: jest.fn(),
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
}));

const router = require('../../routes/redaksi/etimologi');
const ModelEtimologi = require('../../models/modelEtimologi');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/etimologi', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/etimologi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /opsi-entri mengembalikan kosong saat q tidak ada', async () => {
    const response = await request(createApp()).get('/api/redaksi/etimologi/opsi-entri?q=   ');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [] });
    expect(ModelEtimologi.cariEntriUntukTautan).not.toHaveBeenCalled();
  });

  it('GET /opsi-entri meneruskan q ter-trim dan clamp limit', async () => {
    ModelEtimologi.cariEntriUntukTautan.mockResolvedValue([{ id: 1, entri: 'kata' }]);

    const response = await request(createApp()).get('/api/redaksi/etimologi/opsi-entri?q=%20kata%20&limit=99');

    expect(response.status).toBe(200);
    expect(ModelEtimologi.cariEntriUntukTautan).toHaveBeenCalledWith('kata', { limit: 20 });
    expect(response.body.data).toEqual([{ id: 1, entri: 'kata' }]);
  });

  it('GET /opsi-entri meneruskan error', async () => {
    ModelEtimologi.cariEntriUntukTautan.mockRejectedValue(new Error('opsi gagal'));

    const response = await request(createApp()).get('/api/redaksi/etimologi/opsi-entri?q=kata');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('opsi gagal');
  });

  it('GET / mengembalikan paginasi list', async () => {
    ModelEtimologi.daftarAdmin.mockResolvedValue({ data: [{ id: 2 }], total: 3 });

    const response = await request(createApp()).get('/api/redaksi/etimologi?q=%20serap%20&limit=10&offset=0');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(3);
    expect(ModelEtimologi.daftarAdmin).toHaveBeenCalledWith({ limit: 10, offset: 0, q: 'serap' });
  });

  it('GET / meneruskan error', async () => {
    ModelEtimologi.daftarAdmin.mockRejectedValue(new Error('list gagal'));

    const response = await request(createApp()).get('/api/redaksi/etimologi');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list gagal');
  });

  it('GET /:id mengembalikan 404 dan 200', async () => {
    ModelEtimologi.ambilDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 4, indeks: 'kata' });

    const notFound = await request(createApp()).get('/api/redaksi/etimologi/4');
    const success = await request(createApp()).get('/api/redaksi/etimologi/4');

    expect(notFound.status).toBe(404);
    expect(notFound.body.message).toBe('Etimologi tidak ditemukan');
    expect(success.status).toBe(200);
    expect(success.body.data).toEqual({ id: 4, indeks: 'kata' });
  });

  it('GET /:id meneruskan error', async () => {
    ModelEtimologi.ambilDenganId.mockRejectedValue(new Error('detail gagal'));

    const response = await request(createApp()).get('/api/redaksi/etimologi/8');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail gagal');
  });

  it('POST / memvalidasi indeks wajib', async () => {
    const response = await request(createApp())
      .post('/api/redaksi/etimologi')
      .send({ indeks: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Indeks wajib diisi');
  });

  it('POST / memvalidasi entri_id tidak valid', async () => {
    const response = await request(createApp())
      .post('/api/redaksi/etimologi')
      .send({ indeks: 'kata', entri_id: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('entri_id tidak valid');
  });

  it('POST / memakai sumber default dan entri_id null', async () => {
    ModelEtimologi.simpan.mockResolvedValue({ id: 11, indeks: 'kata' });

    const response = await request(createApp())
      .post('/api/redaksi/etimologi')
      .send({ indeks: ' kata ', entri_id: '' });

    expect(response.status).toBe(201);
    expect(ModelEtimologi.simpan).toHaveBeenCalledWith(expect.objectContaining({
      indeks: 'kata',
      sumber: 'LWIM',
      entri_id: null,
    }));
  });

  it('POST / meneruskan sumber ter-trim saat tersedia', async () => {
    ModelEtimologi.simpan.mockResolvedValue({ id: 12, indeks: 'serapan' });

    const response = await request(createApp())
      .post('/api/redaksi/etimologi')
      .send({ indeks: 'serapan', sumber: '  KBBI  ', entri_id: 3 });

    expect(response.status).toBe(201);
    expect(ModelEtimologi.simpan).toHaveBeenCalledWith(expect.objectContaining({
      sumber: 'KBBI',
      entri_id: 3,
    }));
  });

  it('POST / meneruskan error', async () => {
    ModelEtimologi.simpan.mockRejectedValue(new Error('simpan gagal'));

    const response = await request(createApp())
      .post('/api/redaksi/etimologi')
      .send({ indeks: 'kata' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan gagal');
  });

  it('PUT /:id memvalidasi indeks wajib', async () => {
    const response = await request(createApp())
      .put('/api/redaksi/etimologi/2')
      .send({ indeks: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Indeks wajib diisi');
  });

  it('PUT /:id memvalidasi entri_id tidak valid', async () => {
    const response = await request(createApp())
      .put('/api/redaksi/etimologi/2')
      .send({ indeks: 'kata', entri_id: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('entri_id tidak valid');
  });

  it('PUT /:id mengembalikan 404 saat data tidak ditemukan', async () => {
    ModelEtimologi.simpan.mockResolvedValue(null);

    const response = await request(createApp())
      .put('/api/redaksi/etimologi/5')
      .send({ indeks: 'kata' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Etimologi tidak ditemukan');
  });

  it('PUT /:id sukses update', async () => {
    ModelEtimologi.simpan.mockResolvedValue({ id: 5, indeks: 'kata-baru' });

    const response = await request(createApp())
      .put('/api/redaksi/etimologi/5')
      .send({ indeks: ' kata-baru ', sumber: '', entri_id: null });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(ModelEtimologi.simpan).toHaveBeenCalledWith(expect.objectContaining({
      id: 5,
      indeks: 'kata-baru',
      sumber: 'LWIM',
      entri_id: null,
    }));
  });

  it('PUT /:id meneruskan error', async () => {
    ModelEtimologi.simpan.mockRejectedValue(new Error('ubah gagal'));

    const response = await request(createApp())
      .put('/api/redaksi/etimologi/5')
      .send({ indeks: 'kata' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('ubah gagal');
  });

  it('DELETE /:id mengembalikan 404 dan 200', async () => {
    ModelEtimologi.hapus.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const notFound = await request(createApp()).delete('/api/redaksi/etimologi/9');
    const success = await request(createApp()).delete('/api/redaksi/etimologi/9');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(success.body.success).toBe(true);
  });

  it('DELETE /:id meneruskan error', async () => {
    ModelEtimologi.hapus.mockRejectedValue(new Error('hapus gagal'));

    const response = await request(createApp()).delete('/api/redaksi/etimologi/9');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('hapus gagal');
  });
});
