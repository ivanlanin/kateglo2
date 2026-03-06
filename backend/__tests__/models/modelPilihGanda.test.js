/**
 * @fileoverview Test model gim pilih ganda
 * @tested_in backend/models/modelPilihGanda.js
 */

const db = require('../../db');
const ModelPilihGanda = require('../../models/modelPilihGanda');

const { __private } = ModelPilihGanda;

describe('ModelPilihGanda', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('queryAcak menghapus TABLESAMPLE dan menambahkan ORDER BY RANDOM pada fallback', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'acak' }] });

    const sql = `SELECT e.indeks
      FROM entri e TABLESAMPLE SYSTEM(10)
      WHERE e.aktif = 1
      LIMIT 12`;

    const result = await __private.queryAcak(sql, ['x']);

    expect(result.rows).toEqual([{ indeks: 'acak' }]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY RANDOM() LIMIT 12'), ['x']);
    expect(db.query.mock.calls[1][0]).not.toContain('TABLESAMPLE');
  });

  it('normalisasiRiwayatMode dan buatFilterRiwayat menjaga tiga item terbaru', () => {
    expect(__private.normalisasiRiwayatMode([' Alpha ', 'beta', 'alpha', 'gamma', 'delta'])).toEqual(['beta', 'gamma', 'delta']);
    expect(__private.buatFilterRiwayat('e.indeks', ['Alpha', 'beta'], 3)).toEqual({
      clause: ' AND LOWER(e.indeks) NOT IN ($3, $4)',
      params: ['alpha', 'beta'],
    });
  });

  it('soalTesaurus memilih kandidat dari pool dan mendukung pemisah koma-titik koma', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [
          { indeks: 'ramai', sinonim: 'riuh', antonim: '' },
          { indeks: 'dingin', sinonim: '', antonim: 'panas; beku, sejuk' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { kata_salah: 'sendu' },
          { kata_salah: 'hangat' },
        ],
      });

    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.75)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.2);

    const soal = await __private.soalTesaurus();

    expect(soal).toEqual(expect.objectContaining({
      mode: 'tesaurus',
      soal: 'dingin',
      relasi: 'antonim',
      jawaban: 0,
    }));
    expect(soal.pilihan).toEqual(expect.arrayContaining(['beku', 'hangat']));
    expect(soal.penjelasan).toBe('beku adalah antonim dari dingin.');
  });
});