/**
 * @fileoverview Test routes backend
 * @tested_in backend/routes/
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../models/modelGlosarium', () => ({
  autocomplete: jest.fn(),
  cari: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn(),
}));

jest.mock('../../models/modelLabel', () => ({
  ambilSemuaKategori: jest.fn(),
  cariEntriPerLabel: jest.fn(),
}));

jest.mock('../../models/modelEntri', () => {
  const saranEntri = jest.fn();
  return {
    autocomplete: jest.fn(),
    saranEntri,
  };
});

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
const ModelEntri = require('../../models/modelEntri');
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
    ModelEntri.saranEntri.mockResolvedValue([]);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/health mengembalikan status ok', async () => {
    const response = await request(createApp()).get('/api/publik/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/publik/health mengembalikan status ok', async () => {
    const response = await request(createApp()).get('/api/publik/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/redaksi/health mengembalikan status ok dengan token admin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-admin',
        email: 'admin@example.com',
        name: 'Admin',
        picture: 'https://img.example/admin.png',
        provider: 'google',
        peran: 'admin',
        izin: ['kelola_pengguna'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/redaksi/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/redaksi/health mengembalikan status ok dengan token admin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-admin',
        email: 'admin@example.com',
        name: 'Admin',
        picture: 'https://img.example/admin.png',
        provider: 'google',
        peran: 'admin',
        izin: ['kelola_pengguna'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/redaksi/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/redaksi/health mengembalikan 401 tanpa token', async () => {
    const response = await request(createApp()).get('/api/redaksi/health');

    expect(response.status).toBe(401);
  });

  it('GET /api/redaksi/health mengembalikan 403 untuk non-admin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
        izin: ['lihat_lema'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/redaksi/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/kategori mengembalikan data kategori', async () => {
    ModelLabel.ambilSemuaKategori.mockResolvedValue({ ragam: [{ kode: 'cak', nama: 'cak' }] });

    const response = await request(createApp()).get('/api/publik/kamus/kategori');

    expect(response.status).toBe(200);
    expect(response.body.ragam).toHaveLength(1);
  });

  it('GET /api/publik/kamus/kategori meneruskan error ke middleware', async () => {
    ModelLabel.ambilSemuaKategori.mockRejectedValue(new Error('kategori gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/kategori');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('kategori gagal');
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode memanggil model label', async () => {
    ModelLabel.cariEntriPerLabel.mockResolvedValue({ data: [], total: 0, label: null });

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/umum%20sekali?limit=999&offset=-5');

    expect(response.status).toBe(200);
    expect(ModelLabel.cariEntriPerLabel).toHaveBeenCalledWith('ragam', 'umum sekali', 200, 0);
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode meneruskan error', async () => {
    ModelLabel.cariEntriPerLabel.mockRejectedValue(new Error('label gagal'));

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/cak');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('label gagal');
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode mengembalikan 400 saat offset terlalu besar', async () => {
    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/umum?offset=1001');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Query');
    expect(response.body.message).toContain('Offset maksimal adalah 1000');
  });

  it('GET /api/publik/kamus/autocomplete/:kata mengembalikan data', async () => {
    ModelEntri.autocomplete.mockResolvedValue(['kata']);

    const response = await request(createApp()).get('/api/publik/kamus/autocomplete/kat');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['kata'] });
  });

  it('GET /api/publik/kamus/autocomplete/:kata meneruskan error', async () => {
    ModelEntri.autocomplete.mockRejectedValue(new Error('ac gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/autocomplete/kat');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('ac gagal');
  });

  it('GET /api/publik/kamus/cari/:kata mengembalikan hasil dan clamp paginasi', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({
      data: [{ lema: 'kata' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/publik/kamus/cari/kata?limit=999&offset=-4');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata', { limit: 200, offset: 0 });
    expect(response.body.total).toBe(1);
  });

  it('GET /api/publik/kamus/cari/:kata mengembalikan saran saat total 0', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({
      data: [],
      total: 0,
    });
    ModelEntri.saranEntri.mockResolvedValue(['kata', 'kita']);

    const response = await request(createApp()).get('/api/publik/kamus/cari/tidak%20ada');

    expect(response.status).toBe(200);
    expect(ModelEntri.saranEntri).toHaveBeenCalledWith('tidak ada');
    expect(response.body.saran).toEqual(['kata', 'kita']);
  });

  it('GET /api/publik/kamus/cari/:kata meneruskan error', async () => {
    layananKamusPublik.cariKamus.mockRejectedValue(new Error('cari kamus gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/cari/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cari kamus gagal');
  });

  it('GET /api/publik/kamus/detail/:entri mengembalikan 404 saat data null', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue(null);
    ModelEntri.saranEntri.mockResolvedValue(['kata']);

    const response = await request(createApp()).get('/api/publik/kamus/detail/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
    expect(response.body.saran).toEqual(['kata']);
  });

  it('GET /api/publik/kamus/detail/:entri mengembalikan data saat ditemukan', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ entri: 'kata' });

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.body.entri).toBe('kata');
  });

  it('GET /api/publik/kamus/detail/:entri meneruskan error', async () => {
    layananKamusPublik.ambilDetailKamus.mockRejectedValue(new Error('detail kamus gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail kamus gagal');
  });

  it('GET /api/publik/tesaurus/autocomplete/:kata mengembalikan data', async () => {
    ModelTesaurus.autocomplete.mockResolvedValue(['aktif']);

    const response = await request(createApp()).get('/api/publik/tesaurus/autocomplete/akt');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['aktif'] });
  });

  it('GET /api/publik/tesaurus/autocomplete/:kata meneruskan error', async () => {
    ModelTesaurus.autocomplete.mockRejectedValue(new Error('tesaurus ac gagal'));

    const response = await request(createApp()).get('/api/publik/tesaurus/autocomplete/akt');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('tesaurus ac gagal');
  });

  it('GET /api/publik/tesaurus/cari/:kata mengembalikan hasil', async () => {
    layananTesaurusPublik.cariTesaurus.mockResolvedValue({ data: [{ lema: 'aktif' }], total: 1 });

    const response = await request(createApp()).get('/api/publik/tesaurus/cari/aktif?limit=0&offset=7');

    expect(response.status).toBe(200);
    expect(layananTesaurusPublik.cariTesaurus).toHaveBeenCalledWith('aktif', { limit: 100, offset: 7 });
    expect(response.body.total).toBe(1);
  });

  it('GET /api/publik/tesaurus/cari/:kata meneruskan error', async () => {
    layananTesaurusPublik.cariTesaurus.mockRejectedValue(new Error('cari tesaurus gagal'));

    const response = await request(createApp()).get('/api/publik/tesaurus/cari/aktif');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cari tesaurus gagal');
  });

  it('GET /api/publik/tesaurus/:kata mengembalikan 404 saat data null', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/publik/tesaurus/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
  });

  it('GET /api/publik/tesaurus/:kata mengembalikan data saat ditemukan', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockResolvedValue({ lema: 'aktif', sinonim: ['giat'] });

    const response = await request(createApp()).get('/api/publik/tesaurus/aktif');

    expect(response.status).toBe(200);
    expect(response.body.lema).toBe('aktif');
  });

  it('GET /api/publik/tesaurus/:kata meneruskan error', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockRejectedValue(new Error('detail tesaurus gagal'));

    const response = await request(createApp()).get('/api/publik/tesaurus/aktif');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail tesaurus gagal');
  });

  it('GET /api/publik/glosarium/autocomplete/:kata mengembalikan data', async () => {
    ModelGlosarium.autocomplete.mockResolvedValue([{ value: 'term' }]);

    const response = await request(createApp()).get('/api/publik/glosarium/autocomplete/te');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ value: 'term' }] });
  });

  it('GET /api/publik/glosarium/autocomplete/:kata meneruskan error', async () => {
    ModelGlosarium.autocomplete.mockRejectedValue(new Error('glo ac gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/autocomplete/te');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('glo ac gagal');
  });

  it('GET /api/publik/glosarium/cari/:kata memanggil model sesuai query', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/cari/istilah?limit=999&offset=3');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      q: 'istilah',
      limit: 100,
      offset: 3,
    });
  });

  it('GET /api/publik/glosarium/cari/:kata meneruskan error', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('glo cari gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/cari/istilah');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('glo cari gagal');
  });

  it('GET /api/publik/glosarium/bidang mengembalikan daftar bidang', async () => {
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([{ bidang: 'ling', jumlah: 10 }]);

    const response = await request(createApp()).get('/api/publik/glosarium/bidang');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ bidang: 'ling', jumlah: 10 }]);
  });

  it('GET /api/publik/glosarium/bidang meneruskan error', async () => {
    ModelGlosarium.ambilDaftarBidang.mockRejectedValue(new Error('bidang gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/bidang');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('bidang gagal');
  });

  it('GET /api/publik/glosarium/bidang/:bidang memanggil model', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/bidang/ilmu%20komputer?limit=9&offset=2');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      bidang: 'ilmu komputer',
      limit: 9,
      offset: 2,
    });
  });

  it('GET /api/publik/glosarium/bidang/:bidang meneruskan error', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('bidang detail gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/bidang/ling');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('bidang detail gagal');
  });

  it('GET /api/publik/glosarium/sumber mengembalikan daftar sumber', async () => {
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue([{ sumber: 'kbbi', jumlah: 5 }]);

    const response = await request(createApp()).get('/api/publik/glosarium/sumber');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ sumber: 'kbbi', jumlah: 5 }]);
  });

  it('GET /api/publik/glosarium/sumber meneruskan error', async () => {
    ModelGlosarium.ambilDaftarSumber.mockRejectedValue(new Error('sumber gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/sumber');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('sumber gagal');
  });

  it('GET /api/publik/glosarium/sumber/:sumber memanggil model', async () => {
    ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/sumber/KBBI%20V?limit=6&offset=1');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cari).toHaveBeenCalledWith({
      sumber: 'KBBI V',
      limit: 6,
      offset: 1,
    });
  });

  it('GET /api/publik/glosarium/sumber/:sumber meneruskan error', async () => {
    ModelGlosarium.cari.mockRejectedValue(new Error('sumber detail gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/sumber/kbbi');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('sumber detail gagal');
  });

  it('GET /api/publik/auth/me mengembalikan 401 saat token tidak ada', async () => {
    const response = await request(createApp()).get('/api/publik/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/publik/auth/me mengembalikan profil saat token valid', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-123',
        pid: 1,
        email: 'user@example.com',
        name: 'User Test',
        picture: 'https://img.example/user.png',
        peran: 'pengguna',
        izin: ['lihat_lema'],
        provider: 'google',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      id: 'google-123',
      pid: 1,
      email: 'user@example.com',
      name: 'User Test',
      picture: 'https://img.example/user.png',
      peran: 'pengguna',
      izin: ['lihat_lema'],
      provider: 'google',
    });
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/auth/me mengisi izin array kosong jika payload tidak memiliki izin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-456',
        pid: 2,
        email: 'user2@example.com',
        name: 'User Tanpa Izin',
        picture: 'https://img.example/user2.png',
        peran: 'pengguna',
        provider: 'google',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.izin).toEqual([]);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/cari/:kata mengembalikan 400 saat offset terlalu besar', async () => {
    const response = await request(createApp())
      .get('/api/publik/kamus/cari/kata?offset=1001');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Query');
    expect(response.body.message).toContain('Offset maksimal adalah 1000');
  });

  it('GET /api/publik/tesaurus/cari/:kata mengembalikan 400 saat offset terlalu besar', async () => {
    const response = await request(createApp())
      .get('/api/publik/tesaurus/cari/aktif?offset=1001');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Query');
    expect(response.body.message).toContain('Offset maksimal adalah 1000');
  });

  it('GET /api/publik/glosarium/cari/:kata mengembalikan 400 saat offset terlalu besar', async () => {
    const response = await request(createApp())
      .get('/api/publik/glosarium/cari/istilah?offset=1001');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Query');
    expect(response.body.message).toContain('Offset maksimal adalah 1000');
  });

  it('GET /api/publik/glosarium/bidang/:bidang mengembalikan 400 saat offset terlalu besar', async () => {
    const response = await request(createApp())
      .get('/api/publik/glosarium/bidang/linguistik?offset=1001');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Query');
    expect(response.body.message).toContain('Offset maksimal adalah 1000');
  });

  it('GET /api/publik/glosarium/sumber/:sumber mengembalikan 400 saat offset terlalu besar', async () => {
    const response = await request(createApp())
      .get('/api/publik/glosarium/sumber/kbbi?offset=1001');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Query');
    expect(response.body.message).toContain('Offset maksimal adalah 1000');
  });
});

