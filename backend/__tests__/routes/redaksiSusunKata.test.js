/**
 * @fileoverview Test route redaksi susun kata
 * @tested_in backend/routes/redaksi/susunKata.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/otorisasi', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../models/modelSusunKata', () => ({
  parsePanjang: jest.fn((value, fallback = 5) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 4), 8);
  }),
  ambilAtauBuatHarian: jest.fn(),
  buatHarianRentang: jest.fn(),
  ambilTanggalHariIniJakarta: jest.fn(),
  daftarHarianAdmin: jest.fn(),
  ambilPesertaHarian: jest.fn(),
  simpanHarianAdmin: jest.fn(),
  daftarRekapBebasAdmin: jest.fn(),
}));

jest.mock('../../models/modelEntri', () => ({
  ambilArtiSusunKataByIndeks: jest.fn(),
}));

const router = require('../../routes/redaksi/susunKata');
const ModelSusunKata = require('../../models/modelSusunKata');
const ModelEntri = require('../../models/modelEntri');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { pid: 9 };
    next();
  });
  app.use('/api/redaksi/susun-kata', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/susunKata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelSusunKata.daftarHarianAdmin.mockResolvedValue([{ id: 1 }]);
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValue({ id: 10, kata: 'kartu', tanggal: '2026-03-02', panjang: 5 });
    ModelSusunKata.buatHarianRentang.mockResolvedValue([{ id: 10, kata: 'kartu', tanggal: '2026-03-02', panjang: 5 }]);
    ModelSusunKata.ambilTanggalHariIniJakarta.mockResolvedValue('2026-03-02');
    ModelEntri.ambilArtiSusunKataByIndeks.mockResolvedValue('alat tulis');
    ModelSusunKata.ambilPesertaHarian.mockResolvedValue([{ pengguna_id: 9 }]);
    ModelSusunKata.simpanHarianAdmin.mockResolvedValue({ id: 10, kata: 'kartu' });
    ModelSusunKata.daftarRekapBebasAdmin.mockResolvedValue([{ tanggal: '2026-03-02' }]);
  });

  it('GET /harian membuat data rentang 30 hari dengan panjang 5', async () => {
    const withTanggalPanjang = await request(createApp()).get('/api/redaksi/susun-kata/harian?tanggal=2026-03-02&panjang=5');
    expect(withTanggalPanjang.status).toBe(200);
    expect(ModelSusunKata.buatHarianRentang).toHaveBeenCalledWith({ tanggalMulai: '2026-03-02', totalHari: 30 });

    await request(createApp()).get('/api/redaksi/susun-kata/harian?tanggal=2026-03-03');
    expect(ModelSusunKata.buatHarianRentang).toHaveBeenCalledWith({ tanggalMulai: '2026-03-03', totalHari: 30 });

    await request(createApp()).get('/api/redaksi/susun-kata/harian');
    expect(ModelSusunKata.ambilTanggalHariIniJakarta).toHaveBeenCalled();
    expect(ModelSusunKata.buatHarianRentang).toHaveBeenCalledWith({ tanggalMulai: '2026-03-02', totalHari: 30 });
    expect(ModelSusunKata.daftarHarianAdmin).toHaveBeenCalled();
  });

  it('GET /harian meneruskan error', async () => {
    ModelSusunKata.daftarHarianAdmin.mockRejectedValueOnce(new Error('list gagal'));

    const response = await request(createApp()).get('/api/redaksi/susun-kata/harian');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('list gagal');
  });

  it('GET /harian/detail memvalidasi parameter wajib', async () => {
    const noTanggal = await request(createApp()).get('/api/redaksi/susun-kata/harian/detail?panjang=5');
    expect(noTanggal.status).toBe(400);

    const noPanjang = await request(createApp()).get('/api/redaksi/susun-kata/harian/detail?tanggal=2026-03-02');
    expect(noPanjang.status).toBe(200);

    const tanggalInvalid = await request(createApp()).get('/api/redaksi/susun-kata/harian/detail?tanggal=2026/03/02&panjang=5');
    expect(tanggalInvalid.status).toBe(400);
  });

  it('GET /harian/detail mengembalikan 404 saat kata harian tidak tersedia', async () => {
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValueOnce(null);

    const response = await request(createApp()).get('/api/redaksi/susun-kata/harian/detail?tanggal=2026-03-02&panjang=5');

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('tidak tersedia');
  });

  it('GET /harian/detail sukses mengembalikan detail + peserta', async () => {
    const response = await request(createApp()).get('/api/redaksi/susun-kata/harian/detail?tanggal=2026-03-02&panjang=5');

    expect(response.status).toBe(200);
    expect(ModelEntri.ambilArtiSusunKataByIndeks).toHaveBeenCalledWith('kartu');
    expect(ModelSusunKata.ambilPesertaHarian).toHaveBeenCalledWith({ susunKataId: 10 });
    expect(response.body.data.jumlahPeserta).toBe(1);
  });

  it('GET /harian/detail meneruskan error', async () => {
    ModelSusunKata.ambilAtauBuatHarian.mockRejectedValueOnce(new Error('detail gagal'));

    const response = await request(createApp()).get('/api/redaksi/susun-kata/harian/detail?tanggal=2026-03-02&panjang=5');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('detail gagal');
  });

  it('PUT /harian memvalidasi tanggal dan kata wajib', async () => {
    const noTanggal = await request(createApp()).put('/api/redaksi/susun-kata/harian').send({ kata: 'kartu', panjang: 5 });
    expect(noTanggal.status).toBe(400);

    const noKata = await request(createApp()).put('/api/redaksi/susun-kata/harian').send({ tanggal: '2026-03-02', kata: '' });
    expect(noKata.status).toBe(400);
  });

  it('PUT /harian sukses menyimpan payload ter-normalisasi', async () => {
    const response = await request(createApp())
      .put('/api/redaksi/susun-kata/harian')
      .send({ tanggal: '2026-03-02', panjang: 6, kata: ' KARTUN ', keterangan: '  catatan  ' });

    expect(response.status).toBe(200);
    expect(ModelSusunKata.simpanHarianAdmin).toHaveBeenCalledWith({
      tanggal: '2026-03-02',
      panjang: 5,
      kata: 'kartun',
      penggunaId: 9,
      keterangan: 'catatan',
    });
  });

  it('PUT /harian memetakan error domain menjadi status yang tepat', async () => {
    ModelSusunKata.simpanHarianAdmin.mockRejectedValueOnce(new Error('Kata harus 5 huruf'));
    const harus = await request(createApp()).put('/api/redaksi/susun-kata/harian').send({ tanggal: '2026-03-02', kata: 'kata', panjang: 5 });
    expect(harus.status).toBe(400);

    ModelSusunKata.simpanHarianAdmin.mockRejectedValueOnce(new Error('Tanggal tidak valid'));
    const valid = await request(createApp()).put('/api/redaksi/susun-kata/harian').send({ tanggal: '2026-03-02', kata: 'kata', panjang: 5 });
    expect(valid.status).toBe(400);

    ModelSusunKata.simpanHarianAdmin.mockRejectedValueOnce(new Error('Kata tidak ditemukan pada kamus Susun Kata'));
    const notFound = await request(createApp()).put('/api/redaksi/susun-kata/harian').send({ tanggal: '2026-03-02', kata: 'kata', panjang: 5 });
    expect(notFound.status).toBe(404);
  });

  it('PUT /harian meneruskan error umum', async () => {
    ModelSusunKata.simpanHarianAdmin.mockRejectedValueOnce(new Error('simpan gagal'));

    const response = await request(createApp())
      .put('/api/redaksi/susun-kata/harian')
      .send({ tanggal: '2026-03-02', kata: 'kartu', panjang: 5 });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('simpan gagal');
  });

  it('GET /bebas mengembalikan rekap per tanggal', async () => {
    const response = await request(createApp()).get('/api/redaksi/susun-kata/bebas?tanggal=2026-03-02&limit=25');

    expect(response.status).toBe(200);
    expect(ModelSusunKata.daftarRekapBebasAdmin).toHaveBeenCalledWith({ tanggal: '2026-03-02', limit: 25 });
    expect(response.body.data).toEqual([{ tanggal: '2026-03-02' }]);
  });

  it('GET /bebas memakai nilai fallback saat query tidak valid', async () => {
    await request(createApp()).get('/api/redaksi/susun-kata/bebas?tanggal=2026/03/02&limit=abc');

    expect(ModelSusunKata.daftarRekapBebasAdmin).toHaveBeenCalledWith({ tanggal: null, limit: 200 });
  });

  it('GET /bebas meneruskan error', async () => {
    ModelSusunKata.daftarRekapBebasAdmin.mockRejectedValueOnce(new Error('rekap gagal'));

    const response = await request(createApp()).get('/api/redaksi/susun-kata/bebas');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('rekap gagal');
  });
});
