/**
 * @fileoverview Test route gim pilih ganda
 * @tested_in backend/routes/gim/pilihGanda.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../models/modelPilihGanda', () => ({
  ambilRonde: jest.fn(),
}));

const router = require('../../routes/gim/pilihGanda');
const ModelPilihGanda = require('../../models/modelPilihGanda');

function createApp() {
  const app = express();
  app.use('/api/publik/gim/pilih-ganda', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/gim/pilihGanda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('GET /ronde meneruskan riwayat ke model', async () => {
    ModelPilihGanda.ambilRonde.mockResolvedValueOnce([{ mode: 'kamus', soal: 'alpha' }]);

    const response = await request(createApp())
      .get('/api/publik/gim/pilih-ganda/ronde')
      .query({
        riwayat: JSON.stringify([
          { mode: 'kamus', kunciSoal: 'alpha' },
          { mode: 'tesaurus', kunciSoal: 'beta' },
        ]),
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ronde: [{ mode: 'kamus', soal: 'alpha' }] });
    expect(ModelPilihGanda.ambilRonde).toHaveBeenCalledWith({
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
    ModelPilihGanda.ambilRonde.mockResolvedValueOnce([]);

    const response = await request(createApp()).get('/api/publik/gim/pilih-ganda/ronde');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Soal tidak tersedia saat ini' });
  });

  it('GET /ronde meneruskan error ke middleware', async () => {
    ModelPilihGanda.ambilRonde.mockRejectedValueOnce(new Error('db rusak'));

    const response = await request(createApp()).get('/api/publik/gim/pilih-ganda/ronde');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'db rusak' });
  });
});