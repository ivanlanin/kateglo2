/**
 * @fileoverview Test route publik pencarian populer
 * @tested_in backend/routes/publik/interaksi/pencarian.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../models/interaksi/modelPencarian', () => ({
  ambilFrasaPopulerPerDomain: jest.fn(),
}));

jest.mock('../../../../services/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
}));

const router = require('../../../../routes/publik/interaksi/pencarian');
const ModelPencarian = require('../../../../models/interaksi/modelPencarian');
const cacheService = require('../../../../services/layananCache');

function createApp() {
  const app = express();
  app.use('/api/publik/pencarian', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/publik/interaksi/pencarian', () => {
  const originalTtl = process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS;

    cacheService.getJson.mockResolvedValue(null);
    cacheService.setJson.mockResolvedValue(true);
    ModelPencarian.ambilFrasaPopulerPerDomain.mockResolvedValue([
      { domain_nama: 'kamus', tanggal: '2026-03-02', kata: 'air' },
      { domain_nama: 'tesaurus', tanggal: '2026-03-01', kata: 'sinonim' },
      { domain_nama: 'makna', tanggal: new Date('2026-03-03T00:00:00.000Z'), kata: 'arti' },
    ]);
  });

  afterAll(() => {
    if (originalTtl === undefined) delete process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS;
    else process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS = originalTtl;
  });

  it('helper private mencakup parsing ttl, cache headers, map data, dan normalisasi tanggal', () => {
    const { __private } = router;

    expect(__private.parseTanggal(undefined)).toBeNull();
    expect(__private.parseTanggal('2026-03-02')).toBe('2026-03-02');
    expect(__private.parseTanggal('2026/03/02')).toBeNull();
    expect(__private.tanggalHariIni()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS = 'abc';
    expect(__private.parsePopularCacheTtl()).toBe(300);

    process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS = '10';
    expect(__private.parsePopularCacheTtl()).toBe(60);

    process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS = '9999';
    expect(__private.parsePopularCacheTtl()).toBe(3600);

    const res = { set: jest.fn() };
    __private.setCacheHeaders(res, -1, -5);
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=0, stale-while-revalidate=0');
    __private.setCacheHeaders(res, 'abc', 'zzz');
    expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'public, max-age=0, stale-while-revalidate=0');
    __private.setCacheHeaders(res, '120', '180');
    expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'public, max-age=120, stale-while-revalidate=180');
    __private.setCacheHeaders(res);
    expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    expect(__private.mapDataPopuler([{ domain_nama: 'kamus', kata: 'air' }])).toEqual({
      kamus: 'air',
      tesaurus: null,
      glosarium: null,
      makna: null,
      rima: null,
    });
    expect(__private.mapDataPopuler([
      { domain_nama: 'kamus', kata: 'air' },
      { domain_nama: 'tesaurus', kata: 'sinonim' },
      { domain_nama: 'glosarium', kata: 'istilah' },
      { domain_nama: 'makna', kata: 'arti' },
      { domain_nama: 'rima', kata: 'sajak' },
    ])).toEqual({
      kamus: 'air',
      tesaurus: 'sinonim',
      glosarium: 'istilah',
      makna: 'arti',
      rima: 'sajak',
    });
    expect(__private.mapDataPopuler()).toEqual({
      kamus: null,
      tesaurus: null,
      glosarium: null,
      makna: null,
      rima: null,
    });
    expect(__private.mapDataPopuler([{ domain_nama: 'kamus', kata: '' }]).kamus).toBeNull();

    expect(__private.normalisasiTanggalOutput(null)).toBeNull();
    expect(__private.normalisasiTanggalOutput(new Date('invalid'))).toBeNull();
    expect(__private.normalisasiTanggalOutput('2026-03-02')).toBe('2026-03-02');
    expect(__private.normalisasiTanggalOutput('2026/03/02')).toBeNull();
  });

  it('GET /populer memakai cache saat tersedia', async () => {
    cacheService.getJson.mockResolvedValueOnce({ tanggal: '2026-03-02', tanggalData: '2026-03-02', data: {} });

    const response = await request(createApp()).get('/api/publik/pencarian/populer?tanggal=2026-03-02');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('max-age=60');
    expect(ModelPencarian.ambilFrasaPopulerPerDomain).not.toHaveBeenCalled();
  });

  it('GET /populer membangun payload dari model saat cache miss', async () => {
    process.env.POPULAR_SEARCH_CACHE_TTL_SECONDS = '600';

    const response = await request(createApp()).get('/api/publik/pencarian/populer?tanggal=invalid');

    expect(response.status).toBe(200);
    expect(ModelPencarian.ambilFrasaPopulerPerDomain).toHaveBeenCalledWith({
      tanggalReferensi: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(cacheService.setJson).toHaveBeenCalledWith(
      expect.stringContaining('publik:pencarian:populer:v2:'),
      expect.objectContaining({ tanggalData: '2026-03-03' }),
      600
    );
    expect(response.body.data).toEqual({
      kamus: 'air',
      tesaurus: 'sinonim',
      glosarium: null,
      makna: 'arti',
      rima: null,
    });
  });

  it('GET /populer mengembalikan tanggalData null saat semua tanggal sumber tidak valid', async () => {
    ModelPencarian.ambilFrasaPopulerPerDomain.mockResolvedValueOnce([
      { domain_nama: 'kamus', tanggal: 'invalid', kata: 'air' },
      { domain_nama: 'tesaurus', tanggal: null, kata: 'sinonim' },
    ]);

    const response = await request(createApp()).get('/api/publik/pencarian/populer?tanggal=2026-03-02');

    expect(response.status).toBe(200);
    expect(response.body.tanggalData).toBeNull();
  });

  it('GET /populer meneruskan error ke middleware', async () => {
    cacheService.getJson.mockRejectedValueOnce(new Error('cache gagal'));

    const response = await request(createApp()).get('/api/publik/pencarian/populer?tanggal=2026-03-02');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cache gagal');
  });
});


