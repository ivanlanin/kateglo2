import { describe, expect, it } from 'vitest';
import { ambilDaftarLookup, mapOpsiIdNama } from '../../src/utils/opsiUtils';

describe('opsiUtils', () => {
  it('ambilDaftarLookup hanya menerima array data', () => {
    expect(ambilDaftarLookup({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(ambilDaftarLookup({ data: null })).toEqual([]);
    expect(ambilDaftarLookup()).toEqual([]);
  });

  it('mapOpsiIdNama memetakan id dan nama dengan fallback serta opsi kosong opsional', () => {
    expect(mapOpsiIdNama([{ id: 1, nama: 'Satu' }, { id: 2 }])).toEqual([
      { value: '1', label: 'Satu' },
      { value: '2', label: '2' },
    ]);

    expect(mapOpsiIdNama([{}])).toEqual([{ value: '', label: '' }]);

    expect(mapOpsiIdNama([{ id: 3, nama: 'Tiga' }], { includeEmpty: true, emptyLabel: 'Pilih' })).toEqual([
      { value: '', label: 'Pilih' },
      { value: '3', label: 'Tiga' },
    ]);

    expect(mapOpsiIdNama(null)).toEqual([]);
  });
});