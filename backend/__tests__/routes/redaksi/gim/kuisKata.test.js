/**
 * @fileoverview Test route redaksi kuis kata
 * @tested_in backend/routes/redaksi/kuisKata.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../middleware/otorisasi', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../models/gim/modelKuisKata', () => ({
  parseTanggal: jest.fn((value) => {
    const raw = String(value || '').trim();
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    return raw;
  }),
  parseLimit: jest.fn((value, fallback = 200, maksimum = 1000) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), maksimum);
  }),
  daftarRekapAdmin: jest.fn(),
}));

const router = require('../../../routes/redaksi/kuisKata');
const ModelKuisKata = require('../../../models/gim/modelKuisKata');

function createApp() {
  const app = express();
  app.use('/api/redaksi/kuis-kata', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/kuisKata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelKuisKata.daftarRekapAdmin.mockResolvedValue([{ id: 1, tanggal: '2026-03-15', nama: 'A' }]);
  });

  it('helper private parser memproses tanggal dan limit', () => {
    expect(router.__private.parseTanggal('2026-03-15')).toBe('2026-03-15');
    expect(router.__private.parseTanggal('2026/03/15')).toBeNull();
    expect(router.__private.parseLimit('abc')).toBe(200);
    expect(router.__private.parseLimit('0')).toBe(1);
    expect(router.__private.parseLimit('9999')).toBe(1000);
  });

  it('GET / mengembalikan rekap admin', async () => {
    const response = await request(createApp()).get('/api/redaksi/kuis-kata?tanggal=2026-03-15&limit=25');

    expect(response.status).toBe(200);
    expect(ModelKuisKata.daftarRekapAdmin).toHaveBeenCalledWith({ tanggal: '2026-03-15', limit: 25 });
    expect(response.body.data).toEqual([{ id: 1, tanggal: '2026-03-15', nama: 'A' }]);
  });

  it('GET / memakai fallback saat query invalid', async () => {
    await request(createApp()).get('/api/redaksi/kuis-kata?tanggal=2026/03/15&limit=abc');

    expect(ModelKuisKata.daftarRekapAdmin).toHaveBeenCalledWith({ tanggal: null, limit: 200 });
  });

  it('GET / meneruskan error', async () => {
    ModelKuisKata.daftarRekapAdmin.mockRejectedValueOnce(new Error('rekap kuis gagal'));

    const response = await request(createApp()).get('/api/redaksi/kuis-kata');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('rekap kuis gagal');
  });
});

