/**
 * @fileoverview Test ModelTesaurus
 * @tested_in backend/models/modelTesaurus.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const { encodeCursor } = require('../../utils/cursorPagination');
const ModelTesaurus = require('../../models/modelTesaurus');
const { normalizeBoolean, buildAdminWhereClause } = require('../../models/modelTesaurus').__private;

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

  it('daftarAdmin menambahkan filter aktif=true saat aktif=1', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 4 }] });

    await ModelTesaurus.daftarAdmin({ aktif: '1' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('aktif = TRUE'),
      []
    );
  });

  it('daftarAdmin menambahkan filter aktif=false saat aktif=0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 5 }] });

    await ModelTesaurus.daftarAdmin({ aktif: '0' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('aktif = FALSE'),
      []
    );
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

  it('simpan mengubah daftar relasi yang hanya pemisah menjadi null', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 72 }] });

    await ModelTesaurus.simpan({
      indeks: 'aktif',
      sinonim: ' , ;  ',
      antonim: ' ; ',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tesaurus'),
      ['aktif', null, null, true]
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

  it('cariCursor mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelTesaurus.cariCursor('aktif');

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: [],
      total: 0,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
  });

  it('cariCursor arah next dengan cursor menghitung hasPrev/hasNext dan cursor baru', async () => {
    const cursor = encodeCursor({ prioritas: 1, indeks: 'aktif', id: 2 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 3, indeks: 'aktif', sinonim: 'giat', antonim: null, prioritas: 1 },
          { id: 4, indeks: 'aktif sekali', sinonim: 'rajin', antonim: null, prioritas: 1 },
          { id: 5, indeks: 'aktifisme', sinonim: 'enerjik', antonim: null, prioritas: 2 },
        ],
      });

    const result = await ModelTesaurus.cariCursor('aktif', {
      limit: 2,
      cursor,
      direction: 'next',
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('(prioritas, indeks, id) > ($4, $5, $6)'),
      ['aktif', 'aktif%', '%aktif%', 1, 'aktif', 2, 3]
    );
    expect(result.data).toEqual([
      { id: 3, indeks: 'aktif', sinonim: 'giat', antonim: null },
      { id: 4, indeks: 'aktif sekali', sinonim: 'rajin', antonim: null },
    ]);
    expect(result.total).toBe(5);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('cariCursor arah prev tanpa hitungTotal membalik urutan dan set hasNext dari cursor', async () => {
    const cursor = encodeCursor({ prioritas: 1, indeks: 'aktif', id: 10 });
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 9, indeks: 'aktif x', sinonim: null, antonim: null, prioritas: 2 },
        { id: 8, indeks: 'aktif y', sinonim: null, antonim: null, prioritas: 1 },
        { id: 7, indeks: 'aktif z', sinonim: null, antonim: null, prioritas: 1 },
      ],
    });

    const result = await ModelTesaurus.cariCursor('aktif', {
      limit: 2,
      cursor,
      direction: 'prev',
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('(prioritas, indeks, id) < ($4, $5, $6)'),
      ['aktif', 'aktif%', '%aktif%', 1, 'aktif', 10, 3]
    );
    expect(result.data).toEqual([
      { id: 8, indeks: 'aktif y', sinonim: null, antonim: null },
      { id: 9, indeks: 'aktif x', sinonim: null, antonim: null },
    ]);
    expect(result.total).toBe(0);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariCursor lastPage mengatur hasNext false dan hasPrev berdasarkan total', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 2, indeks: 'aktif b', sinonim: null, antonim: null, prioritas: 1 },
          { id: 1, indeks: 'aktif a', sinonim: null, antonim: null, prioritas: 1 },
        ],
      });

    const result = await ModelTesaurus.cariCursor('aktif', {
      limit: 2,
      lastPage: true,
      hitungTotal: true,
    });

    expect(result.data).toEqual([
      { id: 1, indeks: 'aktif a', sinonim: null, antonim: null },
      { id: 2, indeks: 'aktif b', sinonim: null, antonim: null },
    ]);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it('cariCursor memakai fallback limit default saat limit tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indeks: 'aktif', sinonim: null, antonim: null, prioritas: 1 }] });

    await ModelTesaurus.cariCursor('aktif', { limit: 'abc', hitungTotal: true });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4'),
      ['aktif', 'aktif%', '%aktif%', 101]
    );
  });

  it('cariCursor dengan payload cursor kosong memakai fallback nilai default', async () => {
    const cursor = encodeCursor({});
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelTesaurus.cariCursor('aktif', {
      cursor,
      direction: 'prev',
      hitungTotal: false,
      limit: 2,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('(prioritas, indeks, id) < ($4, $5, $6)'),
      ['aktif', 'aktif%', '%aktif%', 0, '', 0, 3]
    );
    expect(result.prevCursor).toBeNull();
    expect(result.nextCursor).toBeNull();
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(true);
  });

  it('cariCursor lastPage bisa memiliki hasPrev false saat total tidak melebihi jumlah data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 2, indeks: 'aktif b', sinonim: null, antonim: null, prioritas: 1 },
          { id: 1, indeks: 'aktif a', sinonim: null, antonim: null, prioritas: 1 },
        ],
      });

    const result = await ModelTesaurus.cariCursor('aktif', { lastPage: true, limit: 2 });
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
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

  it('buildAdminWhereClause aman saat dipanggil tanpa argumen', () => {
    expect(buildAdminWhereClause()).toEqual({
      conditions: [],
      params: [],
    });
  });

  it('daftarAdminCursor mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelTesaurus.daftarAdminCursor({ q: 'aktif', aktif: '1' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) AS total FROM tesaurus WHERE indeks ILIKE $1 AND aktif = TRUE'),
      ['%aktif%']
    );
    expect(result).toEqual({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('daftarAdminCursor arah next dengan cursor membentuk where > serta hasPrev/hasNext', async () => {
    const cursor = encodeCursor({ indeks: 'aktif', id: 2 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 3, indeks: 'aktif b', sinonim: null, antonim: null, aktif: true },
          { id: 4, indeks: 'aktif c', sinonim: null, antonim: null, aktif: true },
          { id: 5, indeks: 'aktif d', sinonim: null, antonim: null, aktif: true },
        ],
      });

    const result = await ModelTesaurus.daftarAdminCursor({
      q: 'aktif',
      limit: 2,
      cursor,
      direction: 'next',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('(indeks, id) > ($2, $3)'),
      ['%aktif%', 'aktif', 2, 3]
    );
    expect(result.data).toEqual([
      { id: 3, indeks: 'aktif b', sinonim: null, antonim: null, aktif: true },
      { id: 4, indeks: 'aktif c', sinonim: null, antonim: null, aktif: true },
    ]);
    expect(result.total).toBe(5);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('daftarAdminCursor arah prev membalik urutan dan memakai where <', async () => {
    const cursor = encodeCursor({ indeks: 'aktif z', id: 10 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '9' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 8, indeks: 'aktif y', sinonim: null, antonim: null, aktif: true },
          { id: 7, indeks: 'aktif x', sinonim: null, antonim: null, aktif: true },
          { id: 6, indeks: 'aktif w', sinonim: null, antonim: null, aktif: true },
        ],
      });

    const result = await ModelTesaurus.daftarAdminCursor({
      limit: 2,
      cursor,
      direction: 'prev',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('(indeks, id) < ($1, $2)'),
      ['aktif z', 10, 3]
    );
    expect(result.data).toEqual([
      { id: 7, indeks: 'aktif x', sinonim: null, antonim: null, aktif: true },
      { id: 8, indeks: 'aktif y', sinonim: null, antonim: null, aktif: true },
    ]);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('daftarAdminCursor lastPage mengatur hasNext false dan hasPrev berdasarkan total', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 2, indeks: 'b', sinonim: null, antonim: null, aktif: true },
          { id: 1, indeks: 'a', sinonim: null, antonim: null, aktif: true },
        ],
      });

    const result = await ModelTesaurus.daftarAdminCursor({ lastPage: true, limit: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ORDER BY indeks DESC, id DESC'),
      [3]
    );
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
    expect(result.data).toEqual([
      { id: 1, indeks: 'a', sinonim: null, antonim: null, aktif: true },
      { id: 2, indeks: 'b', sinonim: null, antonim: null, aktif: true },
    ]);
  });

  it('daftarAdminCursor memaksa clamp limit serta fallback payload cursor kosong', async () => {
    const cursor = encodeCursor({});
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelTesaurus.daftarAdminCursor({
      limit: 'abc',
      cursor,
      direction: 'next',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('(indeks, id) > ($1, $2)'),
      ['', 0, 51]
    );
    expect(result.total).toBe(1);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(false);
  });

  it('daftarAdminCursor default tanpa opsi memakai arah next dan where kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, indeks: 'a', sinonim: null, antonim: null, aktif: true },
          { id: 2, indeks: 'b', sinonim: null, antonim: null, aktif: true },
        ],
      });

    const result = await ModelTesaurus.daftarAdminCursor();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'SELECT COUNT(*) AS total FROM tesaurus ',
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ORDER BY indeks ASC, id ASC'),
      [51]
    );
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });
});
