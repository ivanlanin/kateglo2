/**
 * @fileoverview Test ModelSinset
 * @tested_in backend/models/wordnet/modelSinset.js
 */

const db = require('../../../db');
const ModelSinset = require('../../../models/wordnet/modelSinset');

describe('ModelSinset', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('ambilKandidatMakna mengambil contoh pertama dari tabel contoh', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ lema: 'adil', entri_id: 305, kelas_kata: 'r' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
      });

    const result = await ModelSinset.ambilKandidatMakna('00002950-r', 219548);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM contoh c'),
      [305, 'adv']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM contoh c'),
      [305]
    );
    expect(result).toEqual({
      lema: 'adil',
      entri_id: 305,
      kelas_kata_sinset: 'r',
      kelas_kata_db: 'adv',
      kandidat: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
      semuaMakna: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
    });
  });

  it('ambilKandidatMakna mengembalikan shape konsisten saat entri belum terhubung', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ lema: 'adil', entri_id: null, kelas_kata: 'r' }],
    });

    const result = await ModelSinset.ambilKandidatMakna('00002950-r', 219548);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      lema: 'adil',
      entri_id: null,
      kelas_kata_sinset: 'r',
      kelas_kata_db: 'adv',
      kandidat: [],
      semuaMakna: [],
    });
  });

  it('tambahLema menyisipkan lema dari entri kamus dan urutan berikutnya', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ urutan: '3' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 1,
          sinset_id: '00002950-r',
          lema: 'adil',
          entri_id: 305,
          makna_id: null,
          urutan: 3,
          terverifikasi: false,
          sumber: 'redaksi',
        }],
      });

    const result = await ModelSinset.tambahLema('00002950-r', { entri_id: 305 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM entri'), [305]);
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO sinset_lema'), ['00002950-r', 'adil', 305, 3, 'redaksi']);
    expect(result).toEqual({
      data: {
        id: 1,
        sinset_id: '00002950-r',
        lema: 'adil',
        entri_id: 305,
        makna_id: null,
        urutan: 3,
        terverifikasi: false,
        sumber: 'redaksi',
      },
    });
  });

  it('tambahLema menolak duplikat lema dalam satu sinset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 99, sinset_id: '00002950-r', lema: 'adil', entri_id: 305, makna_id: null, urutan: 0, terverifikasi: false }],
      });

    const result = await ModelSinset.tambahLema('00002950-r', { entri_id: 305 });

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      error: 'duplicate',
      data: { id: 99, sinset_id: '00002950-r', lema: 'adil', entri_id: 305, makna_id: null, urutan: 0, terverifikasi: false },
    });
  });
});