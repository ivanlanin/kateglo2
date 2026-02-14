/**
 * @fileoverview Test ModelPeribahasa dan ModelSingkatan
 * @tested_in backend/models/modelPeribahasa.js, backend/models/modelSingkatan.js
 */

const db = require('../../db');
const ModelPeribahasa = require('../../models/modelPeribahasa');
const ModelSingkatan = require('../../models/modelSingkatan');

describe('ModelPeribahasa', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('cari dengan q membangun where clause dan pagination', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ proverb: 'ringan sama dijinjing' }] });

    const result = await ModelPeribahasa.cari({ q: 'ringan', limit: 5, offset: 10 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE (proverb ILIKE $1 OR meaning ILIKE $1)'),
      ['%ringan%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%ringan%', 5, 10]
    );
    expect(result.total).toBe(3);
  });

  it('cari tanpa q memakai default limit/offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ proverb: 'buah tangan' }] });

    const result = await ModelPeribahasa.cari();

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [20, 0]
    );
    expect(result.data).toHaveLength(1);
  });
});

describe('ModelSingkatan', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('cari dengan semua filter (q, kependekan, tag)', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ abbr_key: 'ABRI' }] });

    const result = await ModelSingkatan.cari({
      q: 'ab',
      kependekan: 'abr',
      tag: 'mil',
      limit: 15,
      offset: 2
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE'),
      ['%ab%', '%abr%', '%mil%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['%ab%', '%abr%', '%mil%', 15, 2]
    );
    expect(result.total).toBe(2);
  });

  it('cari tanpa filter memakai default', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelSingkatan.cari();

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [20, 0]
    );
    expect(result).toEqual({ data: [], total: 0 });
  });
});
