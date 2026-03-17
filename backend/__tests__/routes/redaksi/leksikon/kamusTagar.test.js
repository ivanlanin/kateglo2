/**
 * @fileoverview Test endpoint tagar pada route redaksi kamus
 * @tested_in backend/routes/redaksi/kamus.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../middleware/authorization', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../../models/leksikon/modelEntri', () => ({
  simpanContoh: jest.fn(),
  hapusContoh: jest.fn(),
}));

jest.mock('../../../../models/master/modelTagar', () => ({
  ambilTagarEntri: jest.fn(),
  simpanTagarEntri: jest.fn(),
}));

jest.mock('../../../../services/layananKamusPublik', () => ({
  hapusCacheDetailKamus: jest.fn(),
  ambilDetailKamus: jest.fn(),
}));

const router = require('../../../../routes/redaksi/leksikon/kamus');
const ModelTagar = require('../../../../models/master/modelTagar');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/kamus', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/kamus tagar endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelTagar.ambilTagarEntri.mockResolvedValue([{ id: 1, kode: 'pref' }]);
    ModelTagar.simpanTagarEntri.mockResolvedValue();
  });

  it('GET /:entriId/tagar validasi id, sukses, dan error', async () => {
    const bad = await request(createApp()).get('/api/redaksi/kamus/abc/tagar');
    expect(bad.status).toBe(400);

    const ok = await request(createApp()).get('/api/redaksi/kamus/10/tagar');
    expect(ok.status).toBe(200);
    expect(ModelTagar.ambilTagarEntri).toHaveBeenCalledWith(10);

    ModelTagar.ambilTagarEntri.mockRejectedValueOnce(new Error('ambil tagar gagal'));
    const err = await request(createApp()).get('/api/redaksi/kamus/10/tagar');
    expect(err.status).toBe(500);
  });

  it('PUT /:entriId/tagar validasi id, default tagar_ids kosong, sukses, dan error', async () => {
    const bad = await request(createApp()).put('/api/redaksi/kamus/abc/tagar').send({ tagar_ids: [1] });
    expect(bad.status).toBe(400);

    const ok = await request(createApp()).put('/api/redaksi/kamus/11/tagar').send({ tagar_ids: [1, 2] });
    expect(ok.status).toBe(200);
    expect(ModelTagar.simpanTagarEntri).toHaveBeenCalledWith(11, [1, 2]);
    expect(ModelTagar.ambilTagarEntri).toHaveBeenCalledWith(11);

    await request(createApp()).put('/api/redaksi/kamus/12/tagar').send({ tagar_ids: 'invalid' });
    expect(ModelTagar.simpanTagarEntri).toHaveBeenLastCalledWith(12, []);

    ModelTagar.simpanTagarEntri.mockRejectedValueOnce(new Error('simpan tagar gagal'));
    const err = await request(createApp()).put('/api/redaksi/kamus/13/tagar').send({ tagar_ids: [1] });
    expect(err.status).toBe(500);
  });
});


