/**
 * @fileoverview Test route share preview
 * @tested_in backend/routes/share.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../models/modelLabel', () => ({
  cariEntriPerLabel: jest.fn(),
}));

jest.mock('../../services/layananKamusPublik', () => ({
  ambilDetailKamus: jest.fn(),
}));

jest.mock('../../services/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  getTtlSeconds: jest.fn(() => 900),
}));

const ModelLabel = require('../../models/modelLabel');
const { ambilDetailKamus } = require('../../services/layananKamusPublik');
const { getJson, setJson } = require('../../services/layananCache');
const shareRouter = require('../../routes/share');

function createApp() {
  const app = express();
  app.use('/share', shareRouter);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes/share', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PUBLIC_SITE_URL = 'https://kateglo.org';
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
  });

  afterAll(() => {
    delete process.env.PUBLIC_SITE_URL;
  });

  it('GET /share/kamus/detail/:indeks mengembalikan HTML preview dinamis', async () => {
    ambilDetailKamus.mockResolvedValue({
      indeks: 'kata',
      entri: [
        {
          entri: 'kata',
          makna: [{ makna: 'unsur bahasa yang diucapkan atau dituliskan' }],
        },
      ],
    });

    const response = await request(createApp()).get('/share/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['cache-control']).toContain('s-maxage=900');
    expect(response.text).toContain('<meta property="og:title" content="kata - Kateglo" />');
    expect(response.text).toContain('https://kateglo.org/kamus/detail/kata');
  });

  it('GET /share/:section mengembalikan preview untuk path menu dasar', async () => {
    const kamus = await request(createApp()).get('/share/kamus');
    const tesaurus = await request(createApp()).get('/share/tesaurus');
    const glosarium = await request(createApp()).get('/share/glosarium');

    expect(kamus.status).toBe(200);
    expect(tesaurus.status).toBe(200);
    expect(glosarium.status).toBe(200);

    expect(kamus.text).toContain('<meta property="og:title" content="Kamus - Kateglo" />');
    expect(tesaurus.text).toContain('<meta property="og:title" content="Tesaurus - Kateglo" />');
    expect(glosarium.text).toContain('<meta property="og:title" content="Glosarium - Kateglo" />');
  });

  it('GET /share/kamus/:kategori/:kode mengembalikan HTML preview kategori', async () => {
    ModelLabel.cariEntriPerLabel.mockResolvedValue({
      total: 25,
      label: { nama: 'nomina' },
    });

    const response = await request(createApp()).get('/share/kamus/kelas-kata/nomina');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<meta property="og:title" content="Kamus Kelas Kata: nomina - Kateglo" />');
    expect(response.text).toContain('25 entri ditemukan untuk kategori nomina.');
  });

  it('GET /share/kamus/detail/:indeks memakai cache jika tersedia', async () => {
    getJson.mockResolvedValue({ html: '<html><body>cached</body></html>' });

    const response = await request(createApp()).get('/share/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.text).toContain('cached');
    expect(ambilDetailKamus).not.toHaveBeenCalled();
  });
});
