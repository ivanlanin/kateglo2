/**
 * @fileoverview Test ModelTesaurus
 * @tested_in backend/models/modelTesaurus.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const ModelTesaurus = require('../../models/modelTesaurus');
const { normalizeBoolean } = require('../../models/modelTesaurus').__private;

describe('ModelTesaurus', () => {
  beforeEach(() => {
    db.query.mockReset();
    autocomplete.mockReset();
  });

  it('autocomplete meneruskan parameter ke shared helper', async () => {
    autocomplete.mockResolvedValue(['aktif']);

    const result = await ModelTesaurus.autocomplete('akt', 11);

    expect(autocomplete).toHaveBeenCalledWith('tesaurus', 'indeks', 'akt', { limit: 11, extraWhere: 'aktif = TRUE' });
    expect(result).toEqual(['aktif']);
  });

  it('autocomplete memakai limit default', async () => {
    autocomplete.mockResolvedValue([]);

    await ModelTesaurus.autocomplete('akt');

    expect(autocomplete).toHaveBeenCalledWith('tesaurus', 'indeks', 'akt', { limit: 8, extraWhere: 'aktif = TRUE' });
  });

  it('cari mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelTesaurus.cari(' xyz ', 10, 0);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [], total: 0, hasNext: false });
  });

  it('cari menormalisasi query serta clamp limit/offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indeks: 'aktif', sinonim: 'giat', antonim: 'pasif' }] });

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
    expect(result.hasNext).toBe(true);
  });

  it('cari tanpa hitungTotal memakai limit+1 untuk menentukan hasNext', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, indeks: 'a' },
        { id: 2, indeks: 'b' },
        { id: 3, indeks: 'c' },
      ],
    });

    const result = await ModelTesaurus.cari('aktif', 2, 6, false);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 3, 6]
    );
    expect(result).toEqual({
      data: [{ id: 1, indeks: 'a' }, { id: 2, indeks: 'b' }],
      total: 9,
      hasNext: true,
    });
  });

  it('cari tanpa hitungTotal mengembalikan hasNext false saat hasil <= limit', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, indeks: 'a' },
        { id: 2, indeks: 'b' },
      ],
    });

    const result = await ModelTesaurus.cari('aktif', 5, 6, false);

    expect(result).toEqual({
      data: [{ id: 1, indeks: 'a' }, { id: 2, indeks: 'b' }],
      total: 8,
      hasNext: false,
    });
  });

  it('cari memakai default limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indeks: 'aktif' }] });

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
      .mockResolvedValueOnce({ rows: [{ id: 1, indeks: 'aktif' }] });

    await ModelTesaurus.cari('aktif', 'abc', 'xyz');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 100, 0]
    );
  });

  it('ambilDetail mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9, indeks: 'aktif' }] });

    const result = await ModelTesaurus.ambilDetail('aktif');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE LOWER(indeks) = LOWER($1)'), ['aktif']);
    expect(result).toEqual({ id: 9, indeks: 'aktif' });
  });

  it('ambilDetail mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelTesaurus.ambilDetail('tidak-ada');

    expect(result).toBeNull();
  });

  it('daftarAdmin tanpa query menghitung total dan mengambil data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indeks: 'aktif' }] });

    const result = await ModelTesaurus.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM tesaurus'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(result).toEqual({ data: [{ id: 1, indeks: 'aktif' }], total: 2 });
  });

  it('daftarAdmin dengan query menggunakan parameter where', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelTesaurus.daftarAdmin({ q: 'aktif', limit: 9, offset: 3 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE indeks ILIKE $1'), ['%aktif%']);
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
    const row = { id: 90, indeks: 'aktif' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelTesaurus.ambilDenganId(90);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT id, indeks, sinonim, antonim, aktif FROM tesaurus WHERE id = $1',
      [90]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan update jika id ada', async () => {
    const row = { id: 4, indeks: 'aktif' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelTesaurus.simpan({ id: 4, indeks: 'aktif', sinonim: '', antonim: '' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tesaurus SET indeks = $1'),
      ['aktif', null, null, true, 4]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan insert jika id tidak ada', async () => {
    const row = { id: 5, indeks: 'aktif' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelTesaurus.simpan({ indeks: 'aktif', sinonim: 'giat', antonim: '' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', 'giat', null, true]
    );
    expect(result).toEqual(row);
  });

  it('simpan mempertahankan field sinonim/antonim saat bernilai truthy', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 6 }] });

    await ModelTesaurus.simpan({
      id: 6,
      indeks: 'aktif',
      sinonim: 'giat',
      antonim: 'pasif',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tesaurus SET indeks = $1'),
      ['aktif', 'giat', 'pasif', true, 6]
    );
  });

  it('simpan insert mempertahankan field sinonim/antonim saat bernilai truthy', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 7 }] });

    await ModelTesaurus.simpan({
      indeks: 'aktif',
      sinonim: 'giat',
      antonim: 'pasif',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', 'giat', 'pasif', true]
    );
  });

  it('simpan menormalisasi pemisah menjadi titik koma', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 71 }] });

    await ModelTesaurus.simpan({
      indeks: 'aktif',
      sinonim: 'giat, rajin ; tekun',
      antonim: 'malas, lamban',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', 'giat; rajin; tekun', 'malas; lamban', true]
    );
  });

  it('simpan insert mengubah sinonim kosong menjadi null', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 8 }] });

    await ModelTesaurus.simpan({ indeks: 'aktif', sinonim: '' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', null, null, true]
    );
  });

  it('hapus mengembalikan true jika ada baris terhapus dan false jika tidak', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelTesaurus.hapus(3);
    const missing = await ModelTesaurus.hapus(4);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  // ─── normalizeBoolean coverage via simpan ─────────────────────────────

  it('simpan normalizeBoolean: boolean true diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 30 }] });
    await ModelTesaurus.simpan({ indeks: 'tes', aktif: true });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['tes', null, null, true]
    );
  });

  it('simpan normalizeBoolean: boolean false diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 31 }] });
    await ModelTesaurus.simpan({ indeks: 'tes', aktif: false });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['tes', null, null, false]
    );
  });

  it('simpan normalizeBoolean: number 1 menjadi true', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 32 }] });
    await ModelTesaurus.simpan({ indeks: 'tes', aktif: 1 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['tes', null, null, true]
    );
  });

  it('simpan normalizeBoolean: string "ya" menjadi true, string "no" menjadi false', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 33 }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 34 }] });
    await ModelTesaurus.simpan({ indeks: 'a', aktif: 'ya' });
    await ModelTesaurus.simpan({ indeks: 'b', aktif: 'no' });
    expect(db.query).toHaveBeenNthCalledWith(
      1, expect.stringContaining('INSERT INTO tesaurus'),
      ['a', null, null, true]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2, expect.stringContaining('INSERT INTO tesaurus'),
      ['b', null, null, false]
    );
  });

  it('simpan normalizeBoolean: tipe lain (object) menghasilkan defaultValue', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 35 }] });
    await ModelTesaurus.simpan({ indeks: 'tes', aktif: [] });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['tes', null, null, true]
    );
  });

  it('normalizeBoolean tanpa argumen kedua menggunakan default true', () => {
    expect(normalizeBoolean(undefined)).toBe(true);
    expect(normalizeBoolean(null)).toBe(true);
  });
});
