/**
 * @fileoverview Test route redaksi artikel editorial
 * @tested_in backend/routes/redaksi/artikel.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../middleware/authorization', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../models/artikel/modelArtikel', () => ({
  ambilDaftarRedaksi: jest.fn(),
  ambilSatuRedaksi: jest.fn(),
  buat: jest.fn(),
  perbarui: jest.fn(),
  terbitkan: jest.fn(),
  hapus: jest.fn(),
}));

jest.mock('../../../services/publik/layananArtikelPublik', () => ({
  invalidasiCacheArtikelPublik: jest.fn(),
}));

jest.mock('../../../services/sistem/layananGambarR2', () => ({
  unggahGambarArtikel: jest.fn(),
}));

const router = require('../../../routes/redaksi/artikel');
const ModelArtikel = require('../../../models/artikel/modelArtikel');
const { invalidasiCacheArtikelPublik } = require('../../../services/publik/layananArtikelPublik');
const { unggahGambarArtikel } = require('../../../services/sistem/layananGambarR2');

function createApp(user = { pid: 77 }) {
  const app = express();
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use(express.json());
  app.use('/api/redaksi/artikel', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/artikel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unggah gambar menangani file kosong, sukses, dan ragam error layanan', async () => {
    unggahGambarArtikel
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/artikel/uji.png' })
      .mockRejectedValueOnce(Object.assign(new Error('r2 mati'), { code: 'R2_NOT_CONFIGURED' }))
      .mockRejectedValueOnce(Object.assign(new Error('Tipe tidak didukung'), { code: 'INVALID_TYPE' }))
      .mockRejectedValueOnce(Object.assign(new Error('Terlalu besar'), { code: 'FILE_TOO_LARGE' }))
      .mockRejectedValueOnce(new Error('unggah gagal'));

    const tanpaFile = await request(createApp()).post('/api/redaksi/artikel/unggah-gambar');
    const sukses = await request(createApp())
      .post('/api/redaksi/artikel/unggah-gambar')
      .attach('gambar', Buffer.from('isi'), { filename: 'uji.png', contentType: 'image/png' });
    const r2Off = await request(createApp())
      .post('/api/redaksi/artikel/unggah-gambar')
      .attach('gambar', Buffer.from('isi'), { filename: 'uji.png', contentType: 'image/png' });
    const invalidType = await request(createApp())
      .post('/api/redaksi/artikel/unggah-gambar')
      .attach('gambar', Buffer.from('isi'), { filename: 'uji.png', contentType: 'image/png' });
    const tooLarge = await request(createApp())
      .post('/api/redaksi/artikel/unggah-gambar')
      .attach('gambar', Buffer.from('isi'), { filename: 'uji.png', contentType: 'image/png' });
    const genericError = await request(createApp())
      .post('/api/redaksi/artikel/unggah-gambar')
      .attach('gambar', Buffer.from('isi'), { filename: 'uji.png', contentType: 'image/png' });

    expect(tanpaFile.status).toBe(400);
    expect(sukses.status).toBe(200);
    expect(sukses.body.url).toBe('https://cdn.example.com/artikel/uji.png');
    expect(unggahGambarArtikel).toHaveBeenNthCalledWith(1, expect.any(Buffer), 'uji.png', 'image/png');
    expect(r2Off.status).toBe(503);
    expect(invalidType.status).toBe(400);
    expect(invalidType.body.message).toBe('Tipe tidak didukung');
    expect(tooLarge.status).toBe(400);
    expect(tooLarge.body.message).toBe('Terlalu besar');
    expect(genericError.status).toBe(500);
    expect(genericError.body.message).toBe('unggah gagal');
  });

  it('GET / meneruskan filter daftar artikel dan status alias', async () => {
    ModelArtikel.ambilDaftarRedaksi
      .mockResolvedValueOnce({ data: [{ id: 1 }], total: 1 })
      .mockResolvedValueOnce({ data: [{ id: 2 }], total: 1 })
      .mockResolvedValueOnce({ data: [{ id: 3 }], total: 1 })
      .mockRejectedValueOnce(new Error('list artikel gagal'));

    const terbit = await request(createApp()).get('/api/redaksi/artikel?topik=bahasa&topik=sastra&status=terbit&q=%20uji%20&limit=10&offset=5');
    const draf = await request(createApp()).get('/api/redaksi/artikel?status=draf');
    const singleTopik = await request(createApp()).get('/api/redaksi/artikel?topik=linguistik&diterbitkan=false');
    const error = await request(createApp()).get('/api/redaksi/artikel');

    expect(terbit.status).toBe(200);
    expect(ModelArtikel.ambilDaftarRedaksi).toHaveBeenNthCalledWith(1, {
      topik: ['bahasa', 'sastra'],
      diterbitkan: 'true',
      q: 'uji',
      limit: 10,
      offset: 0,
    });
    expect(draf.status).toBe(200);
    expect(ModelArtikel.ambilDaftarRedaksi).toHaveBeenNthCalledWith(2, {
      topik: undefined,
      diterbitkan: 'false',
      q: '',
      limit: 50,
      offset: 0,
    });
    expect(singleTopik.status).toBe(200);
    expect(ModelArtikel.ambilDaftarRedaksi).toHaveBeenNthCalledWith(3, {
      topik: ['linguistik'],
      diterbitkan: 'false',
      q: '',
      limit: 50,
      offset: 0,
    });
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('list artikel gagal');
  });

  it('GET /:id menangani 404, sukses, dan error', async () => {
    ModelArtikel.ambilSatuRedaksi
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 9, judul: 'Artikel' })
      .mockRejectedValueOnce(new Error('detail artikel gagal'));

    const notFound = await request(createApp()).get('/api/redaksi/artikel/9');
    const ok = await request(createApp()).get('/api/redaksi/artikel/9');
    const error = await request(createApp()).get('/api/redaksi/artikel/9');

    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ok.body.data.id).toBe(9);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('detail artikel gagal');
  });

  it('POST / memvalidasi judul, membuat artikel, dan invalidasi cache slug opsional', async () => {
    ModelArtikel.buat
      .mockResolvedValueOnce({ id: 1, slug: 'artikel-satu' })
      .mockResolvedValueOnce({ id: 2 });

    const badRequest = await request(createApp())
      .post('/api/redaksi/artikel')
      .send({ judul: '' });
    const created = await request(createApp())
      .post('/api/redaksi/artikel')
      .send({ judul: ' Artikel Satu ', konten: 'Isi', topik: 'bahasa', penulis_id: 0, diterbitkan_pada: '' });
    const createdNoSlug = await request(createApp())
      .post('/api/redaksi/artikel')
      .send({ judul: ' Artikel Dua ', konten: 'Isi', topik: ['bahasa', 'sastra'], penulis_id: 12, diterbitkan: true, diterbitkan_pada: '2026-04-05' });

    expect(badRequest.status).toBe(400);
    expect(created.status).toBe(201);
    expect(ModelArtikel.buat).toHaveBeenNthCalledWith(1, {
      judul: 'Artikel Satu',
      konten: 'Isi',
      topik: ['bahasa'],
      penulis_id: 77,
      diterbitkan: false,
      diterbitkan_pada: null,
    });
    expect(invalidasiCacheArtikelPublik).toHaveBeenNthCalledWith(1, ['artikel-satu']);
    expect(createdNoSlug.status).toBe(201);
    expect(ModelArtikel.buat).toHaveBeenNthCalledWith(2, {
      judul: 'Artikel Dua',
      konten: 'Isi',
      topik: ['bahasa', 'sastra'],
      penulis_id: 12,
      diterbitkan: true,
      diterbitkan_pada: '2026-04-05',
    });
    expect(invalidasiCacheArtikelPublik).toHaveBeenNthCalledWith(2, []);
  });

  it('POST / meneruskan error model ke middleware', async () => {
    ModelArtikel.buat.mockRejectedValueOnce(new Error('buat artikel gagal'));

    const response = await request(createApp())
      .post('/api/redaksi/artikel')
      .send({ judul: 'Artikel Tiga' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('buat artikel gagal');
  });

  it('PUT /:id menangani 404, membentuk payload update, dan meneruskan error', async () => {
    ModelArtikel.ambilSatuRedaksi
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 4, slug: 'lama', penulis_id: 20, penyunting_id: 9 })
      .mockResolvedValueOnce({ id: 5, slug: 'lama-2', penulis_id: 77, penyunting_id: 8 })
      .mockResolvedValueOnce({ id: 6, slug: 'lama-3', penulis_id: 20, penyunting_id: 8 })
      .mockRejectedValueOnce(new Error('ambil artikel gagal'));
    ModelArtikel.perbarui
      .mockResolvedValueOnce({ id: 4, slug: 'baru' })
      .mockResolvedValueOnce({ id: 5, slug: 'baru-2' })
      .mockResolvedValueOnce({ id: 6, slug: 'baru-3' });

    const notFound = await request(createApp()).put('/api/redaksi/artikel/4').send({ judul: 'x' });
    const ok = await request(createApp())
      .put('/api/redaksi/artikel/4')
      .send({ judul: ' Baru ', konten: 'isi', topik: 'bahasa', penulis_id: '0', diterbitkan_pada: '' });
    const sameAuthor = await request(createApp({ pid: 77 }))
      .put('/api/redaksi/artikel/5')
      .send({ topik: ['bahasa', 'sastra'] });
    const explicitIds = await request(createApp())
      .put('/api/redaksi/artikel/6')
      .send({ penulis_id: 13, penyunting_id: 0, diterbitkan_pada: '2026-04-06' });
    const error = await request(createApp()).put('/api/redaksi/artikel/7').send({ judul: 'error' });

    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ModelArtikel.perbarui).toHaveBeenNthCalledWith(1, 4, {
      judul: 'Baru',
      konten: 'isi',
      topik: ['bahasa'],
      penyunting_id: 77,
      diterbitkan_pada: null,
    }, 77);
    expect(invalidasiCacheArtikelPublik).toHaveBeenNthCalledWith(1, ['lama', 'baru']);
    expect(sameAuthor.status).toBe(200);
    expect(ModelArtikel.perbarui).toHaveBeenNthCalledWith(2, 5, {
      topik: ['bahasa', 'sastra'],
      penyunting_id: 8,
    }, 77);
    expect(explicitIds.status).toBe(200);
    expect(ModelArtikel.perbarui).toHaveBeenNthCalledWith(3, 6, {
      penulis_id: 13,
      penyunting_id: null,
      diterbitkan_pada: '2026-04-06',
    }, 77);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('ambil artikel gagal');
  });

  it('PUT /:id/terbitkan menangani toggle default, nilai eksplisit, 404, dan error', async () => {
    ModelArtikel.ambilSatuRedaksi
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 8, slug: 'draft', diterbitkan: false })
      .mockResolvedValueOnce({ id: 9, slug: 'terbit', diterbitkan: true })
      .mockRejectedValueOnce(new Error('cek artikel gagal'));
    ModelArtikel.terbitkan
      .mockResolvedValueOnce({ id: 8, slug: 'draft', diterbitkan: true })
      .mockResolvedValueOnce({ id: 9, slug: 'terbit', diterbitkan: false });

    const notFound = await request(createApp()).put('/api/redaksi/artikel/8/terbitkan').send({});
    const toggled = await request(createApp()).put('/api/redaksi/artikel/8/terbitkan').send({});
    const explicitFalse = await request(createApp()).put('/api/redaksi/artikel/9/terbitkan').send({ diterbitkan: false });
    const error = await request(createApp()).put('/api/redaksi/artikel/10/terbitkan').send({});

    expect(notFound.status).toBe(404);
    expect(toggled.status).toBe(200);
    expect(ModelArtikel.terbitkan).toHaveBeenNthCalledWith(1, 8, true);
    expect(explicitFalse.status).toBe(200);
    expect(ModelArtikel.terbitkan).toHaveBeenNthCalledWith(2, 9, false);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('cek artikel gagal');
  });

  it('DELETE /:id menangani 404, sukses, dan error', async () => {
    ModelArtikel.ambilSatuRedaksi
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 11, slug: 'hapus-saya' })
      .mockRejectedValueOnce(new Error('hapus artikel gagal'));

    const notFound = await request(createApp()).delete('/api/redaksi/artikel/11');
    const ok = await request(createApp()).delete('/api/redaksi/artikel/11');
    const error = await request(createApp()).delete('/api/redaksi/artikel/11');

    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ModelArtikel.hapus).toHaveBeenCalledWith(11);
    expect(invalidasiCacheArtikelPublik).toHaveBeenLastCalledWith(['hapus-saya']);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('hapus artikel gagal');
  });
});