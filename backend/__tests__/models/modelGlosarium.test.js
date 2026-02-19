/**
 * @fileoverview Test ModelGlosarium
 * @tested_in backend/models/modelGlosarium.js
 */

const db = require('../../db');
const ModelGlosarium = require('../../models/modelGlosarium');
const { normalizeBoolean } = require('../../models/modelGlosarium').__private;

describe('ModelGlosarium', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('autocomplete mengembalikan kosong jika query kosong', async () => {
    const result = await ModelGlosarium.autocomplete('   ', 10);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('autocomplete melakukan prefix search dengan limit dibatasi', async () => {
    db.query.mockResolvedValue({
      rows: [
        { indonesia: 'kata', asing: 'word' },
        { indonesia: 'katalog', asing: null },
      ],
    });

    const result = await ModelGlosarium.autocomplete(' ka ', 99);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE aktif = TRUE'),
      ['ka%', 20]
    );
    expect(result).toEqual([
      { value: 'kata', asing: 'word' },
      { value: 'katalog', asing: null },
    ]);
  });

  it('autocomplete memakai fallback limit default saat limit tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelGlosarium.autocomplete('ka', 0);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['ka%', 8]);
  });

  it('autocomplete memakai parameter default saat limit tidak diberikan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelGlosarium.autocomplete('ka');

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['ka%', 8]);
  });

  it('cari dengan semua filter termasuk bahasa id', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indonesia: 'kata' }] });

    const result = await ModelGlosarium.cari({
      q: 'kat',
      bidang: 'ling',
      sumber: 'kbbi',
      bahasa: 'id',
      limit: 10,
      offset: 5
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) as total FROM glosarium g WHERE'),
      ['%kat%', 'ling', 'kbbi']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.bahasa = 'id'"),
      ['%kat%', 'ling', 'kbbi', 10, 5]
    );
    expect(result).toEqual({ data: [{ id: 1, indonesia: 'kata' }], total: 2, hasNext: false });
  });

  it('cari dengan bahasa en', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, indonesia: 'word' }] });

    const result = await ModelGlosarium.cari({ bahasa: 'en' });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.bahasa = 'en'"),
      [20, 0]
    );
    expect(result.total).toBe(1);
    expect(result.hasNext).toBe(false);
  });

  it('cari dengan bahasa selain id/en tidak menambah filter bahasa', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, indonesia: 'term' }] });

    await ModelGlosarium.cari({ bahasa: 'semua', limit: 5, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.not.stringContaining("g.bahasa = 'id'"),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.not.stringContaining("g.bahasa = 'en'"),
      [5, 2]
    );
  });

  it('cari menambahkan filter aktif saat aktifSaja true', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, indonesia: 'aktif' }] });

    const result = await ModelGlosarium.cari({ aktifSaja: true, limit: 3, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = TRUE'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('g.aktif = TRUE'),
      [3, 1]
    );
    expect(result).toEqual({ data: [{ id: 7, indonesia: 'aktif' }], total: 1, hasNext: false });
  });

  it('cari menambahkan filter aktif=true saat aktif=1', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, indonesia: 'aktif true' }] });

    await ModelGlosarium.cari({ aktif: '1', limit: 4, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = TRUE'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [4, 2]
    );
  });

  it('cari menambahkan filter aktif=false saat aktif=0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, indonesia: 'aktif false' }] });

    await ModelGlosarium.cari({ aktif: '0' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = FALSE'),
      []
    );
  });

  it('cari tanpa filter menghasilkan whereClause kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.cari();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) as total FROM glosarium g '),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [20, 0]
    );
    expect(result).toEqual({ data: [], total: 0, hasNext: false });
  });

  it('cari menormalkan limit 0 dan offset negatif ke fallback aman', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, indonesia: 'aman' }] });

    const result = await ModelGlosarium.cari({ limit: 0, offset: -10 });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [20, 0]
    );
    expect(result).toEqual({ data: [{ id: 9, indonesia: 'aman' }], total: 1, hasNext: false });
  });

  it('cari tanpa hitungTotal memakai limit+1 untuk menentukan hasNext', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, indonesia: 'a' },
        { id: 2, indonesia: 'b' },
        { id: 3, indonesia: 'c' },
      ],
    });

    const result = await ModelGlosarium.cari({ limit: 2, offset: 4, hitungTotal: false });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [3, 4]
    );
    expect(result).toEqual({
      data: [{ id: 1, indonesia: 'a' }, { id: 2, indonesia: 'b' }],
      total: 7,
      hasNext: true,
    });
  });

  it('cari tanpa hitungTotal mengembalikan hasNext false saat hasil <= limit', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, indonesia: 'a' },
        { id: 2, indonesia: 'b' },
      ],
    });

    const result = await ModelGlosarium.cari({ limit: 5, offset: 4, hitungTotal: false });

    expect(result).toEqual({
      data: [{ id: 1, indonesia: 'a' }, { id: 2, indonesia: 'b' }],
      total: 6,
      hasNext: false,
    });
  });

  it('ambilDaftarBidang mengembalikan rows', async () => {
    const rows = [{ bidang: 'ling' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarBidang();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT DISTINCT bidang'));
    expect(result).toEqual(rows);
  });

  it('ambilDaftarSumber mengembalikan rows', async () => {
    const rows = [{ sumber: 'kbbi' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarSumber();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT DISTINCT sumber'));
    expect(result).toEqual(rows);
  });

  it('cariFrasaMengandungKataUtuh mengembalikan kosong jika kata kosong', async () => {
    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('   ', 20);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('cariFrasaMengandungKataUtuh mengembalikan kosong jika token terlalu pendek', async () => {
    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('ab', 20);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('cariFrasaMengandungKataUtuh menjalankan query dengan limit yang dibatasi', async () => {
    db.query.mockResolvedValue({
      rows: [{ indonesia: 'zat aktif', asing: 'active substance' }],
    });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh(' aktif ', 999);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('regexp_replace(LOWER($1)'),
      ['aktif', 200]
    );
    expect(result).toEqual([{ indonesia: 'zat aktif', asing: 'active substance' }]);
  });

  it('cariFrasaMengandungKataUtuh mendukung argumen default dan fallback limit', async () => {
    const emptyResult = await ModelGlosarium.cariFrasaMengandungKataUtuh();
    expect(emptyResult).toEqual([]);

    db.query.mockResolvedValue({ rows: [] });
    await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', 0);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['aktif', 50]);
  });

  it('hitungTotal mengembalikan nilai total numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '14' }] });

    const result = await ModelGlosarium.hitungTotal();

    expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) AS total FROM glosarium');
    expect(result).toBe(14);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelGlosarium.ambilDenganId(101);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 101, indonesia: 'istilah' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelGlosarium.ambilDenganId(101);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT id, indonesia, asing, bidang, bahasa, sumber, aktif FROM glosarium WHERE id = $1',
      [101]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan update jika id ada', async () => {
    const row = { id: 3, indonesia: 'baharu' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelGlosarium.simpan(
      { id: 3, indonesia: 'baharu', asing: 'new', bidang: '', bahasa: '', sumber: '' },
      'editor@example.com'
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE glosarium SET indonesia = $1'),
      ['baharu', 'new', null, 'en', null, true, 'editor@example.com', 3]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan insert jika id tidak ada', async () => {
    const row = { id: 4, indonesia: 'baru' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelGlosarium.simpan({ indonesia: 'baru', asing: 'new' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['baru', 'new', null, 'en', null, true, 'admin']
    );
    expect(result).toEqual(row);
  });

  it('hapus mengembalikan true jika ada baris terhapus dan false jika tidak', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelGlosarium.hapus(7);
    const missing = await ModelGlosarium.hapus(8);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  // ─── normalizeBoolean coverage via simpan ─────────────────────────────

  it('simpan normalizeBoolean: boolean true diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 20 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: true });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, true, 'admin']
    );
  });

  it('simpan normalizeBoolean: boolean false diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 21 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: false });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, false, 'admin']
    );
  });

  it('simpan normalizeBoolean: number 1 menjadi true', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 22 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: 1 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, true, 'admin']
    );
  });

  it('simpan normalizeBoolean: string "ya" menjadi true, string "no" menjadi false', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 23 }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 24 }] });
    await ModelGlosarium.simpan({ indonesia: 'a', asing: 'b', aktif: 'ya' });
    await ModelGlosarium.simpan({ indonesia: 'c', asing: 'd', aktif: 'no' });
    expect(db.query).toHaveBeenNthCalledWith(
      1, expect.stringContaining('INSERT INTO glosarium'),
      ['a', 'b', null, 'en', null, true, 'admin']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2, expect.stringContaining('INSERT INTO glosarium'),
      ['c', 'd', null, 'en', null, false, 'admin']
    );
  });

  it('simpan normalizeBoolean: tipe lain (object) menghasilkan defaultValue', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 25 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: [] });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, true, 'admin']
    );
  });

  // ─── aktifSaja coverage ───────────────────────────────────────────────

  it('cari dengan aktifSaja menambahkan filter aktif', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, indonesia: 'aktif' }] });
    const result = await ModelGlosarium.cari({ q: 'aktif', aktifSaja: true });
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = TRUE'),
      ['%aktif%']
    );
    expect(result.total).toBe(1);
    expect(result.hasNext).toBe(false);
  });

  it('normalizeBoolean tanpa argumen kedua menggunakan default true', () => {
    expect(normalizeBoolean(undefined)).toBe(true);
    expect(normalizeBoolean(null)).toBe(true);
  });

  it('ambilDaftarBidang dengan aktifSaja=false tidak menambahkan kondisi aktif', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelGlosarium.ambilDaftarBidang(false);
    expect(db.query).toHaveBeenCalledWith(
      expect.not.stringContaining('AND aktif = TRUE')
    );
  });

  it('ambilDaftarSumber dengan aktifSaja=false tidak menambahkan kondisi aktif', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelGlosarium.ambilDaftarSumber(false);
    expect(db.query).toHaveBeenCalledWith(
      expect.not.stringContaining('AND aktif = TRUE')
    );
  });
});
