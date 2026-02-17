import { describe, it, expect } from 'vitest';
import { normalisasiIndeksKamus, buatPathDetailKamus } from '../../src/utils/kamusIndex';

describe('kamusIndex', () => {
  it('normalisasiIndeksKamus menghapus nomor indeks dan strip tepi', () => {
    expect(normalisasiIndeksKamus(' --kata-- (2) ')).toBe('kata');
  });

  it('normalisasiIndeksKamus fallback ke nilai awal saat hasil trim kosong', () => {
    expect(normalisasiIndeksKamus('---')).toBe('---');
  });

  it('normalisasiIndeksKamus mengembalikan string kosong untuk input kosong/falsy', () => {
    expect(normalisasiIndeksKamus('')).toBe('');
    expect(normalisasiIndeksKamus()).toBe('');
    expect(normalisasiIndeksKamus(null)).toBe('');
  });

  it('buatPathDetailKamus membentuk path detail dan fallback ke /kamus', () => {
    expect(buatPathDetailKamus(' kata (1) ')).toBe('/kamus/detail/kata');
    expect(buatPathDetailKamus('')).toBe('/kamus');
  });
});
