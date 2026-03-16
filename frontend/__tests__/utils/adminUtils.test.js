import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, potongTeks, validateRequiredFields } from '../../src/utils/adminUtils';

describe('adminUtils', () => {
  it('potongTeks menangani teks kosong, pendek, dan panjang', () => {
    expect(potongTeks('')).toBe('—');
    expect(potongTeks('pendek', 10)).toBe('pendek');
    expect(potongTeks('teks sangat panjang sekali', 4)).toBe('teks …');
  });

  it('validateRequiredFields mengembalikan pesan field wajib pertama yang kosong', () => {
    expect(validateRequiredFields({ nama: '', kode: 'n' }, [
      { name: 'nama', label: 'Nama' },
      { name: 'kode', label: 'Kode' },
    ])).toBe('Nama wajib diisi');

    expect(validateRequiredFields(undefined, [
      { name: 'nama', label: 'Nama' },
    ])).toBe('Nama wajib diisi');

    expect(validateRequiredFields({ nama: 'Ada', kode: 'n' }, [
      { name: 'nama', label: 'Nama' },
      { name: 'kode', label: 'Kode' },
    ])).toBe('');
  });

  it('getApiErrorMessage memprioritaskan error, lalu message, lalu fallback', () => {
    expect(getApiErrorMessage({ response: { data: { error: 'Error utama', message: 'Message kedua' } } }, 'Fallback')).toBe('Error utama');
    expect(getApiErrorMessage({ response: { data: { message: 'Message kedua' } } }, 'Fallback')).toBe('Message kedua');
    expect(getApiErrorMessage({}, 'Fallback')).toBe('Fallback');
  });
});