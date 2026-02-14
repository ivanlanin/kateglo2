/**
 * @fileoverview Test routes backend
 * @tested_in backend/routes/
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../models/modelBeranda', () => ({
  ambilStatistik: jest.fn(),
  ambilLemaAcak: jest.fn(),
  ambilRujukan: jest.fn(),
  ambilPopuler: jest.fn()
}));

jest.mock('../../models/modelGlosarium', () => ({
  cari: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn()
}));

jest.mock('../../services/layananKamusPublik', () => ({
  cariKamus: jest.fn(),
  ambilDetailKamus: jest.fn()
}));

jest.mock('../../services/layananTesaurusPublik', () => ({
  cariTesaurus: jest.fn(),
  ambilDetailTesaurus: jest.fn()
}));

const ModelBeranda = require('../../models/modelBeranda');
const ModelGlosarium = require('../../models/modelGlosarium');
const layananKamusPublik = require('../../services/layananKamusPublik');
const layananTesaurusPublik = require('../../services/layananTesaurusPublik');
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
  });

  it('GET /api/public/beranda mengembalikan data gabungan', async () => {
    ModelBeranda.ambilStatistik.mockResolvedValue({ kamus: 1 });
    ModelBeranda.ambilLemaAcak.mockResolvedValue([{ id: 1, lema: 'kata' }]);
    ModelBeranda.ambilRujukan.mockResolvedValue([{ lema: 'abadiat', lema_rujuk: 'abadiah' }]);
    ModelBeranda.ambilPopuler.mockResolvedValue([{ phrase: 'kata', search_count: 5 }]);

    const response = await request(createApp()).get('/api/public/beranda');

    expect(response.status).toBe(200);
    expect(response.body.statistik).toEqual({ kamus: 1 });
    expect(ModelBeranda.ambilLemaAcak).toHaveBeenCalledWith(10);
    expect(ModelBeranda.ambilRujukan).toHaveBeenCalledWith(5);
    expect(ModelBeranda.ambilPopuler).toHaveBeenCalledWith(5);
  });

  it('GET /api/public/beranda meneruskan error ke middleware', async () => {
    ModelBeranda.ambilStatistik.mockRejectedValue(new Error('gagal beranda'));

    const response = await request(createApp()).get('/api/public/beranda');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('gagal beranda');
  });

  it('GET /api/public/kamus/cari/:kata mengembalikan hasil', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue([{ lema: 'kata' }]);

    const response = await request(createApp()).get('/api/public/kamus/cari/kata');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata');
    expect(response.body.count).toBe(1);
  });

  it('GET /api/public/kamus/detail/:entri mengembalikan 404 saat data null', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/public/kamus/detail/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
  });

  it('GET /api/public/kamus/detail/:entri mengembalikan data saat ditemukan', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ lema: 'kata' });

    const response = await request(createApp()).get('/api/public/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.body.lema).toBe('kata');
  });

  it('GET /api/public/tesaurus/cari/:kata mengembalikan hasil', async () => {
    layananTesaurusPublik.cariTesaurus.mockResolvedValue([{ lema: 'aktif' }]);

    const response = await request(createApp()).get('/api/public/tesaurus/cari/aktif');

    expect(response.status).toBe(200);
    expect(layananTesaurusPublik.cariTesaurus).toHaveBeenCalledWith('aktif');
    expect(response.body.count).toBe(1);
  });

  it('GET /api/public/tesaurus/:kata mengembalikan 404 saat data null', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/public/tesaurus/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
  });

  it('GET /api/public/tesaurus/:kata mengembalikan data saat ditemukan', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockResolvedValue({ lema: 'aktif', sinonim: ['giat'] });

    const response = await request(createApp()).get('/api/public/tesaurus/aktif');

    expect(response.status).toBe(200);
    expect(response.body.lema).toBe('aktif');
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
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([{ discipline: 'ling', jumlah: 10 }]);

    const response = await request(createApp()).get('/api/public/glosarium/bidang');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ discipline: 'ling', jumlah: 10 }]);
  });

  it('GET /api/public/glosarium/sumber mengembalikan daftar sumber', async () => {
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue([{ ref_source: 'kbbi', jumlah: 5 }]);

    const response = await request(createApp()).get('/api/public/glosarium/sumber');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ ref_source: 'kbbi', jumlah: 5 }]);
  });
});
