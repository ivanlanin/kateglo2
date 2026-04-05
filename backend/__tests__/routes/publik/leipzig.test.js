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
const { __private } = router;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/publik/leipzig', router);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

function createAppWithRouter(customRouter) {
  const app = express();
  app.use(express.json());
  app.use('/api/publik/leipzig', customRouter);
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

  it('GET /korpus meneruskan error ke error handler', async () => {
    ModelKorpus.ambilDaftarTersedia.mockRejectedValueOnce(new Error('daftar gagal'));

    const response = await request(createApp()).get('/api/publik/leipzig/korpus');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('daftar gagal');
  });

  it('GET /korpus/:korpusId/peringkat memvalidasi korpusId kosong setelah trim', async () => {
    const response = await request(createApp()).get('/api/publik/leipzig/korpus/%20/peringkat');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('ID korpus wajib diisi');
  });

  it('GET /korpus/:korpusId/kata/:kata/contoh validasi kata kosong', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/%20%20/contoh');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Kata wajib diisi');
  });

  it('GET endpoint berbasis kata memvalidasi kata kosong sebelum memanggil model', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });

    const info = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/%20%20');
    const sekalimat = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/%20%20/kookurensi-sekalimat');
    const tetangga = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/%20%20/kookurensi-tetangga');
    const graf = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/%20%20/graf');
    const mirip = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/%20%20/mirip-konteks');

    for (const response of [info, sekalimat, tetangga, graf, mirip]) {
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Kata wajib diisi');
    }

    expect(ModelKata.ambilInfoKata).not.toHaveBeenCalled();
    expect(ModelKookurensi.ambilSekalimat).not.toHaveBeenCalled();
    expect(ModelKookurensi.ambilTetangga).not.toHaveBeenCalled();
    expect(ModelKookurensi.ambilGraf).not.toHaveBeenCalled();
    expect(ModelKookurensi.ambilMiripKonteks).not.toHaveBeenCalled();
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

  it('GET /korpus/:korpusId/peringkat menangani error korpus belum siap dari model', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });
    ModelKata.ambilPeringkat.mockRejectedValueOnce({
      code: 'LEIPZIG_CORPUS_NOT_READY',
      message: 'Korpus Leipzig belum siap',
    });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/peringkat');

    expect(response.status).toBe(503);
    expect(response.body.message).toContain('Jalankan impor SQLite terlebih dahulu');
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

  it('GET /korpus/:korpusId/kata/:kata/contoh menangani error korpus invalid dari model', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });
    ModelKalimat.cariContohKata.mockRejectedValueOnce({
      code: 'LEIPZIG_CORPUS_INVALID',
      message: 'ID korpus tidak valid',
    });

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/indonesia/contoh');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('ID korpus tidak valid');
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

  it('GET endpoint kookurensi menangani error Leipzig terpetakan di semua route terkait', async () => {
    ModelKorpus.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true });
    ModelKookurensi.ambilSekalimat.mockRejectedValueOnce({
      code: 'LEIPZIG_CORPUS_INVALID',
      message: 'Parameter korpus invalid',
    });
    ModelKookurensi.ambilTetangga.mockRejectedValueOnce({
      code: 'LEIPZIG_CORPUS_NOT_FOUND',
      message: 'Korpus tidak ada',
    });
    ModelKookurensi.ambilGraf.mockRejectedValueOnce({
      code: 'LEIPZIG_CORPUS_NOT_READY',
      message: 'Korpus belum siap',
    });
    ModelKookurensi.ambilMiripKonteks.mockRejectedValueOnce({
      code: 'LEIPZIG_CORPUS_INVALID',
      message: 'Permintaan tidak valid',
    });

    const sekalimat = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/kookurensi-sekalimat');
    const tetangga = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/kookurensi-tetangga');
    const graf = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/graf');
    const miripKonteks = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/jika/mirip-konteks');

    expect(sekalimat.status).toBe(400);
    expect(sekalimat.body.message).toBe('Parameter korpus invalid');
    expect(tetangga.status).toBe(404);
    expect(tetangga.body.message).toBe('Korpus tidak ada');
    expect(graf.status).toBe(503);
    expect(graf.body.message).toContain('Jalankan impor SQLite terlebih dahulu');
    expect(miripKonteks.status).toBe(400);
    expect(miripKonteks.body.message).toBe('Permintaan tidak valid');
  });

  it('GET /korpus/:korpusId/peringkat memakai cache publik di mode production', async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const ModelKorpusProd = require('../../../models/leipzig/modelKorpus');
    const ModelKataProd = require('../../../models/leipzig/modelKata');
    const prodRouter = require('../../../routes/publik/leipzig');

    ModelKorpusProd.ambilDetail.mockResolvedValue({ id: 'ind_news_2024_10K', hasSqlite: true, label: 'Berita 2024' });
    ModelKataProd.ambilPeringkat.mockResolvedValue({ total: 0, limit: 25, offset: 0, hasMore: false, data: [] });

    const response = await request(createAppWithRouter(prodRouter)).get('/api/publik/leipzig/korpus/ind_news_2024_10K/peringkat');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=300, stale-while-revalidate=900');

    process.env.NODE_ENV = previousEnv;
    jest.resetModules();
  });

  it('helper resolveKorpusOnly dan resolveKorpus menangani parameter yang hilang', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await expect(__private.resolveKorpusOnly({ params: {} }, res)).resolves.toBeNull();
    await expect(__private.resolveKorpus({ params: { korpusId: 'ind_news_2024_10K' } }, res)).resolves.toBeNull();

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, { success: false, message: 'ID korpus wajib diisi' });
    expect(res.status).toHaveBeenNthCalledWith(2, 400);
    expect(res.json).toHaveBeenNthCalledWith(2, { success: false, message: 'Kata wajib diisi' });
  });

  it('helper resolveKorpus mengembalikan null saat resolveKorpusOnly gagal lebih dulu', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    ModelKorpus.ambilDetail.mockResolvedValueOnce(null);

    await expect(__private.resolveKorpus({ params: { korpusId: 'ind_news_2024_10K', kata: 'jika' } }, res)).resolves.toBeNull();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Tidak Ditemukan',
      message: 'Korpus Leipzig tidak ditemukan',
    });
  });

  it('meneruskan error tak dikenal ke error handler', async () => {
    ModelKorpus.ambilDetail.mockRejectedValue(new Error('meledak'));

    const response = await request(createApp()).get('/api/publik/leipzig/korpus/ind_news_2024_10K/kata/indonesia/contoh');
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('meledak');
  });
});