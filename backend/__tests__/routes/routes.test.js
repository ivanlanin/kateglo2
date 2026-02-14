/**
 * @fileoverview Test routes backend
 * @tested_in backend/routes/
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../models/modelBeranda', () => ({
  ambilStatistik: jest.fn(),
  ambilLemaAcak: jest.fn(),
  ambilSalahEja: jest.fn(),
  ambilPopuler: jest.fn()
}));

jest.mock('../../models/modelGlosarium', () => ({
  cari: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn()
}));

jest.mock('../../models/modelPeribahasa', () => ({
  cari: jest.fn()
}));

jest.mock('../../models/modelSingkatan', () => ({
  cari: jest.fn()
}));

jest.mock('../../services/layananKamusPublik', () => ({
  cariKamus: jest.fn(),
  ambilDetailKamus: jest.fn()
}));

const ModelBeranda = require('../../models/modelBeranda');
const ModelGlosarium = require('../../models/modelGlosarium');
const ModelPeribahasa = require('../../models/modelPeribahasa');
const ModelSingkatan = require('../../models/modelSingkatan');
const layananKamusPublik = require('../../services/layananKamusPublik');
const rootRouter = require('../../routes');

function createApp() {
  const app = express();
  app.use('/api', rootRouter);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes backend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/public/health mengembalikan status ok', async () => {
    const response = await request(createApp()).get('/api/public/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.message).toBe('Public API is running');
  });

  it('GET /api/admin/health mengembalikan status ok', async () => {
    const response = await request(createApp()).get('/api/admin/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.message).toBe('Admin API is running');
  });

  it('GET /api/public/beranda mengembalikan data gabungan', async () => {
    ModelBeranda.ambilStatistik.mockResolvedValue({ kamus: 1 });
    ModelBeranda.ambilLemaAcak.mockResolvedValue([{ phrase: 'kata' }]);
    ModelBeranda.ambilSalahEja.mockResolvedValue([{ phrase: 'aktip', actual_phrase: 'aktif' }]);
    ModelBeranda.ambilPopuler.mockResolvedValue([{ phrase: 'kata', search_count: 5 }]);

    const response = await request(createApp()).get('/api/public/beranda');

    expect(response.status).toBe(200);
    expect(response.body.statistik).toEqual({ kamus: 1 });
    expect(ModelBeranda.ambilLemaAcak).toHaveBeenCalledWith(10);
    expect(ModelBeranda.ambilSalahEja).toHaveBeenCalledWith(5);
    expect(ModelBeranda.ambilPopuler).toHaveBeenCalledWith(5);
  });

  it('GET /api/public/beranda meneruskan error ke middleware', async () => {
    ModelBeranda.ambilStatistik.mockRejectedValue(new Error('gagal beranda'));

    const response = await request(createApp()).get('/api/public/beranda');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('gagal beranda');
  });

  it('GET /api/public/pencarian mengembalikan hasil', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue([{ phrase: 'kata' }]);

    const response = await request(createApp()).get('/api/public/pencarian?q=kata&limit=30');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata', '30');
    expect(response.body.count).toBe(1);
  });

  it('GET /api/public/pencarian tanpa query memakai nilai default', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue([]);

    const response = await request(createApp()).get('/api/public/pencarian');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('', '20');
    expect(response.body).toEqual({ query: '', count: 0, data: [] });
  });

  it('GET /api/public/search alias bekerja', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue([{ phrase: 'kata' }]);

    const response = await request(createApp()).get('/api/public/search?q=kata');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('GET /api/public/pencarian meneruskan error ke middleware', async () => {
    layananKamusPublik.cariKamus.mockRejectedValue(new Error('gagal cari'));

    const response = await request(createApp()).get('/api/public/pencarian?q=kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('gagal cari');
  });

  it('GET /api/public/kamus/:slug mengembalikan 404 saat data null', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/public/kamus/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
  });

  it('GET /api/public/kamus/:slug mengembalikan data saat ditemukan', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ frasa: 'kata' });

    const response = await request(createApp()).get('/api/public/kamus/kata');

    expect(response.status).toBe(200);
    expect(response.body.frasa).toBe('kata');
  });

  it('GET /api/public/dictionary/:slug alias bekerja', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ frasa: 'kata' });

    const response = await request(createApp()).get('/api/public/dictionary/kata');

    expect(response.status).toBe(200);
    expect(response.body.frasa).toBe('kata');
  });

  it('GET /api/public/kamus/:slug meneruskan error ke middleware', async () => {
    layananKamusPublik.ambilDetailKamus.mockRejectedValue(new Error('gagal detail'));

    const response = await request(createApp()).get('/api/public/kamus/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('gagal detail');
  });

  it('GET /api/public/glosarium memanggil model dengan limit max 100', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/public/glosarium?q=a&bidang=ling&sumber=kbbi&bahasa=id&limit=999&offset=3');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      q: 'a',
      bidang: 'ling',
      sumber: 'kbbi',
      bahasa: 'id',
      limit: 100,
      offset: 3
    });
  });

  it('GET /api/public/glosarium/bidang mengembalikan daftar bidang', async () => {
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([{ discipline: 'ling' }]);

    const response = await request(createApp()).get('/api/public/glosarium/bidang');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ discipline: 'ling' }]);
  });

  it('GET /api/public/glosarium/sumber mengembalikan daftar sumber', async () => {
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue([{ ref_source: 'kbbi' }]);

    const response = await request(createApp()).get('/api/public/glosarium/sumber');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ ref_source: 'kbbi' }]);
  });

  it('GET /api/public/glosarium meneruskan error ke middleware', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('gagal glosarium'));

    const response = await request(createApp()).get('/api/public/glosarium');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('gagal glosarium');
  });

  it('GET /api/public/peribahasa memanggil model dengan parsing limit/offset', async () => {
    ModelPeribahasa.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp()).get('/api/public/peribahasa?q=buah&limit=90&offset=2');

    expect(response.status).toBe(200);
    expect(ModelPeribahasa.cari).toHaveBeenCalledWith({ q: 'buah', limit: 90, offset: 2 });
  });

  it('GET /api/public/peribahasa meneruskan error ke middleware', async () => {
    ModelPeribahasa.cari.mockRejectedValue(new Error('gagal peribahasa'));

    const response = await request(createApp()).get('/api/public/peribahasa');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('gagal peribahasa');
  });

  it('GET /api/public/singkatan memanggil model dengan parsing limit/offset', async () => {
    ModelSingkatan.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/public/singkatan?q=a&kependekan=ab&tag=mil&limit=70&offset=1');

    expect(response.status).toBe(200);
    expect(ModelSingkatan.cari).toHaveBeenCalledWith({
      q: 'a',
      kependekan: 'ab',
      tag: 'mil',
      limit: 70,
      offset: 1
    });
  });

  it('GET /api/public/singkatan meneruskan error ke middleware', async () => {
    ModelSingkatan.cari.mockRejectedValue(new Error('gagal singkatan'));

    const response = await request(createApp()).get('/api/public/singkatan');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('gagal singkatan');
  });
});
