/**
 * @fileoverview Test API auth frontend
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

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

  it('simpanReturnTo tidak menyimpan saat path efektif kosong', () => {
    window.location.pathname = '';
    window.location.search = '';

    simpanReturnTo();

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

  it('guard window-undefined untuk simpanReturnTo dan ambilReturnTo', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    try {
      expect(() => simpanReturnTo('/kamus')).not.toThrow();
      expect(ambilReturnTo()).toBe('/');
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
  });

  it('mulaiLoginGoogle berhenti awal saat window tidak tersedia', async () => {
    const module = await import('../../src/api/apiAuth.js?login-no-window');
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    try {
      expect(() => module.mulaiLoginGoogle('/kamus')).not.toThrow();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
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

    expect(klien.get).toHaveBeenCalledWith('/api/publik/auth/me', {
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

describe('apiAuth branch coverage', () => {
  it('buatUrlLoginGoogle memakai VITE_API_URL saat tersedia', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.kateglo.id');

    const module = await import('../../src/api/apiAuth.js?env-override');

    expect(module.buatUrlLoginGoogle()).toBe('https://api.kateglo.id/auth/google');
  });

  it('tetap memakai base URL env saat target API localhost', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
    window.location.hostname = 'kateglo.org';
    window.location.origin = 'https://kateglo.org';

    const module = await import('../../src/api/apiAuth.js?prod-origin');

    expect(module.buatUrlLoginGoogle()).toBe('http://localhost:3000/auth/google');
  });

  it('tetap menghasilkan URL absolut saat tanpa window dan env API tersedia', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    try {
      const module = await import('../../src/api/apiAuth.js?ssr-relative');
      expect(module.buatUrlLoginGoogle('https://kateglo.org')).toBe('http://localhost:3000/auth/google?frontend_origin=https%3A%2F%2Fkateglo.org');
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
  });

  it('fallback ke localhost:3000 saat env kosong dan tanpa window', async () => {
    vi.stubEnv('VITE_API_URL', '');

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    try {
      const module = await import('../../src/api/apiAuth.js?ssr-localhost');
      expect(module.buatUrlLoginGoogle()).toBe('http://localhost:3000/auth/google');
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
  });

  it('memakai window origin saat env kosong dan window tersedia', async () => {
    vi.stubEnv('VITE_API_URL', '');
    window.location.origin = 'https://kateglo.org';

    const module = await import('../../src/api/apiAuth.js?browser-origin');

    expect(module.buatUrlLoginGoogle()).toBe('https://kateglo.org/auth/google');
  });

  it('tetap meneruskan base URL mentah jika parsing env gagal', async () => {
    vi.stubEnv('VITE_API_URL', '://invalid-base');

    const module = await import('../../src/api/apiAuth.js?invalid-env');

    expect(() => module.buatUrlLoginGoogle()).toThrow();
  });

  it('opsi rewriteLocalhost pada __private.ambilApiBaseUrl menutup cabang browser', async () => {
    const module = await import('../../src/api/apiAuth.js?private-browser-rewrite');
    const runtimeWindow = {
      location: {
        hostname: 'kateglo.org',
        origin: 'https://kateglo.org',
      },
    };

    const result = module.__private.ambilApiBaseUrl({
      apiBaseUrl: 'http://127.0.0.1:3000',
      runtimeWindow,
      rewriteLocalhost: true,
    });

    expect(result).toBe('https://kateglo.org');
  });

  it('opsi rewriteLocalhost pada __private.ambilApiBaseUrl menutup cabang SSR', async () => {
    const module = await import('../../src/api/apiAuth.js?private-ssr-rewrite');
    const result = module.__private.ambilApiBaseUrl({
      apiBaseUrl: 'http://localhost:3000',
      runtimeWindow: 0,
      rewriteLocalhost: true,
    });

    expect(result).toBe('');
    expect(module.buatUrlLoginGoogle('', {
      apiBaseUrl: 'http://localhost:3000',
      runtimeWindow: 0,
      rewriteLocalhost: true,
    })).toBe('/auth/google');

    expect(module.buatUrlLoginGoogle('https://kateglo.org', {
      apiBaseUrl: 'http://localhost:3000',
      runtimeWindow: 0,
      rewriteLocalhost: true,
    })).toBe('/auth/google?frontend_origin=https%3A%2F%2Fkateglo.org');
  });
});
