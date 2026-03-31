/**
 * @fileoverview Test model Kata Hari Ini
 * @tested_in backend/models/leksikon/modelKataHariIni.js
 */

const db = require('../../../db');
const ModelKataHariIni = require('../../../models/leksikon/modelKataHariIni');
const { __private } = require('../../../models/leksikon/modelKataHariIni');

describe('ModelKataHariIni', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('helper privat mem-parse tanggal, angka, dan payload row', () => {
    expect(__private.parseTanggal('2026-03-31')).toBe('2026-03-31');
    expect(__private.parseTanggal('invalid')).toBeNull();
    expect(__private.parsePositiveInteger('12')).toBe(12);
    expect(__private.parsePositiveInteger('0')).toBeNull();
    expect(__private.sanitizeText('  satu   dua  ')).toBe('satu dua');
    expect(__private.sanitizeText('', { required: false })).toBeNull();
    expect(() => __private.sanitizeText('', { required: true })).toThrow('Teks wajib diisi');
    expect(__private.normalizeModePemilihan('admin')).toBe('admin');
    expect(__private.normalizeModePemilihan('lain')).toBe('auto');

    expect(__private.mapRowToPayload({
      id: 1,
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      entri: 'aktif',
      kelas_kata: 'a',
      makna: 'giat',
      contoh: 'Ia aktif.',
      pemenggalan: 'ak.tif',
      lafal: 'aktif',
      etimologi_bahasa: 'Arab',
      etimologi_kata_asal: 'faal',
      mode_pemilihan: 'admin',
      catatan_admin: 'pilihan redaksi',
    })).toEqual({
      id: 1,
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      entri: 'aktif',
      url: '/kamus/detail/aktif',
      kelas_kata: 'a',
      makna: 'giat',
      contoh: 'Ia aktif.',
      pemenggalan: 'ak.tif',
      lafal: 'aktif',
      etimologi: {
        bahasa: 'Arab',
        bahasa_kode: null,
        kata_asal: 'faal',
        sumber: null,
        sumber_kode: null,
      },
      mode_pemilihan: 'admin',
      catatan_admin: 'pilihan redaksi',
      created_at: null,
      updated_at: null,
    });
  });

  it('ambilByTanggal mengembalikan null jika tanggal invalid', async () => {
    const result = await ModelKataHariIni.ambilByTanggal('invalid');

    expect(result).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilByTanggal mengembalikan payload terformat', async () => {
    db.query.mockResolvedValue({ rows: [{
      id: 1,
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      entri: 'aktif',
      kelas_kata: 'a',
      makna: 'giat',
      contoh: 'Ia aktif.',
      pemenggalan: 'ak.tif',
      lafal: 'aktif',
      etimologi_bahasa: 'Arab',
      etimologi_kata_asal: 'faal',
      mode_pemilihan: 'auto',
      catatan_admin: null,
      created_at: '2026-03-31 10:00:00.000',
      updated_at: '2026-03-31 10:00:00.000',
    }] });

    const result = await ModelKataHariIni.ambilByTanggal('2026-03-31');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM kata_hari_ini'), ['2026-03-31']);
    expect(result).toMatchObject({
      tanggal: '2026-03-31',
      indeks: 'aktif',
      makna: 'giat',
      url: '/kamus/detail/aktif',
    });
  });

  it('hitungTotal, ambilDenganId, daftarAdmin, dan hapus bekerja untuk kebutuhan redaksi', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({ rows: [{
        id: 1,
        tanggal: '2026-03-31',
        entri_id: 7,
        indeks: 'aktif',
        entri: 'aktif',
        kelas_kata: 'a',
        makna: 'giat',
        contoh: 'Ia aktif.',
        pemenggalan: 'ak.tif',
        lafal: 'aktif',
        etimologi_bahasa: 'Arab',
        etimologi_kata_asal: 'faal',
        mode_pemilihan: 'admin',
        catatan_admin: 'catatan',
        created_at: '2026-03-31 10:00:00.000',
        updated_at: '2026-03-31 10:00:00.000',
      }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{
        id: 1,
        tanggal: '2026-03-31',
        entri_id: 7,
        indeks: 'aktif',
        entri: 'aktif',
        kelas_kata: 'a',
        makna: 'giat',
        contoh: 'Ia aktif.',
        pemenggalan: 'ak.tif',
        lafal: 'aktif',
        etimologi_bahasa: 'Arab',
        etimologi_kata_asal: 'faal',
        mode_pemilihan: 'admin',
        catatan_admin: null,
        created_at: '2026-03-31 10:00:00.000',
        updated_at: '2026-03-31 10:00:00.000',
      }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const total = await ModelKataHariIni.hitungTotal();
    const detail = await ModelKataHariIni.ambilDenganId(1);
    const daftar = await ModelKataHariIni.daftarAdmin({ q: 'aktif', modePemilihan: 'admin', limit: 20, offset: 0 });
    const hapus = await ModelKataHariIni.hapus(1);

    expect(total).toBe(4);
    expect(detail).toMatchObject({ id: 1, indeks: 'aktif' });
    expect(daftar.total).toBe(1);
    expect(daftar.data[0]).toMatchObject({ id: 1, mode_pemilihan: 'admin' });
    expect(hapus).toBe(true);
  });

  it('simpanByTanggal melakukan upsert berdasarkan tanggal', async () => {
    db.query.mockResolvedValue({ rows: [{
      id: 9,
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      entri: 'aktif',
      kelas_kata: 'a',
      makna: 'giat',
      contoh: 'Ia aktif.',
      pemenggalan: 'ak.tif',
      lafal: 'aktif',
      etimologi_bahasa: 'Arab',
      etimologi_kata_asal: 'faal',
      mode_pemilihan: 'auto',
      catatan_admin: null,
      created_at: '2026-03-31 10:00:00.000',
      updated_at: '2026-03-31 10:00:00.000',
    }] });

    const result = await ModelKataHariIni.simpanByTanggal({
      tanggal: '2026-03-31',
      entriId: 7,
      payload: {
        indeks: 'aktif',
        entri: 'aktif',
        kelas_kata: 'a',
        makna: 'giat',
        contoh: 'Ia aktif.',
        pemenggalan: 'ak.tif',
        lafal: 'aktif',
        etimologi: { bahasa: 'Arab', kata_asal: 'faal' },
      },
      modePemilihan: 'auto',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (tanggal)'),
      ['2026-03-31', 7, 'aktif', 'aktif', 'a', 'giat', 'Ia aktif.', 'ak.tif', 'aktif', 'Arab', 'faal', 'auto', null]
    );
    expect(result).toMatchObject({
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      makna: 'giat',
    });
  });

  it('simpanByTanggal memvalidasi input wajib', async () => {
    await expect(ModelKataHariIni.simpanByTanggal({ tanggal: 'invalid', entriId: 1, payload: { indeks: 'a', entri: 'a', makna: 'b' } })).rejects.toThrow('Tanggal tidak valid');
    await expect(ModelKataHariIni.simpanByTanggal({ tanggal: '2026-03-31', entriId: 0, payload: { indeks: 'a', entri: 'a', makna: 'b' } })).rejects.toThrow('entriId tidak valid');
    await expect(ModelKataHariIni.simpanByTanggal({ tanggal: '2026-03-31', entriId: 1, payload: { indeks: '', entri: 'a', makna: 'b' } })).rejects.toThrow('Teks wajib diisi');
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilDenganId dan hapus aman untuk id tidak valid', async () => {
    await expect(ModelKataHariIni.ambilDenganId('abc')).resolves.toBeNull();
    await expect(ModelKataHariIni.hapus('abc')).resolves.toBe(false);
    expect(db.query).not.toHaveBeenCalled();
  });
});