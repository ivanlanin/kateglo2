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

  it('cari dengan semua filter termasuk bahasa id', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ glo_uid: 1, phrase: 'kata' }] });

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
      expect.stringContaining('SELECT COUNT(*) as total FROM glossary g WHERE'),
      ['%kat%', 'ling', 'kbbi']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.lang = 'id'"),
      ['%kat%', 'ling', 'kbbi', 10, 5]
    );
    expect(result).toEqual({ data: [{ glo_uid: 1, phrase: 'kata' }], total: 2 });
  });

  it('cari dengan bahasa en', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ glo_uid: 2, phrase: 'word' }] });

    const result = await ModelGlosarium.cari({ bahasa: 'en' });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.lang = 'en'"),
      [20, 0]
    );
    expect(result.total).toBe(1);
  });

  it('cari tanpa filter menghasilkan whereClause kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.cari();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) as total FROM glossary g '),
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
    const rows = [{ discipline: 'ling', discipline_name: 'Linguistik' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarBidang();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM discipline d'));
    expect(result).toEqual(rows);
  });

  it('ambilDaftarSumber mengembalikan rows', async () => {
    const rows = [{ ref_source: 'kbbi', ref_source_name: 'KBBI' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarSumber();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM ref_source rs'));
    expect(result).toEqual(rows);
  });
});
