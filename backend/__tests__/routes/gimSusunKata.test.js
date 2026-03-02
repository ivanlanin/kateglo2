/**
 * @fileoverview Test route gim susun kata
 * @tested_in backend/routes/gim/susunKata.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/auth', () => ({
  authenticate: (req, _res, next) => {
    const pid = req.headers['x-user-pid'];
    if (pid !== undefined) req.user = { pid };
    next();
  },
  authenticateOptional: (req, _res, next) => {
    const pid = req.headers['x-user-pid'];
    if (pid !== undefined) req.user = { pid };
    next();
  },
}));

jest.mock('../../models/modelEntri', () => ({
  ambilArtiSusunKataByIndeks: jest.fn(),
  cekKataSusunKataValid: jest.fn(),
}));

jest.mock('../../models/modelSusunKata', () => ({
  parsePanjang: jest.fn((value, fallback = 5) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 4), 8);
  }),
  parsePenggunaId: jest.fn((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }),
  hitungSkor: jest.fn(({ percobaan, menang }) => (menang ? Math.max(11 - percobaan, 1) : 0)),
  ambilTanggalHariIniJakarta: jest.fn(),
  ambilAtauBuatHarian: jest.fn(),
  ambilSkorPenggunaHarian: jest.fn(),
  simpanSkorHarian: jest.fn(),
  ambilKlasemenHarian: jest.fn(),
}));

const router = require('../../routes/gim/susunKata');
const ModelEntri = require('../../models/modelEntri');
const ModelSusunKata = require('../../models/modelSusunKata');
const { __private } = router;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/publik/gim/susun-kata', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/gim/susunKata', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ModelSusunKata.ambilTanggalHariIniJakarta.mockResolvedValue('2026-03-02');
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValue({ id: 10, kata: 'kartu' });
    ModelEntri.ambilArtiSusunKataByIndeks.mockResolvedValue('alat tulis');
    ModelSusunKata.ambilSkorPenggunaHarian.mockResolvedValue(null);
    ModelSusunKata.simpanSkorHarian.mockResolvedValue({ id: 1, susun_kata_id: 10, pengguna_id: 9 });
    ModelSusunKata.ambilKlasemenHarian.mockResolvedValue([{ pengguna_id: 9, nama: 'A', skor: 8 }]);
    ModelEntri.cekKataSusunKataValid.mockResolvedValue(true);
  });

  it('GET /puzzle sukses dan 404 saat payload kosong', async () => {
    const success = await request(createApp()).get('/api/publik/gim/susun-kata/puzzle?panjang=5').set('x-user-pid', '9');

    expect(success.status).toBe(200);
    expect(success.body.target).toBe('kartu');
    expect(success.body.sudahMainHariIni).toBe(false);

    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValueOnce(null);
    const notFound = await request(createApp()).get('/api/publik/gim/susun-kata/puzzle?panjang=5');

    expect(notFound.status).toBe(404);
    expect(notFound.body.message).toContain('belum tersedia');
  });

  it('helper private parseLimit/parseBodyBoolean/tebakan terakhir mencakup cabang default', () => {
    expect(__private.parseLimit(undefined)).toBe(10);
    expect(__private.parseLimit('0')).toBe(1);
    expect(__private.parseLimit('999')).toBe(50);

    expect(__private.parseBodyBoolean(undefined)).toBe(false);
    expect(__private.parseBodyBoolean(true)).toBe(true);
    expect(__private.parseBodyBoolean('0')).toBe(false);
    expect(__private.parseBodyBoolean('unknown', true)).toBe(true);

    expect(__private.ambilTebakanTerakhir(' kata ; kartu ')).toBe('kartu');
    expect(__private.ambilTebakanTerakhir('')).toBe('');
    expect(__private.normalisasiKataParam(undefined)).toBe('');
    expect(__private.normalisasiKataParam(' KATA ')).toBe('kata');
  });

  it('GET /harian meneruskan error ke middleware', async () => {
    ModelSusunKata.ambilTanggalHariIniJakarta.mockRejectedValueOnce(new Error('tanggal gagal'));

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/harian');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('tanggal gagal');
  });

  it('GET /harian sukses mengembalikan payload', async () => {
    const response = await request(createApp()).get('/api/publik/gim/susun-kata/harian?panjang=5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      tanggal: '2026-03-02',
      panjang: 5,
      target: 'kartu',
      susunKataId: 10,
    }));
  });

  it('GET /puzzle meneruskan error ke middleware', async () => {
    ModelSusunKata.ambilTanggalHariIniJakarta.mockRejectedValueOnce(new Error('puzzle gagal'));

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/puzzle');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('puzzle gagal');
  });

  it('GET /harian mengembalikan 404 saat payload kosong', async () => {
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValueOnce(null);

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/harian?panjang=5');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
  });

  it('POST /harian/submit mengembalikan 401 ketika user tidak valid', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .send({ panjang: 5, menang: false });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Autentikasi diperlukan');
  });

  it('POST /harian/submit mengembalikan 404 saat kata harian belum tersedia', async () => {
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValueOnce(null);

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, menang: false });

    expect(response.status).toBe(404);
  });

  it('POST /harian/submit mengembalikan 409 jika skor sudah tercatat', async () => {
    ModelSusunKata.ambilSkorPenggunaHarian
      .mockResolvedValueOnce({ id: 77, menang: true })
      .mockResolvedValueOnce({ id: 77, menang: true });

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, menang: false });

    expect(response.status).toBe(409);
    expect(response.body.data).toEqual({ id: 77, menang: true });
  });

  it('POST /harian/submit validasi tebakan terakhir ketika menang', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, menang: 'true', tebakan: 'kaku;kutu' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('tidak cocok');
  });

  it('POST /harian/submit sukses menyimpan skor dan menghitung skor', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .set('x-user-pid', '9')
      .send({
        panjang: 5,
        percobaan: 99,
        detik: -12,
        tebakan: 'kasa;kartu',
        menang: '1',
      });

    expect(response.status).toBe(201);
    expect(ModelSusunKata.simpanSkorHarian).toHaveBeenCalledWith({
      susunKataId: 10,
      penggunaId: 9,
      percobaan: 6,
      detik: 0,
      tebakan: 'kasa;kartu',
      menang: true,
    });
    expect(response.body.data.skor).toBe(5);
  });

  it('POST /harian/submit menerima panjang dari query saat body tidak mengirim panjang', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit?panjang=7')
      .set('x-user-pid', '9')
      .send({ percobaan: 3, detik: 20, tebakan: 'abc;def', menang: false });

    expect(response.status).toBe(201);
    expect(ModelSusunKata.parsePanjang).toHaveBeenCalledWith('7', 5);
  });

  it('POST /harian/submit memakai fallback boolean saat nilai menang tidak dikenali', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .set('x-user-pid', '9')
      .send({
        panjang: 5,
        percobaan: 2,
        detik: 15,
        tebakan: 'kasa',
        menang: 'mungkin',
      });

    expect(response.status).toBe(201);
    expect(ModelSusunKata.simpanSkorHarian).toHaveBeenCalledWith(expect.objectContaining({ menang: false }));
  });

  it('POST /harian/submit menangani konflik unik postgres (23505)', async () => {
    ModelSusunKata.simpanSkorHarian.mockRejectedValueOnce({ code: '23505' });

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, menang: false, tebakanTerakhir: 'kartu' });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('sudah tercatat');
  });

  it('POST /harian/submit meneruskan error umum ke middleware', async () => {
    ModelSusunKata.simpanSkorHarian.mockRejectedValueOnce(new Error('simpan gagal'));

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, menang: false });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('simpan gagal');
  });

  it('GET /harian/klasemen mengembalikan data dan 404 jika tidak ada susunKataId', async () => {
    const success = await request(createApp()).get('/api/publik/gim/susun-kata/harian/klasemen?panjang=5&limit=999');

    expect(success.status).toBe(200);
    expect(ModelSusunKata.ambilKlasemenHarian).toHaveBeenCalledWith({ susunKataId: 10, limit: 50 });

    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValueOnce({ id: null, kata: 'kartu' });
    const notFound = await request(createApp()).get('/api/publik/gim/susun-kata/harian/klasemen?panjang=5');

    expect(notFound.status).toBe(404);
    expect(notFound.body.success).toBe(false);
  });

  it('GET /harian/klasemen meneruskan error ke middleware', async () => {
    ModelSusunKata.ambilTanggalHariIniJakarta.mockRejectedValueOnce(new Error('klasemen gagal'));

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/harian/klasemen');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('klasemen gagal');
  });

  it('GET /validasi/:kata mengembalikan hasil validasi dan meneruskan error', async () => {
    const success = await request(createApp()).get('/api/publik/gim/susun-kata/validasi/KARTU?panjang=5');

    expect(success.status).toBe(200);
    expect(success.body).toEqual({ kata: 'kartu', panjang: 5, valid: true });

    ModelEntri.cekKataSusunKataValid.mockRejectedValueOnce(new Error('validasi gagal'));
    const failed = await request(createApp()).get('/api/publik/gim/susun-kata/validasi/KARTU?panjang=5');

    expect(failed.status).toBe(500);
    expect(failed.body.error).toBe('validasi gagal');
  });

  it('GET /validasi/:kata memakai panjang default saat query kosong', async () => {
    const response = await request(createApp()).get('/api/publik/gim/susun-kata/validasi/KATA');

    expect(response.status).toBe(200);
    expect(ModelSusunKata.parsePanjang).toHaveBeenCalledWith(undefined, 5);
  });
});
