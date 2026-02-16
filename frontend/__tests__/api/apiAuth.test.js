/**
 * @fileoverview Test API auth frontend
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/api/klien', () => ({
  default: {
    get: vi.fn(),
  },
}));

import klien from '../../src/api/klien';
import {
  simpanReturnTo,
  ambilReturnTo,
  buatUrlLoginGoogle,
  mulaiLoginGoogle,
  ambilProfilSaya,
} from '../../src/api/apiAuth';

describe('apiAuth', () => {
  beforeEach(() => {
    klien.get.mockReset();
    window.location.pathname = '/kamus';
    window.location.search = '?q=kata';
  });

  it('simpanReturnTo menyimpan path eksplisit jika valid', () => {
    simpanReturnTo('/tesaurus/cari/aktif');

    expect(localStorage.setItem).toHaveBeenCalledWith('kateglo-auth-return-to', '/tesaurus/cari/aktif');
  });

  it('simpanReturnTo memakai path dari lokasi saat argumen kosong', () => {
    simpanReturnTo();

    expect(localStorage.setItem).toHaveBeenCalledWith('kateglo-auth-return-to', '/kamus?q=kata');
  });

  it('simpanReturnTo tidak menyimpan saat path callback auth', () => {
    simpanReturnTo('/auth/callback');

    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('ambilReturnTo mengembalikan default root jika tidak ada data', () => {
    localStorage.getItem.mockReturnValue(null);

    const result = ambilReturnTo();

    expect(result).toBe('/');
    expect(localStorage.removeItem).toHaveBeenCalledWith('kateglo-auth-return-to');
  });

  it('ambilReturnTo menolak path eksternal atau tidak valid', () => {
    localStorage.getItem.mockReturnValue('https://evil.example/path');

    const result = ambilReturnTo();

    expect(result).toBe('/');
  });

  it('ambilReturnTo menolak protocol-relative path', () => {
    localStorage.getItem.mockReturnValue('//evil.example/path');

    const result = ambilReturnTo();

    expect(result).toBe('/');
  });

  it('ambilReturnTo mengembalikan path valid internal', () => {
    localStorage.getItem.mockReturnValue('/glosarium/bidang/linguistik');

    const result = ambilReturnTo();

    expect(result).toBe('/glosarium/bidang/linguistik');
  });

  it('buatUrlLoginGoogle membangun URL login berbasis API', () => {
    expect(buatUrlLoginGoogle()).toBe('http://localhost:3000/auth/google');
  });

  it('buatUrlLoginGoogle menyertakan frontend_origin jika diberikan', () => {
    const url = buatUrlLoginGoogle('https://kateglo.org');
    expect(url).toBe('http://localhost:3000/auth/google?frontend_origin=https%3A%2F%2Fkateglo.org');
  });

  it('mulaiLoginGoogle menyimpan returnTo lalu redirect', () => {
    mulaiLoginGoogle('/kamus/cari/rumah');

    expect(localStorage.setItem).toHaveBeenCalledWith('kateglo-auth-return-to', '/kamus/cari/rumah');
    expect(window.location.assign).toHaveBeenCalledWith('http://localhost:3000/auth/google?frontend_origin=http%3A%2F%2Flocalhost');
  });

  it('ambilProfilSaya memanggil endpoint /me dengan bearer token', async () => {
    klien.get.mockResolvedValue({ data: { data: { email: 'u@example.com' } } });

    const result = await ambilProfilSaya('token-123');

    expect(klien.get).toHaveBeenCalledWith('/api/public/auth/me', {
      headers: {
        Authorization: 'Bearer token-123',
      },
    });
    expect(result).toEqual({ email: 'u@example.com' });
  });

  it('ambilProfilSaya mengembalikan null saat payload data kosong', async () => {
    klien.get.mockResolvedValue({ data: {} });

    const result = await ambilProfilSaya('token-123');

    expect(result).toBeNull();
  });
});
