/**
 * @fileoverview Test ModelTesaurus
 * @tested_in backend/models/modelTesaurus.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const ModelTesaurus = require('../../models/modelTesaurus');

describe('ModelTesaurus', () => {
  beforeEach(() => {
    db.query.mockReset();
    autocomplete.mockReset();
  });

  it('autocomplete meneruskan parameter ke shared helper', async () => {
    autocomplete.mockResolvedValue(['aktif']);

    const result = await ModelTesaurus.autocomplete('akt', 11);

    expect(autocomplete).toHaveBeenCalledWith('tesaurus', 'lema', 'akt', { limit: 11 });
    expect(result).toEqual(['aktif']);
  });

  it('autocomplete memakai limit default', async () => {
    autocomplete.mockResolvedValue([]);

    await ModelTesaurus.autocomplete('akt');

    expect(autocomplete).toHaveBeenCalledWith('tesaurus', 'lema', 'akt', { limit: 8 });
  });

  it('cari mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelTesaurus.cari(' xyz ', 10, 0);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('cari menormalisasi query serta clamp limit/offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'aktif', sinonim: 'giat', antonim: 'pasif' }] });

    const result = await ModelTesaurus.cari(' aktif ', '999', -4);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['aktif', 'aktif%', '%aktif%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 200, 0]
    );
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1);
  });

  it('cari memakai default limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'aktif' }] });

    await ModelTesaurus.cari('aktif');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 100, 0]
    );
  });

  it('cari memakai fallback saat limit dan offset tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'aktif' }] });

    await ModelTesaurus.cari('aktif', 'abc', 'xyz');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 100, 0]
    );
  });

  it('ambilDetail mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9, lema: 'aktif' }] });

    const result = await ModelTesaurus.ambilDetail('aktif');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE LOWER(lema) = LOWER($1)'), ['aktif']);
    expect(result).toEqual({ id: 9, lema: 'aktif' });
  });

  it('ambilDetail mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelTesaurus.ambilDetail('tidak-ada');

    expect(result).toBeNull();
  });

  it('daftarAdmin tanpa query menghitung total dan mengambil data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'aktif' }] });

    const result = await ModelTesaurus.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM tesaurus'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(result).toEqual({ data: [{ id: 1, lema: 'aktif' }], total: 2 });
  });

  it('daftarAdmin dengan query menggunakan parameter where', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelTesaurus.daftarAdmin({ q: 'aktif', limit: 9, offset: 3 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE lema ILIKE $1'), ['%aktif%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%aktif%', 9, 3]);
  });

  it('hitungTotal mengembalikan nilai numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '17' }] });

    const result = await ModelTesaurus.hitungTotal();

    expect(result).toBe(17);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelTesaurus.ambilDenganId(90);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan baris pertama jika ditemukan', async () => {
    const row = { id: 90, lema: 'aktif' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelTesaurus.ambilDenganId(90);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT id, lema, sinonim, antonim, turunan, gabungan, berkaitan FROM tesaurus WHERE id = $1',
      [90]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan update jika id ada', async () => {
    const row = { id: 4, lema: 'aktif' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelTesaurus.simpan({ id: 4, lema: 'aktif', sinonim: '', antonim: '' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tesaurus SET lema = $1'),
      ['aktif', null, null, null, null, null, 4]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan insert jika id tidak ada', async () => {
    const row = { id: 5, lema: 'aktif' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelTesaurus.simpan({ lema: 'aktif', sinonim: 'giat', antonim: '' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', 'giat', null, null, null, null]
    );
    expect(result).toEqual(row);
  });

  it('simpan mempertahankan field opsional saat bernilai truthy', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 6 }] });

    await ModelTesaurus.simpan({
      id: 6,
      lema: 'aktif',
      sinonim: 'giat',
      antonim: 'pasif',
      turunan: 'aktifkan',
      gabungan: 'aktif kerja',
      berkaitan: 'dinamis',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tesaurus SET lema = $1'),
      ['aktif', 'giat', 'pasif', 'aktifkan', 'aktif kerja', 'dinamis', 6]
    );
  });

  it('simpan insert mempertahankan field opsional saat bernilai truthy', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 7 }] });

    await ModelTesaurus.simpan({
      lema: 'aktif',
      sinonim: 'giat',
      antonim: 'pasif',
      turunan: 'aktifkan',
      gabungan: 'aktif kerja',
      berkaitan: 'dinamis',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', 'giat', 'pasif', 'aktifkan', 'aktif kerja', 'dinamis']
    );
  });

  it('simpan insert mengubah sinonim kosong menjadi null', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 8 }] });

    await ModelTesaurus.simpan({ lema: 'aktif', sinonim: '' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', null, null, null, null, null]
    );
  });

  it('hapus mengembalikan true jika ada baris terhapus dan false jika tidak', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelTesaurus.hapus(3);
    const missing = await ModelTesaurus.hapus(4);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });
});
