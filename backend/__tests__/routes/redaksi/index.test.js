/**
 * @fileoverview Test route redaksi (admin API)
 * @tested_in backend/routes/redaksi/
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../../models/akses/modelPengguna', () => ({
  daftarPengguna: jest.fn(),
  ambilDenganId: jest.fn(),
  ubahPeran: jest.fn(),
  simpanPengguna: jest.fn(),
  daftarPeran: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelEntri', () => ({
  daftarAdmin: jest.fn(),
  cariIndukAdmin: jest.fn(),
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

jest.mock('../../../models/leksikon/modelTesaurus', () => ({
  daftarAdmin: jest.fn(),
  daftarAdminCursor: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelEtimologi', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/artikel/modelArtikel', () => ({
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelGlosarium', () => ({
  cari: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  hitungTotalBidang: jest.fn(),
  hitungTotalBahasa: jest.fn(),
  hitungTotalSumber: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelKataHariIni', () => ({
  hitungTotal: jest.fn(),
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpanByTanggal: jest.fn(),
  hapus: jest.fn(),
}));

jest.mock('../../../models/master/modelOpsi', () => ({
  daftarLookupBidang: jest.fn(),
  daftarLookupBahasa: jest.fn(),
  daftarLookupSumber: jest.fn(),
  daftarMasterBidang: jest.fn(),
  daftarMasterBahasa: jest.fn(),
  daftarMasterSumber: jest.fn(),
  ambilMasterBidangDenganId: jest.fn(),
  ambilMasterBahasaDenganId: jest.fn(),
  ambilMasterSumberDenganId: jest.fn(),
  simpanMasterBidang: jest.fn(),
  simpanMasterBahasa: jest.fn(),
  simpanMasterSumber: jest.fn(),
  hapusMasterBidang: jest.fn(),
  hapusMasterBahasa: jest.fn(),
  hapusMasterSumber: jest.fn(),
}));

jest.mock('../../../models/master/modelLabel', () => ({
  daftarAdmin: jest.fn(),
  daftarAdminCursor: jest.fn(),
  ambilKategoriUntukRedaksi: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/interaksi/modelKomentar', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpanAdmin: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/interaksi/modelPencarian', () => ({
  ambilStatistikRedaksi: jest.fn(),
  hitungTotalKataHarian: jest.fn(),
}));

jest.mock('../../../models/gim/modelSusunKata', () => ({
  hitungPesertaHarian: jest.fn(),
  hitungPesertaBebasHarian: jest.fn(),
}));

jest.mock('../../../models/gim/modelKuisKata', () => ({
  hitungPesertaHarian: jest.fn(),
}));

jest.mock('../../../models/audit/modelAuditMakna', () => ({
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/master/modelTagar', () => ({
  hitungTotalBelumBertagar: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/interaksi/modelPencarianHitam', () => ({
  hitungTotal: jest.fn(),
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
}));

jest.mock('../../../models/akses/modelPeran', () => ({
  hitungTotal: jest.fn(),
  daftarPeran: jest.fn(),
  ambilDenganId: jest.fn(),
  daftarIzin: jest.fn(),
  simpan: jest.fn(),
}));

jest.mock('../../../models/akses/modelIzin', () => ({
  hitungTotal: jest.fn(),
  daftarIzin: jest.fn(),
  ambilDenganId: jest.fn(),
  daftarPeran: jest.fn(),
  simpan: jest.fn(),
}));

jest.mock('../../../models/kadi/modelKandidatEntri', () => ({
  hitungTotal: jest.fn(),
}));

jest.mock('../../../models/wordnet/modelSinset', () => ({
  statistik: jest.fn(),
  daftarTipeRelasi: jest.fn(),
  daftar: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  tambahLema: jest.fn(),
  ambilKandidatMakna: jest.fn(),
  simpanPemetaanLema: jest.fn(),
  hitungTotal: jest.fn(),
}));

jest.mock('../../../services/publik/layananKamusPublik', () => ({
  ambilDetailKamus: jest.fn(),
  hapusCacheDetailKamus: jest.fn(),
  hapusCacheKataHariIni: jest.fn(),
  __private: {
    ambilMaknaUtama: jest.fn(),
    bentukPayloadKataHariIni: jest.fn(),
  },
}));

jest.mock('../../../services/publik/layananGlosariumPublik', () => ({
  invalidasiCacheDetailGlosarium: jest.fn(),
}));

const ModelPengguna = require('../../../models/akses/modelPengguna');
const ModelLema = require('../../../models/leksikon/modelEntri');
const ModelTesaurus = require('../../../models/leksikon/modelTesaurus');
const ModelEtimologi = require('../../../models/leksikon/modelEtimologi');
const ModelArtikel = require('../../../models/artikel/modelArtikel');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const ModelKataHariIni = require('../../../models/leksikon/modelKataHariIni');
const ModelOpsi = require('../../../models/master/modelOpsi');
const ModelLabel = require('../../../models/master/modelLabel');
const ModelKomentar = require('../../../models/interaksi/modelKomentar');
const ModelPencarian = require('../../../models/interaksi/modelPencarian');
const ModelSusunKata = require('../../../models/gim/modelSusunKata');
const ModelKuisKata = require('../../../models/gim/modelKuisKata');
const ModelAuditMakna = require('../../../models/audit/modelAuditMakna');
const ModelTagar = require('../../../models/master/modelTagar');
const ModelPencarianHitam = require('../../../models/interaksi/modelPencarianHitam');
const ModelPeran = require('../../../models/akses/modelPeran');
const ModelIzin = require('../../../models/akses/modelIzin');
const ModelKandidatEntri = require('../../../models/kadi/modelKandidatEntri');
const ModelSinset = require('../../../models/wordnet/modelSinset');
const {
  ambilDetailKamus,
  hapusCacheDetailKamus,
  hapusCacheKataHariIni,
  __private: kataHariIniUtils,
} = require('../../../services/publik/layananKamusPublik');
const { invalidasiCacheDetailGlosarium } = require('../../../services/publik/layananGlosariumPublik');
const rootRouter = require('../../../routes');

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
      izin: [
        'kelola_pengguna',
        'kelola_peran',
        'lihat_statistik',
        'lihat_pencarian',
        'lihat_tesaurus',
        'tambah_tesaurus',
        'edit_tesaurus',
        'hapus_tesaurus',
        'kelola_komentar',
        'kelola_label',
        'lihat_entri',
        'kelola_susun_kata',
        'tambah_entri',
        'edit_entri',
        'hapus_entri',
        'tambah_makna',
        'edit_makna',
        'audit_makna',
        'hapus_makna',
        'tambah_contoh',
        'edit_contoh',
        'hapus_contoh',
        'lihat_glosarium',
        'tambah_glosarium',
        'edit_glosarium',
        'hapus_glosarium',
        'kelola_sinset',
      ],
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
      expect(ModelPengguna.daftarPengguna).toHaveBeenCalledWith({
        limit: 9,
        offset: 0,
        q: '',
        aktif: '',
        peran_id: '',
      });
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

    it('GET /api/redaksi/pengguna/:id mengembalikan 404, 200, dan 500 sesuai hasil model', async () => {
      ModelPengguna.ambilDenganId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 8, nama: 'Admin' })
        .mockRejectedValueOnce(new Error('detail pengguna gagal'));

      const notFound = await callAsAdmin('get', '/api/redaksi/pengguna/8');
      const success = await callAsAdmin('get', '/api/redaksi/pengguna/8');
      const error = await callAsAdmin('get', '/api/redaksi/pengguna/8');

      expect(notFound.status).toBe(404);
      expect(success.status).toBe(200);
      expect(success.body.data.id).toBe(8);
      expect(error.status).toBe(500);
      expect(error.body.error).toBe('detail pengguna gagal');
    });

    it('GET /api/redaksi/pengguna meneruskan aktif valid', async () => {
      ModelPengguna.daftarPengguna.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/pengguna?aktif=1');

      expect(response.status).toBe(200);
      expect(ModelPengguna.daftarPengguna).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        q: '',
        aktif: '1',
        peran_id: '',
      });
    });

    it('GET /api/redaksi/pengguna meneruskan peran_id valid dan mengabaikan yang tidak valid', async () => {
      ModelPengguna.daftarPengguna.mockResolvedValue({ data: [], total: 0 });

      const validResponse = await callAsAdmin('get', '/api/redaksi/pengguna?peran_id=3');
      const invalidResponse = await callAsAdmin('get', '/api/redaksi/pengguna?peran_id=abc');

      expect(validResponse.status).toBe(200);
      expect(invalidResponse.status).toBe(200);
      expect(ModelPengguna.daftarPengguna).toHaveBeenNthCalledWith(1, {
        limit: 50,
        offset: 0,
        q: '',
        aktif: '',
        peran_id: 3,
      });
      expect(ModelPengguna.daftarPengguna).toHaveBeenNthCalledWith(2, {
        limit: 50,
        offset: 0,
        q: '',
        aktif: '',
        peran_id: '',
      });
    });
  });

  describe('sinset', () => {
    it('GET /api/redaksi/sinset/:id/opsi-lema mengembalikan kosong saat q kosong', async () => {
      const response = await callAsAdmin('get', '/api/redaksi/sinset/01316949-n/opsi-lema?q=   ');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(ModelLema.cariIndukAdmin).not.toHaveBeenCalled();
    });

    it('GET /api/redaksi/sinset/:id/opsi-lema meneruskan q dan limit', async () => {
      ModelLema.cariIndukAdmin.mockResolvedValue([{ id: 4, entri: 'hewan', indeks: 'hewan' }]);

      const response = await callAsAdmin('get', '/api/redaksi/sinset/01316949-n/opsi-lema?q=hew&limit=99');

      expect(response.status).toBe(200);
      expect(ModelLema.cariIndukAdmin).toHaveBeenCalledWith('hew', { limit: 20, excludeId: null });
      expect(response.body.data).toHaveLength(1);
    });

    it('POST /api/redaksi/sinset/:id/lema memvalidasi entri_id', async () => {
      const response = await callAsAdmin('post', '/api/redaksi/sinset/01316949-n/lema', {
        body: {},
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Entri kamus wajib dipilih');
    });

    it('POST /api/redaksi/sinset/:id/lema mengembalikan 201 saat berhasil', async () => {
      ModelSinset.tambahLema.mockResolvedValue({
        data: { id: 7, sinset_id: '01316949-n', lema: 'hewan pekerja', entri_id: 55, urutan: 0, makna_id: null, terverifikasi: false, sumber: 'redaksi' },
      });

      const response = await callAsAdmin('post', '/api/redaksi/sinset/01316949-n/lema', {
        body: { entri_id: 55 },
      });

      expect(response.status).toBe(201);
      expect(ModelSinset.tambahLema).toHaveBeenCalledWith('01316949-n', {
        entri_id: 55,
        urutan: undefined,
        sumber: undefined,
      });
    });

    it('POST /api/redaksi/sinset/:id/lema mengembalikan konflik saat duplikat', async () => {
      ModelSinset.tambahLema.mockResolvedValue({ error: 'duplicate', data: { id: 7 } });

      const response = await callAsAdmin('post', '/api/redaksi/sinset/01316949-n/lema', {
        body: { entri_id: 55 },
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Lema sudah ada pada sinset ini');
    });
  });

  describe('statistik', () => {
    it('GET /api/redaksi/statistik mengembalikan ringkasan', async () => {
      ModelLema.hitungTotal.mockResolvedValue(10);
      ModelGlosarium.hitungTotal.mockResolvedValue(20);
      ModelTesaurus.hitungTotal.mockResolvedValue(30);
      ModelEtimologi.hitungTotal.mockResolvedValue(35);
      ModelArtikel.hitungTotal.mockResolvedValue(41);
      ModelSusunKata.hitungPesertaHarian.mockResolvedValue(15);
      ModelSusunKata.hitungPesertaBebasHarian.mockResolvedValue(25);
      ModelKuisKata.hitungPesertaHarian.mockResolvedValue(17);
      ModelAuditMakna.hitungTotal.mockResolvedValue(95);
      ModelTagar.hitungTotalBelumBertagar.mockResolvedValue(45);
      ModelTagar.hitungTotal.mockResolvedValue(145);
      ModelLabel.hitungTotal.mockResolvedValue(40);
      ModelGlosarium.hitungTotalBidang.mockResolvedValue(70);
      ModelGlosarium.hitungTotalBahasa.mockResolvedValue(71);
      ModelGlosarium.hitungTotalSumber.mockResolvedValue(80);
      ModelPeran.hitungTotal.mockResolvedValue(81);
      ModelIzin.hitungTotal.mockResolvedValue(82);
      ModelPengguna.hitungTotal.mockResolvedValue(50);
      ModelKomentar.hitungTotal.mockResolvedValue(60);
      ModelKandidatEntri.hitungTotal.mockResolvedValue(61);
      ModelPencarian.hitungTotalKataHarian.mockResolvedValue(90);
      ModelPencarianHitam.hitungTotal.mockResolvedValue(12);
      ModelSinset.hitungTotal.mockResolvedValue(110752);
      ModelKataHariIni.hitungTotal.mockResolvedValue(31);

      const response = await callAsAdmin('get', '/api/redaksi/statistik');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        entri: 10,
        glosarium: 20,
        tesaurus: 30,
        etimologi: 35,
        artikel: 41,
        susunKataHarian: 15,
        susunKataBebas: 25,
        kuisKata: 17,
        auditMakna: 95,
        auditTagar: 45,
        tagar: 145,
        label: 40,
        bidang: 70,
        bahasa: 71,
        sumber: 80,
        peran: 81,
        izin: 82,
        pengguna: 50,
        komentar: 60,
        kandidatKata: 61,
        pencarian: 90,
        pencarianHitam: 12,
        sinset: 110752,
        kataHariIni: 31,
      });
    });

    it('GET /api/redaksi/statistik meneruskan error', async () => {
      ModelLema.hitungTotal.mockRejectedValue(new Error('statistik gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/statistik');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('statistik gagal');
    });

    it('GET /api/redaksi/statistik/pencarian mengembalikan statistik tracking', async () => {
      ModelPencarian.ambilStatistikRedaksi.mockResolvedValue({
        filter: { domain: 1, periode: '7hari', limit: 50 },
        ringkasanDomain: [{ domain: 1, domain_nama: 'kamus', jumlah: 99 }],
        data: [{ domain: 1, domain_nama: 'kamus', kata: 'air', jumlah: 10 }],
      });

      const response = await callAsAdmin('get', '/api/redaksi/statistik/pencarian?domain=1&periode=7hari&limit=50');

      expect(response.status).toBe(200);
      expect(ModelPencarian.ambilStatistikRedaksi).toHaveBeenCalledWith({
        domain: '1',
        periode: '7hari',
        limit: 50,
        offset: 0,
        tanggalMulai: undefined,
        tanggalSelesai: undefined,
      });
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/redaksi/statistik/pencarian meneruskan error', async () => {
      ModelPencarian.ambilStatistikRedaksi.mockRejectedValue(new Error('statistik pencarian gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/statistik/pencarian');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('statistik pencarian gagal');
    });
  });

  describe('kata hari ini redaksi', () => {
    it('GET /api/redaksi/kata-hari-ini/opsi-entri mengembalikan saran entri', async () => {
      ModelLema.cariIndukAdmin.mockResolvedValue([{ id: 7, entri: 'aktif', indeks: 'aktif', jenis: 'dasar' }]);

      const response = await callAsAdmin('get', '/api/redaksi/kata-hari-ini/opsi-entri?q=aktif');

      expect(response.status).toBe(200);
      expect(ModelLema.cariIndukAdmin).toHaveBeenCalledWith('aktif', { limit: 8 });
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/redaksi/kata-hari-ini mengembalikan daftar arsip', async () => {
      ModelKataHariIni.daftarAdmin.mockResolvedValue({
        data: [{ id: 1, tanggal: '2026-03-31', indeks: 'aktif', entri: 'aktif', sumber: 'admin' }],
        total: 1,
      });

      const response = await callAsAdmin('get', '/api/redaksi/kata-hari-ini?q=aktif&sumber=admin');

      expect(response.status).toBe(200);
      expect(ModelKataHariIni.daftarAdmin).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        q: 'aktif',
        sumber: 'admin',
      });
      expect(response.body.total).toBe(1);
    });

    it('GET /api/redaksi/kata-hari-ini/:id mengembalikan 404 bila tidak ada', async () => {
      ModelKataHariIni.ambilDenganId.mockResolvedValue(null);

      const response = await callAsAdmin('get', '/api/redaksi/kata-hari-ini/9');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Arsip Kata Hari Ini tidak ditemukan');
    });

    it('POST /api/redaksi/kata-hari-ini membuat arsip baru dari entri terpilih', async () => {
      ModelLema.ambilDenganId.mockResolvedValue({ id: 7, entri: 'aktif', indeks: 'aktif' });
      ambilDetailKamus.mockResolvedValue({ indeks: 'aktif', entri: [{ id: 7, entri: 'aktif' }] });
      kataHariIniUtils.ambilMaknaUtama.mockReturnValue({ entri: { id: 7 } });
      kataHariIniUtils.bentukPayloadKataHariIni.mockReturnValue({
        tanggal: '2026-03-31',
        indeks: 'aktif',
        entri: 'aktif',
        makna: 'giat',
        contoh: 'Ia aktif.',
      });
      ModelKataHariIni.simpanByTanggal.mockResolvedValue({ id: 1, tanggal: '2026-03-31', indeks: 'aktif' });

      const response = await callAsAdmin('post', '/api/redaksi/kata-hari-ini', {
        body: { tanggal: '2026-03-31', entri_id: 7, sumber: 'admin', catatan: 'pilihan redaksi' },
      });

      expect(response.status).toBe(201);
      expect(ModelKataHariIni.simpanByTanggal).toHaveBeenCalledWith({
        tanggal: '2026-03-31',
        entriId: 7,
        sumber: 'admin',
        catatan: 'pilihan redaksi',
      });
      expect(hapusCacheKataHariIni).toHaveBeenCalledWith('2026-03-31');
    });

    it('POST /api/redaksi/kata-hari-ini mengembalikan 409 jika entri sudah dipakai tanggal lain', async () => {
      ModelLema.ambilDenganId.mockResolvedValue({ id: 7, entri: 'aktif', indeks: 'aktif' });
      ambilDetailKamus.mockResolvedValue({ indeks: 'aktif', entri: [{ id: 7, entri: 'aktif' }] });
      kataHariIniUtils.ambilMaknaUtama.mockReturnValue({ entri: { id: 7 } });
      kataHariIniUtils.bentukPayloadKataHariIni.mockReturnValue({
        tanggal: '2026-04-01',
        indeks: 'aktif',
        entri: 'aktif',
      });
      ModelKataHariIni.simpanByTanggal.mockRejectedValue({
        code: '23505',
        constraint: 'kata_hari_ini_entri_id_key',
      });

      const response = await callAsAdmin('post', '/api/redaksi/kata-hari-ini', {
        body: { tanggal: '2026-04-01', entri_id: 7, sumber: 'admin' },
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Entri ini sudah terdaftar sebagai Kata Hari Ini pada tanggal lain');
      expect(hapusCacheKataHariIni).not.toHaveBeenCalled();
    });

    it('PUT /api/redaksi/kata-hari-ini/:id memperbarui arsip yang ada', async () => {
      ModelKataHariIni.ambilDenganId.mockResolvedValue({
        id: 1,
        tanggal: '2026-03-31',
        entri_id: 7,
        indeks: 'aktif',
        entri: 'aktif',
        sumber: 'auto',
        catatan: null,
      });
      ModelLema.ambilDenganId.mockResolvedValue({ id: 8, entri: 'aktif sekali', indeks: 'aktif-sekali' });
      ambilDetailKamus.mockResolvedValue({ indeks: 'aktif-sekali', entri: [{ id: 8, entri: 'aktif sekali' }] });
      kataHariIniUtils.ambilMaknaUtama.mockReturnValue({ entri: { id: 8 } });
      kataHariIniUtils.bentukPayloadKataHariIni.mockReturnValue({
        tanggal: '2026-03-31',
        indeks: 'aktif-sekali',
        entri: 'aktif sekali',
        makna: 'giat',
      });
      ModelKataHariIni.simpanByTanggal.mockResolvedValue({ id: 1, tanggal: '2026-03-31', indeks: 'aktif-sekali', sumber: 'admin' });

      const response = await callAsAdmin('put', '/api/redaksi/kata-hari-ini/1', {
        body: { entri_id: 8, sumber: 'admin' },
      });

      expect(response.status).toBe(200);
      expect(ModelKataHariIni.simpanByTanggal).toHaveBeenCalledWith({
        tanggal: '2026-03-31',
        entriId: 8,
        sumber: 'admin',
        catatan: null,
      });
      expect(hapusCacheKataHariIni).toHaveBeenCalledWith('2026-03-31');
    });

    it('PUT /api/redaksi/kata-hari-ini/:id mengembalikan 409 jika entri sudah dipakai tanggal lain', async () => {
      ModelKataHariIni.ambilDenganId.mockResolvedValue({
        id: 1,
        tanggal: '2026-03-31',
        entri_id: 7,
        indeks: 'aktif',
        entri: 'aktif',
        sumber: 'admin',
        catatan: null,
      });
      ModelLema.ambilDenganId.mockResolvedValue({ id: 8, entri: 'aktif sekali', indeks: 'aktif-sekali' });
      ambilDetailKamus.mockResolvedValue({ indeks: 'aktif-sekali', entri: [{ id: 8, entri: 'aktif sekali' }] });
      kataHariIniUtils.ambilMaknaUtama.mockReturnValue({ entri: { id: 8 } });
      kataHariIniUtils.bentukPayloadKataHariIni.mockReturnValue({
        tanggal: '2026-03-31',
        indeks: 'aktif-sekali',
        entri: 'aktif sekali',
      });
      ModelKataHariIni.simpanByTanggal.mockRejectedValue({
        code: '23505',
        constraint: 'kata_hari_ini_entri_id_key',
      });

      const response = await callAsAdmin('put', '/api/redaksi/kata-hari-ini/1', {
        body: { entri_id: 8, sumber: 'admin' },
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Entri ini sudah terdaftar sebagai Kata Hari Ini pada tanggal lain');
      expect(hapusCacheKataHariIni).not.toHaveBeenCalled();
    });

    it('DELETE /api/redaksi/kata-hari-ini/:id menghapus arsip', async () => {
      ModelKataHariIni.ambilDenganId.mockResolvedValue({
        id: 1,
        tanggal: '2026-03-31',
        entri_id: 7,
        indeks: 'aktif',
        entri: 'aktif',
      });
      ModelKataHariIni.hapus.mockResolvedValue(true);

      const response = await callAsAdmin('delete', '/api/redaksi/kata-hari-ini/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(hapusCacheKataHariIni).toHaveBeenCalledWith('2026-03-31');
    });
  });

  describe('pencarian blacklist', () => {
    it('GET /api/redaksi/pencarianHitam mengembalikan daftar kata hitam', async () => {
      ModelPencarianHitam.daftarAdmin.mockResolvedValue({
        data: [{ id: 1, kata: 'bajingan', aktif: true, catatan: 'uji' }],
        total: 1,
      });

      const response = await callAsAdmin('get', '/api/redaksi/pencarianHitam?q=baj&aktif=1&limit=20');

      expect(response.status).toBe(200);
      expect(ModelPencarianHitam.daftarAdmin).toHaveBeenCalledWith({
        q: 'baj',
        aktif: '1',
        limit: 20,
        offset: 0,
      });
      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(1);
    });

    it('POST /api/redaksi/pencarianHitam validasi kata wajib', async () => {
      const response = await callAsAdmin('post', '/api/redaksi/pencarianHitam', {
        body: { kata: '   ' },
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Kata wajib diisi');
    });
  });

  describe('kamus', () => {
    it('GET /api/redaksi/kamus mengembalikan data daftar', async () => {
      ModelLema.daftarAdmin.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

      const response = await callAsAdmin('get', '/api/redaksi/kamus?limit=300&offset=-2&q= kata &jenis=dasar&jenis_rujuk= lihat ');

      expect(response.status).toBe(200);
      expect(ModelLema.daftarAdmin).toHaveBeenCalledWith(expect.objectContaining({
        limit: 200,
        offset: 0,
        q: 'kata',
        aktif: '',
        jenis: 'dasar',
        jenis_rujuk: 'lihat',
        punya_homograf: '',
        punya_homonim: '',
        kelas_kata: '',
        ragam: '',
        ragam_varian: '',
        bidang: '',
        bahasa: '',
        punya_ilmiah: '',
        punya_kimia: '',
        penyingkatan: '',
        punya_lafal: '',
        punya_pemenggalan: '',
        punya_kiasan: '',
        punya_contoh: '',
      }));
    });

    it('GET /api/redaksi/kamus meneruskan error', async () => {
      ModelLema.daftarAdmin.mockRejectedValue(new Error('daftar lema gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/kamus');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('daftar lema gagal');
    });

    it('GET /api/redaksi/kamus meneruskan filter punya_homograf dan punya_homonim', async () => {
      ModelLema.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/kamus?punya_homograf=1&punya_homonim=0');

      expect(response.status).toBe(200);
      expect(ModelLema.daftarAdmin).toHaveBeenCalledWith(expect.objectContaining({
        limit: 50,
        offset: 0,
        q: '',
        aktif: '',
        jenis: '',
        jenis_rujuk: '',
        punya_homograf: '1',
        punya_homonim: '0',
        kelas_kata: '',
        ragam: '',
        ragam_varian: '',
        bidang: '',
        bahasa: '',
        punya_ilmiah: '',
        punya_kimia: '',
        penyingkatan: '',
        punya_lafal: '',
        punya_pemenggalan: '',
        punya_kiasan: '',
        punya_contoh: '',
      }));
    });

    it('GET /api/redaksi/kamus meneruskan filter lafal/pemenggalan/kiasan saat valid', async () => {
      ModelLema.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin(
        'get',
        '/api/redaksi/kamus?punya_lafal=0&punya_pemenggalan=1&punya_kiasan=1'
      );

      expect(response.status).toBe(200);
      expect(ModelLema.daftarAdmin).toHaveBeenCalledWith(expect.objectContaining({
        punya_lafal: '0',
        punya_pemenggalan: '1',
        punya_kiasan: '1',
      }));
    });

    it('GET /api/redaksi/kamus meneruskan filter aktif valid', async () => {
      ModelLema.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/kamus?aktif=0');

      expect(response.status).toBe(200);
      expect(ModelLema.daftarAdmin).toHaveBeenCalledWith(expect.objectContaining({
        limit: 50,
        offset: 0,
        q: '',
        aktif: '0',
        jenis: '',
        jenis_rujuk: '',
        punya_homograf: '',
        punya_homonim: '',
        kelas_kata: '',
        ragam: '',
        ragam_varian: '',
        bidang: '',
        bahasa: '',
        punya_ilmiah: '',
        punya_kimia: '',
        penyingkatan: '',
        punya_lafal: '',
        punya_pemenggalan: '',
        punya_kiasan: '',
        punya_contoh: '',
      }));
    });

    it('GET /api/redaksi/kamus meneruskan filter ilmiah/kimia/contoh saat valid', async () => {
      ModelLema.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/kamus?punya_ilmiah=1&punya_kimia=0&punya_contoh=1');

      expect(response.status).toBe(200);
      expect(ModelLema.daftarAdmin).toHaveBeenCalledWith(expect.objectContaining({
        punya_ilmiah: '1',
        punya_kimia: '0',
        punya_contoh: '1',
      }));
    });

    it('GET /api/redaksi/kamus mengosongkan filter ilmiah/kimia/contoh saat nilai tidak valid', async () => {
      ModelLema.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/kamus?punya_ilmiah=x&punya_kimia=2&punya_contoh=ya');

      expect(response.status).toBe(200);
      expect(ModelLema.daftarAdmin).toHaveBeenCalledWith(expect.objectContaining({
        punya_ilmiah: '',
        punya_kimia: '',
        punya_contoh: '',
      }));
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

    it('GET /api/redaksi/kamus/opsi-induk mengembalikan kosong saat q kosong', async () => {
      const response = await callAsAdmin('get', '/api/redaksi/kamus/opsi-induk?q=   ');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(ModelLema.cariIndukAdmin).not.toHaveBeenCalled();
    });

    it('GET /api/redaksi/kamus/opsi-induk meneruskan q, limit, dan exclude_id', async () => {
      ModelLema.cariIndukAdmin.mockResolvedValue([{ id: 4, entri: 'latih' }]);

      const response = await callAsAdmin('get', '/api/redaksi/kamus/opsi-induk?q=lat&limit=99&exclude_id=4');

      expect(response.status).toBe(200);
      expect(ModelLema.cariIndukAdmin).toHaveBeenCalledWith('lat', { limit: 20, excludeId: 4 });
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/redaksi/kamus/opsi-induk meneruskan error', async () => {
      ModelLema.cariIndukAdmin.mockRejectedValue(new Error('opsi induk gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/kamus/opsi-induk?q=lat');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('opsi induk gagal');
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
      ModelLema.simpan.mockResolvedValue({ id: 12, lema: 'kata', indeks: 'kata' });

      const response = await callAsAdmin('post', '/api/redaksi/kamus', {
        body: { lema: 'kata', jenis: 'dasar' },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(hapusCacheDetailKamus).toHaveBeenCalledWith('kata');
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

    it('PUT /api/redaksi/kamus/:id tetap aman saat ambil indeks lama gagal', async () => {
      ModelLema.ambilDenganId.mockRejectedValueOnce(new Error('ambil indeks gagal'));
      ModelLema.simpan.mockResolvedValueOnce({ id: 33, entri: 'kata', indeks: null, jenis: 'dasar' });

      const response = await callAsAdmin('put', '/api/redaksi/kamus/33', {
        body: { entri: 'kata', jenis: 'dasar' },
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/redaksi/kamus/:id invalidasi cache untuk indeks lama dan indeks baru', async () => {
      ModelLema.ambilDenganId.mockResolvedValueOnce({ id: 40, indeks: 'lama' });
      ModelLema.simpan.mockResolvedValueOnce({ id: 40, entri: 'kata', indeks: 'baru', jenis: 'dasar' });

      const response = await callAsAdmin('put', '/api/redaksi/kamus/40', {
        body: { entri: 'kata', jenis: 'dasar' },
      });

      expect(response.status).toBe(200);
      expect(hapusCacheDetailKamus).toHaveBeenCalledWith('lama');
      expect(hapusCacheDetailKamus).toHaveBeenCalledWith('baru');
    });

    it('PUT /api/redaksi/kamus/:id tetap aman saat ambil indeks lama tidak punya nilai indeks', async () => {
      ModelLema.ambilDenganId.mockResolvedValueOnce({ id: 41 });
      ModelLema.simpan.mockResolvedValueOnce({ id: 41, entri: 'kata', indeks: 'baru', jenis: 'dasar' });

      const response = await callAsAdmin('put', '/api/redaksi/kamus/41', {
        body: { entri: 'kata', jenis: 'dasar' },
      });

      expect(response.status).toBe(200);
      expect(hapusCacheDetailKamus).toHaveBeenCalledWith('baru');
    });

    it('POST /api/redaksi/kamus/:entriId/makna tetap sukses saat ambil indeks cache gagal', async () => {
      ModelLema.ambilDenganId.mockRejectedValueOnce(new Error('ambil indeks gagal lagi'));
      ModelLema.simpanMakna.mockResolvedValueOnce({ id: 501, makna: 'arti baru' });

      const response = await callAsAdmin('post', '/api/redaksi/kamus/77/makna', {
        body: { makna: 'arti baru' },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
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
      expect(ModelKomentar.daftarAdmin).toHaveBeenCalledWith({ limit: 25, offset: 0, q: 'kata', aktif: '' });
      expect(response.body.total).toBe(1);
    });

    it('GET /api/redaksi/komentar meneruskan aktif valid', async () => {
      ModelKomentar.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/komentar?aktif=1');

      expect(response.status).toBe(200);
      expect(ModelKomentar.daftarAdmin).toHaveBeenCalledWith({ limit: 50, offset: 0, q: '', aktif: '1' });
    });

    it('GET /api/redaksi/komentar/:id mengembalikan 404 jika komentar tidak ditemukan', async () => {
      ModelKomentar.ambilDenganId.mockResolvedValue(null);

      const response = await callAsAdmin('get', '/api/redaksi/komentar/9');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Komentar tidak ditemukan');
    });

    it('GET /api/redaksi/komentar dan detail meneruskan error model', async () => {
      ModelKomentar.daftarAdmin.mockRejectedValueOnce(new Error('komentar list gagal'));
      ModelKomentar.ambilDenganId.mockRejectedValueOnce(new Error('komentar detail gagal'));

      const list = await callAsAdmin('get', '/api/redaksi/komentar');
      const detail = await callAsAdmin('get', '/api/redaksi/komentar/9');

      expect(list.status).toBe(500);
      expect(list.body.error).toBe('komentar list gagal');
      expect(detail.status).toBe(500);
      expect(detail.body.error).toBe('komentar detail gagal');
    });

    it('GET /api/redaksi/komentar/:id mengembalikan data saat ditemukan', async () => {
      ModelKomentar.ambilDenganId.mockResolvedValue({ id: 9, komentar: 'ok' });

      const response = await callAsAdmin('get', '/api/redaksi/komentar/9');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(9);
    });

    it('PUT /api/redaksi/komentar/:id validasi komentar wajib', async () => {
      const response = await callAsAdmin('put', '/api/redaksi/komentar/9', {
        body: { komentar: '   ', aktif: true },
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Komentar wajib diisi');
    });

    it('PUT /api/redaksi/komentar/:id validasi komentar wajib saat body kosong', async () => {
      const response = await callAsAdmin('put', '/api/redaksi/komentar/9');

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

    it('PUT /api/redaksi/komentar/:id mengembalikan 404 jika simpanAdmin null', async () => {
      ModelKomentar.simpanAdmin.mockResolvedValue(null);

      const response = await callAsAdmin('put', '/api/redaksi/komentar/9', {
        body: { komentar: 'baru', aktif: true },
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Komentar tidak ditemukan');
    });

    it('PUT /api/redaksi/komentar/:id meneruskan error', async () => {
      ModelKomentar.simpanAdmin.mockRejectedValue(new Error('komentar simpan gagal'));

      const response = await callAsAdmin('put', '/api/redaksi/komentar/9', {
        body: { komentar: 'baru', aktif: true },
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('komentar simpan gagal');
    });
  });

  describe('peran', () => {
    it('GET /api/redaksi/peran mengembalikan daftar dan meneruskan q', async () => {
      ModelPeran.daftarPeran.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

      const response = await callAsAdmin('get', '/api/redaksi/peran?limit=9&offset=2&q= adm ');

      expect(response.status).toBe(200);
      expect(ModelPeran.daftarPeran).toHaveBeenCalledWith({ limit: 9, offset: 0, q: 'adm' });
      expect(response.body.total).toBe(1);
    });

    it('GET /api/redaksi/peran/izin mengembalikan opsi izin', async () => {
      ModelPeran.daftarIzin.mockResolvedValue([{ id: 1, kode: 'kelola_peran' }]);

      const response = await callAsAdmin('get', '/api/redaksi/peran/izin?q=kelola');

      expect(response.status).toBe(200);
      expect(ModelPeran.daftarIzin).toHaveBeenCalledWith({ q: 'kelola' });
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/redaksi/peran/:id mengembalikan 404 dan 200 sesuai data', async () => {
      ModelPeran.ambilDenganId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 8, kode: 'editor' });

      const notFound = await callAsAdmin('get', '/api/redaksi/peran/8');
      const success = await callAsAdmin('get', '/api/redaksi/peran/8');

      expect(notFound.status).toBe(404);
      expect(success.status).toBe(200);
      expect(success.body.data.id).toBe(8);
    });

    it('POST/PUT /api/redaksi/peran validasi field wajib dan izin_ids', async () => {
      const noKode = await callAsAdmin('post', '/api/redaksi/peran', { body: { nama: 'Editor' } });
      const noNama = await callAsAdmin('post', '/api/redaksi/peran', { body: { kode: 'editor' } });
      const noKodePut = await callAsAdmin('put', '/api/redaksi/peran/8', { body: { nama: 'Editor' } });
      const noNamaPut = await callAsAdmin('put', '/api/redaksi/peran/8', { body: { kode: 'editor' } });
      const invalidIdsPost = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor', nama: 'Editor', izin_ids: { a: 1 } },
      });
      const invalidIdsPut = await callAsAdmin('put', '/api/redaksi/peran/8', {
        body: { kode: 'editor', nama: 'Editor', izin_ids: [1, 'x'] },
      });

      expect(noKode.status).toBe(400);
      expect(noNama.status).toBe(400);
      expect(noKodePut.status).toBe(400);
      expect(noNamaPut.status).toBe(400);
      expect(invalidIdsPost.status).toBe(400);
      expect(invalidIdsPut.status).toBe(400);
    });

    it('POST /api/redaksi/peran memetakan akses_redaksi dari berbagai tipe', async () => {
      ModelPeran.simpan
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 })
        .mockResolvedValueOnce({ id: 3 })
        .mockResolvedValueOnce({ id: 4 })
        .mockResolvedValueOnce({ id: 5 })
        .mockResolvedValueOnce({ id: 6 })
        .mockResolvedValueOnce({ id: 7 });

      const boolVal = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor', nama: 'Editor', akses_redaksi: true },
      });
      const numVal = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor2', nama: 'Editor 2', akses_redaksi: 1 },
      });
      const strVal = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor3', nama: 'Editor 3', akses_redaksi: 'aktif' },
      });
      const defVal = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor4', nama: 'Editor 4' },
      });
      const zeroNum = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor5', nama: 'Editor 5', akses_redaksi: 0 },
      });
      const unknownType = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor6', nama: 'Editor 6', akses_redaksi: {} },
      });
      const strFalse = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor7', nama: 'Editor 7', akses_redaksi: 'tidak' },
      });

      expect(boolVal.status).toBe(201);
      expect(numVal.status).toBe(201);
      expect(strVal.status).toBe(201);
      expect(defVal.status).toBe(201);
      expect(zeroNum.status).toBe(201);
      expect(unknownType.status).toBe(201);
      expect(strFalse.status).toBe(201);
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(1, expect.objectContaining({ akses_redaksi: true }));
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(2, expect.objectContaining({ akses_redaksi: true }));
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(3, expect.objectContaining({ akses_redaksi: true }));
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(4, expect.objectContaining({ akses_redaksi: false }));
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(5, expect.objectContaining({ akses_redaksi: false }));
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(6, expect.objectContaining({ akses_redaksi: false }));
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(7, expect.objectContaining({ akses_redaksi: false }));
    });

    it('POST/PUT /api/redaksi/peran mengembalikan 201/200/404 dan normalisasi izin_ids', async () => {
      ModelPeran.simpan
        .mockResolvedValueOnce({ id: 9, kode: 'editor' })
        .mockResolvedValueOnce({ id: 9, kode: 'editor' })
        .mockResolvedValueOnce(null);

      const post = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor', nama: 'Editor', izin_ids: [1, 1, 2] },
      });
      const putOk = await callAsAdmin('put', '/api/redaksi/peran/9', {
        body: { kode: 'editor', nama: 'Editor', izin_ids: [2, 2, 3] },
      });
      const put404 = await callAsAdmin('put', '/api/redaksi/peran/9', {
        body: { kode: 'editor', nama: 'Editor', izin_ids: [] },
      });

      expect(post.status).toBe(201);
      expect(putOk.status).toBe(200);
      expect(put404.status).toBe(404);
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(1, expect.objectContaining({ izin_ids: [1, 2] }));
      expect(ModelPeran.simpan).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 9, izin_ids: [2, 3] }));
    });

    it('routes /api/redaksi/peran meneruskan error model', async () => {
      ModelPeran.daftarPeran.mockRejectedValueOnce(new Error('peran list gagal'));
      ModelPeran.daftarIzin.mockRejectedValueOnce(new Error('izin opsi gagal'));
      ModelPeran.ambilDenganId.mockRejectedValueOnce(new Error('peran detail gagal'));
      ModelPeran.simpan
        .mockRejectedValueOnce(new Error('peran simpan gagal'))
        .mockRejectedValueOnce(new Error('peran update gagal'));

      const list = await callAsAdmin('get', '/api/redaksi/peran');
      const opsiIzin = await callAsAdmin('get', '/api/redaksi/peran/izin');
      const detail = await callAsAdmin('get', '/api/redaksi/peran/1');
      const post = await callAsAdmin('post', '/api/redaksi/peran', {
        body: { kode: 'editor', nama: 'Editor' },
      });
      const put = await callAsAdmin('put', '/api/redaksi/peran/1', {
        body: { kode: 'editor', nama: 'Editor' },
      });

      expect(list.status).toBe(500);
      expect(opsiIzin.status).toBe(500);
      expect(detail.status).toBe(500);
      expect(post.status).toBe(500);
      expect(put.status).toBe(500);
    });
  });

  describe('izin', () => {
    it('GET /api/redaksi/izin mengembalikan daftar dan meneruskan q', async () => {
      ModelIzin.daftarIzin.mockResolvedValue({ data: [{ id: 1 }], total: 1 });

      const response = await callAsAdmin('get', '/api/redaksi/izin?limit=9&offset=2&q= kelola ');

      expect(response.status).toBe(200);
      expect(ModelIzin.daftarIzin).toHaveBeenCalledWith({ limit: 9, offset: 0, q: 'kelola' });
      expect(response.body.total).toBe(1);
    });

    it('GET /api/redaksi/izin/peran mengembalikan opsi peran', async () => {
      ModelIzin.daftarPeran.mockResolvedValue([{ id: 1, kode: 'admin' }]);

      const response = await callAsAdmin('get', '/api/redaksi/izin/peran?q=admin');

      expect(response.status).toBe(200);
      expect(ModelIzin.daftarPeran).toHaveBeenCalledWith({ q: 'admin' });
      expect(response.body.data).toHaveLength(1);
    });

    it('GET /api/redaksi/izin/:id mengembalikan 404 dan 200 sesuai data', async () => {
      ModelIzin.ambilDenganId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 8, kode: 'kelola_peran' });

      const notFound = await callAsAdmin('get', '/api/redaksi/izin/8');
      const success = await callAsAdmin('get', '/api/redaksi/izin/8');

      expect(notFound.status).toBe(404);
      expect(success.status).toBe(200);
      expect(success.body.data.id).toBe(8);
    });

    it('POST/PUT /api/redaksi/izin validasi field wajib dan peran_ids', async () => {
      const noKode = await callAsAdmin('post', '/api/redaksi/izin', { body: { nama: 'Kelola' } });
      const noNama = await callAsAdmin('post', '/api/redaksi/izin', { body: { kode: 'kelola' } });
      const noKodePut = await callAsAdmin('put', '/api/redaksi/izin/8', { body: { nama: 'Kelola' } });
      const noNamaPut = await callAsAdmin('put', '/api/redaksi/izin/8', { body: { kode: 'kelola' } });
      const invalidIdsPost = await callAsAdmin('post', '/api/redaksi/izin', {
        body: { kode: 'kelola', nama: 'Kelola', peran_ids: { a: 1 } },
      });
      const invalidIdsPut = await callAsAdmin('put', '/api/redaksi/izin/8', {
        body: { kode: 'kelola', nama: 'Kelola', peran_ids: [1, 'x'] },
      });

      expect(noKode.status).toBe(400);
      expect(noNama.status).toBe(400);
      expect(noKodePut.status).toBe(400);
      expect(noNamaPut.status).toBe(400);
      expect(invalidIdsPost.status).toBe(400);
      expect(invalidIdsPut.status).toBe(400);
    });

    it('POST/PUT /api/redaksi/izin mengembalikan 201/200/404 dan normalisasi peran_ids', async () => {
      ModelIzin.simpan
        .mockResolvedValueOnce({ id: 9, kode: 'kelola' })
        .mockResolvedValueOnce({ id: 9, kode: 'kelola' })
        .mockResolvedValueOnce(null);

      const post = await callAsAdmin('post', '/api/redaksi/izin', {
        body: { kode: 'kelola', nama: 'Kelola', peran_ids: [1, 1, 2] },
      });
      const putOk = await callAsAdmin('put', '/api/redaksi/izin/9', {
        body: { kode: 'kelola', nama: 'Kelola', peran_ids: [2, 2, 3] },
      });
      const put404 = await callAsAdmin('put', '/api/redaksi/izin/9', {
        body: { kode: 'kelola', nama: 'Kelola', peran_ids: [] },
      });

      expect(post.status).toBe(201);
      expect(putOk.status).toBe(200);
      expect(put404.status).toBe(404);
      expect(ModelIzin.simpan).toHaveBeenNthCalledWith(1, expect.objectContaining({ peran_ids: [1, 2] }));
      expect(ModelIzin.simpan).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 9, peran_ids: [2, 3] }));
    });

    it('routes /api/redaksi/izin meneruskan error model', async () => {
      ModelIzin.daftarIzin.mockRejectedValueOnce(new Error('izin list gagal'));
      ModelIzin.daftarPeran.mockRejectedValueOnce(new Error('peran opsi gagal'));
      ModelIzin.ambilDenganId.mockRejectedValueOnce(new Error('izin detail gagal'));
      ModelIzin.simpan
        .mockRejectedValueOnce(new Error('izin simpan gagal'))
        .mockRejectedValueOnce(new Error('izin update gagal'));

      const list = await callAsAdmin('get', '/api/redaksi/izin');
      const opsiPeran = await callAsAdmin('get', '/api/redaksi/izin/peran');
      const detail = await callAsAdmin('get', '/api/redaksi/izin/1');
      const post = await callAsAdmin('post', '/api/redaksi/izin', {
        body: { kode: 'kelola', nama: 'Kelola' },
      });
      const put = await callAsAdmin('put', '/api/redaksi/izin/1', {
        body: { kode: 'kelola', nama: 'Kelola' },
      });

      expect(list.status).toBe(500);
      expect(opsiPeran.status).toBe(500);
      expect(detail.status).toBe(500);
      expect(post.status).toBe(500);
      expect(put.status).toBe(500);
    });
  });

  describe('tesaurus', () => {
    it('CRUD /api/redaksi/tesaurus mencakup cabang utama', async () => {
      ModelTesaurus.daftarAdminCursor.mockResolvedValue({
        data: [{ id: 1 }],
        total: 1,
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      });
      const list = await callAsAdmin('get', '/api/redaksi/tesaurus?limit=10&offset=1&q=akt');

      ModelTesaurus.ambilDenganId.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, indeks: 'aktif' });
      const detail404 = await callAsAdmin('get', '/api/redaksi/tesaurus/1');
      const detail200 = await callAsAdmin('get', '/api/redaksi/tesaurus/1');

      const post400 = await callAsAdmin('post', '/api/redaksi/tesaurus', { body: { indeks: ' ' } });
      ModelTesaurus.simpan.mockResolvedValueOnce({ id: 1, indeks: 'aktif' }).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, indeks: 'aktif' });
      const post201 = await callAsAdmin('post', '/api/redaksi/tesaurus', { body: { indeks: 'aktif' } });
      const put400 = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { indeks: ' ' } });
      const put404 = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { indeks: 'aktif' } });
      const put200 = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { indeks: 'aktif' } });

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

    it('GET /api/redaksi/tesaurus meneruskan aktif valid', async () => {
      ModelTesaurus.daftarAdminCursor.mockResolvedValue({
        data: [],
        total: 0,
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      });

      const response = await callAsAdmin('get', '/api/redaksi/tesaurus?aktif=1');

      expect(response.status).toBe(200);
      expect(ModelTesaurus.daftarAdminCursor).toHaveBeenCalledWith({
        limit: 50,
        q: '',
        aktif: '1',
        cursor: null,
        direction: 'next',
        lastPage: false,
      });
    });

    it('CRUD /api/redaksi/tesaurus meneruskan error', async () => {
      ModelTesaurus.daftarAdminCursor.mockRejectedValueOnce(new Error('tesaurus list gagal'));
      ModelTesaurus.ambilDenganId.mockRejectedValueOnce(new Error('tesaurus detail gagal'));
      ModelTesaurus.simpan.mockRejectedValueOnce(new Error('tesaurus simpan gagal')).mockRejectedValueOnce(new Error('tesaurus update gagal'));
      ModelTesaurus.hapus.mockRejectedValueOnce(new Error('tesaurus hapus gagal'));

      const list = await callAsAdmin('get', '/api/redaksi/tesaurus');
      const detail = await callAsAdmin('get', '/api/redaksi/tesaurus/1');
      const post = await callAsAdmin('post', '/api/redaksi/tesaurus', { body: { indeks: 'aktif' } });
      const put = await callAsAdmin('put', '/api/redaksi/tesaurus/1', { body: { indeks: 'aktif' } });
      const del = await callAsAdmin('delete', '/api/redaksi/tesaurus/1');

      expect(list.status).toBe(500);
      expect(detail.status).toBe(500);
      expect(post.status).toBe(500);
      expect(put.status).toBe(500);
      expect(del.status).toBe(500);
    });
  });

  describe('etimologi', () => {
    it('GET /api/redaksi/etimologi meneruskan filter bahasa_id, sumber_id, dan bahasa kosong', async () => {
      ModelEtimologi.daftarAdmin.mockResolvedValue({ data: [], total: 0 });

      const responseById = await callAsAdmin('get', '/api/redaksi/etimologi?bahasa_id=10&sumber_id=3', {
        tokenPayload: { izin: ['kelola_etimologi'] },
      });
      const responseKosong = await callAsAdmin('get', '/api/redaksi/etimologi?bahasa=__KOSONG__', {
        tokenPayload: { izin: ['kelola_etimologi'] },
      });

      expect(responseById.status).toBe(200);
      expect(responseKosong.status).toBe(200);
      expect(ModelEtimologi.daftarAdmin).toHaveBeenNthCalledWith(1, {
        limit: 50,
        offset: 0,
        q: '',
        bahasa: '',
        bahasaId: 10,
        sumberId: 3,
        aktif: '',
        meragukan: '',
      });
      expect(ModelEtimologi.daftarAdmin).toHaveBeenNthCalledWith(2, {
        limit: 50,
        offset: 0,
        q: '',
        bahasa: '__KOSONG__',
        aktif: '',
        meragukan: '',
      });
    });
  });

  describe('lookup master', () => {
    it('GET /api/redaksi/bidang/opsi mengembalikan lookup bidang', async () => {
      ModelOpsi.daftarLookupBidang.mockResolvedValue([{ id: 1, kode: 'umum', nama: 'Umum' }]);

      const response = await callAsAdmin('get', '/api/redaksi/bidang/opsi');

      expect(response.status).toBe(200);
      expect(ModelOpsi.daftarLookupBidang).toHaveBeenCalledWith({ q: '' });
      expect(response.body.data).toEqual([{ id: 1, kode: 'umum', nama: 'Umum' }]);
    });

    it('GET /api/redaksi/bahasa/opsi mengembalikan lookup bahasa', async () => {
      ModelOpsi.daftarLookupBahasa.mockResolvedValue([{ id: 10, kode: 'Ing', nama: 'Inggris', iso2: 'en' }]);

      const response = await callAsAdmin('get', '/api/redaksi/bahasa/opsi');

      expect(response.status).toBe(200);
      expect(ModelOpsi.daftarLookupBahasa).toHaveBeenCalledWith({ q: '' });
      expect(response.body.data).toEqual([{ id: 10, kode: 'Ing', nama: 'Inggris', iso2: 'en' }]);
    });

    it('GET /api/redaksi/sumber/opsi mengembalikan lookup sumber sesuai konteks', async () => {
      ModelOpsi.daftarLookupSumber.mockResolvedValue([{ id: 3, kode: 'kbbi', nama: 'KBBI' }]);

      const response = await callAsAdmin('get', '/api/redaksi/sumber/opsi?glosarium=1');

      expect(response.status).toBe(200);
      expect(ModelOpsi.daftarLookupSumber).toHaveBeenCalledWith({
        q: '',
        glosarium: '1',
        kamus: '',
        tesaurus: '',
        etimologi: '',
      });
      expect(response.body.data).toEqual([{ id: 3, kode: 'kbbi', nama: 'KBBI' }]);
    });
  });

  describe('glosarium', () => {
    it('CRUD /api/redaksi/glosarium mencakup cabang utama', async () => {
      ModelGlosarium.cari.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      const list = await callAsAdmin('get', '/api/redaksi/glosarium?limit=10&offset=1&q=istilah');

      ModelGlosarium.ambilDenganId
        .mockResolvedValue({ id: 1, indonesia: 'istilah', asing: 'term-lama' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1, indonesia: 'istilah', asing: 'term' });
      const detail404 = await callAsAdmin('get', '/api/redaksi/glosarium/1');
      const detail200 = await callAsAdmin('get', '/api/redaksi/glosarium/1');

      const post400Indonesia = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: ' ', asing: 'term' } });
      const post400Asing = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: ' ' } });

      ModelGlosarium.simpan
        .mockResolvedValueOnce({ id: 1, asing: 'term' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1, asing: 'term-baru' });
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
      expect(invalidasiCacheDetailGlosarium).toHaveBeenCalledWith('term');
      expect(invalidasiCacheDetailGlosarium).toHaveBeenCalledWith('term-lama');
      expect(invalidasiCacheDetailGlosarium).toHaveBeenCalledWith('term-baru');
    });

    it('GET /api/redaksi/glosarium meneruskan aktif valid', async () => {
      ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/glosarium?aktif=0');

      expect(response.status).toBe(200);
      expect(ModelGlosarium.cari).toHaveBeenCalledWith({
        q: '',
        limit: 50,
        offset: 0,
        aktif: '0',
      });
    });

    it('GET /api/redaksi/glosarium meneruskan filter bidang_id, bahasa_id, dan sumber_id', async () => {
      ModelGlosarium.cari.mockResolvedValue({ data: [], total: 0 });

      const response = await callAsAdmin('get', '/api/redaksi/glosarium?bidang_id=3&bahasa_id=7&sumber_id=5');

      expect(response.status).toBe(200);
      expect(ModelGlosarium.cari).toHaveBeenCalledWith({
        q: '',
        limit: 50,
        offset: 0,
        aktif: '',
        bidangId: 3,
        bahasaId: 7,
        sumberId: 5,
      });
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

    it('POST/PUT /api/redaksi/glosarium mengembalikan 400 untuk INVALID_BIDANG dan INVALID_SUMBER', async () => {
      const invalidBidangError = new Error('Bidang tidak valid');
      invalidBidangError.code = 'INVALID_BIDANG';
      const invalidSumberError = new Error('Sumber tidak valid');
      invalidSumberError.code = 'INVALID_SUMBER';
      const invalidBahasaError = new Error('Bahasa tidak valid');
      invalidBahasaError.code = 'INVALID_BAHASA';

      ModelGlosarium.simpan
        .mockRejectedValueOnce(invalidBidangError)
        .mockRejectedValueOnce(invalidSumberError)
        .mockRejectedValueOnce(invalidBahasaError)
        .mockRejectedValueOnce(invalidBidangError)
        .mockRejectedValueOnce(invalidSumberError)
        .mockRejectedValueOnce(invalidBahasaError);

      const postBidang = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: 'term' } });
      const postSumber = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: 'term' } });
      const postBahasa = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: 'term' } });
      const putBidang = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: 'term' } });
      const putSumber = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: 'term' } });
      const putBahasa = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: 'term' } });

      expect(postBidang.status).toBe(400);
      expect(postBidang.body.message).toBe('Bidang tidak valid');
      expect(postSumber.status).toBe(400);
      expect(postSumber.body.message).toBe('Sumber tidak valid');
      expect(postBahasa.status).toBe(400);
      expect(postBahasa.body.message).toBe('Bahasa tidak valid');
      expect(putBidang.status).toBe(400);
      expect(putBidang.body.message).toBe('Bidang tidak valid');
      expect(putSumber.status).toBe(400);
      expect(putSumber.body.message).toBe('Sumber tidak valid');
      expect(putBahasa.status).toBe(400);
      expect(putBahasa.body.message).toBe('Bahasa tidak valid');
    });

    it('POST/PUT /api/redaksi/glosarium tetap meneruskan saat error nullish', async () => {
      ModelGlosarium.simpan
        .mockRejectedValueOnce(null)
        .mockRejectedValueOnce(undefined);

      const post = await callAsAdmin('post', '/api/redaksi/glosarium', { body: { indonesia: 'istilah', asing: 'term' } });
      const put = await callAsAdmin('put', '/api/redaksi/glosarium/1', { body: { indonesia: 'istilah', asing: 'term' } });

      expect(post.status).toBe(404);
      expect(put.status).toBe(404);
    });

    it('POST/PUT /api/redaksi/glosarium meneruskan bidang_id/sumber_id saat integer positif', async () => {
      ModelGlosarium.simpan.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 1 });

      const post = await callAsAdmin('post', '/api/redaksi/glosarium', {
        body: { indonesia: 'istilah', asing: 'term', bidang_id: 3, sumber_id: 5 },
      });
      const put = await callAsAdmin('put', '/api/redaksi/glosarium/1', {
        body: { indonesia: 'istilah', asing: 'term', bidang_id: 7, sumber_id: 9 },
      });

      expect(post.status).toBe(201);
      expect(put.status).toBe(200);
      expect(ModelGlosarium.simpan).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ bidang_id: 3, sumber_id: 5 }),
        'admin@example.com'
      );
      expect(ModelGlosarium.simpan).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ bidang_id: 7, sumber_id: 9, id: 1 }),
        'admin@example.com'
      );
    });

    it('PUT /api/redaksi/glosarium tetap melakukan invalidasi cache saat lookup sebelum update gagal', async () => {
      ModelGlosarium.ambilDenganId.mockRejectedValueOnce(new Error('lookup lama gagal'));
      ModelGlosarium.simpan.mockResolvedValue({ id: 1, asing: 'term-baru' });

      const response = await callAsAdmin('put', '/api/redaksi/glosarium/1', {
        body: { indonesia: 'istilah', asing: 'term-baru' },
      });

      expect(response.status).toBe(200);
      expect(invalidasiCacheDetailGlosarium).toHaveBeenNthCalledWith(1, null);
      expect(invalidasiCacheDetailGlosarium).toHaveBeenNthCalledWith(2, 'term-baru');
    });

    it('PUT /api/redaksi/glosarium memaksa null saat data sebelum-update tidak punya asing', async () => {
      ModelGlosarium.ambilDenganId.mockResolvedValueOnce({ id: 1, asing: '' });
      ModelGlosarium.simpan.mockResolvedValue({ id: 1, asing: 'term-baru' });

      const response = await callAsAdmin('put', '/api/redaksi/glosarium/1', {
        body: { indonesia: 'istilah', asing: 'term-baru' },
      });

      expect(response.status).toBe(200);
      expect(invalidasiCacheDetailGlosarium).toHaveBeenNthCalledWith(1, null);
      expect(invalidasiCacheDetailGlosarium).toHaveBeenNthCalledWith(2, 'term-baru');
    });
  });

  describe('label', () => {
    it('CRUD /api/redaksi/label mencakup cabang utama', async () => {
      ModelLabel.daftarAdminCursor.mockResolvedValue({
        data: [{ id: 1 }],
        total: 1,
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      });
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

    it('GET /api/redaksi/label meneruskan aktif valid', async () => {
      ModelLabel.daftarAdminCursor.mockResolvedValue({
        data: [],
        total: 0,
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      });

      const response = await callAsAdmin('get', '/api/redaksi/label?aktif=1');

      expect(response.status).toBe(200);
      expect(ModelLabel.daftarAdminCursor).toHaveBeenCalledWith({
        limit: 50,
        q: '',
        aktif: '1',
        cursor: null,
        direction: 'next',
        lastPage: false,
      });
    });

    it('GET /api/redaksi/label/kategori mendukung query nama dan default', async () => {
      ModelLabel.ambilKategoriUntukRedaksi
        .mockResolvedValueOnce({ ragam: [{ kode: 'cak', nama: 'cakapan' }] })
        .mockResolvedValueOnce({});

      const withQuery = await callAsAdmin('get', '/api/redaksi/label/kategori?nama=ragam,kelas-kata');
      const withoutQuery = await callAsAdmin('get', '/api/redaksi/label/kategori');

      expect(withQuery.status).toBe(200);
      expect(ModelLabel.ambilKategoriUntukRedaksi).toHaveBeenNthCalledWith(1, ['ragam', 'kelas-kata']);
      expect(withoutQuery.status).toBe(200);
      expect(ModelLabel.ambilKategoriUntukRedaksi).toHaveBeenNthCalledWith(2, undefined);
    });

    it('GET /api/redaksi/label/kategori meneruskan error', async () => {
      ModelLabel.ambilKategoriUntukRedaksi.mockRejectedValue(new Error('kategori label gagal'));

      const response = await callAsAdmin('get', '/api/redaksi/label/kategori');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('kategori label gagal');
    });

    it('POST/PUT /api/redaksi/label validasi urutan >= 1', async () => {
      const post = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', urutan: 0 },
      });

      const put = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', urutan: -1 },
      });

      expect(post.status).toBe(400);
      expect(post.body.message).toBe('Urutan harus bilangan bulat >= 1');
      expect(put.status).toBe(400);
      expect(put.body.message).toBe('Urutan harus bilangan bulat >= 1');
    });

    it('POST/PUT /api/redaksi/label menolak kategori master bahasa, bidang, dan sumber', async () => {
      const post = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'bahasa', kode: 'Ing', nama: 'Inggris' },
      });

      const put = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'sumber', kode: 'KBBI4', nama: 'KBBI IV' },
      });

      expect(post.status).toBe(400);
      expect(post.body.message).toBe('Kategori bahasa, bidang, dan sumber dikelola lewat menu master masing-masing');
      expect(put.status).toBe(400);
      expect(put.body.message).toBe('Kategori bahasa, bidang, dan sumber dikelola lewat menu master masing-masing');
    });

    it('POST/PUT /api/redaksi/label validasi status aktif tidak valid', async () => {
      const post = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', aktif: {} },
      });

      const put = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', aktif: [] },
      });

      expect(post.status).toBe(400);
      expect(post.body.message).toBe('Status aktif tidak valid');
      expect(put.status).toBe(400);
      expect(put.body.message).toBe('Status aktif tidak valid');
    });

    it('POST /api/redaksi/label menerima status aktif string valid', async () => {
      ModelLabel.simpan.mockResolvedValueOnce({ id: 1, aktif: true });

      const response = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', aktif: 'aktif' },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/redaksi/label menolak status aktif string tidak dikenal', async () => {
      const response = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', aktif: 'mungkin' },
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Status aktif tidak valid');
    });

    it('POST /api/redaksi/label menerima status aktif numerik valid (0/1)', async () => {
      ModelLabel.simpan.mockResolvedValueOnce({ id: 1, aktif: 1 });

      const response = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', aktif: 1 },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('POST /api/redaksi/label menerima status aktif boolean', async () => {
      ModelLabel.simpan.mockResolvedValueOnce({ id: 1, aktif: false });

      const response = await callAsAdmin('post', '/api/redaksi/label', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', aktif: false },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/redaksi/label menolak status aktif numerik di luar 0/1', async () => {
      const response = await callAsAdmin('put', '/api/redaksi/label/1', {
        body: { kategori: 'ragam', kode: 'R', nama: 'Ragam', aktif: 2 },
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Status aktif tidak valid');
    });

    it('CRUD /api/redaksi/label meneruskan error', async () => {
      ModelLabel.daftarAdminCursor.mockRejectedValueOnce(new Error('label list gagal'));
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



