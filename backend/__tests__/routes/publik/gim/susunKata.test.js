/**
 * @fileoverview Test route gim susun kata
 * @tested_in backend/routes/publik/gim/susunKata.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../middleware/auth', () => ({
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

jest.mock('../../../../models/leksikon/modelEntri', () => ({
  ambilArtiSusunKataByIndeks: jest.fn(),
  cekKataSusunKataValid: jest.fn(),
}));

jest.mock('../../../../models/gim/modelSusunKata', () => ({
  parsePanjang: jest.fn((value, fallback = 5) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 4), 8);
  }),
  parsePanjangBebas: jest.fn((value, fallback = 5) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 4), 6);
  }),
  parsePenggunaId: jest.fn((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }),
  hitungSkor: jest.fn(({ percobaan, menang }) => (menang ? Math.max(11 - percobaan, 1) : 0)),
  ambilTanggalHariIniJakarta: jest.fn(),
  ambilAtauBuatHarian: jest.fn(),
  ambilSkorPenggunaHarian: jest.fn(),
  ambilProgresPenggunaHarian: jest.fn(),
  simpanProgresPenggunaHarian: jest.fn(),
  simpanSkorHarian: jest.fn(),
  ambilKlasemenHarian: jest.fn(),
  ambilPuzzleBebas: jest.fn(),
  simpanSkorBebas: jest.fn(),
  ambilKlasemenBebas: jest.fn(),
}));

const router = require('../../../../routes/publik/gim/susunKata');
const ModelEntri = require('../../../../models/leksikon/modelEntri');
const ModelSusunKata = require('../../../../models/gim/modelSusunKata');
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

describe('routes/publik/gim/susunKata', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ModelSusunKata.ambilTanggalHariIniJakarta.mockResolvedValue('2026-03-02');
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValue({ id: 10, kata: 'kartu' });
    ModelEntri.ambilArtiSusunKataByIndeks.mockResolvedValue('alat tulis');
    ModelSusunKata.ambilSkorPenggunaHarian.mockResolvedValue(null);
    ModelSusunKata.ambilProgresPenggunaHarian.mockResolvedValue(null);
    ModelSusunKata.simpanProgresPenggunaHarian.mockResolvedValue({
      id: 99,
      susun_kata_id: 10,
      pengguna_id: 9,
      tebakan: 'kartu',
    });
    ModelSusunKata.simpanSkorHarian.mockResolvedValue({ id: 1, susun_kata_id: 10, pengguna_id: 9 });
    ModelSusunKata.ambilKlasemenHarian.mockResolvedValue([{ pengguna_id: 9, nama: 'A', skor: 8 }]);
    ModelSusunKata.ambilPuzzleBebas.mockResolvedValue({ panjang: 5, target: 'kartu', arti: 'alat tulis', kamus: ['kartu'] });
    ModelSusunKata.simpanSkorBebas.mockResolvedValue({ id: 2, pengguna_id: 9, kata: 'kartu' });
    ModelSusunKata.ambilKlasemenBebas.mockResolvedValue([{ pengguna_id: 9, nama: 'A', rata_poin: 7.5, total_main: 4 }]);
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
    expect(__private.parseRiwayatTebakanHarian('abcde;ab12e;fghij', 5)).toEqual(['abcde', 'fghij']);
    expect(__private.parseRiwayatTebakanHarian('abcd;efgh', 'abc')).toEqual([]);
    expect(__private.parseRiwayatTebakanHarian('abcde;fghij')).toEqual(['abcde', 'fghij']);
    expect(__private.parseRiwayatTebakanHarian('abcd;ab12;ABCDE', 4)).toEqual(['abcd']);
    expect(__private.parseRiwayatTebakanHarian(undefined, 5)).toEqual([]);
  });

  it('helper private buildBebasPayload menutup cabang default parameter', async () => {
    const payload = await __private.buildBebasPayload({});
    expect(payload).toEqual(expect.objectContaining({ mode: 'bebas', sudahMainHariIni: false }));
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

  it('POST /harian/progres mengembalikan 401 ketika user tidak valid', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/progres')
      .send({ panjang: 5, tebakan: 'kartu' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Autentikasi diperlukan');
  });

  it('POST /harian/progres mengembalikan 404 saat kata harian belum tersedia', async () => {
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValueOnce(null);

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/progres')
      .set('x-user-pid', '9')
      .send({ panjang: 5, tebakan: 'kartu' });

    expect(response.status).toBe(404);
  });

  it('POST /harian/progres mengembalikan 409 jika skor sudah tercatat', async () => {
    ModelSusunKata.ambilSkorPenggunaHarian.mockResolvedValue({ id: 77, menang: true });

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/progres')
      .set('x-user-pid', '9')
      .send({ panjang: 5, tebakan: 'kartu' });

    expect(response.status).toBe(409);
    expect(response.body.data).toEqual({ id: 77, menang: true });
  });

  it('POST /harian/progres sukses dan memfilter tebakan sesuai regex+panjang', async () => {
    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/progres?panjang=5')
      .set('x-user-pid', '9')
      .send({ tebakan: 'abcde;ABCD3;kartu;katun;selalu;tepat;lebih;akhir' });

    expect(response.status).toBe(200);
    expect(ModelSusunKata.simpanProgresPenggunaHarian).toHaveBeenCalledWith({
      susunKataId: 10,
      penggunaId: 9,
      tebakan: 'abcde;kartu;katun;tepat;lebih;akhir',
    });
  });

  it('POST /harian/progres mengembalikan 409 saat simpan progres tidak berhasil', async () => {
    ModelSusunKata.simpanProgresPenggunaHarian.mockResolvedValueOnce(null);

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/progres')
      .set('x-user-pid', '9')
      .send({ panjang: 5, tebakan: 'kartu' });

    expect(response.status).toBe(409);
  });

  it('POST /harian/progres meneruskan error umum ke middleware', async () => {
    ModelSusunKata.simpanProgresPenggunaHarian.mockRejectedValueOnce(new Error('progres gagal'));

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/harian/progres')
      .set('x-user-pid', '9')
      .send({ panjang: 5, tebakan: 'kartu' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('progres gagal');
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

  it('GET /bebas mengembalikan payload bebas dan 404 saat kosong', async () => {
    const success = await request(createApp()).get('/api/publik/gim/susun-kata/bebas');

    expect(success.status).toBe(200);
    expect(success.body.mode).toBe('bebas');

    ModelSusunKata.ambilPuzzleBebas.mockResolvedValueOnce(null);
    const notFound = await request(createApp()).get('/api/publik/gim/susun-kata/bebas');
    expect(notFound.status).toBe(404);

    await request(createApp()).get('/api/publik/gim/susun-kata/bebas?panjang=6');
    expect(ModelSusunKata.parsePanjangBebas).toHaveBeenCalledWith('6', 5);
  });

  it('GET /bebas meneruskan error ke middleware', async () => {
    ModelSusunKata.ambilPuzzleBebas.mockRejectedValueOnce(new Error('bebas gagal'));

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/bebas');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('bebas gagal');
  });

  it('POST /bebas/submit validasi auth, kata, dan sukses simpan skor', async () => {
    const unauthorized = await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .send({ panjang: 5, kata: 'kartu' });
    expect(unauthorized.status).toBe(401);

    ModelEntri.cekKataSusunKataValid.mockResolvedValueOnce(false);
    const invalid = await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, kata: 'zzzzz', menang: true, tebakan: 'zzzzz' });
    expect(invalid.status).toBe(400);

    const success = await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, kata: 'kartu', menang: true, tebakan: 'kartu', percobaan: 2, detik: 10 });

    expect(success.status).toBe(201);
    expect(ModelSusunKata.simpanSkorBebas).toHaveBeenCalledWith(expect.objectContaining({ penggunaId: 9, kata: 'kartu', menang: true }));
  });

  it('POST /bebas/submit memvalidasi format kata dan kecocokan tebakan terakhir', async () => {
    const badFormat = await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, kata: 'ka1tu', menang: false });
    expect(badFormat.status).toBe(400);

    const badLastGuess = await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, kata: 'kartu', menang: true, tebakan: 'kartu;salah' });
    expect(badLastGuess.status).toBe(400);

    await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, kata: 'kartu', menang: false, percobaan: 2, waktuDetik: 11, tebakan: 'kartu' });
    expect(ModelSusunKata.simpanSkorBebas).toHaveBeenLastCalledWith(expect.objectContaining({ detik: 11 }));

    await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, kata: 'kartu', menang: false, percobaan: 2, detik: 9, tebakan: '', tanggal: '2026-03-02' });
    expect(ModelSusunKata.simpanSkorBebas).toHaveBeenLastCalledWith(expect.objectContaining({ detik: 9, tanggal: '2026-03-02', tebakan: '' }));

    await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit?panjang=6')
      .set('x-user-pid', '9')
      .send({ kata: 'kartut', menang: false, percobaan: 2, tebakan: 'kartut' });
    expect(ModelSusunKata.parsePanjangBebas).toHaveBeenLastCalledWith('6', 5);

    const tanpaKata = await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, menang: false, percobaan: 1 });
    expect(tanpaKata.status).toBe(400);
  });

  it('GET /bebas/klasemen meneruskan error', async () => {
    ModelSusunKata.ambilKlasemenBebas.mockRejectedValueOnce(new Error('klasemen bebas gagal'));

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/bebas/klasemen');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('klasemen bebas gagal');
  });

  it('POST /bebas/submit meneruskan error umum', async () => {
    ModelSusunKata.simpanSkorBebas.mockRejectedValueOnce(new Error('simpan bebas gagal'));

    const response = await request(createApp())
      .post('/api/publik/gim/susun-kata/bebas/submit')
      .set('x-user-pid', '9')
      .send({ panjang: 5, kata: 'kartu', menang: false });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('simpan bebas gagal');
  });

  it('GET /bebas/klasemen mengembalikan data', async () => {
    const response = await request(createApp()).get('/api/publik/gim/susun-kata/bebas/klasemen?limit=99');

    expect(response.status).toBe(200);
    expect(ModelSusunKata.ambilKlasemenBebas).toHaveBeenCalledWith({ limit: 50 });
    expect(response.body.mode).toBe('bebas');
  });
});


