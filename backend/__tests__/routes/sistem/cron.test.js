/**
 * @fileoverview Test route cron internal
 * @tested_in backend/routes/sistem/cron.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../jobs/jobSusunKataHarian', () => ({
  jalankanPrefillSusunKataHarian: jest.fn(),
  parseTanggal: jest.fn((value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  }),
  parseTotalHari: jest.fn((value, fallback = 30) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), 365);
  }),
}));

jest.mock('../../../jobs/jobWikipedia', () => ({
  jalankanProsesWikipedia: jest.fn(),
}));

const router = require('../../../routes/sistem/cron');
const { __private } = router;
const { jalankanPrefillSusunKataHarian } = require('../../../jobs/jobSusunKataHarian');
const { jalankanProsesWikipedia } = require('../../../jobs/jobWikipedia');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/cron', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/sistem/cron', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret-test';
    jalankanPrefillSusunKataHarian.mockResolvedValue({
      tanggalMulai: '2026-03-12',
      totalHari: 30,
      jumlah: 30,
      data: [],
    });
    jalankanProsesWikipedia.mockResolvedValue({ artikelDiproses: 5, kandidatBaru: 2 });
  });

  afterAll(() => {
    delete process.env.CRON_SECRET;
  });

  it('helper private membaca bearer token atau x-cron-secret', () => {
    expect(__private.ambilSecretRequest({ get: jest.fn((key) => (key === 'authorization' ? 'Bearer abc' : '')) })).toBe('abc');
    expect(__private.ambilSecretRequest({ get: jest.fn((key) => (key === 'x-cron-secret' ? 'xyz' : '')) })).toBe('xyz');
  });

  it('POST /cron/susun-kata/harian menolak saat secret tidak dikirim', async () => {
    const response = await request(createApp()).post('/cron/susun-kata/harian');

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('tidak valid');
  });

  it('POST /cron/susun-kata/harian menolak saat konfigurasi secret belum lengkap', async () => {
    delete process.env.CRON_SECRET;

    const response = await request(createApp())
      .post('/cron/susun-kata/harian')
      .set('Authorization', 'Bearer cron-secret-test');

    expect(response.status).toBe(503);
    expect(response.body.message).toContain('belum lengkap');
  });

  it('POST /cron/susun-kata/harian menjalankan job dengan bearer token', async () => {
    const response = await request(createApp())
      .post('/cron/susun-kata/harian?tanggalMulai=2026-03-15&totalHari=7')
      .set('Authorization', 'Bearer cron-secret-test');

    expect(response.status).toBe(200);
    expect(jalankanPrefillSusunKataHarian).toHaveBeenCalledWith({
      tanggalMulai: '2026-03-15',
      totalHari: 7,
    });
    expect(response.body.data).toEqual({
      tanggalMulai: '2026-03-12',
      totalHari: 30,
      jumlah: 30,
    });
  });

  it('POST /cron/susun-kata/harian menerima x-cron-secret dan body json', async () => {
    const response = await request(createApp())
      .post('/cron/susun-kata/harian')
      .set('X-Cron-Secret', 'cron-secret-test')
      .send({ tanggalMulai: '2026-03-20', totalHari: 14 });

    expect(response.status).toBe(200);
    expect(jalankanPrefillSusunKataHarian).toHaveBeenCalledWith({
      tanggalMulai: '2026-03-20',
      totalHari: 14,
    });
  });

  it('POST /cron/susun-kata/harian meneruskan error job', async () => {
    jalankanPrefillSusunKataHarian.mockRejectedValueOnce(new Error('job gagal'));

    const response = await request(createApp())
      .post('/cron/susun-kata/harian')
      .set('Authorization', 'Bearer cron-secret-test');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('job gagal');
  });

  it('POST /cron/kadi/wikipedia menjalankan job wikipedia dengan clamp batas artikel', async () => {
    const response = await request(createApp())
      .post('/cron/kadi/wikipedia')
      .set('X-Cron-Secret', 'cron-secret-test')
      .send({ batasArtikel: 9999 });

    expect(response.status).toBe(200);
    expect(jalankanProsesWikipedia).toHaveBeenCalledWith({ batasArtikel: 500 });
    expect(response.body.data).toEqual({ artikelDiproses: 5, kandidatBaru: 2 });
  });

  it('POST /cron/kadi/wikipedia memakai fallback minimum dan meneruskan error job', async () => {
    await request(createApp())
      .post('/cron/kadi/wikipedia')
      .set('Authorization', 'Bearer cron-secret-test')
      .send({ batasArtikel: 0 });

    expect(jalankanProsesWikipedia).toHaveBeenCalledWith({ batasArtikel: 50 });

    jalankanProsesWikipedia.mockRejectedValueOnce(new Error('wiki gagal'));
    const response = await request(createApp())
      .post('/cron/kadi/wikipedia')
      .set('Authorization', 'Bearer cron-secret-test');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('wiki gagal');
  });
});