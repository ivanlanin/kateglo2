/**
 * @fileoverview Test routes backend
 * @tested_in backend/routes/
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../models/modelGlosarium', () => ({
  autocomplete: jest.fn(),
  cari: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn(),
}));

jest.mock('../../models/modelLabel', () => ({
  ambilSemuaKategori: jest.fn(),
  cariLemaPerLabel: jest.fn(),
}));

jest.mock('../../models/modelLema', () => ({
  autocomplete: jest.fn(),
}));

jest.mock('../../models/modelTesaurus', () => ({
  autocomplete: jest.fn(),
}));

jest.mock('../../services/layananKamusPublik', () => ({
  cariKamus: jest.fn(),
  ambilDetailKamus: jest.fn(),
}));

jest.mock('../../services/layananTesaurusPublik', () => ({
  cariTesaurus: jest.fn(),
  ambilDetailTesaurus: jest.fn(),
}));

const ModelGlosarium = require('../../models/modelGlosarium');
const ModelLabel = require('../../models/modelLabel');
const ModelLema = require('../../models/modelLema');
const ModelTesaurus = require('../../models/modelTesaurus');
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

  it('GET /api/admin/health mengembalikan status ok', async () => {
    const response = await request(createApp()).get('/api/admin/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/public/kamus/kategori mengembalikan data kategori', async () => {
    ModelLabel.ambilSemuaKategori.mockResolvedValue({ ragam: [{ kode: 'cak', nama: 'cak' }] });

    const response = await request(createApp()).get('/api/public/kamus/kategori');

    expect(response.status).toBe(200);
    expect(response.body.ragam).toHaveLength(1);
  });

  it('GET /api/public/kamus/kategori meneruskan error ke middleware', async () => {
    ModelLabel.ambilSemuaKategori.mockRejectedValue(new Error('kategori gagal'));

    const response = await request(createApp()).get('/api/public/kamus/kategori');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('kategori gagal');
  });

  it('GET /api/public/kamus/kategori/:kategori/:kode memanggil model label', async () => {
    ModelLabel.cariLemaPerLabel.mockResolvedValue({ data: [], total: 0, label: null });

    const response = await request(createApp())
      .get('/api/public/kamus/kategori/ragam/umum%20sekali?limit=999&offset=-5');

    expect(response.status).toBe(200);
    expect(ModelLabel.cariLemaPerLabel).toHaveBeenCalledWith('ragam', 'umum sekali', 200, 0);
  });

  it('GET /api/public/kamus/kategori/:kategori/:kode meneruskan error', async () => {
    ModelLabel.cariLemaPerLabel.mockRejectedValue(new Error('label gagal'));

    const response = await request(createApp())
      .get('/api/public/kamus/kategori/ragam/cak');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('label gagal');
  });

  it('GET /api/public/kamus/autocomplete/:kata mengembalikan data', async () => {
    ModelLema.autocomplete.mockResolvedValue(['kata']);

    const response = await request(createApp()).get('/api/public/kamus/autocomplete/kat');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['kata'] });
  });

  it('GET /api/public/kamus/autocomplete/:kata meneruskan error', async () => {
    ModelLema.autocomplete.mockRejectedValue(new Error('ac gagal'));

    const response = await request(createApp()).get('/api/public/kamus/autocomplete/kat');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('ac gagal');
  });

  it('GET /api/public/kamus/cari/:kata mengembalikan hasil dan clamp paginasi', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({
      data: [{ lema: 'kata' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/public/kamus/cari/kata?limit=999&offset=-4');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata', { limit: 200, offset: 0 });
    expect(response.body.total).toBe(1);
  });

  it('GET /api/public/kamus/cari/:kata meneruskan error', async () => {
    layananKamusPublik.cariKamus.mockRejectedValue(new Error('cari kamus gagal'));

    const response = await request(createApp()).get('/api/public/kamus/cari/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cari kamus gagal');
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

  it('GET /api/public/kamus/detail/:entri meneruskan error', async () => {
    layananKamusPublik.ambilDetailKamus.mockRejectedValue(new Error('detail kamus gagal'));

    const response = await request(createApp()).get('/api/public/kamus/detail/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail kamus gagal');
  });

  it('GET /api/public/tesaurus/autocomplete/:kata mengembalikan data', async () => {
    ModelTesaurus.autocomplete.mockResolvedValue(['aktif']);

    const response = await request(createApp()).get('/api/public/tesaurus/autocomplete/akt');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['aktif'] });
  });

  it('GET /api/public/tesaurus/autocomplete/:kata meneruskan error', async () => {
    ModelTesaurus.autocomplete.mockRejectedValue(new Error('tesaurus ac gagal'));

    const response = await request(createApp()).get('/api/public/tesaurus/autocomplete/akt');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('tesaurus ac gagal');
  });

  it('GET /api/public/tesaurus/cari/:kata mengembalikan hasil', async () => {
    layananTesaurusPublik.cariTesaurus.mockResolvedValue({ data: [{ lema: 'aktif' }], total: 1 });

    const response = await request(createApp()).get('/api/public/tesaurus/cari/aktif?limit=0&offset=7');

    expect(response.status).toBe(200);
    expect(layananTesaurusPublik.cariTesaurus).toHaveBeenCalledWith('aktif', { limit: 100, offset: 7 });
    expect(response.body.total).toBe(1);
  });

  it('GET /api/public/tesaurus/cari/:kata meneruskan error', async () => {
    layananTesaurusPublik.cariTesaurus.mockRejectedValue(new Error('cari tesaurus gagal'));

    const response = await request(createApp()).get('/api/public/tesaurus/cari/aktif');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cari tesaurus gagal');
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

  it('GET /api/public/tesaurus/:kata meneruskan error', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockRejectedValue(new Error('detail tesaurus gagal'));

    const response = await request(createApp()).get('/api/public/tesaurus/aktif');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail tesaurus gagal');
  });

  it('GET /api/public/glosarium/autocomplete/:kata mengembalikan data', async () => {
    ModelGlosarium.autocomplete.mockResolvedValue([{ value: 'term' }]);

    const response = await request(createApp()).get('/api/public/glosarium/autocomplete/te');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ value: 'term' }] });
  });

  it('GET /api/public/glosarium/autocomplete/:kata meneruskan error', async () => {
    ModelGlosarium.autocomplete.mockRejectedValue(new Error('glo ac gagal'));

    const response = await request(createApp()).get('/api/public/glosarium/autocomplete/te');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('glo ac gagal');
  });

  it('GET /api/public/glosarium/cari/:kata memanggil model sesuai query', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/public/glosarium/cari/istilah?limit=999&offset=3');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      q: 'istilah',
      limit: 100,
      offset: 3,
    });
  });

  it('GET /api/public/glosarium/cari/:kata meneruskan error', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('glo cari gagal'));

    const response = await request(createApp()).get('/api/public/glosarium/cari/istilah');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('glo cari gagal');
  });

  it('GET /api/public/glosarium/bidang mengembalikan daftar bidang', async () => {
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([{ bidang: 'ling', jumlah: 10 }]);

    const response = await request(createApp()).get('/api/public/glosarium/bidang');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ bidang: 'ling', jumlah: 10 }]);
  });

  it('GET /api/public/glosarium/bidang meneruskan error', async () => {
    ModelGlosarium.ambilDaftarBidang.mockRejectedValue(new Error('bidang gagal'));

    const response = await request(createApp()).get('/api/public/glosarium/bidang');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('bidang gagal');
  });

  it('GET /api/public/glosarium/bidang/:bidang memanggil model', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/public/glosarium/bidang/ilmu%20komputer?limit=9&offset=2');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      bidang: 'ilmu komputer',
      limit: 9,
      offset: 2,
    });
  });

  it('GET /api/public/glosarium/bidang/:bidang meneruskan error', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('bidang detail gagal'));

    const response = await request(createApp()).get('/api/public/glosarium/bidang/ling');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('bidang detail gagal');
  });

  it('GET /api/public/glosarium/sumber mengembalikan daftar sumber', async () => {
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue([{ sumber: 'kbbi', jumlah: 5 }]);

    const response = await request(createApp()).get('/api/public/glosarium/sumber');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ sumber: 'kbbi', jumlah: 5 }]);
  });

  it('GET /api/public/glosarium/sumber meneruskan error', async () => {
    ModelGlosarium.ambilDaftarSumber.mockRejectedValue(new Error('sumber gagal'));

    const response = await request(createApp()).get('/api/public/glosarium/sumber');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('sumber gagal');
  });

  it('GET /api/public/glosarium/sumber/:sumber memanggil model', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/public/glosarium/sumber/KBBI%20V?limit=6&offset=1');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      sumber: 'KBBI V',
      limit: 6,
      offset: 1,
    });
  });

  it('GET /api/public/glosarium/sumber/:sumber meneruskan error', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('sumber detail gagal'));

    const response = await request(createApp()).get('/api/public/glosarium/sumber/kbbi');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('sumber detail gagal');
  });
});
