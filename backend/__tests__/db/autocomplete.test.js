/**
 * @fileoverview Test shared autocomplete helper
 * @tested_in backend/db/autocomplete.js
 */

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');

describe('db/autocomplete', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('mengembalikan kosong jika query kosong', async () => {
    const result = await autocomplete('lema', 'lema', '   ');

    expect(result).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('menjalankan query prefix tanpa extraWhere', async () => {
    db.query.mockResolvedValue({ rows: [{ lema: 'kata' }, { lema: 'katalog' }] });

    const result = await autocomplete('lema', 'lema', 'ka', { limit: 5 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE lema ILIKE $1'),
      ['ka%', 5]
    );
    expect(result).toEqual(['kata', 'katalog']);
  });

  it('menjalankan query dengan extraWhere dan clamp limit', async () => {
    db.query.mockResolvedValue({ rows: [{ phrase: 'aktif' }] });

    const result = await autocomplete('phrase', 'phrase', ' ak ', { limit: 99, extraWhere: 'aktif = 1' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE phrase ILIKE $1 AND aktif = 1'),
      ['ak%', 20]
    );
    expect(result).toEqual(['aktif']);
  });

  it('memakai fallback limit 8 saat limit tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await autocomplete('lema', 'lema', 'ka', { limit: 0 });

    expect(db.query).toHaveBeenCalledWith(
      expect.any(String),
      ['ka%', 8]
    );
  });
});
