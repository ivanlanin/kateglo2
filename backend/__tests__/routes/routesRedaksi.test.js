/**
 * @fileoverview Test route redaksi (admin API)
 * @tested_in backend/routes/redaksi/
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../models/modelPengguna', () => ({
  daftarPengguna: jest.fn(),
  ubahPeran: jest.fn(),
  simpanPengguna: jest.fn(),
  daftarPeran: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../models/modelEntri', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  ambilMakna: jest.fn(),
  ambilContoh: jest.fn(),
  simpanMakna: jest.fn(),
  hapusMakna: jest.fn(),
  simpanContoh: jest.fn(),
  hapusContoh: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../models/modelTesaurus', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../models/modelGlosarium', () => ({
  cari: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../models/modelLabel', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
}));

jest.mock('../../models/modelKomentar', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpanAdmin: jest.fn(),
  hitungTotal: jest.fn(),
}));

const ModelPengguna = require('../../models/modelPengguna');
const ModelLema = require('../../models/modelEntri');
const ModelTesaurus = require('../../models/modelTesaurus');
const ModelGlosarium = require('../../models/modelGlosarium');
const ModelLabel = require('../../models/modelLabel');
const ModelKomentar = require('../../models/modelKomentar');
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

function buildToken(overrides = {}) {
  return jwt.sign(
    {
      sub: 'google-admin',
      email: 'admin@example.com',
      name: 'Admin',
      provider: 'google',
      peran: 'admin',
      izin: ['kelola_pengguna', 'kelola_peran'],
      ...overrides,
    },
    process.env.JWT_SECRET
  );
}

function callAsAdmin(method, url, { body, tokenPayload } = {}) {
  const token = buildToken(tokenPayload);
  const req = request(createApp())[method](url).set('Authorization', `Bearer ${token}`);
  if (body) req.send(body);
  return req;
}

describe('routes/redaksi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-redaksi';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe('pengguna', () => {
    it('GET /api/redaksi/pengguna mengembalikan data', async () => {
      ModelPengguna.daftarPengguna.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

      const response = await callAsAdmin('get', '/api/redaksi/pengguna?limit=9&offset=2');

      expect(response.status).toBe(200);
      expect(ModelPengguna.daftarPengguna).toHaveBeenCalledWith({ limit: 9, offset: 2 });
      expect(response.body.total).toBe(1);
    });

    it('GET /api/redaksi/pengguna meneruskan error', async () => {
      ModelPengguna.daftarPengguna.mockRejectedValue(new Error('pengguna gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/pengguna');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('pengguna gagal');
    });

    it('PATCH /api/redaksi/pengguna/:id/peran mengembalikan 400 untuk peran tidak valid', async () => {
      const response = await callAsAdmin('patch', '/api/redaksi/pengguna/8/peran', {
        body: { peran_id: 'abc' },
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('PATCH /api/redaksi/pengguna/:id/peran mengembalikan 404 jika pengguna tidak ada', async () => {
      ModelPengguna.ubahPeran.mockResolvedValue(null);

      const response = await callAsAdmin('patch', '/api/redaksi/pengguna/8/peran', {
        body: { peran_id: 2 },
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Pengguna tidak ditemukan');
    });

    it('PATCH /api/redaksi/pengguna/:id/peran mengembalikan data jika berhasil', async () => {
      ModelPengguna.ubahPeran.mockResolvedValue({ id: 8, peran_id: 1 });

      const response = await callAsAdmin('patch', '/api/redaksi/pengguna/8/peran', {
        body: { peran_id: 1 },
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(8);
    });

    it('PATCH /api/redaksi/pengguna/:id/peran meneruskan error', async () => {
      ModelPengguna.ubahPeran.mockRejectedValue(new Error('ubah peran gagal'));

      const response = await callAsAdmin('patch', '/api/redaksi/pengguna/8/peran', {
        body: { peran_id: 1 },
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('ubah peran gagal');
    });

    it('PUT /api/redaksi/pengguna/:id mengembalikan 404 jika tidak ditemukan', async () => {
      ModelPengguna.simpanPengguna.mockResolvedValue(null);

      const response = await callAsAdmin('put', '/api/redaksi/pengguna/3', {
        body: { nama: 'Baru' },
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('PUT /api/redaksi/pengguna/:id mengembalikan data jika berhasil', async () => {
      ModelPengguna.simpanPengguna.mockResolvedValue({ id: 3, nama: 'Baru' });

      const response = await callAsAdmin('put', '/api/redaksi/pengguna/3', {
        body: { nama: 'Baru' },
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/redaksi/pengguna/:id meneruskan error', async () => {
      ModelPengguna.simpanPengguna.mockRejectedValue(new Error('simpan pengguna gagal'));

      const response = await callAsAdmin('put', '/api/redaksi/pengguna/3', {
        body: { nama: 'Baru' },
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('simpan pengguna gagal');
    });

    it('GET /api/redaksi/pengguna/peran mengembalikan daftar peran', async () => {
      ModelPengguna.daftarPeran.mockResolvedValue([{ id: 1, kode: 'admin' }]);

      const response = await callAsAdmin('get', '/api/redaksi/pengguna/peran');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/redaksi/pengguna/peran meneruskan error', async () => {
      ModelPengguna.daftarPeran.mockRejectedValue(new Error('peran gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/pengguna/peran');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('peran gagal');
    });
  });

  describe('statistik', () => {
    it('GET /api/redaksi/statistik mengembalikan ringkasan', async () => {
      ModelLema.hitungTotal.mockResolvedValue(10);
      ModelGlosarium.hitungTotal.mockResolvedValue(20);
      ModelTesaurus.hitungTotal.mockResolvedValue(30);
      ModelPengguna.hitungTotal.mockResolvedValue(40);
      ModelKomentar.hitungTotal.mockResolvedValue(50);

      const response = await callAsAdmin('get', '/api/redaksi/statistik');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        entri: 10,
        glosarium: 20,
        tesaurus: 30,
        pengguna: 40,
        komentar: 50,
      });
    });

    it('GET /api/redaksi/statistik meneruskan error', async () => {
      ModelLema.hitungTotal.mockRejectedValue(new Error('statistik gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/statistik');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('statistik gagal');
    });
  });

  describe('kamus', () => {
    it('GET /api/redaksi/kamus mengembalikan data daftar', async () => {
      ModelLema.daftarAdmin.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

      const response = await callAsAdmin('get', '/api/redaksi/kamus?limit=300&offset=-2&q= kata ');

      expect(response.status).toBe(200);
      expect(ModelLema.daftarAdmin).toHaveBeenCalledWith({ limit: 200, offset: 0, q: 'kata' });
    });

    it('GET /api/redaksi/kamus meneruskan error', async () => {
      ModelLema.daftarAdmin.mockRejectedValue(new Error('daftar lema gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/kamus');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('daftar lema gagal');
    });

    it('GET /api/redaksi/kamus/:id mengembalikan 404 jika data null', async () => {
      ModelLema.ambilDenganId.mockResolvedValue(null);

      const response = await callAsAdmin('get', '/api/redaksi/kamus/11');

      expect(response.status).toBe(404);
    });

    it('GET /api/redaksi/kamus/:id mengembalikan data jika ditemukan', async () => {
      ModelLema.ambilDenganId.mockResolvedValue({ id: 11, lema: 'kata' });

      const response = await callAsAdmin('get', '/api/redaksi/kamus/11');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/redaksi/kamus/:id meneruskan error', async () => {
      ModelLema.ambilDenganId.mockRejectedValue(new Error('detail lema gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/kamus/11');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('detail lema gagal');
    });

    it('POST /api/redaksi/kamus validasi lema dan jenis', async () => {
      const noLema = await callAsAdmin('post', '/api/redaksi/kamus', {
        body: { lema: ' ', jenis: 'dasar' },
      });
      const noJenis = await callAsAdmin('post', '/api/redaksi/kamus', {
        body: { lema: 'kata' },
      });

      expect(noLema.status).toBe(400);
      expect(noJenis.status).toBe(400);
    });

    it('POST/PUT /api/redaksi/kamus validasi saat entri dan lema keduanya tidak dikirim', async () => {
      const postNoEntri = await callAsAdmin('post', '/api/redaksi/kamus', {
        body: { jenis: 'dasar' },
      });
      const putNoEntri = await callAsAdmin('put', '/api/redaksi/kamus/12', {
        body: { jenis: 'dasar' },
      });

      expect(postNoEntri.status).toBe(400);
      expect(postNoEntri.body.message).toBe('Entri wajib diisi');
      expect(putNoEntri.status).toBe(400);
      expect(putNoEntri.body.message).toBe('Entri wajib diisi');
    });

    it('POST /api/redaksi/kamus mengembalikan 201 saat berhasil', async () => {
      ModelLema.simpan.mockResolvedValue({ id: 12, lema: 'kata' });

      const response = await callAsAdmin('post', '/api/redaksi/kamus', {
        body: { lema: 'kata', jenis: 'dasar' },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('POST/PUT /api/redaksi/kamus memakai field entri bila tersedia', async () => {
      ModelLema.simpan
        .mockResolvedValueOnce({ id: 77, entri: 'baku', jenis: 'dasar' })
        .mockResolvedValueOnce({ id: 77, entri: 'baku', jenis: 'dasar' });

      const post = await callAsAdmin('post', '/api/redaksi/kamus', {
        body: { entri: '  baku ', jenis: 'dasar' },
      });
      const put = await callAsAdmin('put', '/api/redaksi/kamus/77', {
        body: { entri: '  baku ', jenis: 'dasar' },
      });

      expect(post.status).toBe(201);
      expect(put.status).toBe(200);
      expect(ModelLema.simpan).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ entri: 'baku', jenis: 'dasar' })
      );
      expect(ModelLema.simpan).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: 77, entri: 'baku', jenis: 'dasar' })
      );
    });

    it('POST /api/redaksi/kamus meneruskan error', async () => {
      ModelLema.simpan.mockRejectedValue(new Error('simpan lema gagal'));

      const response = await callAsAdmin('post', '/api/redaksi/kamus', {
        body: { lema: 'kata', jenis: 'dasar' },
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('simpan lema gagal');
    });

    it('PUT /api/redaksi/kamus/:id validasi dan cabang hasil', async () => {
      const noLema = await callAsAdmin('put', '/api/redaksi/kamus/12', {
        body: { lema: ' ', jenis: 'dasar' },
      });
      const noJenis = await callAsAdmin('put', '/api/redaksi/kamus/12', {
        body: { lema: 'kata' },
      });

      ModelLema.simpan.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 12, lema: 'kata' });

      const notFound = await callAsAdmin('put', '/api/redaksi/kamus/12', {
        body: { lema: 'kata', jenis: 'dasar' },
      });
      const success = await callAsAdmin('put', '/api/redaksi/kamus/12', {
        body: { lema: 'kata', jenis: 'dasar' },
      });

      expect(noLema.status).toBe(400);
      expect(noJenis.status).toBe(400);
      expect(notFound.status).toBe(404);
      expect(success.status).toBe(200);
    });

    it('PUT /api/redaksi/kamus/:id meneruskan error', async () => {
      ModelLema.simpan.mockRejectedValue(new Error('update lema gagal'));

      const response = await callAsAdmin('put', '/api/redaksi/kamus/12', {
        body: { lema: 'kata', jenis: 'dasar' },
      });

      expect(response.status).toBe(500);
    });

    it('DELETE /api/redaksi/kamus/:id mengembalikan 404 dan success', async () => {
      ModelLema.hapus.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const notFound = await callAsAdmin('delete', '/api/redaksi/kamus/12');
      const success = await callAsAdmin('delete', '/api/redaksi/kamus/12');

      expect(notFound.status).toBe(404);
      expect(success.status).toBe(200);
    });

    it('DELETE /api/redaksi/kamus/:id meneruskan error', async () => {
      ModelLema.hapus.mockRejectedValue(new Error('hapus lema gagal'));

      const response = await callAsAdmin('delete', '/api/redaksi/kamus/12');

      expect(response.status).toBe(500);
    });

    it('GET /api/redaksi/kamus/:lemaId/makna merangkai makna dan contoh', async () => {
      ModelLema.ambilMakna.mockResolvedValue([{ id: 1, makna: 'arti' }]);
      ModelLema.ambilContoh.mockResolvedValue([{ id: 4, makna_id: 1, contoh: 'contoh' }]);

      const response = await callAsAdmin('get', '/api/redaksi/kamus/5/makna');

      expect(response.status).toBe(200);
      expect(response.body.data[0].contoh).toHaveLength(1);
    });

    it('GET /api/redaksi/kamus/:lemaId/makna mengelompokkan banyak contoh dan memberi fallback array kosong', async () => {
      ModelLema.ambilMakna.mockResolvedValue([
        { id: 1, makna: 'arti 1' },
        { id: 2, makna: 'arti 2' },
      ]);
      ModelLema.ambilContoh.mockResolvedValue([
        { id: 4, makna_id: 1, contoh: 'contoh 1' },
        { id: 5, makna_id: 1, contoh: 'contoh 2' },
      ]);

      const response = await callAsAdmin('get', '/api/redaksi/kamus/5/makna');

      expect(response.status).toBe(200);
      expect(response.body.data[0].contoh).toHaveLength(2);
      expect(response.body.data[1].contoh).toEqual([]);
    });

    it('GET /api/redaksi/kamus/:lemaId/makna meneruskan error', async () => {
      ModelLema.ambilMakna.mockRejectedValue(new Error('ambil makna gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/kamus/5/makna');

      expect(response.status).toBe(500);
    });

    it('POST/PUT/DELETE makna menangani validasi, notfound, success, dan error', async () => {
      const postInvalid = await callAsAdmin('post', '/api/redaksi/kamus/5/makna', { body: { makna: ' ' } });
      ModelLema.simpanMakna.mockResolvedValueOnce({ id: 20 }).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 21 });
      const postSuccess = await callAsAdmin('post', '/api/redaksi/kamus/5/makna', { body: { makna: 'arti' } });
      const putInvalid = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20', { body: { makna: ' ' } });
      const putNotFound = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20', { body: { makna: 'arti' } });
      const putSuccess = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20', { body: { makna: 'arti' } });
      ModelLema.hapusMakna.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const deleteNotFound = await callAsAdmin('delete', '/api/redaksi/kamus/5/makna/20');
      const deleteSuccess = await callAsAdmin('delete', '/api/redaksi/kamus/5/makna/20');

      ModelLema.simpanMakna.mockRejectedValueOnce(new Error('makna gagal'));
      const postError = await callAsAdmin('post', '/api/redaksi/kamus/5/makna', { body: { makna: 'arti' } });
      ModelLema.hapusMakna.mockRejectedValueOnce(new Error('hapus makna gagal'));
      const deleteError = await callAsAdmin('delete', '/api/redaksi/kamus/5/makna/20');

      expect(postInvalid.status).toBe(400);
      expect(postSuccess.status).toBe(201);
      expect(putInvalid.status).toBe(400);
      expect(putNotFound.status).toBe(404);
      expect(putSuccess.status).toBe(200);
      expect(deleteNotFound.status).toBe(404);
      expect(deleteSuccess.status).toBe(200);
      expect(postError.status).toBe(500);
      expect(deleteError.status).toBe(500);
    });

    it('PUT /api/redaksi/kamus/:lemaId/makna/:maknaId meneruskan error', async () => {
      ModelLema.simpanMakna.mockRejectedValue(new Error('update makna gagal'));

      const response = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20', {
        body: { makna: 'arti' },
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('update makna gagal');
    });

    it('POST/PUT/DELETE contoh menangani validasi, notfound, success, dan error', async () => {
      const postInvalid = await callAsAdmin('post', '/api/redaksi/kamus/5/makna/20/contoh', { body: { contoh: ' ' } });
      ModelLema.simpanContoh.mockResolvedValueOnce({ id: 50 }).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 50 });
      const postSuccess = await callAsAdmin('post', '/api/redaksi/kamus/5/makna/20/contoh', { body: { contoh: 'contoh' } });
      const putInvalid = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20/contoh/50', { body: { contoh: ' ' } });
      const putNotFound = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20/contoh/50', { body: { contoh: 'contoh' } });
      const putSuccess = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20/contoh/50', { body: { contoh: 'contoh' } });
      ModelLema.hapusContoh.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const deleteNotFound = await callAsAdmin('delete', '/api/redaksi/kamus/5/makna/20/contoh/50');
      const deleteSuccess = await callAsAdmin('delete', '/api/redaksi/kamus/5/makna/20/contoh/50');

      ModelLema.simpanContoh.mockRejectedValueOnce(new Error('contoh gagal'));
      const postError = await callAsAdmin('post', '/api/redaksi/kamus/5/makna/20/contoh', { body: { contoh: 'contoh' } });
      ModelLema.hapusContoh.mockRejectedValueOnce(new Error('hapus contoh gagal'));
      const deleteError = await callAsAdmin('delete', '/api/redaksi/kamus/5/makna/20/contoh/50');

      expect(postInvalid.status).toBe(400);
      expect(postSuccess.status).toBe(201);
      expect(putInvalid.status).toBe(400);
      expect(putNotFound.status).toBe(404);
      expect(putSuccess.status).toBe(200);
      expect(deleteNotFound.status).toBe(404);
      expect(deleteSuccess.status).toBe(200);
      expect(postError.status).toBe(500);
      expect(deleteError.status).toBe(500);
    });

    it('PUT /api/redaksi/kamus/:lemaId/makna/:maknaId/contoh/:contohId meneruskan error', async () => {
      ModelLema.simpanContoh.mockRejectedValue(new Error('update contoh gagal'));

      const response = await callAsAdmin('put', '/api/redaksi/kamus/5/makna/20/contoh/50', {
        body: { contoh: 'contoh' },
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('update contoh gagal');
    });
  });

  describe('komentar', () => {
    it('GET /api/redaksi/komentar mengembalikan daftar komentar', async () => {
      ModelKomentar.daftarAdmin.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

      const response = await callAsAdmin('get', '/api/redaksi/komentar?limit=25&offset=5&q=kata');

      expect(response.status).toBe(200);
      expect(ModelKomentar.daftarAdmin).toHaveBeenCalledWith({ limit: 25, offset: 5, q: 'kata' });
      expect(response.body.total).toBe(1);
    });

    it('GET /api/redaksi/komentar/:id mengembalikan 404 jika komentar tidak ditemukan', async () => {
      ModelKomentar.ambilDenganId.mockResolvedValue(null);

      const response = await callAsAdmin('get', '/api/redaksi/komentar/9');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Komentar tidak ditemukan');
    });

    it('PUT /api/redaksi/komentar/:id validasi komentar wajib', async () => {
      const response = await callAsAdmin('put', '/api/redaksi/komentar/9', {
        body: { komentar: '   ', aktif: true },
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Komentar wajib diisi');
    });

    it('PUT /api/redaksi/komentar/:id menyimpan komentar jika valid', async () => {
      ModelKomentar.simpanAdmin.mockResolvedValue({ id: 9, komentar: 'baru', aktif: true });

      const response = await callAsAdmin('put', '/api/redaksi/komentar/9', {
        body: { komentar: 'baru', aktif: true },
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(ModelKomentar.simpanAdmin).toHaveBeenCalledWith({ id: 9, komentar: 'baru', aktif: true });
    });
  });

  describe('tesaurus', () => {
    it('CRUD /api/redaksi/tesaurus mencakup cabang utama', async () => {
      ModelTesaurus.daftarAdmin.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      const list = await callAsAdmin('get', '/api/redaksi/tesaurus?limit=10&offset=1&q=akt');

      ModelTesaurus.ambilDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, lema: 'aktif' });
      const detail404 = await callAsAdmin('get', '/api/redaksi/tesaurus/1');
      const detail200 = await callAsAdmin('get', '/api/redaksi/tesaurus/1');

      const post400 = await callAsAdmin('post', '/api/redaksi/tesaurus', { body: { lema: ' ' } });
      ModelTesaurus.simpan.mockResolvedValueOnce({ id: 1, lema: 'aktif' }).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, lema: 'aktif' });
      const post201 = await callAsAdmin('post', '/api/redaksi/tesaurus', { body: { lema: 'aktif' } });
      const put400 = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { lema: ' ' } });
      const put404 = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { lema: 'aktif' } });
      const put200 = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { lema: 'aktif' } });

      ModelTesaurus.hapus.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const delete404 = await callAsAdmin('delete', '/api/redaksi/tesaurus/1');
      const delete200 = await callAsAdmin('delete', '/api/redaksi/tesaurus/1');

      expect(list.status).toBe(200);
      expect(detail404.status).toBe(404);
      expect(detail200.status).toBe(200);
      expect(post400.status).toBe(400);
      expect(post201.status).toBe(201);
      expect(put400.status).toBe(400);
      expect(put404.status).toBe(404);
      expect(put200.status).toBe(200);
      expect(delete404.status).toBe(404);
      expect(delete200.status).toBe(200);
    });

    it('CRUD /api/redaksi/tesaurus meneruskan error', async () => {
      ModelTesaurus.daftarAdmin.mockRejectedValueOnce(new Error('tesaurus list gagal'));
      ModelTesaurus.ambilDenganId.mockRejectedValueOnce(new Error('tesaurus detail gagal'));
      ModelTesaurus.simpan.mockRejectedValueOnce(new Error('tesaurus simpan gagal')).mockRejectedValueOnce(new Error('tesaurus update gagal'));
      ModelTesaurus.hapus.mockRejectedValueOnce(new Error('tesaurus hapus gagal'));

      const list = await callAsAdmin('get', '/api/redaksi/tesaurus');
      const detail = await callAsAdmin('get', '/api/redaksi/tesaurus/1');
      const post = await callAsAdmin('post', '/api/redaksi/tesaurus', { body: { lema: 'aktif' } });
      const put = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { lema: 'aktif' } });
      const del = await callAsAdmin('delete', '/api/redaksi/tesaurus/1');

      expect(list.status).toBe(500);
      expect(detail.status).toBe(500);
      expect(post.status).toBe(500);
      expect(put.status).toBe(500);
      expect(del.status).toBe(500);
    });
  });

  describe('glosarium', () => {
    it('CRUD /api/redaksi/glosarium mencakup cabang utama', async () => {
      ModelGlosarium.cari.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      const list = await callAsAdmin('get', '/api/redaksi/glosarium?limit=10&offset=1&q=istilah');

      ModelGlosarium.ambilDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, indonesia: 'istilah' });
      const detail404 = await callAsAdmin('get', '/api/redaksi/glosarium/1');
      const detail200 = await callAsAdmin('get', '/api/redaksi/glosarium/1');

      const post400Indonesia = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: ' ', asing: 'term' } });
      const post400Asing = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: ' ' } });

      ModelGlosarium.simpan.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
      const post201 = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: 'term' } });

      const put400Indonesia = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: ' ', asing: 'term' } });
      const put400Asing = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: ' ' } });
      const put404 = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: 'term' } });
      const put200 = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: 'term' } });

      ModelGlosarium.hapus.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const delete404 = await callAsAdmin('delete', '/api/redaksi/glosarium/1');
      const delete200 = await callAsAdmin('delete', '/api/redaksi/glosarium/1');

      expect(list.status).toBe(200);
      expect(detail404.status).toBe(404);
      expect(detail200.status).toBe(200);
      expect(post400Indonesia.status).toBe(400);
      expect(post400Asing.status).toBe(400);
      expect(post201.status).toBe(201);
      expect(put400Indonesia.status).toBe(400);
      expect(put400Asing.status).toBe(400);
      expect(put404.status).toBe(404);
      expect(put200.status).toBe(200);
      expect(delete404.status).toBe(404);
      expect(delete200.status).toBe(200);
    });

    it('POST/PUT /api/redaksi/glosarium memakai updater default saat email admin tidak tersedia', async () => {
      ModelGlosarium.simpan.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 1 });

      const post = await callAsAdmin('post', '/api/redaksi/glosarium', {
        tokenPayload: { email: undefined },
        body: { indonesia: 'istilah', asing: 'term' },
      });
      const put = await callAsAdmin('put', '/api/redaksi/glosarium/1', {
        tokenPayload: { email: undefined },
        body: { indonesia: 'istilah', asing: 'term' },
      });

      expect(post.status).toBe(201);
      expect(put.status).toBe(200);
      expect(ModelGlosarium.simpan).toHaveBeenNthCalledWith(1, { indonesia: 'istilah', asing: 'term' }, 'admin');
      expect(ModelGlosarium.simpan).toHaveBeenNthCalledWith(2, { indonesia: 'istilah', asing: 'term', id: 1 }, 'admin');
    });

    it('CRUD /api/redaksi/glosarium meneruskan error', async () => {
      ModelGlosarium.cari.mockRejectedValueOnce(new Error('glosarium list gagal'));
      ModelGlosarium.ambilDenganId.mockRejectedValueOnce(new Error('glosarium detail gagal'));
      ModelGlosarium.simpan
        .mockRejectedValueOnce(new Error('glosarium simpan gagal'))
        .mockRejectedValueOnce(new Error('glosarium update gagal'));
      ModelGlosarium.hapus.mockRejectedValueOnce(new Error('glosarium hapus gagal'));

      const list = await callAsAdmin('get', '/api/redaksi/glosarium');
      const detail = await callAsAdmin('get', '/api/redaksi/glosarium/1');
      const post = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: 'term' } });
      const put = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: 'term' } });
      const del = await callAsAdmin('delete', '/api/redaksi/glosarium/1');

      expect(list.status).toBe(500);
      expect(detail.status).toBe(500);
      expect(post.status).toBe(500);
      expect(put.status).toBe(500);
      expect(del.status).toBe(500);
    });
  });

  describe('label', () => {
    it('CRUD /api/redaksi/label mencakup cabang utama', async () => {
      ModelLabel.daftarAdmin.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      const list = await callAsAdmin('get', '/api/redaksi/label?limit=10&offset=1&q=ragam');

      ModelLabel.ambilDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, nama: 'ragam resmi' });
      const detail404 = await callAsAdmin('get', '/api/redaksi/label/1');
      const detail200 = await callAsAdmin('get', '/api/redaksi/label/1');

      const post400Kategori = await callAsAdmin('post', '/api/redaksi/label', { body: { kategori: ' ', kode: 'R', nama: 'Ragam' } });
      const post400Kode = await callAsAdmin('post', '/api/redaksi/label', { body: { kategori: 'ragam', kode: ' ', nama: 'Ragam' } });
      const post400Nama = await callAsAdmin('post', '/api/redaksi/label', { body: { kategori: 'ragam', kode: 'R', nama: ' ' } });

      ModelLabel.simpan.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 });
      const post201 = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam resmi' },
      });

      const put400Kategori = await callAsAdmin('put', '/api/redaksi/label/1', { body: { kategori: ' ', kode: 'R', nama: 'Ragam' } });
      const put400Kode = await callAsAdmin('put', '/api/redaksi/label/1', { body: { kategori: 'ragam', kode: ' ', nama: 'Ragam' } });
      const put400Nama = await callAsAdmin('put', '/api/redaksi/label/1', { body: { kategori: 'ragam', kode: 'R', nama: ' ' } });
      const put404 = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam resmi' },
      });
      const put200 = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam resmi' },
      });

      ModelLabel.hapus.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const delete404 = await callAsAdmin('delete', '/api/redaksi/label/1');
      const delete200 = await callAsAdmin('delete', '/api/redaksi/label/1');

      expect(list.status).toBe(200);
      expect(detail404.status).toBe(404);
      expect(detail200.status).toBe(200);
      expect(post400Kategori.status).toBe(400);
      expect(post400Kode.status).toBe(400);
      expect(post400Nama.status).toBe(400);
      expect(post201.status).toBe(201);
      expect(put400Kategori.status).toBe(400);
      expect(put400Kode.status).toBe(400);
      expect(put400Nama.status).toBe(400);
      expect(put404.status).toBe(404);
      expect(put200.status).toBe(200);
      expect(delete404.status).toBe(404);
      expect(delete200.status).toBe(200);
    });

    it('CRUD /api/redaksi/label meneruskan error', async () => {
      ModelLabel.daftarAdmin.mockRejectedValueOnce(new Error('label list gagal'));
      ModelLabel.ambilDenganId.mockRejectedValueOnce(new Error('label detail gagal'));
      ModelLabel.simpan
        .mockRejectedValueOnce(new Error('label simpan gagal'))
        .mockRejectedValueOnce(new Error('label update gagal'));
      ModelLabel.hapus.mockRejectedValueOnce(new Error('label hapus gagal'));

      const list = await callAsAdmin('get', '/api/redaksi/label');
      const detail = await callAsAdmin('get', '/api/redaksi/label/1');
      const post = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam resmi' },
      });
      const put = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam resmi' },
      });
      const del = await callAsAdmin('delete', '/api/redaksi/label/1');

      expect(list.status).toBe(500);
      expect(detail.status).toBe(500);
      expect(post.status).toBe(500);
      expect(put.status).toBe(500);
      expect(del.status).toBe(500);
    });
  });
});

