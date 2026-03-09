/**
 * @fileoverview Test route master opsi redaksi untuk bahasa, bidang, dan sumber
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/otorisasi', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../models/modelOpsi', () => ({
  daftarMasterBahasa: jest.fn(),
  ambilMasterBahasaDenganId: jest.fn(),
  simpanMasterBahasa: jest.fn(),
  hapusMasterBahasa: jest.fn(),
  daftarMasterBidang: jest.fn(),
  ambilMasterBidangDenganId: jest.fn(),
  simpanMasterBidang: jest.fn(),
  hapusMasterBidang: jest.fn(),
  daftarMasterSumber: jest.fn(),
  ambilMasterSumberDenganId: jest.fn(),
  simpanMasterSumber: jest.fn(),
  hapusMasterSumber: jest.fn(),
}));

const routerBahasa = require('../../routes/redaksi/bahasa');
const routerBidang = require('../../routes/redaksi/bidang');
const routerSumber = require('../../routes/redaksi/sumber');
const ModelOpsi = require('../../models/modelOpsi');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/bahasa', routerBahasa);
  app.use('/api/redaksi/bidang', routerBidang);
  app.use('/api/redaksi/sumber', routerSumber);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi master opsi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CRUD /bahasa menangani alur utama', async () => {
    ModelOpsi.daftarMasterBahasa.mockResolvedValue({
      data: [{ id: 1, kode: 'Ing', nama: 'Inggris' }],
      total: 1,
    });
    ModelOpsi.ambilMasterBahasaDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, kode: 'Ing', nama: 'Inggris' });
    ModelOpsi.simpanMasterBahasa.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
    const inUseError = new Error('Bahasa masih dipakai');
    inUseError.code = 'MASTER_IN_USE';
    ModelOpsi.hapusMasterBahasa
      .mockRejectedValueOnce(inUseError)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const list = await request(createApp()).get('/api/redaksi/bahasa?q=ing&aktif=1');
    const detail404 = await request(createApp()).get('/api/redaksi/bahasa/1');
    const detail200 = await request(createApp()).get('/api/redaksi/bahasa/1');
    const post400 = await request(createApp()).post('/api/redaksi/bahasa').send({ kode: '', nama: '' });
    const post201 = await request(createApp()).post('/api/redaksi/bahasa').send({ kode: ' Ing ', nama: ' Inggris ', aktif: '0' });
    const put404 = await request(createApp()).put('/api/redaksi/bahasa/1').send({ kode: 'Ing', nama: 'Inggris' });
    const put200 = await request(createApp()).put('/api/redaksi/bahasa/1').send({ kode: 'Ing', nama: 'Inggris', aktif: true });
    const delete409 = await request(createApp()).delete('/api/redaksi/bahasa/1');
    const delete404 = await request(createApp()).delete('/api/redaksi/bahasa/1');
    const delete200 = await request(createApp()).delete('/api/redaksi/bahasa/1');

    expect(list.status).toBe(200);
    expect(ModelOpsi.daftarMasterBahasa).toHaveBeenCalledWith(expect.objectContaining({ q: 'ing', aktif: '1' }));
    expect(detail404.status).toBe(404);
    expect(detail200.status).toBe(200);
    expect(post400.status).toBe(400);
    expect(post201.status).toBe(201);
    expect(ModelOpsi.simpanMasterBahasa).toHaveBeenNthCalledWith(1, {
      kode: 'Ing',
      nama: 'Inggris',
      iso2: '',
      iso3: '',
      keterangan: '',
      aktif: false,
    });
    expect(put404.status).toBe(404);
    expect(put200.status).toBe(200);
    expect(ModelOpsi.simpanMasterBahasa).toHaveBeenNthCalledWith(3, {
      id: 1,
      kode: 'Ing',
      nama: 'Inggris',
      iso2: '',
      iso3: '',
      keterangan: '',
      aktif: true,
    });
    expect(delete409.status).toBe(409);
    expect(delete404.status).toBe(404);
    expect(delete200.status).toBe(200);
  });

  it('GET /bidang-master mengembalikan data paginasi', async () => {
    ModelOpsi.daftarMasterBidang.mockResolvedValue({
      data: [{ id: 1, kode: 'kimia', nama: 'Kimia' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/redaksi/bidang?q=kim&limit=10&offset=0');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(ModelOpsi.daftarMasterBidang).toHaveBeenCalled();
  });

  it('GET /bidang-master meneruskan filter kamus/glosarium dan fallback kosong', async () => {
    ModelOpsi.daftarMasterBidang.mockResolvedValue({ data: [], total: 0 });

    await request(createApp()).get('/api/redaksi/bidang?kamus=1&glosarium=0');
    await request(createApp()).get('/api/redaksi/bidang?kamus=0&glosarium=1');
    await request(createApp()).get('/api/redaksi/bidang?kamus=abc&glosarium=xyz');

    expect(ModelOpsi.daftarMasterBidang).toHaveBeenNthCalledWith(1, expect.objectContaining({ kamus: '1', glosarium: '0' }));
    expect(ModelOpsi.daftarMasterBidang).toHaveBeenNthCalledWith(2, expect.objectContaining({ kamus: '0', glosarium: '1' }));
    expect(ModelOpsi.daftarMasterBidang).toHaveBeenNthCalledWith(3, expect.objectContaining({ kamus: '', glosarium: '' }));
  });

  it('GET /bidang-master meneruskan error', async () => {
    ModelOpsi.daftarMasterBidang.mockRejectedValue(new Error('list bidang gagal'));

    const response = await request(createApp()).get('/api/redaksi/bidang');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list bidang gagal');
  });

  it('GET /bidang-master/:id mengembalikan 404 dan 200', async () => {
    ModelOpsi.ambilMasterBidangDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, nama: 'Kimia' });

    const notFound = await request(createApp()).get('/api/redaksi/bidang/1');
    const success = await request(createApp()).get('/api/redaksi/bidang/1');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(success.body.data.id).toBe(1);
  });

  it('GET /bidang-master/:id meneruskan error', async () => {
    ModelOpsi.ambilMasterBidangDenganId.mockRejectedValue(new Error('detail bidang gagal'));

    const response = await request(createApp()).get('/api/redaksi/bidang/1');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail bidang gagal');
  });

  it('POST /bidang-master memvalidasi payload wajib', async () => {
    const response = await request(createApp())
      .post('/api/redaksi/bidang')
      .send({ kode: '', nama: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('POST /bidang-master memvalidasi nama wajib', async () => {
    const response = await request(createApp())
      .post('/api/redaksi/bidang')
      .send({ kode: 'kim', nama: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Nama bidang wajib diisi');
  });

  it('POST /bidang-master sukses dan memetakan payload kamus dan glosarium', async () => {
    ModelOpsi.simpanMasterBidang.mockResolvedValue({ id: 10, kode: 'kim', nama: 'Kimia' });

    const response = await request(createApp())
      .post('/api/redaksi/bidang')
      .send({ kode: ' kim ', nama: ' Kimia ', keterangan: ' ipa ', kamus: '0', glosarium: '1' });

    expect(response.status).toBe(201);
    expect(ModelOpsi.simpanMasterBidang).toHaveBeenCalledWith({
      kode: 'kim',
      nama: 'Kimia',
      keterangan: 'ipa',
      kamus: false,
      glosarium: true,
    });
  });

  it('POST /bidang-master meneruskan error', async () => {
    ModelOpsi.simpanMasterBidang.mockRejectedValue(new Error('simpan bidang gagal'));

    const response = await request(createApp())
      .post('/api/redaksi/bidang')
      .send({ kode: 'kim', nama: 'Kimia' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan bidang gagal');
  });

  it('PUT /bidang-master/:id memvalidasi payload, 404, dan 200', async () => {
    const badKode = await request(createApp())
      .put('/api/redaksi/bidang/1')
      .send({ kode: '', nama: 'Kimia' });
    const badNama = await request(createApp())
      .put('/api/redaksi/bidang/1')
      .send({ kode: 'kim', nama: '' });

    ModelOpsi.simpanMasterBidang.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, nama: 'Kimia Baru' });
    const notFound = await request(createApp())
      .put('/api/redaksi/bidang/1')
      .send({ kode: 'kim', nama: 'Kimia' });
    const success = await request(createApp())
      .put('/api/redaksi/bidang/1')
      .send({ kode: 'kim', nama: 'Kimia Baru', aktif: true });

    expect(badKode.status).toBe(400);
    expect(badNama.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(ModelOpsi.simpanMasterBidang).toHaveBeenLastCalledWith({
      id: 1,
      kode: 'kim',
      nama: 'Kimia Baru',
      keterangan: '',
      kamus: true,
      glosarium: true,
    });
  });

  it('PUT /bidang-master/:id meneruskan error', async () => {
    ModelOpsi.simpanMasterBidang.mockRejectedValue(new Error('ubah bidang gagal'));

    const response = await request(createApp())
      .put('/api/redaksi/bidang/1')
      .send({ kode: 'kim', nama: 'Kimia' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('ubah bidang gagal');
  });

  it('DELETE /bidang-master/:id mengembalikan 409 saat masih dipakai', async () => {
    const error = new Error('Bidang masih dipakai');
    error.code = 'MASTER_IN_USE';
    ModelOpsi.hapusMasterBidang.mockRejectedValue(error);

    const response = await request(createApp()).delete('/api/redaksi/bidang/1');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /bidang-master/:id mengembalikan 404, 200, dan 500', async () => {
    ModelOpsi.hapusMasterBidang
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('hapus bidang gagal'));

    const notFound = await request(createApp()).delete('/api/redaksi/bidang/1');
    const success = await request(createApp()).delete('/api/redaksi/bidang/1');
    const error = await request(createApp()).delete('/api/redaksi/bidang/1');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('hapus bidang gagal');
  });

  it('GET /sumber-master mengembalikan data paginasi', async () => {
    ModelOpsi.daftarMasterSumber.mockResolvedValue({
      data: [{ id: 1, kode: 'kbbi', nama: 'KBBI' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/redaksi/sumber?q=kb&limit=10&offset=0');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(ModelOpsi.daftarMasterSumber).toHaveBeenCalled();
  });

  it('GET /sumber-master meneruskan filter konteks 1/0 dan fallback kosong', async () => {
    ModelOpsi.daftarMasterSumber.mockResolvedValue({ data: [], total: 0 });

    await request(createApp()).get('/api/redaksi/sumber?glosarium=1&kamus=0&tesaurus=random');
    await request(createApp()).get('/api/redaksi/sumber?etimologi=1');

    expect(ModelOpsi.daftarMasterSumber).toHaveBeenNthCalledWith(1, expect.objectContaining({ glosarium: '1', kamus: '0', tesaurus: '' }));
    expect(ModelOpsi.daftarMasterSumber).toHaveBeenNthCalledWith(2, expect.objectContaining({ etimologi: '1' }));
  });

  it('GET /sumber-master/:id mengembalikan 404 dan 200', async () => {
    ModelOpsi.ambilMasterSumberDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2, nama: 'KBBI' });

    const notFound = await request(createApp()).get('/api/redaksi/sumber/2');
    const success = await request(createApp()).get('/api/redaksi/sumber/2');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(success.body.data.id).toBe(2);
  });

  it('GET /sumber-master meneruskan error', async () => {
    ModelOpsi.daftarMasterSumber.mockRejectedValue(new Error('list sumber gagal'));

    const response = await request(createApp()).get('/api/redaksi/sumber');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list sumber gagal');
  });

  it('GET /sumber-master/:id meneruskan error', async () => {
    ModelOpsi.ambilMasterSumberDenganId.mockRejectedValue(new Error('detail sumber gagal'));

    const response = await request(createApp()).get('/api/redaksi/sumber/2');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail sumber gagal');
  });

  it('POST /sumber-master memvalidasi payload dan sukses', async () => {
    const badKode = await request(createApp())
      .post('/api/redaksi/sumber')
      .send({ kode: '', nama: 'KBBI' });
    const badNama = await request(createApp())
      .post('/api/redaksi/sumber')
      .send({ kode: 'kbbi', nama: '' });

    ModelOpsi.simpanMasterSumber.mockResolvedValue({ id: 2, kode: 'kbbi', nama: 'KBBI' });
    const success = await request(createApp())
      .post('/api/redaksi/sumber')
      .send({ kode: ' kbbi ', nama: ' KBBI ', glosarium: 1, kamus: true });

    expect(badKode.status).toBe(400);
    expect(badNama.status).toBe(400);
    expect(success.status).toBe(201);
    expect(ModelOpsi.simpanMasterSumber).toHaveBeenCalledWith({
      kode: 'kbbi',
      nama: 'KBBI',
      keterangan: '',
      glosarium: true,
      kamus: true,
      tesaurus: false,
      etimologi: false,
    });
  });

  it('POST /sumber-master meneruskan error', async () => {
    ModelOpsi.simpanMasterSumber.mockRejectedValue(new Error('simpan sumber gagal'));

    const response = await request(createApp())
      .post('/api/redaksi/sumber')
      .send({ kode: 'kbbi', nama: 'KBBI' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan sumber gagal');
  });

  it('PUT /sumber-master/:id memvalidasi payload, 404, dan 200', async () => {
    const badKode = await request(createApp())
      .put('/api/redaksi/sumber/2')
      .send({ kode: '', nama: 'KBBI' });
    const badNama = await request(createApp())
      .put('/api/redaksi/sumber/2')
      .send({ kode: 'kbbi', nama: '' });

    ModelOpsi.simpanMasterSumber.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2, nama: 'KBBI Baru' });
    const notFound = await request(createApp())
      .put('/api/redaksi/sumber/2')
      .send({ kode: 'kbbi', nama: 'KBBI' });
    const success = await request(createApp())
      .put('/api/redaksi/sumber/2')
      .send({ kode: 'kbbi', nama: 'KBBI Baru', etimologi: true });

    expect(badKode.status).toBe(400);
    expect(badNama.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(ModelOpsi.simpanMasterSumber).toHaveBeenLastCalledWith({
      id: 2,
      kode: 'kbbi',
      nama: 'KBBI Baru',
      keterangan: '',
      glosarium: false,
      kamus: false,
      tesaurus: false,
      etimologi: true,
    });
  });

  it('PUT /sumber-master/:id meneruskan error', async () => {
    ModelOpsi.simpanMasterSumber.mockRejectedValue(new Error('ubah sumber gagal'));

    const response = await request(createApp())
      .put('/api/redaksi/sumber/2')
      .send({ kode: 'kbbi', nama: 'KBBI' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('ubah sumber gagal');
  });

  it('DELETE /sumber-master/:id mengembalikan 409 saat masih dipakai', async () => {
    const error = new Error('Sumber masih dipakai');
    error.code = 'MASTER_IN_USE';
    ModelOpsi.hapusMasterSumber.mockRejectedValue(error);

    const response = await request(createApp()).delete('/api/redaksi/sumber/1');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /sumber-master/:id mengembalikan 404, 200, dan 500', async () => {
    ModelOpsi.hapusMasterSumber
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('hapus sumber gagal'));

    const notFound = await request(createApp()).delete('/api/redaksi/sumber/1');
    const success = await request(createApp()).delete('/api/redaksi/sumber/1');
    const error = await request(createApp()).delete('/api/redaksi/sumber/1');

    expect(notFound.status).toBe(404);
    expect(success.status).toBe(200);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('hapus sumber gagal');
  });
});
