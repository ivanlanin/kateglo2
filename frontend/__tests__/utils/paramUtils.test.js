import { describe, expect, it, vi } from 'vitest';
import {
  buatPathDetailKamus,
  compactParams,
  normalisasiIndeksKamus,
  normalizeOffset,
  parsePositiveIntegerParam,
  readOffsetFromSearchParams,
  updateSearchParams,
  updateSearchParamsWithOffset,
} from '../../src/utils/paramUtils';

describe('utils/paramUtils', () => {
  describe('search params helpers', () => {
    it('compactParams membuang nilai kosong dan trim string', () => {
      const result = compactParams({
        q: '  kata  ',
        a: '',
        b: '   ',
        c: null,
        d: undefined,
        offset: 0,
        limit: 20,
      });

      expect(result).toEqual({ q: 'kata', offset: '0', limit: '20' });
    });

    it('updateSearchParams mengirim params yang sudah dikompak', () => {
      const setSearchParams = vi.fn();

      updateSearchParams(setSearchParams, {
        q: ' tes ',
        kosong: ' ',
        page: 2,
      });

      expect(setSearchParams).toHaveBeenCalledWith({ q: 'tes', page: '2' });
    });

    it('updateSearchParamsWithOffset menyertakan offset jika > 0', () => {
      const setSearchParams = vi.fn();

      updateSearchParamsWithOffset(setSearchParams, { q: 'abc' }, 40);

      expect(setSearchParams).toHaveBeenCalledWith({ q: 'abc', offset: '40' });
    });

    it('updateSearchParamsWithOffset membatasi offset ke maksimum publik', () => {
      const setSearchParams = vi.fn();

      updateSearchParamsWithOffset(setSearchParams, { q: 'abc' }, 5000);

      expect(setSearchParams).toHaveBeenCalledWith({ q: 'abc', offset: '1000' });
    });

    it('updateSearchParamsWithOffset menghapus offset jika 0 atau kurang', () => {
      const setSearchParams = vi.fn();

      updateSearchParamsWithOffset(setSearchParams, { q: 'abc' }, 0);
      updateSearchParamsWithOffset(setSearchParams, { q: 'abc' }, -10);

      expect(setSearchParams).toHaveBeenNthCalledWith(1, { q: 'abc' });
      expect(setSearchParams).toHaveBeenNthCalledWith(2, { q: 'abc' });
    });

    it('normalizeOffset dan readOffsetFromSearchParams melakukan clamp nilai', () => {
      expect(normalizeOffset('5000')).toBe(1000);
      expect(normalizeOffset('-100')).toBe(0);
      expect(normalizeOffset('abc')).toBe(0);
      expect(normalizeOffset(undefined)).toBe(0);

      const searchParams = new URLSearchParams('offset=9999');
      expect(readOffsetFromSearchParams(searchParams)).toBe(1000);
    });

    it('normalizeOffset menangani maxOffset invalid/negatif dan readOffset default saat searchParams null', () => {
      expect(normalizeOffset('10', 'bukan-angka')).toBe(0);
      expect(normalizeOffset('10', -5)).toBe(0);
      expect(readOffsetFromSearchParams(null)).toBe(0);
    });
  });

  describe('route param helper', () => {
    it('mengembalikan integer positif untuk nilai valid', () => {
      expect(parsePositiveIntegerParam('1')).toBe(1);
      expect(parsePositiveIntegerParam('42')).toBe(42);
      expect(parsePositiveIntegerParam(7)).toBe(7);
    });

    it('mengembalikan null untuk nilai tidak valid', () => {
      expect(parsePositiveIntegerParam('0')).toBeNull();
      expect(parsePositiveIntegerParam('-2')).toBeNull();
      expect(parsePositiveIntegerParam('abc')).toBeNull();
      expect(parsePositiveIntegerParam('')).toBeNull();
      expect(parsePositiveIntegerParam(null)).toBeNull();
      expect(parsePositiveIntegerParam(undefined)).toBeNull();
    });

    it('memakai parseInt basis 10 untuk string campuran', () => {
      expect(parsePositiveIntegerParam('12xyz')).toBe(12);
      expect(parsePositiveIntegerParam('08')).toBe(8);
    });
  });

  describe('kamus index helper', () => {
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
});