import { describe, it, expect } from 'vitest';
import {
  daftarIsiEjaan,
  daftarItemEjaan,
  petaItemEjaanBySlug,
  daftarAutocompleteEjaan,
  petaAutocompleteEjaan,
  formatJudulEjaanDariSlug,
} from '../../src/constants/ejaanData';

describe('constants/ejaanData', () => {
  it('membentuk daftar item, peta slug, dan autocomplete secara konsisten', () => {
    expect(Array.isArray(daftarIsiEjaan)).toBe(true);
    expect(Array.isArray(daftarItemEjaan)).toBe(true);
    expect(Array.isArray(daftarAutocompleteEjaan)).toBe(true);

    const itemPertama = daftarItemEjaan[0];
    expect(itemPertama).toBeDefined();
    expect(petaItemEjaanBySlug[itemPertama.slug]).toEqual(itemPertama);

    const autoPertama = daftarAutocompleteEjaan[0];
    expect(autoPertama).toBeDefined();
    expect(petaAutocompleteEjaan[autoPertama.slug]).toBe(autoPertama.value);
  });

  it('formatJudulEjaanDariSlug menangani slug normal dan slug kosong', () => {
    expect(formatJudulEjaanDariSlug('huruf-kapital')).toBe('Huruf Kapital');
    expect(formatJudulEjaanDariSlug('')).toBe('');
    expect(formatJudulEjaanDariSlug('--')).toBe('');
  });
});
