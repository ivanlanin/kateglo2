/**
 * @fileoverview Test ModelFrasa
 * @tested_in backend/models/modelFrasa.js
 */

const db = require('../../db');
const ModelFrasa = require('../../models/modelFrasa');

describe('ModelFrasa', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('cariKamus: hanya prefix jika hasil sudah cukup', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ phrase: 'kata', actual_phrase: null, lex_class: 'n', info: null }]
      })
      .mockResolvedValueOnce({
        rows: [{ phrase_key: 'kata', def_text: 'unit bahasa bermakna' }]
      });

    const result = await ModelFrasa.cariKamus('  kata  ', 1);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE phrase ILIKE $1'),
      ['kata%', 'kata', 1]
    );
    expect(result[0].definition_preview).toBe('unit bahasa bermakna');
  });

  it('cariKamus: prefix + contains saat hasil prefix kurang', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ phrase: 'kata', actual_phrase: null, lex_class: 'n', info: null }]
      })
      .mockResolvedValueOnce({
        rows: [{ phrase: 'perkataan', actual_phrase: null, lex_class: 'n', info: null }]
      })
      .mockResolvedValueOnce({
        rows: [
          { phrase_key: 'kata', def_text: 'def kata' },
          { phrase_key: 'perkataan', def_text: 'def perkataan' }
        ]
      });

    const result = await ModelFrasa.cariKamus('kata', 2);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('AND phrase NOT ILIKE $2'),
      ['%kata%', 'kata%', 1]
    );
    expect(result).toHaveLength(2);
    expect(result[1].definition_preview).toBe('def perkataan');
  });

  it('cariKamus: memakai limit default 20 saat limit tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ phrase: 'kata', actual_phrase: null, lex_class: 'n', info: null }]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelFrasa.cariKamus('kata', 'bukan-angka');

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      ['kata%', 'kata', 20]
    );
  });

  it('cariKamus: membatasi limit maksimal 50', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelFrasa.cariKamus('kata', 999);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      ['kata%', 'kata', 50]
    );
  });

  it('cariKamus: mengembalikan array kosong jika tidak ada hasil', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelFrasa.cariKamus('zzz', 10);

    expect(result).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('cariKamus: definition_preview bernilai null jika definisi tidak ditemukan', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ phrase: 'kata', actual_phrase: null, lex_class: 'n', info: null }]
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelFrasa.cariKamus('kata', 1);

    expect(result).toHaveLength(1);
    expect(result[0].definition_preview).toBeNull();
  });

  it('ambilFrasa mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelFrasa.ambilFrasa('tidak-ada');

    expect(result).toBeNull();
  });

  it('ambilFrasa mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ phrase: 'kata' }] });

    const result = await ModelFrasa.ambilFrasa('kata');

    expect(result).toEqual({ phrase: 'kata' });
  });

  it('ambilDefinisi mengembalikan rows', async () => {
    const rows = [{ def_uid: 1, def_text: 'arti' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelFrasa.ambilDefinisi('kata');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM definition d'), ['kata']);
    expect(result).toEqual(rows);
  });

  it('ambilRelasi mengembalikan rows', async () => {
    const rows = [{ rel_type: 's', related_phrase: 'sinonim' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelFrasa.ambilRelasi('kata');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM relation r'), ['kata']);
    expect(result).toEqual(rows);
  });

  it('ambilPeribahasa mengembalikan rows', async () => {
    const rows = [{ prv_uid: 1, proverb: 'ada udang di balik batu', meaning: 'ada maksud tersembunyi' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelFrasa.ambilPeribahasa('udang');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM proverb'), ['udang']);
    expect(result).toEqual(rows);
  });

  it('ambilTerjemahan mengembalikan rows', async () => {
    const rows = [{ lemma: 'kata', translation: 'word' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelFrasa.ambilTerjemahan('kata');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM translation t'), ['kata']);
    expect(result).toEqual(rows);
  });

  it('ambilTautan mengembalikan rows', async () => {
    const rows = [{ ext_uid: 1, label: 'Wiki', url: 'https://example.com' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelFrasa.ambilTautan('kata');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM external_ref'), ['kata']);
    expect(result).toEqual(rows);
  });

  it('ambilKataDasar memetakan related_phrase menjadi array string', async () => {
    db.query.mockResolvedValue({ rows: [{ related_phrase: 'dasar1' }, { related_phrase: 'dasar2' }] });

    const result = await ModelFrasa.ambilKataDasar('turunan');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("rel_type = 'r'"), ['turunan']);
    expect(result).toEqual(['dasar1', 'dasar2']);
  });
});
