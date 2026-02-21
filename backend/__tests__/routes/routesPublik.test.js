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
  cariCursor: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn(),
}));

jest.mock('../../models/modelLabel', () => ({
  ambilSemuaKategori: jest.fn(),
  cariEntriPerLabel: jest.fn(),
  cariEntriPerLabelCursor: jest.fn(),
}));

jest.mock('../../models/modelEntri', () => {
  const saranEntri = jest.fn();
  return {
    autocomplete: jest.fn(),
    saranEntri,
    contohAcak: jest.fn(),
    cariMakna: jest.fn(),
  };
});

jest.mock('../../models/modelKomentar', () => ({
  hitungKomentarAktif: jest.fn(),
  ambilKomentarTerbaca: jest.fn(),
  upsertKomentarPengguna: jest.fn(),
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
const ModelEntri = require('../../models/modelEntri');
const ModelKomentar = require('../../models/modelKomentar');
const ModelTesaurus = require('../../models/modelTesaurus');
const layananKamusPublik = require('../../services/layananKamusPublik');
const layananTesaurusPublik = require('../../services/layananTesaurusPublik');
const rootRouter = require('../../routes');

function createApp() {
  const app = express();
  app.use(express.json());
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
    ModelKomentar.hitungKomentarAktif.mockResolvedValue(0);
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
    ModelLabel.cariEntriPerLabelCursor.mockResolvedValue({ data: [], total: 0, label: null });

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/umum%20sekali?limit=999&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelLabel.cariEntriPerLabelCursor).toHaveBeenCalledWith('ragam', 'umum sekali', {
      limit: 200,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
      hitungTotal: true,
    });
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode meneruskan error', async () => {
    ModelLabel.cariEntriPerLabelCursor.mockRejectedValue(new Error('label gagal'));

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/cak');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('label gagal');
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode mendukung lastPage cursor', async () => {
    ModelLabel.cariEntriPerLabelCursor.mockResolvedValue({ data: [], total: 0, label: null });

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/umum?lastPage=1');

    expect(response.status).toBe(200);
    expect(ModelLabel.cariEntriPerLabelCursor).toHaveBeenCalledWith('ragam', 'umum', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: true,
      hitungTotal: true,
    });
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

  it('GET /api/publik/makna/contoh mengembalikan data contoh acak', async () => {
    ModelEntri.contohAcak.mockResolvedValue(['kata', 'frasa']);

    const response = await request(createApp()).get('/api/publik/makna/contoh');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['kata', 'frasa'] });
    expect(ModelEntri.contohAcak).toHaveBeenCalledWith(5);
  });

  it('GET /api/publik/makna/contoh meneruskan error', async () => {
    ModelEntri.contohAcak.mockRejectedValue(new Error('contoh gagal'));

    const response = await request(createApp()).get('/api/publik/makna/contoh');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('contoh gagal');
  });

  it('GET /api/publik/makna/cari/:kata validasi query kosong', async () => {
    const response = await request(createApp()).get('/api/publik/makna/cari/%20%20%20');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Query tidak boleh kosong');
    expect(ModelEntri.cariMakna).not.toHaveBeenCalled();
  });

  it('GET /api/publik/makna/cari/:kata meneruskan cursor pagination ke model', async () => {
    ModelEntri.cariMakna.mockResolvedValue({
      data: [{ id: 1, entri: 'kata' }],
      total: 2,
      hasPrev: true,
      hasNext: false,
      prevCursor: 'prev123',
      nextCursor: null,
    });

    const response = await request(createApp())
      .get('/api/publik/makna/cari/kata?limit=999&cursor=abc&direction=prev&lastPage=1');

    expect(response.status).toBe(200);
    expect(ModelEntri.cariMakna).toHaveBeenCalledWith('kata', {
      limit: 100,
      cursor: 'abc',
      direction: 'prev',
      lastPage: true,
    });
    expect(response.body.pageInfo).toEqual({
      hasPrev: true,
      hasNext: false,
      prevCursor: 'prev123',
      nextCursor: null,
    });
  });

  it('GET /api/publik/makna/cari/:kata mengembalikan nextCursor ketika tersedia', async () => {
    ModelEntri.cariMakna.mockResolvedValue({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: true,
      prevCursor: '',
      nextCursor: 'next123',
    });

    const response = await request(createApp()).get('/api/publik/makna/cari/kata');

    expect(response.status).toBe(200);
    expect(response.body.pageInfo.prevCursor).toBeNull();
    expect(response.body.pageInfo.nextCursor).toBe('next123');
  });

  it('GET /api/publik/makna/cari/:kata meneruskan error model', async () => {
    ModelEntri.cariMakna.mockRejectedValue(new Error('makna gagal'));

    const response = await request(createApp()).get('/api/publik/makna/cari/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('makna gagal');
  });

  it('GET /api/publik/kamus/cari/:kata mengembalikan hasil dan clamp paginasi', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({
      data: [{ lema: 'kata' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/publik/kamus/cari/kata?limit=999&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata', {
      limit: 200,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
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

  it('GET /api/publik/kamus/detail/:indeks mengembalikan 404 saat data null', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue(null);
    ModelEntri.saranEntri.mockResolvedValue(['kata']);

    const response = await request(createApp()).get('/api/publik/kamus/detail/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
    expect(response.body.saran).toEqual(['kata']);
  });

  it('GET /api/publik/kamus/detail/:entri mengembalikan data saat ditemukan', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ indeks: 'kata', entri: [{ id: 1, entri: 'kata' }] });

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.body.indeks).toBe('kata');
    expect(response.body.entri).toHaveLength(1);
  });

  it('GET /api/publik/kamus/detail/:entri meneruskan error', async () => {
    layananKamusPublik.ambilDetailKamus.mockRejectedValue(new Error('detail kamus gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail kamus gagal');
  });

  it('GET /api/publik/kamus/komentar/:indeks mengembalikan teaser jika belum login', async () => {
    ModelKomentar.hitungKomentarAktif.mockResolvedValue(2);

    const response = await request(createApp()).get('/api/publik/kamus/komentar/kata');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.loggedIn).toBe(false);
    expect(response.body.data.activeCount).toBe(2);
    expect(ModelKomentar.ambilKomentarTerbaca).not.toHaveBeenCalled();
  });

  it('GET /api/publik/kamus/komentar/:indeks mengembalikan komentar terbaca jika login', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 9,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    ModelKomentar.hitungKomentarAktif.mockResolvedValue(1);
    ModelKomentar.ambilKomentarTerbaca.mockResolvedValue([{ id: 7, komentar: 'uji', aktif: false }]);

    const response = await request(createApp())
      .get('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.loggedIn).toBe(true);
    expect(response.body.data.komentar).toHaveLength(1);
    expect(ModelKomentar.ambilKomentarTerbaca).toHaveBeenCalledWith('kata', 9);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/komentar/:indeks meneruskan error model', async () => {
    ModelKomentar.hitungKomentarAktif.mockRejectedValue(new Error('komentar publik gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/komentar/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('komentar publik gagal');
  });

  it('POST /api/publik/kamus/komentar/:indeks menyimpan komentar pengguna login', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 11,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );
    ModelKomentar.upsertKomentarPengguna.mockResolvedValue({ id: 1, indeks: 'kata', komentar: 'isi' });

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(ModelKomentar.upsertKomentarPengguna).toHaveBeenCalledWith({ indeks: 'kata', penggunaId: 11, komentar: 'isi' });
    delete process.env.JWT_SECRET;
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
    layananTesaurusPublik.cariTesaurus.mockResolvedValue({ data: [{ indeks: 'aktif' }], total: 1 });

    const response = await request(createApp()).get('/api/publik/tesaurus/cari/aktif?limit=0&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(layananTesaurusPublik.cariTesaurus).toHaveBeenCalledWith('aktif', {
      limit: 100,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
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
    layananTesaurusPublik.ambilDetailTesaurus.mockResolvedValue({ indeks: 'aktif', sinonim: ['giat'] });

    const response = await request(createApp()).get('/api/publik/tesaurus/aktif');

    expect(response.status).toBe(200);
    expect(response.body.indeks).toBe('aktif');
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
    ModelGlosarium.cariCursor.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/cari/istilah?limit=999&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      q: 'istilah',
      limit: 100,
      aktifSaja: true,
      hitungTotal: true,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
  });

  it('GET /api/publik/glosarium/cari/:kata meneruskan error', async () => {
    ModelGlosarium.cariCursor.mockRejectedValue(new Error('glo cari gagal'));

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
    ModelGlosarium.cariCursor.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/bidang/ilmu%20komputer?limit=9&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      bidang: 'ilmu komputer',
      limit: 9,
      aktifSaja: true,
      hitungTotal: true,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
  });

  it('GET /api/publik/glosarium/bidang/:bidang meneruskan error', async () => {
    ModelGlosarium.cariCursor.mockRejectedValue(new Error('bidang detail gagal'));

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
    ModelGlosarium.cariCursor.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/sumber/KBBI%20V?limit=6&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      sumber: 'KBBI V',
      limit: 6,
      aktifSaja: true,
      hitungTotal: true,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
  });

  it('GET /api/publik/glosarium/sumber/:sumber meneruskan error', async () => {
    ModelGlosarium.cariCursor.mockRejectedValue(new Error('sumber detail gagal'));

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
      akses_redaksi: false,
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
    expect(response.body.data.akses_redaksi).toBe(false);
    expect(response.body.data.izin).toEqual([]);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/cari/:kata menerima flag lastPage', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/kamus/cari/kata?lastPage=1');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: true,
    });
  });

  it('GET /api/publik/kamus/komentar/:indeks mengembalikan 400 jika indeks kosong', async () => {
    const response = await request(createApp()).get('/api/publik/kamus/komentar/%20%20');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Indeks wajib diisi');
  });

  it('POST /api/publik/kamus/komentar/:indeks mengembalikan 401 jika pid tidak tersedia', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Autentikasi diperlukan');
    delete process.env.JWT_SECRET;
  });

  it('POST /api/publik/kamus/komentar/:indeks validasi indeks dan komentar wajib', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 17,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    const noIndeks = await request(createApp())
      .post('/api/publik/kamus/komentar/%20')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    const noKomentar = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: '   ' });

    expect(noIndeks.status).toBe(400);
    expect(noIndeks.body.message).toBe('Indeks wajib diisi');
    expect(noKomentar.status).toBe(400);
    expect(noKomentar.body.message).toBe('Komentar wajib diisi');
    delete process.env.JWT_SECRET;
  });

  it('POST /api/publik/kamus/komentar/:indeks validasi komentar saat body kosong', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 17,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Komentar wajib diisi');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode meneruskan error decode parameter', async () => {
    const response = await request(createApp()).get('/api/publik/kamus/kategori/ragam/%E0%A4%A');

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Failed to decode param');
  });

  it('POST /api/publik/kamus/komentar/:indeks meneruskan error model', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 13,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );
    ModelKomentar.upsertKomentarPengguna.mockRejectedValue(new Error('simpan komentar gagal'));

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('simpan komentar gagal');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/detail/:indeks meneruskan error saat ambil saran gagal', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue(null);
    ModelEntri.saranEntri.mockRejectedValue(new Error('saran gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/detail/tidak-ada');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('saran gagal');
  });
});

