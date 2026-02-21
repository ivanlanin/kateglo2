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

  it('GET /bidang-master meneruskan filter aktif 1/0 dan fallback kosong', async () => {
    ModelGlosarium.daftarMasterBidang.mockResolvedValue({ data: [], total: 0 });

    await request(createApp()).get('/api/redaksi/glosarium/bidang-master?aktif=1');
    await request(createApp()).get('/api/redaksi/glosarium/bidang-master?aktif=0');
    await request(createApp()).get('/api/redaksi/glosarium/bidang-master?aktif=abc');

    expect(ModelGlosarium.daftarMasterBidang).toHaveBeenNthCalledWith(1, expect.objectContaining({ aktif: '1' }));
    expect(ModelGlosarium.daftarMasterBidang).toHaveBeenNthCalledWith(2, expect.objectContaining({ aktif: '0' }));
    expect(ModelGlosarium.daftarMasterBidang).toHaveBeenNthCalledWith(3, expect.objectContaining({ aktif: '' }));
  });

  it('GET /bidang-master meneruskan error', async () => {
    ModelGlosarium.daftarMasterBidang.mockRejectedValue(new Error('list bidang gagal'));

    const response = await request(createApp()).get('/api/redaksi/glosarium/bidang-master');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list bidang gagal');
  });

  it('GET /bidang-master/:id mengembalikan 404 dan 200', async () => {
    ModelGlosarium.ambilMasterBidangDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, nama: 'Kimia' });

    const notFound = await request(createApp()).get('/api/redaksi/glosarium/bidang-master/1');
    const success = await request(createApp()).get('/api/redaksi/glosarium/bidang-master/1');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(success.body.data.id).toBe(1);
  });

  it('GET /bidang-master/:id meneruskan error', async () => {
    ModelGlosarium.ambilMasterBidangDenganId.mockRejectedValue(new Error('detail bidang gagal'));

    const response = await request(createApp()).get('/api/redaksi/glosarium/bidang-master/1');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail bidang gagal');
  });

  it('POST /bidang-master memvalidasi payload wajib', async () => {
    const response = await request(createApp())
      .post('/api/redaksi/glosarium/bidang-master')
      .send({ kode: '', nama: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('POST /bidang-master memvalidasi nama wajib', async () => {
    const response = await request(createApp())
      .post('/api/redaksi/glosarium/bidang-master')
      .send({ kode: 'kim', nama: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Nama bidang wajib diisi');
  });

  it('POST /bidang-master sukses dan memetakan payload aktif', async () => {
    ModelGlosarium.simpanMasterBidang.mockResolvedValue({ id: 10, kode: 'kim', nama: 'Kimia' });

    const response = await request(createApp())
      .post('/api/redaksi/glosarium/bidang-master')
      .send({ kode: ' kim ', nama: ' Kimia ', keterangan: ' ipa ', aktif: '0' });

    expect(response.status).toBe(201);
    expect(ModelGlosarium.simpanMasterBidang).toHaveBeenCalledWith({
      kode: 'kim',
      nama: 'Kimia',
      keterangan: 'ipa',
      aktif: false,
    });
  });

  it('POST /bidang-master meneruskan error', async () => {
    ModelGlosarium.simpanMasterBidang.mockRejectedValue(new Error('simpan bidang gagal'));

    const response = await request(createApp())
      .post('/api/redaksi/glosarium/bidang-master')
      .send({ kode: 'kim', nama: 'Kimia' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan bidang gagal');
  });

  it('PUT /bidang-master/:id memvalidasi payload, 404, dan 200', async () => {
    const badKode = await request(createApp())
      .put('/api/redaksi/glosarium/bidang-master/1')
      .send({ kode: '', nama: 'Kimia' });
    const badNama = await request(createApp())
      .put('/api/redaksi/glosarium/bidang-master/1')
      .send({ kode: 'kim', nama: '' });

    ModelGlosarium.simpanMasterBidang.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, nama: 'Kimia Baru' });
    const notFound = await request(createApp())
      .put('/api/redaksi/glosarium/bidang-master/1')
      .send({ kode: 'kim', nama: 'Kimia' });
    const success = await request(createApp())
      .put('/api/redaksi/glosarium/bidang-master/1')
      .send({ kode: 'kim', nama: 'Kimia Baru', aktif: true });

    expect(badKode.status).toBe(400);
    expect(badNama.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(ModelGlosarium.simpanMasterBidang).toHaveBeenLastCalledWith({
      id: 1,
      kode: 'kim',
      nama: 'Kimia Baru',
      keterangan: '',
      aktif: true,
    });
  });

  it('PUT /bidang-master/:id meneruskan error', async () => {
    ModelGlosarium.simpanMasterBidang.mockRejectedValue(new Error('ubah bidang gagal'));

    const response = await request(createApp())
      .put('/api/redaksi/glosarium/bidang-master/1')
      .send({ kode: 'kim', nama: 'Kimia' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('ubah bidang gagal');
  });

  it('DELETE /bidang-master/:id mengembalikan 409 saat masih dipakai', async () => {
    const error = new Error('Bidang masih dipakai');
    error.code = 'MASTER_IN_USE';
    ModelGlosarium.hapusMasterBidang.mockRejectedValue(error);

    const response = await request(createApp()).delete('/api/redaksi/glosarium/bidang-master/1');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /bidang-master/:id mengembalikan 404, 200, dan 500', async () => {
    ModelGlosarium.hapusMasterBidang
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('hapus bidang gagal'));

    const notFound = await request(createApp()).delete('/api/redaksi/glosarium/bidang-master/1');
    const success = await request(createApp()).delete('/api/redaksi/glosarium/bidang-master/1');
    const error = await request(createApp()).delete('/api/redaksi/glosarium/bidang-master/1');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('hapus bidang gagal');
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

  it('GET /sumber-master/:id mengembalikan 404 dan 200', async () => {
    ModelGlosarium.ambilMasterSumberDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2, nama: 'KBBI' });

    const notFound = await request(createApp()).get('/api/redaksi/glosarium/sumber-master/2');
    const success = await request(createApp()).get('/api/redaksi/glosarium/sumber-master/2');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(success.body.data.id).toBe(2);
  });

  it('GET /sumber-master meneruskan error', async () => {
    ModelGlosarium.daftarMasterSumber.mockRejectedValue(new Error('list sumber gagal'));

    const response = await request(createApp()).get('/api/redaksi/glosarium/sumber-master');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list sumber gagal');
  });

  it('GET /sumber-master/:id meneruskan error', async () => {
    ModelGlosarium.ambilMasterSumberDenganId.mockRejectedValue(new Error('detail sumber gagal'));

    const response = await request(createApp()).get('/api/redaksi/glosarium/sumber-master/2');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail sumber gagal');
  });

  it('POST /sumber-master memvalidasi payload dan sukses', async () => {
    const badKode = await request(createApp())
      .post('/api/redaksi/glosarium/sumber-master')
      .send({ kode: '', nama: 'KBBI' });
    const badNama = await request(createApp())
      .post('/api/redaksi/glosarium/sumber-master')
      .send({ kode: 'kbbi', nama: '' });

    ModelGlosarium.simpanMasterSumber.mockResolvedValue({ id: 2, kode: 'kbbi', nama: 'KBBI' });
    const success = await request(createApp())
      .post('/api/redaksi/glosarium/sumber-master')
      .send({ kode: ' kbbi ', nama: ' KBBI ', aktif: 1 });

    expect(badKode.status).toBe(400);
    expect(badNama.status).toBe(400);
    expect(success.status).toBe(201);
    expect(ModelGlosarium.simpanMasterSumber).toHaveBeenCalledWith({
      kode: 'kbbi',
      nama: 'KBBI',
      keterangan: '',
      aktif: true,
    });
  });

  it('POST /sumber-master meneruskan error', async () => {
    ModelGlosarium.simpanMasterSumber.mockRejectedValue(new Error('simpan sumber gagal'));

    const response = await request(createApp())
      .post('/api/redaksi/glosarium/sumber-master')
      .send({ kode: 'kbbi', nama: 'KBBI' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan sumber gagal');
  });

  it('PUT /sumber-master/:id memvalidasi payload, 404, dan 200', async () => {
    const badKode = await request(createApp())
      .put('/api/redaksi/glosarium/sumber-master/2')
      .send({ kode: '', nama: 'KBBI' });
    const badNama = await request(createApp())
      .put('/api/redaksi/glosarium/sumber-master/2')
      .send({ kode: 'kbbi', nama: '' });

    ModelGlosarium.simpanMasterSumber.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2, nama: 'KBBI Baru' });
    const notFound = await request(createApp())
      .put('/api/redaksi/glosarium/sumber-master/2')
      .send({ kode: 'kbbi', nama: 'KBBI' });
    const success = await request(createApp())
      .put('/api/redaksi/glosarium/sumber-master/2')
      .send({ kode: 'kbbi', nama: 'KBBI Baru', aktif: false });

    expect(badKode.status).toBe(400);
    expect(badNama.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(ModelGlosarium.simpanMasterSumber).toHaveBeenLastCalledWith({
      id: 2,
      kode: 'kbbi',
      nama: 'KBBI Baru',
      keterangan: '',
      aktif: false,
    });
  });

  it('PUT /sumber-master/:id meneruskan error', async () => {
    ModelGlosarium.simpanMasterSumber.mockRejectedValue(new Error('ubah sumber gagal'));

    const response = await request(createApp())
      .put('/api/redaksi/glosarium/sumber-master/2')
      .send({ kode: 'kbbi', nama: 'KBBI' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('ubah sumber gagal');
  });

  it('DELETE /sumber-master/:id mengembalikan 409 saat masih dipakai', async () => {
    const error = new Error('Sumber masih dipakai');
    error.code = 'MASTER_IN_USE';
    ModelGlosarium.hapusMasterSumber.mockRejectedValue(error);

    const response = await request(createApp()).delete('/api/redaksi/glosarium/sumber-master/1');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /sumber-master/:id mengembalikan 404, 200, dan 500', async () => {
    ModelGlosarium.hapusMasterSumber
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('hapus sumber gagal'));

    const notFound = await request(createApp()).delete('/api/redaksi/glosarium/sumber-master/1');
    const success = await request(createApp()).delete('/api/redaksi/glosarium/sumber-master/1');
    const error = await request(createApp()).delete('/api/redaksi/glosarium/sumber-master/1');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('hapus sumber gagal');
  });
});
