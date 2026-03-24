import { describe, expect, it } from 'vitest';
import {
  daftarIsiGramatika,
  daftarItemGramatika,
  petaItemGramatikaBySlug,
  daftarAutocompleteGramatika,
  petaAutocompleteGramatika,
  formatJudulGramatikaDariSlug,
} from '../../src/constants/gramatikaData';

describe('constants/gramatikaData', () => {
  it('membentuk daftar item, peta slug, dan autocomplete secara konsisten', () => {
    expect(Array.isArray(daftarIsiGramatika)).toBe(true);
    expect(Array.isArray(daftarItemGramatika)).toBe(true);
    expect(Array.isArray(daftarAutocompleteGramatika)).toBe(true);

    const itemPertama = daftarItemGramatika[0];
    expect(itemPertama).toBeDefined();
    expect(petaItemGramatikaBySlug[itemPertama.slug]).toEqual(itemPertama);

    const autoPertama = daftarAutocompleteGramatika[0];
    expect(autoPertama).toBeDefined();
    expect(petaAutocompleteGramatika[autoPertama.slug]).toBe(autoPertama.value);
  });

  it('formatJudulGramatikaDariSlug menangani slug normal, kosong, dan separator ganda', () => {
    expect(formatJudulGramatikaDariSlug('frasa-nominal')).toBe('Frasa Nominal');
    expect(formatJudulGramatikaDariSlug('')).toBe('');
    expect(formatJudulGramatikaDariSlug('--')).toBe('');
  });
});