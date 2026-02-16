/**
 * @fileoverview Test env override untuk apiAuth
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('apiAuth env', () => {
  it('buatUrlLoginGoogle memakai VITE_API_URL saat tersedia', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.kateglo.id');
    vi.resetModules();

    const module = await import('../../src/api/apiAuth.js?env-override');

    expect(module.buatUrlLoginGoogle()).toBe('https://api.kateglo.id/auth/google');
  });
});
