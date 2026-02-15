/**
 * @fileoverview Test ModelGlosarium
 * @tested_in backend/models/modelGlosarium.js
 */

const db = require('../../db');
const ModelGlosarium = require('../../models/modelGlosarium');

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
      expect.stringContaining('WHERE indonesia ILIKE $1 OR asing ILIKE $1'),
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
    expect(result).toEqual({ data: [{ id: 1, indonesia: 'kata' }], total: 2 });
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
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('ambilDaftarBidang mengembalikan rows', async () => {
    const rows = [{ bidang: 'ling', jumlah: 10 }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarBidang();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('GROUP BY bidang'));
    expect(result).toEqual(rows);
  });

  it('ambilDaftarSumber mengembalikan rows', async () => {
    const rows = [{ sumber: 'kbbi', jumlah: 5 }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarSumber();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('GROUP BY sumber'));
    expect(result).toEqual(rows);
  });

  it('cariFrasaMengandungKataUtuh mengembalikan kosong jika kata kosong', async () => {
    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('   ', 20);

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
});
