/**
 * @fileoverview Test route redaksi wordnet sinset
 * @tested_in backend/routes/redaksi/wordnet/sinset.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../middleware/authorization', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../../models/leksikon/modelEntri', () => ({
  cariIndukAdmin: jest.fn(),
}));

jest.mock('../../../../models/wordnet/modelSinset', () => ({
  statistik: jest.fn(),
  daftarTipeRelasi: jest.fn(),
  daftar: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  tambahLema: jest.fn(),
  ambilKandidatMakna: jest.fn(),
  simpanPemetaanLema: jest.fn(),
}));

const router = require('../../../../routes/redaksi/wordnet/sinset');
const ModelEntri = require('../../../../models/leksikon/modelEntri');
const ModelSinset = require('../../../../models/wordnet/modelSinset');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/sinset', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/wordnet/sinset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /statistik sukses dan meneruskan error', async () => {
    ModelSinset.statistik.mockResolvedValueOnce({ total: 1 }).mockRejectedValueOnce(new Error('statistik gagal'));

    const ok = await request(createApp()).get('/api/redaksi/sinset/statistik');
    const err = await request(createApp()).get('/api/redaksi/sinset/statistik');

    expect(ok.status).toBe(200);
    expect(ok.body.data).toEqual({ total: 1 });
    expect(err.status).toBe(500);
  });

  it('GET /tipe-relasi sukses dan meneruskan error', async () => {
    ModelSinset.daftarTipeRelasi.mockResolvedValueOnce([{ kode: 'hipernim' }]).mockRejectedValueOnce(new Error('relasi gagal'));

    const ok = await request(createApp()).get('/api/redaksi/sinset/tipe-relasi');
    const err = await request(createApp()).get('/api/redaksi/sinset/tipe-relasi');

    expect(ok.status).toBe(200);
    expect(ok.body.data).toEqual([{ kode: 'hipernim' }]);
    expect(err.status).toBe(500);
  });

  it('GET / meneruskan filter paginasi dan error', async () => {
    ModelSinset.daftar.mockResolvedValueOnce({
      data: [{ id: '0001-n' }],
      total: 1,
      hasPrev: false,
      hasNext: true,
      prevCursor: null,
      nextCursor: 'next',
    }).mockRejectedValueOnce(new Error('daftar gagal'));

    const ok = await request(createApp()).get('/api/redaksi/sinset?q=%20adil%20&status=draf&kelas_kata=n&ada_pemetaan=1&akar=0&limit=5&cursor=abc&direction=prev&lastPage=1');
    const err = await request(createApp()).get('/api/redaksi/sinset');

    expect(ok.status).toBe(200);
    expect(ModelSinset.daftar).toHaveBeenCalledWith({
      limit: 5,
      q: 'adil',
      status: 'draf',
      kelasKata: 'n',
      adaPemetaan: '1',
      akar: '0',
      cursor: 'abc',
      direction: 'prev',
      lastPage: true,
    });
    expect(err.status).toBe(500);
  });

  it('GET /:id menangani 400, 404, 200, dan error', async () => {
    const bad = await request(createApp()).get('/api/redaksi/sinset/%20');

    ModelSinset.ambilDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: '0001-n' }).mockRejectedValueOnce(new Error('detail gagal'));

    const notFound = await request(createApp()).get('/api/redaksi/sinset/0001-n');
    const ok = await request(createApp()).get('/api/redaksi/sinset/0001-n');
    const err = await request(createApp()).get('/api/redaksi/sinset/0001-n');

    expect(bad.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(err.status).toBe(500);
  });

  it('PUT /:id menangani 400 status invalid, 404, 200, dan error', async () => {
    const badId = await request(createApp()).put('/api/redaksi/sinset/%20').send({});
    const badStatus = await request(createApp()).put('/api/redaksi/sinset/0001-n').send({ status: 'salah' });

    ModelSinset.simpan.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: '0001-n', status: 'tinjau' }).mockRejectedValueOnce(new Error('simpan gagal'));

    const notFound = await request(createApp()).put('/api/redaksi/sinset/0001-n').send({ status: 'draf' });
    const ok = await request(createApp()).put('/api/redaksi/sinset/0001-n').send({ status: 'tinjau', definisi_id: 1, contoh_id: ['c1'], catatan: 'cat' });
    const err = await request(createApp()).put('/api/redaksi/sinset/0001-n').send({ status: 'draf' });

    expect(badId.status).toBe(400);
    expect(badStatus.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ModelSinset.simpan).toHaveBeenCalledWith('0001-n', {
      definisi_id: 1,
      contoh_id: ['c1'],
      status: 'tinjau',
      catatan: 'cat',
    });
    expect(err.status).toBe(500);
  });

  it('GET /:id/opsi-lema menangani 400, q kosong, sukses, dan error', async () => {
    const badId = await request(createApp()).get('/api/redaksi/sinset/%20/opsi-lema');
    const kosong = await request(createApp()).get('/api/redaksi/sinset/0001-n/opsi-lema?q=%20%20');

    ModelEntri.cariIndukAdmin.mockResolvedValueOnce([{ id: 1, entri: 'adil' }]).mockRejectedValueOnce(new Error('opsi gagal'));

    const ok = await request(createApp()).get('/api/redaksi/sinset/0001-n/opsi-lema?q=%20adil%20&limit=50');
    const err = await request(createApp()).get('/api/redaksi/sinset/0001-n/opsi-lema?q=adil');

    expect(badId.status).toBe(400);
    expect(kosong.status).toBe(200);
    expect(kosong.body.data).toEqual([]);
    expect(ok.status).toBe(200);
    expect(ModelEntri.cariIndukAdmin).toHaveBeenCalledWith('adil', { limit: 20, excludeId: null });
    expect(err.status).toBe(500);
  });

  it('POST /:id/lema menangani seluruh cabang validasi dan error result', async () => {
    const badId = await request(createApp()).post('/api/redaksi/sinset/%20/lema').send({ entri_id: 1 });
    const badEntri = await request(createApp()).post('/api/redaksi/sinset/0001-n/lema').send({ entri_id: 0 });

    ModelSinset.tambahLema
      .mockResolvedValueOnce({ error: 'entri_not_found' })
      .mockResolvedValueOnce({ error: 'duplicate', data: { id: 1 } })
      .mockResolvedValueOnce({ error: 'invalid_input' })
      .mockResolvedValueOnce({ data: { id: 2 } })
      .mockRejectedValueOnce(new Error('lema gagal'));

    const notFound = await request(createApp()).post('/api/redaksi/sinset/0001-n/lema').send({ entri_id: 5 });
    const dup = await request(createApp()).post('/api/redaksi/sinset/0001-n/lema').send({ entri_id: 5 });
    const invalid = await request(createApp()).post('/api/redaksi/sinset/0001-n/lema').send({ entri_id: 5 });
    const ok = await request(createApp()).post('/api/redaksi/sinset/0001-n/lema').send({ entri_id: 5, urutan: 2, sumber: 'redaksi' });
    const err = await request(createApp()).post('/api/redaksi/sinset/0001-n/lema').send({ entri_id: 5 });

    expect(badId.status).toBe(400);
    expect(badEntri.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(dup.status).toBe(409);
    expect(invalid.status).toBe(400);
    expect(ok.status).toBe(201);
    expect(err.status).toBe(500);
  });

  it('GET /:id/lema/:lemaId/kandidat menangani 400, 404, 200, dan error', async () => {
    const bad = await request(createApp()).get('/api/redaksi/sinset/%20/lema/0/kandidat');

    ModelSinset.ambilKandidatMakna.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 7 }).mockRejectedValueOnce(new Error('kandidat gagal'));

    const notFound = await request(createApp()).get('/api/redaksi/sinset/0001-n/lema/7/kandidat');
    const ok = await request(createApp()).get('/api/redaksi/sinset/0001-n/lema/7/kandidat');
    const err = await request(createApp()).get('/api/redaksi/sinset/0001-n/lema/7/kandidat');

    expect(bad.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(err.status).toBe(500);
  });

  it('PUT /:id/lema/:lemaId menangani 400, 404, 200, dan error', async () => {
    const bad = await request(createApp()).put('/api/redaksi/sinset/0001-n/lema/0').send({});

    ModelSinset.simpanPemetaanLema.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 9 }).mockRejectedValueOnce(new Error('pemetaan gagal'));

    const notFound = await request(createApp()).put('/api/redaksi/sinset/0001-n/lema/9').send({ makna_id: 11, terverifikasi: true });
    const ok = await request(createApp()).put('/api/redaksi/sinset/0001-n/lema/9').send({ makna_id: 11, terverifikasi: true });
    const err = await request(createApp()).put('/api/redaksi/sinset/0001-n/lema/9').send({ makna_id: 11, terverifikasi: true });

    expect(bad.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ModelSinset.simpanPemetaanLema).toHaveBeenCalledWith(9, { makna_id: 11, terverifikasi: true });
    expect(err.status).toBe(500);
  });
});