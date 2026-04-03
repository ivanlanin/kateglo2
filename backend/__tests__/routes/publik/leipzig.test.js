/**
 * @fileoverview Test route publik Leipzig.
 * @tested_in backend/routes/publik/leipzig.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../models/leipzig/modelKorpus', () => ({
  ambilDaftarTersedia: jest.fn(),
  ambilDetail: jest.fn(),
}));

jest.mock('../../../models/leipzig/modelKata', () => ({
  ambilInfoKata: jest.fn(),
  ambilPeringkat: jest.fn(),
}));

jest.mock('../../../models/leipzig/modelKalimat', () => ({
  cariContohKata: jest.fn(),
}));

jest.mock('../../../models/leipzig/modelKookurensi', () => ({
  ambilSekalimat: jest.fn(),
  ambilTetangga: jest.fn(),
  ambilGraf: jest.fn(),
  ambilMiripKonteks: jest.fn(),
}));

const ModelKorpus = require('../../../models/leipzig/modelKorpus');
const ModelKata = require('../../../models/leipzig/modelKata');
const ModelKalimat = require('../../../models/leipzig/modelKalimat');
const ModelKookurensi = require('../../../models/leipzig/modelKookurensi');
const router = require('../../../routes/publik/leipzig');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/publik/leipzig', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/publik/leipzig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /korpus mengembalikan daftar korpus', async () => {
    ModelKorpus.ambilDaftarTersedia.mockResolvedValue([{ id: 'ind_news_2024_10K' }]);

    const response = await request(createApp()).get('/api/publik/leipzig/korpus');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [{ id: 'ind_news_2024_10K' }] });
  });

  it('GET /korpus/:korpusId/kata/:kata/contoh validasi kata kosong', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/%20%20/contoh');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Kata wajib diisi');
  });

  it('GET /korpus/:korpusId/kata/:kata mengembalikan info kata', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true, label: 'Berita 2024' });
    ModelKata.ambilInfoKata.mockResolvedValue({
      kata: 'jika',
      frekuensi: 42,
      rank: 10,
      kelasFrekuensi: 2,
      bentuk: [{ kata: 'jika', frekuensi: 42, wordId: 1 }],
    });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika');

    expect(response.status).toBe(200);
    expect(response.body.rank).toBe(10);
    expect(ModelKata.ambilInfoKata).toHaveBeenCalledWith('ind_news_2024_10K', 'jika');
  });

  it('GET /korpus/:korpusId/kata/:kata mengembalikan 404 jika kata tidak ada', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });
    ModelKata.ambilInfoKata.mockResolvedValue({ frekuensi: 0, bentuk: [] });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/tidak-ada');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Kata tidak ditemukan pada korpus Leipzig');
  });

  it('GET /korpus/:korpusId/peringkat mengembalikan daftar frekuensi kata', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true, label: 'Berita 2024' });
    ModelKata.ambilPeringkat.mockResolvedValue({
      total: 2,
      limit: 25,
      offset: 0,
      hasMore: false,
      data: [
        { kata: 'jika', frekuensi: 42, rank: 1, kelasFrekuensi: 0 },
        { kata: 'indonesia', frekuensi: 13, rank: 2, kelasFrekuensi: 1 },
      ],
    });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/peringkat?limit=25&offset=0');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data).toHaveLength(2);
    expect(ModelKata.ambilPeringkat).toHaveBeenCalledWith('ind_news_2024_10K', { limit: '25', offset: '0' });
  });

  it('GET /korpus/:korpusId/kata/:kata/contoh mengembalikan 404 jika korpus tidak ada', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_web_2024_10K/kata/indonesia/contoh');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Korpus Leipzig tidak ditemukan');
  });

  it('GET /korpus/:korpusId/kata/:kata/contoh mengembalikan 503 jika sqlite belum siap', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: false });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/indonesia/contoh');
    expect(response.status).toBe(503);
    expect(response.body.message).toContain('Korpus Leipzig belum siap');
  });

  it('GET /korpus/:korpusId/kata/:kata/contoh mengembalikan 404 jika kata tidak ada', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });
    ModelKalimat.cariContohKata.mockResolvedValue({ total: 0 });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/indonesia/contoh');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Kata tidak ditemukan pada korpus Leipzig');
  });

  it('GET /korpus/:korpusId/kata/:kata/contoh mengembalikan payload sukses', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true, label: 'Berita 2024' });
    ModelKalimat.cariContohKata.mockResolvedValue({
      kata: 'indonesia',
      frekuensi: 13,
      total: 2,
      limit: 10,
      offset: 0,
      bentuk: [{ kata: 'Indonesia', frekuensi: 8 }],
      data: [{ sentenceId: 10, sentence: 'Indonesia menyiapkan korpus baru.' }],
    });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/indonesia/contoh?limit=10');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(ModelKalimat.cariContohKata).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: '10' });
    expect(response.body.success).toBe(true);
    expect(response.body.korpus.label).toBe('Berita 2024');
    expect(response.body.total).toBe(2);
  });

  it('GET endpoint Leipzig mengembalikan 503 jika runtime SQLite tidak didukung', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true, label: 'Berita 2024' });
    ModelKata.ambilInfoKata.mockRejectedValue({
      code: 'LEIPZIG_RUNTIME_UNSUPPORTED',
      message: 'Runtime Node.js ini belum mendukung node:sqlite. Gunakan Node 22 atau nonaktifkan fitur Leipzig berbasis SQLite.',
    });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika');

    expect(response.status).toBe(503);
    expect(response.body.message).toContain('belum mendukung node:sqlite');
  });

  it('GET /korpus/:korpusId/kata/:kata/kookurensi-sekalimat, tetangga, dan graf mengembalikan data', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true, label: 'Berita 2024' });
    ModelKookurensi.ambilSekalimat.mockResolvedValue({
      kata: 'jika',
      total: 2,
      limit: 25,
      offset: 0,
      data: [{ kata: 'maka', frekuensi: 10, signifikansi: 0.9 }],
    });
    ModelKookurensi.ambilTetangga.mockResolvedValue({
      kata: 'jika',
      limit: 25,
      kiri: [{ kata: 'apabila', frekuensi: 4 }],
      kanan: [{ kata: 'maka', frekuensi: 6 }],
    });
    ModelKookurensi.ambilGraf.mockResolvedValue({
      kata: 'jika',
      nodes: [{ id: 'jika', label: 'jika', weight: 1, isCenter: true }],
      edges: [],
    });

    const sekalimat = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/kookurensi-sekalimat');
    const tetangga = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/kookurensi-tetangga');
    const graf = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/graf');

    expect(sekalimat.status).toBe(200);
    expect(tetangga.status).toBe(200);
    expect(graf.status).toBe(200);
    expect(sekalimat.body.data[0].kata).toBe('maka');
    expect(tetangga.body.kiri[0].kata).toBe('apabila');
    expect(graf.body.nodes[0].id).toBe('jika');
  });

  it('GET /korpus/:korpusId/kata/:kata/mirip-konteks mengembalikan data', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true, label: 'Berita 2024' });
    ModelKookurensi.ambilMiripKonteks.mockResolvedValue({
      kata: 'jika',
      limit: 12,
      minimumKonteksSama: 3,
      jumlahKonteksAcuan: 14,
      total: 1,
      data: [{
        kata: 'apabila',
        frekuensi: 9,
        skorDice: 0.75,
        jumlahKonteksSama: 6,
        konteksBersama: [{ kata: 'maka', jenis: 'kalimat', frekuensi: 10, signifikansi: 0.8 }],
      }],
    });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/mirip-konteks?limit=12');

    expect(response.status).toBe(200);
    expect(response.body.data[0].kata).toBe('apabila');
    expect(ModelKookurensi.ambilMiripKonteks).toHaveBeenCalledWith('ind_news_2024_10K', 'jika', { limit: '12' });
  });

  it('GET endpoint kookurensi mengembalikan 404 jika data kosong', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });
    ModelKookurensi.ambilSekalimat.mockResolvedValue({ total: 0, data: [] });
    ModelKookurensi.ambilTetangga.mockResolvedValue({ kiri: [], kanan: [] });
    ModelKookurensi.ambilGraf.mockResolvedValue({ nodes: [], edges: [] });
    ModelKookurensi.ambilMiripKonteks.mockResolvedValue({ total: 0, data: [] });

    const sekalimat = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/kookurensi-sekalimat');
    const tetangga = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/kookurensi-tetangga');
    const graf = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/graf');
    const miripKonteks = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/mirip-konteks');

    expect(sekalimat.status).toBe(404);
    expect(tetangga.status).toBe(404);
    expect(graf.status).toBe(404);
    expect(miripKonteks.status).toBe(404);
  });

  it('meneruskan error tak dikenal ke error handler', async () => {
    ModelKorpus.ambilDetail.mockRejectedValue(new Error('meledak'));

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/indonesia/contoh');
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('meledak');
  });
});