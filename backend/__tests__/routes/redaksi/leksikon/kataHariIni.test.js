/**
 * @fileoverview Test route redaksi kata hari ini
 * @tested_in backend/routes/redaksi/leksikon/kataHariIni.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../../middleware/authorization', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../../models/leksikon/modelEntri', () => ({
  cariIndukAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
}));

jest.mock('../../../../models/leksikon/modelKataHariIni', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpanByTanggal: jest.fn(),
  hapus: jest.fn(),
}));

jest.mock('../../../../services/publik/layananKamusPublik', () => ({
  ambilDetailKamus: jest.fn(),
  hapusCacheKataHariIni: jest.fn(),
  __private: {
    ambilMaknaUtama: jest.fn(),
    bentukPayloadKataHariIni: jest.fn(),
  },
}));

const router = require('../../../../routes/redaksi/leksikon/kataHariIni');
const { __private } = router;
const ModelEntri = require('../../../../models/leksikon/modelEntri');
const ModelKataHariIni = require('../../../../models/leksikon/modelKataHariIni');
const layananKamusPublik = require('../../../../services/publik/layananKamusPublik');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/kata-hari-ini', router);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/leksikon/kataHariIni', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    layananKamusPublik.__private.ambilMaknaUtama.mockReturnValue({ entri: { id: 21 } });
    layananKamusPublik.__private.bentukPayloadKataHariIni.mockReturnValue({ tanggal: '2026-04-05' });
  });

  it('GET /opsi-entri mengembalikan list kosong tanpa q, sukses, dan error', async () => {
    ModelEntri.cariIndukAdmin
      .mockResolvedValueOnce([{ id: 1, indeks: 'kata' }])
      .mockRejectedValueOnce(new Error('opsi entri gagal'));

    const empty = await request(createApp()).get('/api/redaksi/kata-hari-ini/opsi-entri');
    const ok = await request(createApp()).get('/api/redaksi/kata-hari-ini/opsi-entri?q=%20kat%20&limit=50');
    const error = await request(createApp()).get('/api/redaksi/kata-hari-ini/opsi-entri?q=kat');

    expect(empty.status).toBe(200);
    expect(empty.body.data).toEqual([]);
    expect(ok.status).toBe(200);
    expect(ModelEntri.cariIndukAdmin).toHaveBeenCalledWith('kat', { limit: 20 });
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('opsi entri gagal');
  });

  it('GET / dan GET /:id menangani daftar, 404, sukses, dan error', async () => {
    ModelKataHariIni.daftarAdmin
      .mockResolvedValueOnce({ data: [{ id: 1 }], total: 1 })
      .mockRejectedValueOnce(new Error('list kata hari ini gagal'));
    ModelKataHariIni.ambilDenganId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 3, tanggal: '2026-04-05' })
      .mockRejectedValueOnce(new Error('detail kata hari ini gagal'));

    const list = await request(createApp()).get('/api/redaksi/kata-hari-ini?q=%20kata%20&sumber=%20admin%20&limit=10&offset=2');
    const listError = await request(createApp()).get('/api/redaksi/kata-hari-ini');
    const detail404 = await request(createApp()).get('/api/redaksi/kata-hari-ini/3');
    const detailOk = await request(createApp()).get('/api/redaksi/kata-hari-ini/3');
    const detailError = await request(createApp()).get('/api/redaksi/kata-hari-ini/3');

    expect(list.status).toBe(200);
    expect(ModelKataHariIni.daftarAdmin).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      q: 'kata',
      sumber: 'admin',
    });
    expect(listError.status).toBe(500);
    expect(detail404.status).toBe(404);
    expect(detailOk.status).toBe(200);
    expect(detailError.status).toBe(500);
  });

  it('helper private menormalkan body opsional, mendeteksi konflik, dan me-resolve entri dari indeks', async () => {
    ModelEntri.ambilDenganId.mockResolvedValueOnce({ id: 31, indeks: 'kata' });
    layananKamusPublik.ambilDetailKamus.mockResolvedValueOnce({
      indeks: 'kata',
      entri: [{ id: 31 }, { id: 32 }],
    }).mockResolvedValueOnce({
      indeks: 'frasa',
      entri: [{ id: 41 }, { id: 42 }],
    });
    layananKamusPublik.__private.ambilMaknaUtama.mockReturnValueOnce({ entri: { id: 42 } });
    layananKamusPublik.__private.bentukPayloadKataHariIni
      .mockReturnValueOnce({ tanggal: '2026-04-20' })
      .mockReturnValueOnce({ tanggal: '2026-04-21' });

    expect(__private.normalizeOptionalBodyValue({}, 'catatan', 'fallback')).toBe('fallback');
    expect(__private.normalizeOptionalBodyValue(null, 'catatan', 'fallback')).toBe('fallback');
    expect(__private.normalizeOptionalBodyValue({ catatan: '  isi  ' }, 'catatan', null)).toBe('isi');
    expect(__private.normalizeOptionalBodyValue({ catatan: '   ' }, 'catatan', 'fallback')).toBeNull();
    expect(__private.isKataHariIniEntriConflict({ code: '23505', constraint: 'kata_hari_ini_entri_id_key' })).toBe(true);
    expect(__private.isKataHariIniEntriConflict(new Error('biasa'))).toBe(false);

    await expect(__private.resolveEntriKataHariIni({ entriId: 31, tanggal: '2026-04-20' })).resolves.toEqual({
      entriId: 31,
      detail: { indeks: 'kata', entri: [{ id: 31 }, { id: 32 }] },
    });
    await expect(__private.resolveEntriKataHariIni({ indeks: ' frasa ', tanggal: '2026-04-21' })).resolves.toEqual({
      entriId: 42,
      detail: { indeks: 'frasa', entri: [{ id: 41 }, { id: 42 }] },
    });
  });

  it('helper private resolveEntriKataHariIni mengembalikan null pada cabang gagal', async () => {
    ModelEntri.ambilDenganId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 51, indeks: 'kosong' })
      .mockResolvedValueOnce({ id: 52, indeks: 'hilang' });
    layananKamusPublik.ambilDetailKamus
      .mockResolvedValueOnce({ indeks: 'kosong', entri: [] })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ indeks: 'hilang', entri: [{ id: 99 }] })
      .mockResolvedValueOnce({ indeks: 'hilang', entri: [{ id: 52 }] });
    layananKamusPublik.__private.ambilMaknaUtama.mockReturnValueOnce(null);
    layananKamusPublik.__private.bentukPayloadKataHariIni.mockReturnValueOnce(null);

    await expect(__private.resolveEntriKataHariIni({ entriId: 50, tanggal: '2026-04-22' })).resolves.toBeNull();
    await expect(__private.resolveEntriKataHariIni({ entriId: 51, tanggal: '2026-04-22' })).resolves.toBeNull();
    await expect(__private.resolveEntriKataHariIni({ entriId: 52, tanggal: '2026-04-22' })).resolves.toBeNull();
    await expect(__private.resolveEntriKataHariIni({ indeks: '', tanggal: '2026-04-22' })).resolves.toBeNull();
    await expect(__private.resolveEntriKataHariIni({ indeks: ' hilang ', tanggal: '2026-04-22' })).resolves.toBeNull();
  });

  it('helper private menutup branch body undefined dan entri target yang tidak ditemukan di detail', async () => {
    expect(__private.normalizeOptionalBodyValue(undefined, 'catatan')).toBeNull();
    expect(__private.normalizeOptionalBodyValue(undefined, 'catatan', 'fallback')).toBe('fallback');

    ModelEntri.ambilDenganId.mockResolvedValueOnce({ id: 80, indeks: 'kata' });
    layananKamusPublik.ambilDetailKamus.mockResolvedValueOnce({
      indeks: 'kata',
      entri: [{ id: 81 }],
    });
    layananKamusPublik.__private.bentukPayloadKataHariIni.mockReturnValueOnce({ tanggal: '2026-05-03' });

    await expect(__private.resolveEntriKataHariIni({ entriId: 80, tanggal: '2026-05-03' })).resolves.toBeNull();
  });

  it('POST / memvalidasi payload, memeriksa target entri, sukses, konflik, dan error', async () => {
    ModelEntri.ambilDenganId.mockImplementation(async (id) => {
      if (id === 13) return null;
      return { id, indeks: 'kata' };
    });
    layananKamusPublik.ambilDetailKamus.mockImplementation(async () => ({
      indeks: 'kata',
      entri: [{ id: 11 }, { id: 12 }, { id: 14 }],
    }));
    ModelKataHariIni.simpanByTanggal
      .mockResolvedValueOnce({ id: 1, tanggal: '2026-04-05' })
      .mockRejectedValueOnce(Object.assign(new Error('duplikat'), {
        code: '23505',
        constraint: 'kata_hari_ini_entri_id_key',
      }))
      .mockRejectedValueOnce(new Error('simpan kata hari ini gagal'));

    const badTanggal = await request(createApp()).post('/api/redaksi/kata-hari-ini').send({ entri_id: 11 });
    const badEntri = await request(createApp()).post('/api/redaksi/kata-hari-ini').send({ tanggal: '2026-04-05', entri_id: 0 });
    const ok = await request(createApp())
      .post('/api/redaksi/kata-hari-ini')
      .send({ tanggal: '2026-04-05', entri_id: 11, sumber: '', catatan: '   ' });
    const conflict = await request(createApp())
      .post('/api/redaksi/kata-hari-ini')
      .send({ tanggal: '2026-04-06', entri_id: 12, sumber: 'editor' });
    const notReady = await request(createApp())
      .post('/api/redaksi/kata-hari-ini')
      .send({ tanggal: '2026-04-07', entri_id: 13 });
    layananKamusPublik.__private.bentukPayloadKataHariIni.mockReturnValueOnce(null);
    const payloadNull = await request(createApp())
      .post('/api/redaksi/kata-hari-ini')
      .send({ tanggal: '2026-04-08', entri_id: 14 });
    layananKamusPublik.__private.bentukPayloadKataHariIni.mockReturnValueOnce({ tanggal: '2026-04-09' });
    const error = await request(createApp())
      .post('/api/redaksi/kata-hari-ini')
      .send({ tanggal: '2026-04-09', entri_id: 14 });

    expect(badTanggal.status).toBe(400);
    expect(badEntri.status).toBe(400);
    expect(ok.status).toBe(201);
    expect(ModelKataHariIni.simpanByTanggal).toHaveBeenNthCalledWith(1, {
      tanggal: '2026-04-05',
      entriId: 11,
      sumber: 'admin',
      catatan: null,
    });
    expect(layananKamusPublik.hapusCacheKataHariIni).toHaveBeenNthCalledWith(1, '2026-04-05');
    expect(conflict.status).toBe(409);
    expect(notReady.status).toBe(400);
    expect(payloadNull.status).toBe(400);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('simpan kata hari ini gagal');
  });

  it('PUT /:id menangani 404, fallback existing, konflik, target null, dan error', async () => {
    ModelKataHariIni.ambilDenganId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 2, tanggal: '2026-04-10', entri_id: 22, sumber: 'admin', catatan: 'lama' })
      .mockResolvedValueOnce({ id: 3, tanggal: '2026-04-11', entri_id: 23, sumber: 'admin', catatan: 'lama' })
      .mockResolvedValueOnce({ id: 4, tanggal: '2026-04-12', entri_id: 24, sumber: 'manual', catatan: 'catatan' })
      .mockResolvedValueOnce({ id: 5, tanggal: '2026-04-13', entri_id: 25, sumber: 'manual', catatan: 'catatan' })
      .mockRejectedValueOnce(new Error('ambil arsip gagal'));
    ModelEntri.ambilDenganId.mockImplementation(async (id) => ({ id, indeks: 'kata' }));
    layananKamusPublik.ambilDetailKamus
      .mockResolvedValueOnce({ indeks: 'kata', entri: [{ id: 22 }] })
      .mockResolvedValueOnce({ indeks: 'kata', entri: [{ id: 23 }] })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ indeks: 'kata', entri: [{ id: 25 }] });
    ModelKataHariIni.simpanByTanggal
      .mockResolvedValueOnce({ id: 2, tanggal: '2026-04-10' })
      .mockRejectedValueOnce(Object.assign(new Error('duplikat'), {
        code: '23505',
        constraint: 'kata_hari_ini_entri_id_key',
      }))
      .mockRejectedValueOnce(new Error('ubah kata hari ini gagal'));

    const notFound = await request(createApp()).put('/api/redaksi/kata-hari-ini/2').send({ entri_id: 22 });
    const ok = await request(createApp())
      .put('/api/redaksi/kata-hari-ini/2')
      .send({});
    const conflict = await request(createApp())
      .put('/api/redaksi/kata-hari-ini/3')
      .send({ entri_id: 23, sumber: '' });
    const targetNull = await request(createApp())
      .put('/api/redaksi/kata-hari-ini/4')
      .send({ entri_id: 99 });
    const error = await request(createApp())
      .put('/api/redaksi/kata-hari-ini/5')
      .send({ entri_id: 25, catatan: '' });
    const lookupError = await request(createApp()).put('/api/redaksi/kata-hari-ini/6').send({});

    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(ModelKataHariIni.simpanByTanggal).toHaveBeenNthCalledWith(1, {
      tanggal: '2026-04-10',
      entriId: 22,
      sumber: 'admin',
      catatan: 'lama',
    });
    expect(conflict.status).toBe(409);
    expect(targetNull.status).toBe(400);
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('ubah kata hari ini gagal');
    expect(lookupError.status).toBe(500);
    expect(lookupError.body.message).toBe('ambil arsip gagal');
  });

  it('PUT /:id memakai fallback sumber, catatan, dan tanggal cache saat model mengembalikan tanggal kosong', async () => {
    ModelKataHariIni.ambilDenganId.mockResolvedValueOnce({
      id: 11,
      tanggal: '2026-04-30',
      entri_id: 60,
      sumber: 'manual',
      catatan: 'catatan lama',
    });
    ModelEntri.ambilDenganId.mockResolvedValueOnce({ id: 60, indeks: 'kata' });
    layananKamusPublik.ambilDetailKamus.mockResolvedValueOnce({ indeks: 'kata', entri: [{ id: 60 }] });
    ModelKataHariIni.simpanByTanggal.mockResolvedValueOnce({});

    const response = await request(createApp())
      .put('/api/redaksi/kata-hari-ini/11')
      .send({ entri_id: 60, sumber: '' });

    expect(response.status).toBe(200);
    expect(ModelKataHariIni.simpanByTanggal).toHaveBeenCalledWith({
      tanggal: '2026-04-30',
      entriId: 60,
      sumber: 'manual',
      catatan: 'catatan lama',
    });
    expect(layananKamusPublik.hapusCacheKataHariIni).toHaveBeenLastCalledWith('2026-04-30');
  });

  it('PUT /:id memakai fallback sumber admin dan catatan null saat existing kosong', async () => {
    ModelKataHariIni.ambilDenganId.mockResolvedValueOnce({
      id: 12,
      tanggal: '2026-05-02',
      entri_id: 61,
      sumber: '',
      catatan: '',
    });
    ModelEntri.ambilDenganId.mockResolvedValueOnce({ id: 61, indeks: 'kata' });
    layananKamusPublik.ambilDetailKamus.mockResolvedValueOnce({ indeks: 'kata', entri: [{ id: 61 }] });
    ModelKataHariIni.simpanByTanggal.mockResolvedValueOnce({ tanggal: '2026-05-02' });

    const response = await request(createApp())
      .put('/api/redaksi/kata-hari-ini/12')
      .send({ entri_id: 61, sumber: '' });

    expect(response.status).toBe(200);
    expect(ModelKataHariIni.simpanByTanggal).toHaveBeenCalledWith({
      tanggal: '2026-05-02',
      entriId: 61,
      sumber: 'admin',
      catatan: null,
    });
  });

  it('POST / memakai fallback tanggal cache saat model tidak mengembalikan tanggal', async () => {
    ModelEntri.ambilDenganId.mockResolvedValueOnce({ id: 70, indeks: 'kata' });
    layananKamusPublik.ambilDetailKamus.mockResolvedValueOnce({ indeks: 'kata', entri: [{ id: 70 }] });
    ModelKataHariIni.simpanByTanggal.mockResolvedValueOnce({});

    const response = await request(createApp())
      .post('/api/redaksi/kata-hari-ini')
      .send({ tanggal: '2026-05-01', entri_id: 70, sumber: 'admin' });

    expect(response.status).toBe(201);
    expect(layananKamusPublik.hapusCacheKataHariIni).toHaveBeenLastCalledWith('2026-05-01');
  });

  it('DELETE /:id menangani 404, delete miss, sukses, dan error', async () => {
    ModelKataHariIni.ambilDenganId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 8, tanggal: '2026-04-15' })
      .mockResolvedValueOnce({ id: 9, tanggal: '2026-04-16' })
      .mockRejectedValueOnce(new Error('hapus arsip gagal'));
    ModelKataHariIni.hapus
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const notFound = await request(createApp()).delete('/api/redaksi/kata-hari-ini/8');
    const deleteMiss = await request(createApp()).delete('/api/redaksi/kata-hari-ini/8');
    const ok = await request(createApp()).delete('/api/redaksi/kata-hari-ini/9');
    const error = await request(createApp()).delete('/api/redaksi/kata-hari-ini/10');

    expect(notFound.status).toBe(404);
    expect(deleteMiss.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(layananKamusPublik.hapusCacheKataHariIni).toHaveBeenLastCalledWith('2026-04-16');
    expect(error.status).toBe(500);
    expect(error.body.message).toBe('hapus arsip gagal');
  });
});