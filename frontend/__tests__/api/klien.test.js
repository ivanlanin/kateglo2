import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

const mockUse = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ get: vi.fn(), interceptors: { request: { use: mockUse } } })),
  },
}));

describe('klien', () => {
  beforeEach(() => {
    vi.resetModules();
    axios.create.mockReset();
    mockUse.mockReset();
    axios.create.mockReturnValue({ get: vi.fn(), interceptors: { request: { use: mockUse } } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('mengisi header X-Frontend-Key saat env key tersedia', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.kateglo.test');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', 'rahasia');

    await import('../../src/api/klien');

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.kateglo.test',
      timeout: 15000,
    });
    expect(mockUse).toHaveBeenCalled();

    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorFn(config);
    expect(result.headers['X-Frontend-Key']).toBe('rahasia');

    localStorage.getItem.mockReturnValue('token-uji');
    const configDenganToken = { headers: {} };
    const resultDenganToken = interceptorFn(configDenganToken);
    expect(resultDenganToken.headers.Authorization).toBe('Bearer token-uji');
  });

  it('memakai default same-origin dan tanpa header saat key tidak ada', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');

    await import('../../src/api/klien');

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: undefined,
      timeout: 15000,
    });
    expect(mockUse).toHaveBeenCalled();

    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorFn(config);
    expect(result.headers['X-Frontend-Key']).toBeUndefined();
  });

  it('tetap memakai base URL mentah saat env API tidak valid', async () => {
    vi.stubEnv('VITE_API_URL', '://invalid-base');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');

    await import('../../src/api/klien?invalid-base-url');

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: '://invalid-base',
      timeout: 15000,
    });
  });

  it('tetap memakai base URL localhost dari env saat tersedia', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');
    window.location.hostname = 'kateglo.org';
    window.location.origin = 'https://kateglo.org';

    await import('../../src/api/klien?prod-local-rewrite');

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
      timeout: 15000,
    });
  });

  it('opsi rewriteLocalhost pada __private.resolveApiBaseUrl menutup cabang rewrite', async () => {
    const module = await import('../../src/api/klien?private-rewrite-resolver');
    const runtimeWindow = {
      location: {
        hostname: 'kateglo.org',
        origin: 'https://kateglo.org',
      },
    };

    expect(module.__private.resolveApiBaseUrl({
      apiBaseUrl: 'http://localhost:3000',
      runtimeWindow,
      rewriteLocalhost: true,
    })).toBe('https://kateglo.org');
  });

  it('interceptor tidak menambah Authorization saat token kosong', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.kateglo.test');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');
    localStorage.getItem.mockReturnValue('');

    await import('../../src/api/klien?without-token-header');
    const interceptorFn = mockUse.mock.calls[0][0];
    const result = interceptorFn({ headers: {} });

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('interceptor aman saat window tidak tersedia', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.kateglo.test');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    try {
      await import('../../src/api/klien?no-window-interceptor');
      const interceptorFn = mockUse.mock.calls[0][0];
      const result = interceptorFn({ headers: {} });
      expect(result.headers.Authorization).toBeUndefined();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
  });

  it('mengembalikan instance axios default dan memasang interceptor request', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');

    const module = await import('../../src/api/klien?instance-default');

    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('object');
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: undefined,
      timeout: 15000,
    });
    expect(mockUse).toHaveBeenCalled();
  });
});
