/**
 * @fileoverview Test route redaksi tagar, audit tagar, dan pencarian hitam
 * @tested_in backend/routes/redaksi/tagar.js
 * @tested_in backend/routes/redaksi/auditTagar.js
 * @tested_in backend/routes/redaksi/pencarianHitam.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../../middleware/otorisasi', () => ({
  periksaIzin: () => (_req, _res, next) => next(),
}));

jest.mock('../../../models/master/modelTagar', () => ({
  ambilDaftarKategori: jest.fn(),
  ambilSemuaTagarRedaksi: jest.fn(),
  daftarAdminCursor: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
  daftarEntriTagarAdminCursor: jest.fn(),
  hitungCakupan: jest.fn(),
}));

jest.mock('../../../models/interaksi/modelPencarianHitam', () => ({
  daftarAdmin: jest.fn(),
  ambilDenganId: jest.fn(),
  simpan: jest.fn(),
  hapus: jest.fn(),
}));

const routerTagar = require('../../../routes/redaksi/tagar');
const routerAuditTagar = require('../../../routes/redaksi/auditTagar');
const routerPencarianHitam = require('../../../routes/redaksi/pencarianHitam');
const { __private: pencarianHitamPrivate } = routerPencarianHitam;
const ModelTagar = require('../../../models/master/modelTagar');
const ModelPencarianHitam = require('../../../models/interaksi/modelPencarianHitam');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/redaksi/tagar', routerTagar);
  app.use('/api/redaksi/audit-tagar', routerAuditTagar);
  app.use('/api/redaksi/pencarianHitam', routerPencarianHitam);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ success: false, message: err.message });
  });
  return app;
}

describe('routes/redaksi/tagar + auditTagar + pencarianHitam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelTagar.ambilDaftarKategori.mockResolvedValue(['bentuk', 'kelas']);
    ModelTagar.ambilSemuaTagarRedaksi.mockResolvedValue([{ id: 1, kode: 'pref', nama: 'Prefiks', kategori: 'bentuk', aktif: true }]);
    ModelTagar.daftarAdminCursor.mockResolvedValue({
      data: [{ id: 1, kode: 'pref' }],
      total: 1,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
    ModelTagar.ambilDenganId.mockResolvedValue({ id: 1, kode: 'pref' });
    ModelTagar.simpan.mockResolvedValue({ id: 1, kode: 'pref' });
    ModelTagar.hapus.mockResolvedValue(true);
    ModelTagar.daftarEntriTagarAdminCursor.mockResolvedValue({
      data: [{ id: 11, entri: 'mengajar' }],
      total: 1,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
    ModelTagar.hitungCakupan.mockResolvedValue({ total_turunan: 10, sudah_bertagar: 4 });

    ModelPencarianHitam.daftarAdmin.mockResolvedValue({ data: [{ id: 2, kata: 'bajing' }], total: 1 });
    ModelPencarianHitam.ambilDenganId.mockResolvedValue({ id: 2, kata: 'bajing' });
    ModelPencarianHitam.simpan.mockResolvedValue({ id: 2, kata: 'bajing' });
    ModelPencarianHitam.hapus.mockResolvedValue(true);
  });

  it('helper isValidAktifValue menutup cabang tipe nilai', () => {
    expect(pencarianHitamPrivate.isValidAktifValue(undefined)).toBe(true);
    expect(pencarianHitamPrivate.isValidAktifValue(true)).toBe(true);
    expect(pencarianHitamPrivate.isValidAktifValue(1)).toBe(true);
    expect(pencarianHitamPrivate.isValidAktifValue(2)).toBe(false);
    expect(pencarianHitamPrivate.isValidAktifValue('aktif')).toBe(true);
    expect(pencarianHitamPrivate.isValidAktifValue('tidak')).toBe(true);
    expect(pencarianHitamPrivate.isValidAktifValue('x')).toBe(false);
    expect(pencarianHitamPrivate.isValidAktifValue({})).toBe(false);
  });

  it('redaksi/tagar: list, kategori, detail, create, update, delete, validasi, dan error path', async () => {
    const list = await request(createApp()).get('/api/redaksi/tagar?q=fi&kategori=bentuk&aktif=1&limit=20');
    expect(list.status).toBe(200);
    expect(ModelTagar.daftarAdminCursor).toHaveBeenCalledWith(expect.objectContaining({ q: 'fi', kategori: 'bentuk', aktif: '1' }));

    const listKategoriInvalid = await request(createApp()).get('/api/redaksi/tagar?kategori=invalid');
    expect(listKategoriInvalid.status).toBe(200);
    expect(ModelTagar.daftarAdminCursor).toHaveBeenLastCalledWith(expect.objectContaining({ kategori: '' }));

    const kategori = await request(createApp()).get('/api/redaksi/tagar/kategori');
    expect(kategori.status).toBe(200);

    const opsiPilih = await request(createApp()).get('/api/redaksi/tagar/opsi-pilih');
    expect(opsiPilih.status).toBe(200);
    expect(ModelTagar.ambilSemuaTagarRedaksi).toHaveBeenCalled();

    ModelTagar.ambilDenganId.mockResolvedValueOnce(null);
    const detail404 = await request(createApp()).get('/api/redaksi/tagar/1');
    expect(detail404.status).toBe(404);

    const detailOk = await request(createApp()).get('/api/redaksi/tagar/1');
    expect(detailOk.status).toBe(200);

    const postBad = await request(createApp()).post('/api/redaksi/tagar').send({ kode: '', nama: '', kategori: '' });
    expect(postBad.status).toBe(400);

    const postBadNama = await request(createApp()).post('/api/redaksi/tagar').send({ kode: 'a', nama: '', kategori: 'bentuk' });
    expect(postBadNama.status).toBe(400);

    const postBadKategori = await request(createApp()).post('/api/redaksi/tagar').send({ kode: 'a', nama: 'A', kategori: '' });
    expect(postBadKategori.status).toBe(400);

    const postKategoriBad = await request(createApp()).post('/api/redaksi/tagar').send({ kode: 'a', nama: 'A', kategori: 'invalid' });
    expect(postKategoriBad.status).toBe(400);

    const postOk = await request(createApp()).post('/api/redaksi/tagar').send({ kode: 'a', nama: 'A', kategori: 'bentuk' });
    expect(postOk.status).toBe(201);

    const putBad = await request(createApp()).put('/api/redaksi/tagar/1').send({ kode: '', nama: '', kategori: '' });
    expect(putBad.status).toBe(400);

    const putBadNama = await request(createApp()).put('/api/redaksi/tagar/1').send({ kode: 'a', nama: '', kategori: 'bentuk' });
    expect(putBadNama.status).toBe(400);

    const putBadKategori = await request(createApp()).put('/api/redaksi/tagar/1').send({ kode: 'a', nama: 'A', kategori: '' });
    expect(putBadKategori.status).toBe(400);

    const putKategoriBad = await request(createApp()).put('/api/redaksi/tagar/1').send({ kode: 'a', nama: 'A', kategori: 'invalid' });
    expect(putKategoriBad.status).toBe(400);

    ModelTagar.simpan.mockResolvedValueOnce(null);
    const put404 = await request(createApp()).put('/api/redaksi/tagar/1').send({ kode: 'a', nama: 'A', kategori: 'bentuk' });
    expect(put404.status).toBe(404);

    const putOk = await request(createApp()).put('/api/redaksi/tagar/1').send({ kode: 'a', nama: 'A', kategori: 'bentuk' });
    expect(putOk.status).toBe(200);

    ModelTagar.hapus.mockResolvedValueOnce(false);
    const del404 = await request(createApp()).delete('/api/redaksi/tagar/1');
    expect(del404.status).toBe(404);

    const delOk = await request(createApp()).delete('/api/redaksi/tagar/1');
    expect(delOk.status).toBe(200);

    ModelTagar.daftarAdminCursor.mockRejectedValueOnce(new Error('list gagal'));
    const listErr = await request(createApp()).get('/api/redaksi/tagar');
    expect(listErr.status).toBe(500);

    ModelTagar.ambilDaftarKategori.mockRejectedValueOnce(new Error('kategori gagal'));
    const kategoriErr = await request(createApp()).get('/api/redaksi/tagar/kategori');
    expect(kategoriErr.status).toBe(500);

    ModelTagar.ambilSemuaTagarRedaksi.mockRejectedValueOnce(new Error('opsi gagal'));
    const opsiErr = await request(createApp()).get('/api/redaksi/tagar/opsi-pilih');
    expect(opsiErr.status).toBe(500);

    ModelTagar.ambilDenganId.mockRejectedValueOnce(new Error('detail gagal'));
    const detailErr = await request(createApp()).get('/api/redaksi/tagar/2');
    expect(detailErr.status).toBe(500);

    ModelTagar.simpan.mockRejectedValueOnce(new Error('create gagal'));
    const postErr = await request(createApp()).post('/api/redaksi/tagar').send({ kode: 'a', nama: 'A', kategori: 'bentuk' });
    expect(postErr.status).toBe(500);

    ModelTagar.simpan.mockRejectedValueOnce(new Error('update gagal'));
    const putErr = await request(createApp()).put('/api/redaksi/tagar/2').send({ kode: 'a', nama: 'A', kategori: 'bentuk' });
    expect(putErr.status).toBe(500);

    ModelTagar.hapus.mockRejectedValueOnce(new Error('hapus gagal'));
    const delErr = await request(createApp()).delete('/api/redaksi/tagar/2');
    expect(delErr.status).toBe(500);
  });

  it('redaksi/audit-tagar: list + cakupan + parsing filter + error path', async () => {
    const ok = await request(createApp()).get('/api/redaksi/audit-tagar?q=ajar&tagar_id=7&jenis=turunan&punya_tagar=1&limit=15');
    expect(ok.status).toBe(200);
    expect(ModelTagar.daftarEntriTagarAdminCursor).toHaveBeenCalledWith(expect.objectContaining({
      q: 'ajar',
      tagarId: 7,
      jenis: 'turunan',
      punyaTagar: '1',
    }));
    expect(ok.body.cakupan).toEqual({ totalTurunan: 10, sudahBertagar: 4, persentase: 40 });

    const invalid = await request(createApp()).get('/api/redaksi/audit-tagar?tagar_id=x&punya_tagar=abc');
    expect(invalid.status).toBe(200);
    expect(ModelTagar.daftarEntriTagarAdminCursor).toHaveBeenLastCalledWith(expect.objectContaining({ tagarId: null, punyaTagar: '' }));

    ModelTagar.hitungCakupan.mockResolvedValueOnce({ total_turunan: 0, sudah_bertagar: 0 });
    const zero = await request(createApp()).get('/api/redaksi/audit-tagar');
    expect(zero.status).toBe(200);
    expect(zero.body.cakupan).toEqual({ totalTurunan: 0, sudahBertagar: 0, persentase: 0 });

    ModelTagar.daftarEntriTagarAdminCursor.mockRejectedValueOnce(new Error('audit gagal'));
    const err = await request(createApp()).get('/api/redaksi/audit-tagar');
    expect(err.status).toBe(500);
  });

  it('redaksi/pencarianHitam: list/detail/create/update/delete + validasi + error path', async () => {
    const list = await request(createApp()).get('/api/redaksi/pencarianHitam?q=baj&aktif=1&limit=10&offset=2');
    expect(list.status).toBe(200);
    expect(ModelPencarianHitam.daftarAdmin).toHaveBeenCalledWith({ q: 'baj', aktif: '1', limit: 10, offset: 0 });

    const listInvalidAktif = await request(createApp()).get('/api/redaksi/pencarianHitam?aktif=x');
    expect(listInvalidAktif.status).toBe(200);
    expect(ModelPencarianHitam.daftarAdmin).toHaveBeenLastCalledWith(expect.objectContaining({ aktif: '' }));

    ModelPencarianHitam.ambilDenganId.mockResolvedValueOnce(null);
    const detail404 = await request(createApp()).get('/api/redaksi/pencarianHitam/2');
    expect(detail404.status).toBe(404);

    const detailOk = await request(createApp()).get('/api/redaksi/pencarianHitam/2');
    expect(detailOk.status).toBe(200);

    const postNoKata = await request(createApp()).post('/api/redaksi/pencarianHitam').send({ kata: '' });
    expect(postNoKata.status).toBe(400);

    const postBadAktif = await request(createApp()).post('/api/redaksi/pencarianHitam').send({ kata: 'uji', aktif: { a: 1 } });
    expect(postBadAktif.status).toBe(400);

    const postValidAlias = await request(createApp()).post('/api/redaksi/pencarianHitam').send({ kata: 'uji', aktif: 'no' });
    expect(postValidAlias.status).toBe(201);

    const postValidNumber = await request(createApp()).post('/api/redaksi/pencarianHitam').send({ kata: 'uji', aktif: 0 });
    expect(postValidNumber.status).toBe(201);

    const postOk = await request(createApp()).post('/api/redaksi/pencarianHitam').send({ kata: 'uji', aktif: 'ya' });
    expect(postOk.status).toBe(201);

    const putBadId = await request(createApp()).put('/api/redaksi/pencarianHitam/abc').send({ kata: 'uji' });
    expect(putBadId.status).toBe(400);

    const putBadKata = await request(createApp()).put('/api/redaksi/pencarianHitam/2').send({ kata: '' });
    expect(putBadKata.status).toBe(400);

    const putBadAktif = await request(createApp()).put('/api/redaksi/pencarianHitam/2').send({ kata: 'uji', aktif: { a: 1 } });
    expect(putBadAktif.status).toBe(400);

    ModelPencarianHitam.simpan.mockResolvedValueOnce(null);
    const put404 = await request(createApp()).put('/api/redaksi/pencarianHitam/2').send({ kata: 'uji', aktif: 0 });
    expect(put404.status).toBe(404);

    const putOk = await request(createApp()).put('/api/redaksi/pencarianHitam/2').send({ kata: 'uji', aktif: 1 });
    expect(putOk.status).toBe(200);

    ModelPencarianHitam.hapus.mockResolvedValueOnce(false);
    const del404 = await request(createApp()).delete('/api/redaksi/pencarianHitam/2');
    expect(del404.status).toBe(404);

    const delOk = await request(createApp()).delete('/api/redaksi/pencarianHitam/2');
    expect(delOk.status).toBe(200);

    ModelPencarianHitam.daftarAdmin.mockRejectedValueOnce(new Error('list hitam gagal'));
    const listErr = await request(createApp()).get('/api/redaksi/pencarianHitam');
    expect(listErr.status).toBe(500);

    ModelPencarianHitam.ambilDenganId.mockRejectedValueOnce(new Error('detail hitam gagal'));
    const detailErr = await request(createApp()).get('/api/redaksi/pencarianHitam/3');
    expect(detailErr.status).toBe(500);

    ModelPencarianHitam.simpan.mockRejectedValueOnce(new Error('simpan hitam gagal'));
    const postErr = await request(createApp()).post('/api/redaksi/pencarianHitam').send({ kata: 'uji', aktif: true });
    expect(postErr.status).toBe(500);

    ModelPencarianHitam.simpan.mockRejectedValueOnce(new Error('ubah hitam gagal'));
    const putErr = await request(createApp()).put('/api/redaksi/pencarianHitam/3').send({ kata: 'uji', aktif: true });
    expect(putErr.status).toBe(500);

    ModelPencarianHitam.hapus.mockRejectedValueOnce(new Error('hapus hitam gagal'));
    const delErr = await request(createApp()).delete('/api/redaksi/pencarianHitam/3');
    expect(delErr.status).toBe(500);
  });
});


