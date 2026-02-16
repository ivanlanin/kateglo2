/**
 * @fileoverview Test ModelLema
 * @tested_in backend/models/modelLema.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const ModelLema = require('../../models/modelLema');

describe('ModelLema', () => {
  beforeEach(() => {
    db.query.mockReset();
    autocomplete.mockReset();
  });

  it('autocomplete meneruskan parameter ke shared helper', async () => {
    autocomplete.mockResolvedValue(['kata', 'kata kerja']);

    const result = await ModelLema.autocomplete('kat', 12);

    expect(autocomplete).toHaveBeenCalledWith('lema', 'lema', 'kat', {
      limit: 12,
      extraWhere: 'aktif = 1',
    });
    expect(result).toEqual(['kata', 'kata kerja']);
  });

  it('autocomplete memakai limit default', async () => {
    autocomplete.mockResolvedValue([]);

    await ModelLema.autocomplete('kat');

    expect(autocomplete).toHaveBeenCalledWith('lema', 'lema', 'kat', {
      limit: 8,
      extraWhere: 'aktif = 1',
    });
  });

  it('normalisasiKunciLema mengembalikan string kosong untuk input falsy', () => {
    expect(ModelLema.normalisasiKunciLema(undefined)).toBe('');
    expect(ModelLema.normalisasiKunciLema(null)).toBe('');
  });

  it('normalisasiKunciLema menghapus nomor homonim dan tanda hubung', () => {
    expect(ModelLema.normalisasiKunciLema(' Per- (2) ')).toBe('per');
    expect(ModelLema.normalisasiKunciLema('dara (10)')).toBe('dara');
  });

  it('cariLema mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelLema.cariLema(' zzz ', 10, 5);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['zzz', 'zzz%', '%zzz%']
    );
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('cariLema menormalisasi query serta clamp limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ total: '3' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, lema: 'kata', jenis: 'dasar' }],
      });

    const result = await ModelLema.cariLema('  kata  ', '999', '-3');

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
    expect(result).toEqual({ data: [{ id: 1, lema: 'kata', jenis: 'dasar' }], total: 3 });
  });

  it('cariLema memakai limit dan offset default saat argumen tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'kata' }] });

    await ModelLema.cariLema('kata');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('cariLema memakai fallback saat limit atau offset bukan angka', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'kata' }] });

    await ModelLema.cariLema('kata', 'abc', 'xyz');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('ambilLema mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelLema.ambilLema('tidak-ada');

    expect(result).toBeNull();
  });

  it('ambilLema mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, lema: 'kata' }] });

    const result = await ModelLema.ambilLema('kata');

    expect(result).toEqual({ id: 1, lema: 'kata' });
  });

  it('ambilLemaSerupa mengembalikan array kosong jika kunci kosong', async () => {
    const result = await ModelLema.ambilLemaSerupa('   ');

    expect(result).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilLemaSerupa clamp limit maksimum dan fallback non-angka', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'per (1)', lafal: 'per' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, lema: 'per (2)', lafal: null }] });

    await ModelLema.ambilLemaSerupa('per (1)', 999);
    await ModelLema.ambilLemaSerupa('per (1)', 'abc');

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('LIMIT $3'),
      ['per', 'per (1)', 100]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $3'),
      ['per', 'per (1)', 20]
    );
  });

  it('ambilLemaSerupa mengembalikan array kosong jika kunci kosong', async () => {
    const result = await ModelLema.ambilLemaSerupa('   ');

    expect(result).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilLemaSerupa menjalankan query normalisasi dengan limit', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, lema: 'per (1)', lafal: 'per' }] });

    const result = await ModelLema.ambilLemaSerupa('per- (2)', 9);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(REGEXP_REPLACE(REPLACE(lema, '-', ''),"),
      ['per', 'per- (2)', 9]
    );
    expect(result).toEqual([{ id: 1, lema: 'per (1)', lafal: 'per' }]);
  });

  it('ambilMakna mengembalikan rows', async () => {
    const rows = [{ id: 1, makna: 'arti', kelas_kata: 'nomina' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilMakna(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM makna'), [1]);
    expect(result).toEqual(rows);
  });

  it('ambilContoh mengembalikan array kosong jika tidak ada ID', async () => {
    const result = await ModelLema.ambilContoh([]);

    expect(result).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilContoh mengembalikan rows', async () => {
    const rows = [{ id: 1, makna_id: 1, contoh: 'contoh kalimat' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilContoh([1]);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM contoh'), [[1]]);
    expect(result).toEqual(rows);
  });

  it('ambilSublema mengembalikan rows', async () => {
    const rows = [{ id: 2, lema: 'berkata', jenis: 'berimbuhan' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilSublema(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE induk = $1'), [1]);
    expect(result).toEqual(rows);
  });

  it('saranLema mengembalikan kosong untuk input kosong/falsy', async () => {
    expect(await ModelLema.saranLema('')).toEqual([]);
    expect(await ModelLema.saranLema('   ')).toEqual([]);
    expect(await ModelLema.saranLema(null)).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('saranLema menormalkan teks, clamp limit, dan mapping hasil', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ lema: 'kata' }, { lema: 'kita' }] })
      .mockResolvedValueOnce({ rows: [{ lema: 'kata' }] })
      .mockResolvedValueOnce({ rows: [{ lema: 'kata' }] });

    const maxResult = await ModelLema.saranLema('  kata  ', 999);
    const defaultResult = await ModelLema.saranLema('kata', 'abc');
    const minResult = await ModelLema.saranLema('kata', -2);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('similarity(lema, $1)'),
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
    const result = await ModelLema.ambilInduk(null);

    expect(result).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilInduk mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9, lema: 'induk', jenis: 'dasar' }] });

    const result = await ModelLema.ambilInduk(9);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [9]);
    expect(result).toEqual({ id: 9, lema: 'induk', jenis: 'dasar' });
  });

  it('ambilInduk mengembalikan null jika ID tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelLema.ambilInduk(10);

    expect(result).toBeNull();
  });

  it('ambilRantaiInduk mengembalikan array kosong jika indukId falsy', async () => {
    expect(await ModelLema.ambilRantaiInduk(null)).toEqual([]);
    expect(await ModelLema.ambilRantaiInduk(undefined)).toEqual([]);
    expect(await ModelLema.ambilRantaiInduk(0)).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilRantaiInduk mengembalikan rantai dari akar ke induk langsung', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 100, lema: 'latih' },
        { id: 200, lema: 'berlatih' },
      ],
    });

    const result = await ModelLema.ambilRantaiInduk(200);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WITH RECURSIVE'),
      [200]
    );
    expect(result).toEqual([
      { id: 100, lema: 'latih' },
      { id: 200, lema: 'berlatih' },
    ]);
  });

  it('ambilRantaiInduk mengembalikan satu elemen jika induk langsung adalah akar', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 100, lema: 'latih' }],
    });

    const result = await ModelLema.ambilRantaiInduk(100);

    expect(result).toEqual([{ id: 100, lema: 'latih' }]);
  });

  it('daftarAdmin tanpa q menghitung total dan mengambil data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'kata' }] });

    const result = await ModelLema.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*) AS total FROM lema'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(result).toEqual({ data: [{ id: 1, lema: 'kata' }], total: 2 });
  });

  it('daftarAdmin dengan q memakai where clause', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelLema.daftarAdmin({ q: 'kat', limit: 9, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE lema ILIKE $1'), ['%kat%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%kat%', 9, 2]);
  });

  it('hitungTotal mengembalikan nilai numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '31' }] });

    const result = await ModelLema.hitungTotal();

    expect(result).toBe(31);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelLema.ambilDenganId(7);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 7, lema: 'kata' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelLema.ambilDenganId(7);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM lema WHERE id = $1'), [7]);
    expect(result).toEqual(row);
  });

  it('simpan melakukan update jika id ada', async () => {
    const row = { id: 8, lema: 'kata baru' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelLema.simpan({
      id: 8,
      lema: 'kata baru',
      jenis: 'dasar',
      induk: null,
      pemenggalan: '',
      lafal: '',
      varian: '',
      jenis_rujuk: '',
      lema_rujuk: '',
      aktif: undefined,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE lema SET lema = $1'),
      ['kata baru', 'dasar', null, null, null, null, null, null, 1, 8]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan insert jika id tidak ada', async () => {
    const row = { id: 9, lema: 'kata' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelLema.simpan({ lema: 'kata', jenis: 'dasar', aktif: 0 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO lema'),
      ['kata', 'dasar', null, null, null, null, null, null, 0]
    );
    expect(result).toEqual(row);
  });

  it('simpan insert memakai aktif default 1 jika aktif tidak diberikan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 10 }] });

    await ModelLema.simpan({ lema: 'kata', jenis: 'dasar' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO lema'),
      ['kata', 'dasar', null, null, null, null, null, null, 1]
    );
  });

  it('hapus mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelLema.hapus(10);
    const missing = await ModelLema.hapus(11);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  it('ambilMaknaById mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelLema.ambilMaknaById(12);

    expect(result).toBeNull();
  });

  it('ambilMaknaById mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 12, makna: 'arti' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelLema.ambilMaknaById(12);

    expect(result).toEqual(row);
  });

  it('simpanMakna melakukan update dan insert', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const updated = await ModelLema.simpanMakna({ id: 1, lema_id: 8, makna: 'arti' });
    const inserted = await ModelLema.simpanMakna({ lema_id: 8, makna: 'arti' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE makna SET lema_id = $1'),
      [8, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, 1]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO makna'),
      [8, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null]);
    expect(updated).toEqual({ id: 1 });
    expect(inserted).toEqual({ id: 2 });
  });

  it('hapusMakna mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelLema.hapusMakna(20);
    const missing = await ModelLema.hapusMakna(21);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  it('ambilContohById mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelLema.ambilContohById(30);

    expect(result).toBeNull();
  });

  it('ambilContohById mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 30, contoh: 'contoh' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelLema.ambilContohById(30);

    expect(result).toEqual(row);
  });

  it('simpanContoh melakukan update dan insert', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 41 }] }).mockResolvedValueOnce({ rows: [{ id: 42 }] });

    const updated = await ModelLema.simpanContoh({ id: 41, makna_id: 11, contoh: 'contoh' });
    const inserted = await ModelLema.simpanContoh({ makna_id: 11, contoh: 'contoh' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE contoh SET makna_id = $1'),
      [11, 1, 'contoh', null, null, null, 0, null, 41]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO contoh'),
      [11, 1, 'contoh', null, null, null, 0, null]);
    expect(updated).toEqual({ id: 41 });
    expect(inserted).toEqual({ id: 42 });
  });

  it('hapusContoh mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelLema.hapusContoh(50);
    const missing = await ModelLema.hapusContoh(51);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

});
