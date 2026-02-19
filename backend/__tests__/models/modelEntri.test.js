/**
 * @fileoverview Test ModelEntri
 * @tested_in backend/models/modelEntri.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const ModelEntri = require('../../models/modelEntri');
const { normalizeBoolean } = require('../../models/modelEntri').__private;

describe('ModelEntri', () => {
  beforeEach(() => {
    db.query.mockReset();
    autocomplete.mockReset();
  });

  it('autocomplete meneruskan parameter ke shared helper', async () => {
    autocomplete.mockResolvedValue(['kata', 'kata kerja']);

    const result = await ModelEntri.autocomplete('kat', 12);

    expect(autocomplete).toHaveBeenCalledWith('entri', 'indeks', 'kat', {
      limit: 12,
      extraWhere: 'aktif = 1',
    });
    expect(result).toEqual(['kata', 'kata kerja']);
  });

  it('autocomplete memakai limit default', async () => {
    autocomplete.mockResolvedValue([]);

    await ModelEntri.autocomplete('kat');

    expect(autocomplete).toHaveBeenCalledWith('entri', 'indeks', 'kat', {
      limit: 8,
      extraWhere: 'aktif = 1',
    });
  });

  it('cariEntri mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelEntri.cariEntri(' zzz ', 10, 5);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['zzz', 'zzz%', '%zzz%']
    );
    expect(result).toEqual({ data: [], total: 0, hasNext: false });
  });

  it('cariEntri menormalisasi query serta clamp limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ total: '3' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, entri: 'kata', jenis: 'dasar' }],
      });

    const result = await ModelEntri.cariEntri('  kata  ', '999', '-3');

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['kata', 'kata%', '%kata%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 200, 0]
    );
    expect(result).toEqual({ data: [{ id: 1, entri: 'kata', jenis: 'dasar' }], total: 3, hasNext: true });
  });

  it('cariEntri tanpa hitungTotal memakai limit+1 untuk menentukan hasNext', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, entri: 'a' },
        { id: 2, entri: 'b' },
        { id: 3, entri: 'c' },
      ],
    });

    const result = await ModelEntri.cariEntri('kata', 2, 4, false);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 3, 4]
    );
    expect(result).toEqual({
      data: [{ id: 1, entri: 'a' }, { id: 2, entri: 'b' }],
      total: 7,
      hasNext: true,
    });
  });

  it('cariEntri tanpa hitungTotal mengembalikan hasNext false saat baris tidak melebihi limit', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, entri: 'a' },
        { id: 2, entri: 'b' },
      ],
    });

    const result = await ModelEntri.cariEntri('kata', 5, 4, false);

    expect(result).toEqual({
      data: [{ id: 1, entri: 'a' }, { id: 2, entri: 'b' }],
      total: 6,
      hasNext: false,
    });
  });

  it('cariEntri memakai limit dan offset default saat argumen tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, entri: 'kata' }] });

    await ModelEntri.cariEntri('kata');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('cariEntri memakai fallback saat limit atau offset bukan angka', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, entri: 'kata' }] });

    await ModelEntri.cariEntri('kata', 'abc', 'xyz');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('ambilEntri mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilEntri('tidak-ada');

    expect(result).toBeNull();
  });

  it('ambilEntri mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, entri: 'kata' }] });

    const result = await ModelEntri.ambilEntri('kata');

    expect(result).toEqual({ id: 1, entri: 'kata' });
  });

  it('ambilEntriPerIndeks mengembalikan rows sesuai urutan query', async () => {
    const rows = [{ id: 3, entri: 'aktif', indeks: 'aktif' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilEntriPerIndeks('aktif');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE LOWER(indeks) = LOWER($1) AND aktif = 1'),
      ['aktif']
    );
    expect(result).toEqual(rows);
  });

  it('ambilMakna mengembalikan rows', async () => {
    const rows = [{ id: 1, makna: 'arti', kelas_kata: 'nomina' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilMakna(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM makna'), [1]);
    expect(result).toEqual(rows);
  });

  it('ambilContoh mengembalikan array kosong jika tidak ada ID', async () => {
    const result = await ModelEntri.ambilContoh([]);

    expect(result).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilContoh mengembalikan rows', async () => {
    const rows = [{ id: 1, makna_id: 1, contoh: 'contoh kalimat' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilContoh([1]);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM contoh'), [[1]]);
    expect(result).toEqual(rows);
  });

  it('ambilSubentri mengembalikan rows', async () => {
    const rows = [{ id: 2, entri: 'berkata', jenis: 'turunan' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilSubentri(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE induk = $1'), [1]);
    expect(result).toEqual(rows);
  });

  it('saranEntri mengembalikan kosong untuk input kosong/falsy', async () => {
    expect(await ModelEntri.saranEntri('')).toEqual([]);
    expect(await ModelEntri.saranEntri('   ')).toEqual([]);
    expect(await ModelEntri.saranEntri(null)).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('saranEntri menormalkan teks, clamp limit, dan mapping hasil', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ entri: 'kata' }, { entri: 'kita' }] })
      .mockResolvedValueOnce({ rows: [{ entri: 'kata' }] })
      .mockResolvedValueOnce({ rows: [{ entri: 'kata' }] });

    const maxResult = await ModelEntri.saranEntri('  kata  ', 999);
    const defaultResult = await ModelEntri.saranEntri('kata', 'abc');
    const minResult = await ModelEntri.saranEntri('kata', -2);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('similarity(entri, $1)'),
      ['kata', 20]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2'),
      ['kata', 5]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('LIMIT $2'),
      ['kata', 1]
    );
    expect(maxResult).toEqual(['kata', 'kita']);
    expect(defaultResult).toEqual(['kata']);
    expect(minResult).toEqual(['kata']);
  });

  it('ambilInduk mengembalikan null jika indukId null', async () => {
    const result = await ModelEntri.ambilInduk(null);

    expect(result).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilInduk mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9, entri: 'induk', jenis: 'dasar' }] });

    const result = await ModelEntri.ambilInduk(9);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [9]);
    expect(result).toEqual({ id: 9, entri: 'induk', jenis: 'dasar' });
  });

  it('ambilInduk mengembalikan null jika ID tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilInduk(10);

    expect(result).toBeNull();
  });

  it('ambilRantaiInduk mengembalikan array kosong jika indukId falsy', async () => {
    expect(await ModelEntri.ambilRantaiInduk(null)).toEqual([]);
    expect(await ModelEntri.ambilRantaiInduk(undefined)).toEqual([]);
    expect(await ModelEntri.ambilRantaiInduk(0)).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilRantaiInduk mengembalikan rantai dari akar ke induk langsung', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 100, entri: 'latih' },
        { id: 200, entri: 'berlatih' },
      ],
    });

    const result = await ModelEntri.ambilRantaiInduk(200);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WITH RECURSIVE'),
      [200]
    );
    expect(result).toEqual([
      { id: 100, entri: 'latih' },
      { id: 200, entri: 'berlatih' },
    ]);
  });

  it('ambilRantaiInduk mengembalikan satu elemen jika induk langsung adalah akar', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 100, entri: 'latih' }],
    });

    const result = await ModelEntri.ambilRantaiInduk(100);

    expect(result).toEqual([{ id: 100, entri: 'latih' }]);
  });

  it('daftarAdmin tanpa q menghitung total dan mengambil data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, entri: 'kata' }] });

    const result = await ModelEntri.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*) AS total FROM entri'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(result).toEqual({ data: [{ id: 1, entri: 'kata' }], total: 2 });
  });

  it('daftarAdmin dengan q memakai where clause', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelEntri.daftarAdmin({ q: 'kat', limit: 9, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE entri ILIKE $1'), ['%kat%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%kat%', 9, 2]);
  });

  it('hitungTotal mengembalikan nilai numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '31' }] });

    const result = await ModelEntri.hitungTotal();

    expect(result).toBe(31);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilDenganId(7);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 7, entri: 'kata' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.ambilDenganId(7);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM entri WHERE id = $1'), [7]);
    expect(result).toEqual(row);
  });

  it('simpan melakukan update jika id ada', async () => {
    const row = { id: 8, entri: 'kata baru' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.simpan({
      id: 8,
      entri: 'kata baru',
      jenis: 'dasar',
      induk: null,
      pemenggalan: '',
      lafal: '',
      varian: '',
      jenis_rujuk: '',
      entri_rujuk: '',
      aktif: undefined,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE entri SET entri = $1'),
      ['kata baru', 'dasar', null, null, null, null, null, null, 1, 'kata baru', null, 1, 8]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan insert jika id tidak ada', async () => {
    const row = { id: 9, entri: 'kata' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.simpan({ entri: 'kata', jenis: 'dasar', aktif: 0 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entri'),
      ['kata', 'dasar', null, null, null, null, null, null, 0, 'kata', null, 1]
    );
    expect(result).toEqual(row);
  });

  it('simpan insert memakai aktif default 1 jika aktif tidak diberikan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 10 }] });

    await ModelEntri.simpan({ entri: 'kata', jenis: 'dasar' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entri'),
      ['kata', 'dasar', null, null, null, null, null, null, 1, 'kata', null, 1]
    );
  });

  it('simpan menormalkan indeks serta parsing homonim/urutan saat input tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 12, entri: '--kata-- (2)' }] });

    await ModelEntri.simpan({
      entri: '--kata-- (2)',
      jenis: 'dasar',
      indeks: '   ',
      homonim: 'bukan-angka',
      urutan: '0',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entri'),
      ['--kata-- (2)', 'dasar', null, null, null, null, null, null, 1, 'kata', null, 1]
    );
  });

  it('simpan parsing homonim null-string kosong dan urutan default saat non-numeric', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 13, entri: 'kata-a' }] })
      .mockResolvedValueOnce({ rows: [{ id: 14, entri: 'kata-b' }] });

    await ModelEntri.simpan({
      entri: 'kata-a',
      jenis: 'dasar',
      homonim: null,
      urutan: 'abc',
    });

    await ModelEntri.simpan({
      entri: 'kata-b',
      jenis: 'dasar',
      homonim: '',
      urutan: 2,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO entri'),
      ['kata-a', 'dasar', null, null, null, null, null, null, 1, 'kata-a', null, 1]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO entri'),
      ['kata-b', 'dasar', null, null, null, null, null, null, 1, 'kata-b', null, 2]
    );
  });

  it('simpan tetap menyimpan saat entri undefined serta indeks hasil normalisasi fallback ke teks asli', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 15 }] })
      .mockResolvedValueOnce({ rows: [{ id: 16 }] });

    await ModelEntri.simpan({ jenis: 'dasar', indeks: '   ' });
    await ModelEntri.simpan({ entri: '---', jenis: 'dasar', indeks: '' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO entri'),
      [undefined, 'dasar', null, null, null, null, null, null, 1, '', null, 1]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO entri'),
      ['---', 'dasar', null, null, null, null, null, null, 1, '---', null, 1]
    );
  });

  it('hapus mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelEntri.hapus(10);
    const missing = await ModelEntri.hapus(11);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  it('ambilMaknaById mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilMaknaById(12);

    expect(result).toBeNull();
  });

  it('ambilMaknaById mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 12, makna: 'arti' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.ambilMaknaById(12);

    expect(result).toEqual(row);
  });

  it('simpanMakna melakukan update dan insert', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const updated = await ModelEntri.simpanMakna({ id: 1, entri_id: 8, makna: 'arti' });
    const inserted = await ModelEntri.simpanMakna({ entri_id: 8, makna: 'arti' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE makna SET entri_id = $1'),
      [8, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true, 1]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO makna'),
      [8, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]);
    expect(updated).toEqual({ id: 1 });
    expect(inserted).toEqual({ id: 2 });
  });

  it('hapusMakna mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelEntri.hapusMakna(20);
    const missing = await ModelEntri.hapusMakna(21);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  it('ambilContohById mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilContohById(30);

    expect(result).toBeNull();
  });

  it('ambilContohById mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 30, contoh: 'contoh' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.ambilContohById(30);

    expect(result).toEqual(row);
  });

  it('simpanContoh melakukan update dan insert', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 41 }] }).mockResolvedValueOnce({ rows: [{ id: 42 }] });

    const updated = await ModelEntri.simpanContoh({ id: 41, makna_id: 11, contoh: 'contoh' });
    const inserted = await ModelEntri.simpanContoh({ makna_id: 11, contoh: 'contoh' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE contoh SET makna_id = $1'),
      [11, 1, 'contoh', null, null, null, 0, null, true, 41]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO contoh'),
      [11, 1, 'contoh', null, null, null, 0, null, true]);
    expect(updated).toEqual({ id: 41 });
    expect(inserted).toEqual({ id: 42 });
  });

  it('hapusContoh mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelEntri.hapusContoh(50);
    const missing = await ModelEntri.hapusContoh(51);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  // ─── normalizeBoolean coverage via simpanMakna ────────────────────────

  it('simpanMakna normalizeBoolean: boolean true diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 60 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: true });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
  });

  it('simpanMakna normalizeBoolean: boolean false diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 61 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: false });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, false]
    );
  });

  it('simpanMakna normalizeBoolean: number 1 menjadi true', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 62 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: 1 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
  });

  it('simpanMakna normalizeBoolean: string "ya" menjadi true, string "no" menjadi false', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 63 }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 64 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: 'ya' });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: 'no' });
    expect(db.query).toHaveBeenNthCalledWith(
      1, expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2, expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, false]
    );
  });

  it('simpanMakna normalizeBoolean: tipe lain (object) menghasilkan defaultValue', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 65 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: [] });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
  });

  it('normalizeBoolean tanpa argumen kedua menggunakan default true', () => {
    expect(normalizeBoolean(undefined)).toBe(true);
    expect(normalizeBoolean(null)).toBe(true);
  });

  it('ambilMakna dengan aktifSaja=true menambahkan filter aktif', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelEntri.ambilMakna(1, true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND aktif = TRUE'),
      [1]
    );
  });

  it('ambilContoh dengan aktifSaja=true menambahkan filter aktif', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelEntri.ambilContoh([1, 2], true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND aktif = TRUE'),
      [[1, 2]]
    );
  });

});
