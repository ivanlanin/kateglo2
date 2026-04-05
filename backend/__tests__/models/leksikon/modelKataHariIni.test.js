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
    expect(__private.parseTanggal()).toBeNull();
    expect(__private.parseTanggal('2026-03-31')).toBe('2026-03-31');
    expect(__private.parseTanggal('invalid')).toBeNull();
    expect(__private.parsePositiveInteger()).toBeNull();
    expect(__private.parsePositiveInteger('12')).toBe(12);
    expect(__private.parsePositiveInteger('0')).toBeNull();
    expect(__private.sanitizeText()).toBeNull();
    expect(__private.sanitizeText('  satu   dua  ')).toBe('satu dua');
    expect(__private.sanitizeText('', { required: false })).toBeNull();
    expect(() => __private.sanitizeText('', { required: true })).toThrow('Teks wajib diisi');
    expect(__private.normalizeSumber(' ADMIN ')).toBe('admin');
    expect(__private.normalizeSumber('admin')).toBe('admin');
    expect(__private.normalizeSumber()).toBe('auto');
    expect(__private.normalizeSumber('lain')).toBe('auto');
    expect(__private.formatTanggalOutput()).toBeNull();
    expect(__private.formatTanggalOutput(new Date('2026-03-31T00:00:00.000Z'))).toBe('2026-03-31');
    expect(__private.formatTanggalOutput(new Date('invalid'))).toBeNull();
    expect(__private.formatTanggalOutput('invalid')).toBeNull();
    expect(__private.mapRowToPayload()).toBeNull();

    expect(__private.mapRowToPayload({
      id: 1,
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      entri: 'aktif',
      sumber: 'admin',
      catatan: 'pilihan redaksi',
    })).toEqual({
      id: 1,
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      entri: 'aktif',
      url: '/kamus/detail/aktif',
      sumber: 'admin',
      catatan: 'pilihan redaksi',
      created_at: null,
      updated_at: null,
    });

    expect(__private.mapRowToPayload({
      id: 2,
      tanggal: new Date('2026-04-01T00:00:00.000Z'),
      entri_id: 8,
      indeks: 'baru',
      entri: 'baru',
      sumber: 'lain',
      catatan: '  catatan  ',
    })).toEqual(expect.objectContaining({
      tanggal: '2026-04-01',
      sumber: 'auto',
      catatan: 'catatan',
    }));

    expect(__private.mapRowToPayload({
      id: 3,
      tanggal: 'invalid',
      entri_id: 9,
      indeks: 'rusak',
      entri: 'rusak',
    })).toBeNull();

    expect(__private.mapRowToPayload({
      id: 4,
      tanggal: '2026-04-02',
      entri_id: 0,
      indeks: '  ',
      entri: 'rusak',
    })).toBeNull();
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
      sumber: 'auto',
      catatan: null,
      created_at: '2026-03-31 10:00:00.000',
      updated_at: '2026-03-31 10:00:00.000',
    }] });

    const result = await ModelKataHariIni.ambilByTanggal('2026-03-31');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM kata_hari_ini'), ['2026-03-31']);
    expect(result).toMatchObject({
      tanggal: '2026-03-31',
      indeks: 'aktif',
      sumber: 'auto',
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
        sumber: 'admin',
        catatan: 'catatan',
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
        sumber: 'admin',
        catatan: null,
        created_at: '2026-03-31 10:00:00.000',
        updated_at: '2026-03-31 10:00:00.000',
      }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const total = await ModelKataHariIni.hitungTotal();
    const detail = await ModelKataHariIni.ambilDenganId(1);
    const daftar = await ModelKataHariIni.daftarAdmin({ q: 'aktif', sumber: 'admin', limit: 20, offset: 0 });
    const hapus = await ModelKataHariIni.hapus(1);

    expect(total).toBe(4);
    expect(detail).toMatchObject({ id: 1, indeks: 'aktif' });
    expect(daftar.total).toBe(1);
    expect(daftar.data[0]).toMatchObject({ id: 1, sumber: 'admin' });
    expect(hapus).toBe(true);
  });

  it('hitungTotal, ambilDenganId, ambilByTanggal, simpanByTanggal, dan hapus menangani hasil kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 2, tanggal: '2026-03-31', entri_id: 7, indeks: ' ', entri: 'aktif', sumber: 'auto' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await expect(ModelKataHariIni.hitungTotal()).resolves.toBe(0);
    await expect(ModelKataHariIni.ambilDenganId(2)).resolves.toBeNull();
    await expect(ModelKataHariIni.ambilByTanggal('2026-03-31')).resolves.toBeNull();
    await expect(ModelKataHariIni.simpanByTanggal({ tanggal: '2026-03-31', entriId: 7 })).resolves.toBeNull();
    await expect(ModelKataHariIni.hapus(2)).resolves.toBe(false);
  });

  it('daftarAdmin memakai default aman, sumber invalid, dan menyaring row tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [
        {
          id: 1,
          tanggal: '2026-04-01',
          entri_id: 7,
          indeks: 'aktif',
          entri: 'aktif',
          sumber: 'lain',
          catatan: null,
          created_at: null,
          updated_at: null,
        },
        {
          id: 2,
          tanggal: 'invalid',
          entri_id: 8,
          indeks: 'rusak',
          entri: 'rusak',
          sumber: 'admin',
          catatan: null,
          created_at: null,
          updated_at: null,
        },
      ] });

    const hasil = await ModelKataHariIni.daftarAdmin({ limit: -9, offset: -3, q: '', sumber: 'lain' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('JOIN entri e ON e.id = khi.entri_id'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY khi.tanggal DESC, khi.id DESC'), [1, 0]);
    expect(hasil).toEqual({
      data: [expect.objectContaining({ id: 1, sumber: 'auto' })],
      total: 0,
    });
  });

  it('daftarAdmin membatasi limit maksimum dan mem-filter sumber auto', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelKataHariIni.daftarAdmin({ sumber: 'AUTO', limit: 999, offset: 5 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('khi.sumber = $1'), ['auto']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), ['auto', 200, 5]);
  });

  it('daftarAdmin memakai parameter default saat dipanggil tanpa argumen', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const hasil = await ModelKataHariIni.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*) AS total'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [50, 0]);
    expect(hasil).toEqual({ data: [], total: 0 });
  });

  it('daftarAdmin memakai fallback limit 50 saat limit bernilai 0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelKataHariIni.daftarAdmin({ limit: 0, offset: 4 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [50, 4]);
  });

  it('simpanByTanggal melakukan upsert berdasarkan tanggal', async () => {
    db.query.mockResolvedValue({ rows: [{
      id: 9,
      tanggal: '2026-03-31',
      entri_id: 7,
      indeks: 'aktif',
      entri: 'aktif',
      sumber: 'auto',
      catatan: null,
      created_at: '2026-03-31 10:00:00.000',
      updated_at: '2026-03-31 10:00:00.000',
    }] });

    const result = await ModelKataHariIni.simpanByTanggal({
      tanggal: '2026-03-31',
      entriId: 7,
      sumber: 'auto',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (tanggal)'),
      ['2026-03-31', 7, 'auto', null]
    );
    expect(result).toMatchObject({
      tanggal: '2026-03-31',
      entri_id: 7,
      sumber: 'auto',
    });
  });

  it('simpanByTanggal memvalidasi input wajib', async () => {
    await expect(ModelKataHariIni.simpanByTanggal()).rejects.toThrow('Tanggal tidak valid');
    await expect(ModelKataHariIni.simpanByTanggal({ tanggal: 'invalid', entriId: 1 })).rejects.toThrow('Tanggal tidak valid');
    await expect(ModelKataHariIni.simpanByTanggal({ tanggal: '2026-03-31', entriId: 0 })).rejects.toThrow('entriId tidak valid');
    expect(db.query).not.toHaveBeenCalled();
  });

  it('simpanByTanggal mengembalikan null saat query tidak mengembalikan baris', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(ModelKataHariIni.simpanByTanggal({ tanggal: '2026-03-31', entriId: 9, sumber: 'admin' })).resolves.toBeNull();
  });

  it('ambilDenganId dan hapus aman untuk id tidak valid', async () => {
    await expect(ModelKataHariIni.ambilDenganId('abc')).resolves.toBeNull();
    await expect(ModelKataHariIni.hapus('abc')).resolves.toBe(false);
    expect(db.query).not.toHaveBeenCalled();
  });
});