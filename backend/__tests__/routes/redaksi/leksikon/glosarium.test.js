/**
 * @fileoverview Test route redaksi glosarium
 * @tested_in backend/routes/redaksi/leksikon/glosarium.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../middleware/authorization', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../../models/leksikon/modelGlosarium', () => ({
  cari: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
}));

jest.mock('../../../../services/publik/layananGlosariumPublik', () => ({
  invalidasiCacheDetailGlosarium: jest.fn(),
  invalidasiCacheMasterGlosarium: jest.fn(),
}));

const router = require('../../../../routes/redaksi/leksikon/glosarium');
const ModelGlosarium = require('../../../../models/leksikon/modelGlosarium');
const { invalidasiCacheDetailGlosarium, invalidasiCacheMasterGlosarium } = require('../../../../services/publik/layananGlosariumPublik');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { email: 'admin@example.com' };
    next();
  });
  app.use('/api/redaksi/glosarium', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/glosarium', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / mengembalikan paginasi dengan filter yang valid', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

    const response = await request(createApp())
      .get('/api/redaksi/glosarium?q=%20air%20&aktif=1&bidang_id=2&bahasa_id=3&sumber_id=4&limit=5&offset=10');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      q: 'air',
      limit: 5,
      offset: 0,
      aktif: '1',
      bidangId: 2,
      bahasaId: 3,
      sumberId: 4,
    });
    expect(response.body.success).toBe(true);
  });

  it('GET / meneruskan error ke middleware', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('list gagal'));

    const response = await request(createApp()).get('/api/redaksi/glosarium');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list gagal');
  });

  it('GET /:id mengembalikan 404 dan 200', async () => {
    ModelGlosarium.ambilDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 3, asing: 'term' });

    const notFound = await request(createApp()).get('/api/redaksi/glosarium/3');
    const ok = await request(createApp()).get('/api/redaksi/glosarium/3');

    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ok.body.data).toEqual({ id: 3, asing: 'term' });
  });

  it('GET /:id meneruskan error', async () => {
    ModelGlosarium.ambilDenganId.mockRejectedValue(new Error('detail gagal'));

    const response = await request(createApp()).get('/api/redaksi/glosarium/5');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail gagal');
  });

  it('POST / memvalidasi indonesia dan asing wajib', async () => {
    const tanpaIndonesia = await request(createApp()).post('/api/redaksi/glosarium').send({ indonesia: '   ', asing: 'term' });
    const tanpaAsing = await request(createApp()).post('/api/redaksi/glosarium').send({ indonesia: 'istilah', asing: '   ' });

    expect(tanpaIndonesia.status).toBe(400);
    expect(tanpaAsing.status).toBe(400);
  });

  it('POST / menyimpan data dan invalidasi cache detail', async () => {
    ModelGlosarium.simpan.mockResolvedValue({ id: 1, asing: 'term' });

    const response = await request(createApp())
      .post('/api/redaksi/glosarium')
      .send({ indonesia: ' istilah ', asing: ' term ', bidang_id: 2, sumber_id: 4, bahasa_id: 3 });

    expect(response.status).toBe(201);
    expect(ModelGlosarium.simpan).toHaveBeenCalledWith(expect.objectContaining({
      indonesia: 'istilah',
      asing: 'term',
      bidang_id: 2,
      sumber_id: 4,
    }), 'admin@example.com');
    expect(invalidasiCacheDetailGlosarium).toHaveBeenCalledWith('term');
  });

  it('POST / memetakan error validasi master ke 400', async () => {
    const invalidBidang = new Error('Bidang tidak valid');
    invalidBidang.code = 'INVALID_BIDANG';
    const invalidSumber = new Error('Sumber tidak valid');
    invalidSumber.code = 'INVALID_SUMBER';
    const invalidBahasa = new Error('Bahasa tidak valid');
    invalidBahasa.code = 'INVALID_BAHASA';

    ModelGlosarium.simpan
      .mockRejectedValueOnce(invalidBidang)
      .mockRejectedValueOnce(invalidSumber)
      .mockRejectedValueOnce(invalidBahasa);

    const bid = await request(createApp()).post('/api/redaksi/glosarium').send({ indonesia: 'istilah', asing: 'term' });
    const sum = await request(createApp()).post('/api/redaksi/glosarium').send({ indonesia: 'istilah', asing: 'term' });
    const bah = await request(createApp()).post('/api/redaksi/glosarium').send({ indonesia: 'istilah', asing: 'term' });

    expect(bid.status).toBe(400);
    expect(sum.status).toBe(400);
    expect(bah.status).toBe(400);
  });

  it('POST / meneruskan error tak dikenal', async () => {
    ModelGlosarium.simpan.mockRejectedValue(new Error('simpan gagal'));

    const response = await request(createApp()).post('/api/redaksi/glosarium').send({ indonesia: 'istilah', asing: 'term' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan gagal');
  });

  it('PUT /:id memvalidasi field wajib, 404 jika null, dan sukses invalidasi cache ganda', async () => {
    const tanpaIndonesia = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: '', asing: 'term' });
    const tanpaAsing = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: 'istilah', asing: '' });

    expect(tanpaIndonesia.status).toBe(400);
    expect(tanpaAsing.status).toBe(400);

    ModelGlosarium.ambilDenganId.mockResolvedValueOnce({ id: 5, asing: 'old-term' });
    ModelGlosarium.simpan.mockResolvedValueOnce(null);
    const notFound = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: 'istilah', asing: 'term' });
    expect(notFound.status).toBe(404);

    ModelGlosarium.ambilDenganId.mockResolvedValueOnce({ id: 5, asing: 'old-term' });
    ModelGlosarium.simpan.mockResolvedValueOnce({ id: 5, asing: 'new-term' });
    const ok = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: 'istilah', asing: 'new-term' });
    expect(ok.status).toBe(200);
    expect(invalidasiCacheDetailGlosarium).toHaveBeenNthCalledWith(1, 'old-term');
    expect(invalidasiCacheDetailGlosarium).toHaveBeenNthCalledWith(2, 'new-term');
  });

  it('PUT /:id memetakan error validasi master dan error umum', async () => {
    const invalidBidang = new Error('Bidang tidak valid');
    invalidBidang.code = 'INVALID_BIDANG';
    const invalidSumber = new Error('Sumber tidak valid');
    invalidSumber.code = 'INVALID_SUMBER';
    const invalidBahasa = new Error('Bahasa tidak valid');
    invalidBahasa.code = 'INVALID_BAHASA';

    ModelGlosarium.ambilDenganId
      .mockResolvedValue({ id: 5, asing: 'old-term' });
    ModelGlosarium.simpan
      .mockRejectedValueOnce(invalidBidang)
      .mockRejectedValueOnce(invalidSumber)
      .mockRejectedValueOnce(invalidBahasa)
      .mockRejectedValueOnce(new Error('ubah gagal'));

    const bid = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: 'istilah', asing: 'term' });
    const sum = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: 'istilah', asing: 'term' });
    const bah = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: 'istilah', asing: 'term' });
    const err = await request(createApp()).put('/api/redaksi/glosarium/5').send({ indonesia: 'istilah', asing: 'term' });

    expect(bid.status).toBe(400);
    expect(sum.status).toBe(400);
    expect(bah.status).toBe(400);
    expect(err.status).toBe(500);
  });

  it('DELETE /:id mengembalikan 404, 200, dan meneruskan error', async () => {
    ModelGlosarium.ambilDenganId.mockResolvedValueOnce({ id: 7, asing: 'lama' });
    ModelGlosarium.hapus.mockResolvedValueOnce(false);
    const notFound = await request(createApp()).delete('/api/redaksi/glosarium/7');

    ModelGlosarium.ambilDenganId.mockResolvedValueOnce({ id: 7, asing: 'lama' });
    ModelGlosarium.hapus.mockResolvedValueOnce(true);
    const ok = await request(createApp()).delete('/api/redaksi/glosarium/7');

    ModelGlosarium.ambilDenganId.mockRejectedValueOnce(new Error('gagal ambil'));
    ModelGlosarium.hapus.mockRejectedValueOnce(new Error('hapus gagal'));
    const err = await request(createApp()).delete('/api/redaksi/glosarium/7');

    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(invalidasiCacheDetailGlosarium).toHaveBeenLastCalledWith('lama');
    expect(err.status).toBe(500);
  });

  it('POST /cache/invalidasi-master mengembalikan sukses dan meneruskan error', async () => {
    invalidasiCacheMasterGlosarium.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('cache gagal'));

    const ok = await request(createApp()).post('/api/redaksi/glosarium/cache/invalidasi-master');
    const err = await request(createApp()).post('/api/redaksi/glosarium/cache/invalidasi-master');

    expect(ok.status).toBe(200);
    expect(ok.body.message).toBe('Cache master glosarium berhasil diinvalidasi');
    expect(err.status).toBe(500);
    expect(err.body.message).toBe('cache gagal');
  });
});