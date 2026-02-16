import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

const mockUse = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ get: vi.fn(), interceptors: { request: { use: mockUse } } })),
  },
}));

describe('klien config', () => {
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

    // Simulate interceptor execution to verify it sets the header
    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorFn(config);
    expect(result.headers['X-Frontend-Key']).toBe('rahasia');

    localStorage.getItem.mockReturnValue('token-uji');
    const configDenganToken = { headers: {} };
    const resultDenganToken = interceptorFn(configDenganToken);
    expect(resultDenganToken.headers.Authorization).toBe('Bearer token-uji');
  });

  it('memakai default baseURL dan tanpa header saat key tidak ada', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');

    await import('../../src/api/klien');

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
      timeout: 15000,
    });
    expect(mockUse).toHaveBeenCalled();

    // Simulate interceptor execution to verify it does NOT set the header
    const interceptorFn = mockUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorFn(config);
    expect(result.headers['X-Frontend-Key']).toBeUndefined();
  });
});