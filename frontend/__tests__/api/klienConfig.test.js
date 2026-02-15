import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ get: vi.fn() })),
  },
}));

describe('klien config', () => {
  beforeEach(() => {
    vi.resetModules();
    axios.create.mockReset();
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
      headers: { 'X-Frontend-Key': 'rahasia' },
    });
  });

  it('memakai default baseURL dan tanpa header saat key tidak ada', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_FRONTEND_SHARED_KEY', '');

    await import('../../src/api/klien');

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000',
      timeout: 15000,
      headers: undefined,
    });
  });
});