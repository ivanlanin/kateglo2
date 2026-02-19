import { describe, it, expect, vi } from 'vitest';
import {
  compactParams,
  normalizeOffset,
  readOffsetFromSearchParams,
  updateSearchParams,
  updateSearchParamsWithOffset,
} from '../../src/utils/searchParams';

describe('searchParams utils', () => {
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

    const searchParams = new URLSearchParams('offset=9999');
    expect(readOffsetFromSearchParams(searchParams)).toBe(1000);
  });
});