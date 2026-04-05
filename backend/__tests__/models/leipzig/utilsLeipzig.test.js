/**
 * @fileoverview Test utilitas Leipzig
 * @tested_in backend/models/leipzig/utilsLeipzig.js
 */

const {
  normalizeSearchWord,
  parseLimit,
  parseOffset,
  buildPlaceholders,
  listMatchedForms,
  summarizeMatchedForms,
  aggregateWordRows,
  bersihkanTokenAgregat,
  adalahVarianHurufKecil,
  pilihLabelAgregat,
} = require('../../../models/leipzig/utilsLeipzig');

describe('models/leipzig/utilsLeipzig', () => {
  it('menormalkan input pencarian dan batas numerik', () => {
    expect(normalizeSearchWord('  kata  ')).toBe('kata');
    expect(normalizeSearchWord()).toBe('');

    expect(parseLimit(undefined)).toBe(10);
    expect(parseLimit('25')).toBe(25);
    expect(parseLimit('0')).toBe(1);
    expect(parseLimit('999')).toBe(50);
    expect(parseLimit('abc', { fallback: 20 })).toBe(20);

    expect(parseOffset('10')).toBe(10);
    expect(parseOffset('-5')).toBe(0);
    expect(parseOffset('abc')).toBe(0);

    expect(buildPlaceholders(['a', 'b', 'c'])).toBe('?, ?, ?');
    expect(buildPlaceholders()).toBe('');
  });

  it('mendaftar dan merangkum bentuk kata yang cocok dari database', () => {
    const all = jest.fn(() => [
      { wordId: '7', word: 'kata', freq: '12' },
      { wordId: null, word: 'Kata', freq: null },
    ]);
    const prepare = jest.fn(() => ({ all }));
    const database = { prepare };

    expect(listMatchedForms(database, '  kata ')).toEqual([
      { wordId: 7, word: 'kata', freq: 12 },
      { wordId: 0, word: 'Kata', freq: 0 },
    ]);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE word = ? COLLATE NOCASE'));
    expect(all).toHaveBeenCalledWith('kata', 'kata');

    expect(listMatchedForms(database, '   ')).toEqual([]);
    expect(summarizeMatchedForms([{ word: 'kata', freq: '3', wordId: '9' }])).toEqual([
      { kata: 'kata', frekuensi: 3, wordId: 9 },
    ]);
    expect(summarizeMatchedForms([{ word: 'nol', freq: 0, wordId: 0 }])).toEqual([
      { kata: 'nol', frekuensi: 0, wordId: 0 },
    ]);
    expect(summarizeMatchedForms()).toEqual([]);
  });

  it('memilih label agregat terbaik untuk variasi token', () => {
    expect(bersihkanTokenAgregat('  (kata)!  ')).toBe('kata');
    expect(bersihkanTokenAgregat()).toBe('');
    expect(adalahVarianHurufKecil('kata')).toBe(true);
    expect(adalahVarianHurufKecil('Kata')).toBe(false);
    expect(adalahVarianHurufKecil('')).toBe(false);
    expect(adalahVarianHurufKecil()).toBe(false);

    expect(pilihLabelAgregat(null, 'Kata', 2)).toEqual({
      kata: 'Kata',
      wordId: 0,
      preferHurufKecil: false,
      frekuensiLabel: 2,
    });
    expect(pilihLabelAgregat(null, '!!!', 2)).toBeNull();

    const hurufKecil = pilihLabelAgregat({
      kata: 'Kata',
      wordId: 0,
      preferHurufKecil: false,
      frekuensiLabel: 1,
    }, 'kata', 1);
    expect(hurufKecil).toEqual({
      kata: 'kata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 1,
    });

    const frekuensiLebihTinggi = pilihLabelAgregat({
      kata: 'kata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 3,
    }, 'kota', 5);
    expect(frekuensiLebihTinggi).toEqual({
      kata: 'kota',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 5,
    });

    const alfabetis = pilihLabelAgregat({
      kata: 'zata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 5,
    }, 'kata', 5);
    expect(alfabetis).toEqual({
      kata: 'kata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 5,
    });

    expect(pilihLabelAgregat({
      kata: 'kata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 5,
    }, 'zeta', 5)).toEqual({
      kata: 'kata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 5,
    });

    expect(pilihLabelAgregat({
      kata: 'kata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 5,
    }, 'KATA', 0)).toEqual({
      kata: 'kata',
      wordId: 0,
      preferHurufKecil: true,
      frekuensiLabel: 5,
    });
  });

  it('mengagregasi variasi kata, mengecualikan kata tertentu, dan mengurutkan hasil', () => {
    const hasil = aggregateWordRows([
      { kata: 'Kata', frekuensi: 3, signifikansi: 2, wordId: 11 },
      { kata: 'kata', frekuensi: 5, signifikansi: 7, wordId: 13 },
      { kata: 'Beta', frekuensi: 8, signifikansi: null, wordId: 21 },
      { kata: 'beta', frekuensi: 2, signifikansi: 4, wordId: 22 },
      { kata: 'gamma', frekuensi: 8, signifikansi: 1, wordId: 31 },
      { word: 'delta', frekuensi: 1, signifikansi: null, wordId: null },
      { kata: '', frekuensi: 1, signifikansi: 9, wordId: 99 },
      { kata: 'exclude', frekuensi: 100, signifikansi: 100, wordId: 77 },
    ], ' ExClUdE ');

    expect(hasil).toEqual([
      { kata: 'beta', frekuensi: 10, signifikansi: 4, wordId: 22 },
      { kata: 'gamma', frekuensi: 8, signifikansi: 1, wordId: 31 },
      { kata: 'kata', frekuensi: 8, signifikansi: 7, wordId: 13 },
      { kata: 'delta', frekuensi: 1, signifikansi: null, wordId: 0 },
    ]);
  });

  it('mempertahankan wordId sebelumnya saat label tidak diganti oleh baris baru', () => {
    const hasil = aggregateWordRows([
      { kata: 'alpha', frekuensi: 5, signifikansi: 2, wordId: 41 },
      { kata: 'Alpha', frekuensi: 2, signifikansi: null, wordId: 42 },
    ]);

    expect(hasil).toEqual([
      { kata: 'alpha', frekuensi: 7, signifikansi: 2, wordId: 41 },
    ]);
  });

  it('memakai fallback nol saat frekuensi dan signifikansi tidak tersedia', () => {
    const hasil = aggregateWordRows([
      { kata: 'omega', frekuensi: undefined, signifikansi: undefined, wordId: undefined },
      { kata: 'omega', frekuensi: 0, signifikansi: 0, wordId: 0 },
    ]);

    expect(hasil).toEqual([
      { kata: 'omega', frekuensi: 0, signifikansi: 0, wordId: 0 },
    ]);
  });

  it('mengembalikan daftar kosong secara bawaan dan menjaga wordId nol pada cabang lama', () => {
    expect(aggregateWordRows()).toEqual([]);

    const hasil = aggregateWordRows([
      { kata: 'rho', frekuensi: 0, signifikansi: 1, wordId: 0 },
      { kata: 'RHO', frekuensi: 0, signifikansi: 2, wordId: 99 },
    ]);

    expect(hasil).toEqual([
      { kata: 'rho', frekuensi: 0, signifikansi: 2, wordId: 0 },
    ]);
  });
});