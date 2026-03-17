/**
 * @fileoverview Test route redaksi kandidat kata KADI
 * @tested_in backend/routes/redaksi/kadi/kandidatKata.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../middleware/otorisasi', () => ({
  periksaIzin: () => (req, _res, next) => {
    req.user = { id: 99 };
    next();
  },
}));

jest.mock('../../../../models/kadi/modelKandidatEntri', () => ({
  statistikAntrian: jest.fn(),
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  ubahStatus: jest.fn(),
  hapus: jest.fn(),
  daftarAtestasi: jest.fn(),
  tambahAtestasi: jest.fn(),
  daftarRiwayat: jest.fn(),
}));

const router = require('../../../../routes/redaksi/kadi/kandidatKata');
const ModelKandidatEntri = require('../../../../models/kadi/modelKandidatEntri');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/kandidat-kata', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/kadi/kandidatKata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelKandidatEntri.statistikAntrian.mockResolvedValue([{ status: 'menunggu', jumlah: 2 }]);
    ModelKandidatEntri.daftarAdmin.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
    ModelKandidatEntri.ambilDenganId.mockResolvedValue({ id: 1, kata: 'baru' });
    ModelKandidatEntri.simpan.mockResolvedValue({ id: 1, kata: 'baru' });
    ModelKandidatEntri.ubahStatus.mockResolvedValue({ id: 1, status: 'ditinjau' });
    ModelKandidatEntri.hapus.mockResolvedValue(true);
    ModelKandidatEntri.daftarAtestasi.mockResolvedValue([{ id: 1 }]);
    ModelKandidatEntri.tambahAtestasi.mockResolvedValue({ id: 2 });
    ModelKandidatEntri.daftarRiwayat.mockResolvedValue([{ id: 3 }]);
  });

  it('GET /stats mengembalikan statistik dan meneruskan error', async () => {
    const ok = await request(createApp()).get('/api/redaksi/kandidat-kata/stats');
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true, data: [{ status: 'menunggu', jumlah: 2 }] });

    ModelKandidatEntri.statistikAntrian.mockRejectedValueOnce(new Error('stats gagal'));
    const fail = await request(createApp()).get('/api/redaksi/kandidat-kata/stats');
    expect(fail.status).toBe(500);
    expect(fail.body.message).toBe('stats gagal');
  });

  it('GET / memvalidasi filter status, mengembalikan hasil, dan meneruskan error', async () => {
    const ok = await request(createApp())
      .get('/api/redaksi/kandidat-kata')
      .query({ q: 'baru', status: 'menunggu', jenis: 'dasar', sumber_scraper: 'wiki', prioritas: '2', limit: '5', offset: '10' });

    expect(ok.status).toBe(200);
    expect(ModelKandidatEntri.daftarAdmin).toHaveBeenCalledWith({
      limit: 5,
      offset: 0,
      q: 'baru',
      status: 'menunggu',
      jenis: 'dasar',
      sumber_scraper: 'wiki',
      prioritas: '2',
    });

    await request(createApp()).get('/api/redaksi/kandidat-kata').query({ status: 'liar' });
    expect(ModelKandidatEntri.daftarAdmin).toHaveBeenLastCalledWith(expect.objectContaining({ status: '' }));

    ModelKandidatEntri.daftarAdmin.mockRejectedValueOnce(new Error('daftar gagal'));
    const fail = await request(createApp()).get('/api/redaksi/kandidat-kata');
    expect(fail.status).toBe(500);
    expect(fail.body.message).toBe('daftar gagal');
  });

  it('GET /:id menangani id invalid, not found, sukses, dan error', async () => {
    let response = await request(createApp()).get('/api/redaksi/kandidat-kata/abc');
    expect(response.status).toBe(400);

    ModelKandidatEntri.ambilDenganId.mockResolvedValueOnce(null);
    response = await request(createApp()).get('/api/redaksi/kandidat-kata/10');
    expect(response.status).toBe(404);

    response = await request(createApp()).get('/api/redaksi/kandidat-kata/1');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 1, kata: 'baru' });

    ModelKandidatEntri.ambilDenganId.mockRejectedValueOnce(new Error('detail gagal'));
    response = await request(createApp()).get('/api/redaksi/kandidat-kata/1');
    expect(response.status).toBe(500);
  });

  it('PUT /:id menangani id invalid, not found, sukses, dan error', async () => {
    let response = await request(createApp()).put('/api/redaksi/kandidat-kata/abc').send({ kata: 'baru' });
    expect(response.status).toBe(400);

    ModelKandidatEntri.ambilDenganId.mockResolvedValueOnce(null);
    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1').send({ kata: 'baru' });
    expect(response.status).toBe(404);

    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1').send({ kata: 'baru' });
    expect(response.status).toBe(200);
    expect(ModelKandidatEntri.simpan).toHaveBeenCalledWith({ kata: 'baru', id: 1 });

    ModelKandidatEntri.simpan.mockRejectedValueOnce(new Error('simpan gagal'));
    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1').send({ kata: 'baru' });
    expect(response.status).toBe(500);
  });

  it('PUT /:id/status menangani validasi, not found khusus, sukses, dan error umum', async () => {
    let response = await request(createApp()).put('/api/redaksi/kandidat-kata/abc/status').send({ status: 'ditinjau' });
    expect(response.status).toBe(400);

    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1/status').send({ status: 'liar' });
    expect(response.status).toBe(400);

    ModelKandidatEntri.ubahStatus.mockRejectedValueOnce(new Error('Kandidat tidak ditemukan'));
    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1/status').send({ status: 'ditinjau', catatan: 'cek' });
    expect(response.status).toBe(404);

    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1/status').send({ status: 'ditinjau', catatan: 'cek' });
    expect(response.status).toBe(200);
    expect(ModelKandidatEntri.ubahStatus).toHaveBeenLastCalledWith(1, 'ditinjau', 99, 'cek');

    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1/status').send({ status: 'ditinjau', catatan: '' });
    expect(response.status).toBe(200);
    expect(ModelKandidatEntri.ubahStatus).toHaveBeenLastCalledWith(1, 'ditinjau', 99, null);

    ModelKandidatEntri.ubahStatus.mockRejectedValueOnce(new Error('status gagal'));
    response = await request(createApp()).put('/api/redaksi/kandidat-kata/1/status').send({ status: 'ditinjau' });
    expect(response.status).toBe(500);
  });

  it('DELETE /:id menangani id invalid, not found, sukses, dan error', async () => {
    let response = await request(createApp()).delete('/api/redaksi/kandidat-kata/abc');
    expect(response.status).toBe(400);

    ModelKandidatEntri.hapus.mockResolvedValueOnce(false);
    response = await request(createApp()).delete('/api/redaksi/kandidat-kata/2');
    expect(response.status).toBe(404);

    response = await request(createApp()).delete('/api/redaksi/kandidat-kata/1');
    expect(response.status).toBe(200);

    ModelKandidatEntri.hapus.mockRejectedValueOnce(new Error('hapus gagal'));
    response = await request(createApp()).delete('/api/redaksi/kandidat-kata/1');
    expect(response.status).toBe(500);
  });

  it('GET /:id/atestasi dan /:id/riwayat menangani validasi, sukses, dan error', async () => {
    let response = await request(createApp()).get('/api/redaksi/kandidat-kata/abc/atestasi');
    expect(response.status).toBe(400);

    response = await request(createApp()).get('/api/redaksi/kandidat-kata/1/atestasi');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 1 }]);

    ModelKandidatEntri.daftarAtestasi.mockRejectedValueOnce(new Error('atestasi gagal'));
    response = await request(createApp()).get('/api/redaksi/kandidat-kata/1/atestasi');
    expect(response.status).toBe(500);

    response = await request(createApp()).get('/api/redaksi/kandidat-kata/abc/riwayat');
    expect(response.status).toBe(400);

    response = await request(createApp()).get('/api/redaksi/kandidat-kata/1/riwayat');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 3 }]);

    ModelKandidatEntri.daftarRiwayat.mockRejectedValueOnce(new Error('riwayat gagal'));
    response = await request(createApp()).get('/api/redaksi/kandidat-kata/1/riwayat');
    expect(response.status).toBe(500);
  });

  it('POST /:id/atestasi memvalidasi payload, menyimpan data, dan meneruskan error', async () => {
    let response = await request(createApp()).post('/api/redaksi/kandidat-kata/abc/atestasi').send({});
    expect(response.status).toBe(400);

    response = await request(createApp()).post('/api/redaksi/kandidat-kata/1/atestasi').send({ kutipan: '', sumber_tipe: '' });
    expect(response.status).toBe(400);

    response = await request(createApp()).post('/api/redaksi/kandidat-kata/1/atestasi');
    expect(response.status).toBe(400);

    response = await request(createApp()).post('/api/redaksi/kandidat-kata/1/atestasi').send({ kutipan: 'contoh', sumber_tipe: 'web' });
    expect(response.status).toBe(201);
    expect(ModelKandidatEntri.tambahAtestasi).toHaveBeenCalledWith({ kutipan: 'contoh', sumber_tipe: 'web', kandidat_id: 1 });

    ModelKandidatEntri.tambahAtestasi.mockRejectedValueOnce(new Error('tambah gagal'));
    response = await request(createApp()).post('/api/redaksi/kandidat-kata/1/atestasi').send({ kutipan: 'contoh', sumber_tipe: 'web' });
    expect(response.status).toBe(500);
  });

  it('handler status dan atestasi memakai fallback req.body kosong saat body undefined', async () => {
    const statusLayer = router.stack.find((item) => item.route && item.route.path === '/:id/status');
    const statusHandler = statusLayer.route.stack[1].handle;
    const reqStatus = { params: { id: '1' }, user: { id: 99 } };
    const resStatus = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const nextStatus = jest.fn();

    await statusHandler(reqStatus, resStatus, nextStatus);
    expect(resStatus.status).toHaveBeenCalledWith(400);

    const atestasiLayer = router.stack.find((item) => item.route && item.route.path === '/:id/atestasi' && item.route.methods.post);
    const atestasiHandler = atestasiLayer.route.stack[1].handle;
    const reqAtestasi = { params: { id: '1' } };
    const resAtestasi = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const nextAtestasi = jest.fn();

    await atestasiHandler(reqAtestasi, resAtestasi, nextAtestasi);
    expect(resAtestasi.status).toHaveBeenCalledWith(400);
  });
});

