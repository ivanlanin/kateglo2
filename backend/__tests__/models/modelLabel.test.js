/**
 * @fileoverview Test ModelLabel
 * @tested_in backend/models/modelLabel.js
 */

const db = require('../../db');
const ModelLabel = require('../../models/modelLabel');

describe('ModelLabel', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('ambilSemuaKategori mengelompokkan label serta menambah abjad dan jenis', async () => {
    db.query.mockResolvedValue({
      rows: [
        { kategori: 'ragam', kode: 'cak', nama: 'cakapan' },
        { kategori: 'ragam', kode: 'ark', nama: 'arkais' },
        { kategori: 'bahasa', kode: 'id', nama: 'Indonesia' },
      ],
    });

    const result = await ModelLabel.ambilSemuaKategori();

    expect(result.ragam).toEqual([
      { kode: 'cak', nama: 'cakapan' },
      { kode: 'ark', nama: 'arkais' },
    ]);
    expect(result.bahasa).toEqual([{ kode: 'id', nama: 'Indonesia' }]);
    expect(result.abjad).toHaveLength(26);
    expect(result.jenis).toHaveLength(6);
  });

  it('cariEntriPerLabel mengembalikan kosong untuk kategori tidak valid', async () => {
    const result = await ModelLabel.cariEntriPerLabel('unknown', 'x', 10, 0);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel kategori abjad valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'Akar' }] });

    const result = await ModelLabel.cariEntriPerLabel('abjad', 'a', 5, 1);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND UPPER'),
      ['A']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['A', 5, 1]
    );
    expect(result.total).toBe(2);
    expect(result.label).toEqual({ kode: 'A', nama: 'A' });
  });

  it('cariEntriPerLabel kategori abjad invalid', async () => {
    const result = await ModelLabel.cariEntriPerLabel('abjad', '12', 5, 0);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel kategori jenis valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, lema: 'berkata', jenis: 'turunan' }] });

    const result = await ModelLabel.cariEntriPerLabel('jenis', 'turunan', 10, 2);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND jenis = $1'),
      ['turunan']
    );
    expect(result.total).toBe(1);
    expect(result.label).toEqual({ kode: 'turunan', nama: 'turunan' });
  });

  it('cariEntriPerLabel kategori jenis valid dengan limit/offset default', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, lema: 'kata', jenis: 'dasar' }] });

    await ModelLabel.cariEntriPerLabel('jenis', 'dasar');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['dasar', 20, 0]
    );
  });

  it('cariEntriPerLabel kategori jenis invalid', async () => {
    const result = await ModelLabel.cariEntriPerLabel('jenis', 'random', 10, 0);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel kategori label memakai kode dan nama saat label ditemukan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ kode: 'cak', nama: 'cakapan', keterangan: '' }] })
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, lema: 'kata' }] });

    const result = await ModelLabel.cariEntriPerLabel('ragam', 'cak', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM label WHERE kategori = $1'),
      ['ragam', 'cak']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.ragam = ANY($1::text[])'),
      [['cak', 'cakapan']]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [['cak', 'cakapan'], 20, 0]
    );
    expect(result.total).toBe(3);
    expect(result.label).toEqual({ kode: 'cak', nama: 'cakapan', keterangan: '' });
  });

  it('cariEntriPerLabel kategori label hanya kode saat label tidak ditemukan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel.cariEntriPerLabel('bahasa', 'id', 3, 4);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.bahasa = ANY($1::text[])'),
      [['id']]
    );
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('daftarAdmin tanpa q memakai paginasi default where kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kategori: 'ragam', kode: 'cak' }] });

    const result = await ModelLabel.daftarAdmin({ limit: 5, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM label'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [5, 1]
    );
    expect(result).toEqual({ data: [{ id: 1, kategori: 'ragam', kode: 'cak' }], total: 2 });
  });

  it('daftarAdmin dapat dipanggil tanpa argumen dan memakai nilai default', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [50, 0]
    );
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('daftarAdmin dengan q membentuk WHERE ILIKE dan parameter berurutan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, kategori: 'bahasa', kode: 'id', nama: 'Indonesia' }] });

    const result = await ModelLabel.daftarAdmin({ limit: 7, offset: 3, q: 'indo' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('kategori ILIKE $1'),
      ['%indo%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%indo%', 7, 3]
    );
    expect(result.total).toBe(1);
  });

  it('ambilDenganId mengembalikan baris pertama atau null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 11, kategori: 'ragam', kode: 'cak' }] })
      .mockResolvedValueOnce({ rows: [] });

    const found = await ModelLabel.ambilDenganId(11);
    const notFound = await ModelLabel.ambilDenganId(99);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'SELECT id, kategori, kode, nama, keterangan, sumber FROM label WHERE id = $1',
      [11]
    );
    expect(found).toEqual({ id: 11, kategori: 'ragam', kode: 'cak' });
    expect(notFound).toBeNull();
  });

  it('simpan melakukan INSERT dengan normalisasi null untuk field opsional', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 21, kategori: 'ragam', kode: 'cak', nama: 'cakapan', keterangan: null, sumber: null }],
    });

    const result = await ModelLabel.simpan({
      kategori: 'ragam',
      kode: 'cak',
      nama: 'cakapan',
      keterangan: '',
      sumber: undefined,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO label'),
      ['ragam', 'cak', 'cakapan', null, null]
    );
    expect(result.id).toBe(21);
  });

  it('simpan melakukan UPDATE dan bisa mengembalikan null saat id tidak ditemukan', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 22, kategori: 'bahasa', kode: 'id', nama: 'Indonesia', keterangan: null, sumber: null }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const updated = await ModelLabel.simpan({
      id: 22,
      kategori: 'bahasa',
      kode: 'id',
      nama: 'Indonesia',
      keterangan: null,
      sumber: null,
    });
    const missing = await ModelLabel.simpan({
      id: 404,
      kategori: 'bahasa',
      kode: 'xx',
      nama: 'Kosong',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE label'),
      ['bahasa', 'id', 'Indonesia', null, null, 22]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE label'),
      ['bahasa', 'xx', 'Kosong', null, null, 404]
    );
    expect(updated.id).toBe(22);
    expect(missing).toBeNull();
  });

  it('hapus mengembalikan boolean dari rowCount', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelLabel.hapus(5);
    const notDeleted = await ModelLabel.hapus(6);

    expect(db.query).toHaveBeenNthCalledWith(1, 'DELETE FROM label WHERE id = $1 RETURNING id', [5]);
    expect(db.query).toHaveBeenNthCalledWith(2, 'DELETE FROM label WHERE id = $1 RETURNING id', [6]);
    expect(deleted).toBe(true);
    expect(notDeleted).toBe(false);
  });
});
