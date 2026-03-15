/**
 * @fileoverview Test route gim kuis kata
 * @tested_in backend/routes/gim/kuisKata.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/auth', () => ({
  authenticate: (req, _res, next) => {
    const pid = req.headers['x-user-pid'];
    if (pid !== undefined) req.user = { pid };
    next();
  },
}));

jest.mock('../../models/modelKuisKata', () => ({
  ambilRonde: jest.fn(),
  parseLimit: jest.fn((value, fallback = 10, maksimum = 50) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), maksimum);
  }),
  parsePenggunaId: jest.fn((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }),
  parseJumlahBenar: jest.fn((value, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 0), 100);
  }),
  parseJumlahPertanyaan: jest.fn((value, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 0), 100);
  }),
  parseDurasiDetik: jest.fn((value, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 0), 86400);
  }),
  ambilKlasemenHarian: jest.fn(),
  simpanRekapHarian: jest.fn(),
}));

const router = require('../../routes/gim/kuisKata');
const ModelKuisKata = require('../../models/modelKuisKata');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/publik/gim/kuis-kata', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/gim/kuisKata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelKuisKata.ambilKlasemenHarian.mockResolvedValue([{ pengguna_id: 9, nama: 'A', skor_total: 40 }]);
    ModelKuisKata.simpanRekapHarian.mockResolvedValue({
      id: 1,
      pengguna_id: 9,
      tanggal: '2026-03-15',
      jumlah_benar: 4,
      jumlah_pertanyaan: 5,
      durasi_detik: 17,
      jumlah_main: 1,
      skor_total: 40,
    });
  });

  it('parseRiwayat memetakan JSON valid per mode', () => {
    expect(router.__private.parseRiwayat(JSON.stringify([
      { mode: 'kamus', kunciSoal: 'alpha' },
      { mode: 'rima', kunciSoal: 'beta' },
      { mode: 'invalid', kunciSoal: 'x' },
    ]))).toEqual({
      kamus: ['alpha'],
      tesaurus: [],
      glosarium: [],
      makna: [],
      rima: ['beta'],
    });
  });

  it('parseRiwayat mengembalikan struktur kosong untuk input non-string, JSON invalid, dan bentuk non-array', () => {
    const kosong = {
      kamus: [],
      tesaurus: [],
      glosarium: [],
      makna: [],
      rima: [],
    };

    expect(router.__private.parseRiwayat()).toEqual(kosong);
    expect(router.__private.parseRiwayat('{invalid')).toEqual(kosong);
    expect(router.__private.parseRiwayat(JSON.stringify({ mode: 'kamus', kunciSoal: 'alpha' }))).toEqual(kosong);
  });

  it('parseRiwayat mengabaikan mode tidak dikenal dan kunci kosong', () => {
    expect(router.__private.parseRiwayat(JSON.stringify([
      { mode: ' KAMUS ', kunciSoal: ' alpha ' },
      { mode: 'tesaurus', kunciSoal: '' },
      null,
      { mode: 'lain', kunciSoal: 'x' },
      { mode: 'rima', kunciSoal: ' beta ' },
    ]))).toEqual({
      kamus: ['alpha'],
      tesaurus: [],
      glosarium: [],
      makna: [],
      rima: ['beta'],
    });
  });

  it('parseLimit memakai parser model dengan fallback bawaan', () => {
    expect(router.__private.parseLimit('abc')).toBe(10);
    expect(router.__private.parseLimit('99')).toBe(50);
  });

  it('GET /ronde meneruskan riwayat ke model', async () => {
    ModelKuisKata.ambilRonde.mockResolvedValueOnce([{ mode: 'kamus', soal: 'alpha' }]);

    const response = await request(createApp())
      .get('/api/publik/gim/kuis-kata/ronde')
      .query({
        riwayat: JSON.stringify([
          { mode: 'kamus', kunciSoal: 'alpha' },
          { mode: 'tesaurus', kunciSoal: 'beta' },
        ]),
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ronde: [{ mode: 'kamus', soal: 'alpha' }] });
    expect(ModelKuisKata.ambilRonde).toHaveBeenCalledWith({
      riwayat: {
        kamus: ['alpha'],
        tesaurus: ['beta'],
        glosarium: [],
        makna: [],
        rima: [],
      },
    });
  });

  it('GET /ronde mengembalikan 503 saat model tidak menghasilkan soal', async () => {
    ModelKuisKata.ambilRonde.mockResolvedValueOnce([]);

    const response = await request(createApp()).get('/api/publik/gim/kuis-kata/ronde');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Soal tidak tersedia saat ini' });
  });

  it('GET /ronde meneruskan error ke middleware', async () => {
    ModelKuisKata.ambilRonde.mockRejectedValueOnce(new Error('db rusak'));

    const response = await request(createApp()).get('/api/publik/gim/kuis-kata/ronde');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'db rusak' });
  });

  it('GET /klasemen mengembalikan klasemen harian', async () => {
    const response = await request(createApp()).get('/api/publik/gim/kuis-kata/klasemen?limit=99');

    expect(response.status).toBe(200);
    expect(ModelKuisKata.ambilKlasemenHarian).toHaveBeenCalledWith({ limit: 50 });
    expect(response.body).toEqual({
      success: true,
      data: [{ pengguna_id: 9, nama: 'A', skor_total: 40 }],
    });
  });

  it('GET /klasemen meneruskan error ke middleware', async () => {
    ModelKuisKata.ambilKlasemenHarian.mockRejectedValueOnce(new Error('klasemen gagal'));

    const response = await request(createApp()).get('/api/publik/gim/kuis-kata/klasemen');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('klasemen gagal');
  });

  it('POST /submit memerlukan autentikasi pengguna', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .send({ jumlahBenar: 4, jumlahPertanyaan: 5, durasiDetik: 17 });

    expect(response.status).toBe(401);
    expect(ModelKuisKata.simpanRekapHarian).not.toHaveBeenCalled();
  });

  it('POST /submit memvalidasi payload domain', async () => {
    const jumlahPertanyaanKosong = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .set('x-user-pid', '9')
      .send({ jumlahBenar: 0, jumlahPertanyaan: 0, durasiDetik: 17 });

    expect(jumlahPertanyaanKosong.status).toBe(400);

    const jumlahBenarInvalid = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .set('x-user-pid', '9')
      .send({ jumlahBenar: 6, jumlahPertanyaan: 5, durasiDetik: 17 });

    expect(jumlahBenarInvalid.status).toBe(400);
  });

  it('POST /submit menyimpan rekap harian kuis', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .set('x-user-pid', '9')
      .send({ jumlahBenar: 4, jumlahPertanyaan: 5, durasiDetik: 17 });

    expect(response.status).toBe(201);
    expect(ModelKuisKata.simpanRekapHarian).toHaveBeenCalledWith({
      penggunaId: 9,
      jumlahBenar: 4,
      jumlahPertanyaan: 5,
      durasiDetik: 17,
      jumlahMain: 1,
    });
    expect(response.body.success).toBe(true);
  });

  it('POST /submit memetakan error domain model', async () => {
    ModelKuisKata.simpanRekapHarian.mockRejectedValueOnce(new Error('Pengguna tidak valid'));

    const response = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .set('x-user-pid', '9')
      .send({ jumlahBenar: 4, jumlahPertanyaan: 5, durasiDetik: 17 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Pengguna tidak valid');
  });

  it('POST /submit memetakan error jumlah pertanyaan dan jumlah benar serta meneruskan error umum', async () => {
    ModelKuisKata.simpanRekapHarian.mockRejectedValueOnce(new Error('Jumlah pertanyaan harus lebih dari 0'));

    let response = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .set('x-user-pid', '9')
      .send({ jumlahBenar: 1, jumlahPertanyaan: 1, durasiDetik: 17 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('lebih dari 0');

    ModelKuisKata.simpanRekapHarian.mockRejectedValueOnce(new Error('Jumlah benar tidak boleh melebihi jumlah pertanyaan'));
    response = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .set('x-user-pid', '9')
      .send({ jumlahBenar: 1, jumlahPertanyaan: 1, durasiDetik: 17 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('melebihi');

    ModelKuisKata.simpanRekapHarian.mockRejectedValueOnce(new Error('server rusak'));
    response = await request(createApp())
      .post('/api/publik/gim/kuis-kata/submit')
      .set('x-user-pid', '9')
      .send({ jumlahBenar: 1, jumlahPertanyaan: 1, durasiDetik: 17 });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('server rusak');
  });
});