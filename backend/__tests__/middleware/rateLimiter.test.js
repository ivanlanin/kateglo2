/**
 * @fileoverview Test middleware rate limiter
 * @tested_in backend/middleware/rateLimiter.js
 */

function loadRateLimiterWithEnv(envOverrides = {}) {
  jest.resetModules();

  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    ...envOverrides,
  };

  const rateLimitMock = jest.fn((options) => ({ options }));
  jest.doMock('express-rate-limit', () => rateLimitMock);

  const module = require('../../middleware/rateLimiter');
  return { module, rateLimitMock, restoreEnv: () => { process.env = originalEnv; } };
}

describe('middleware/rateLimiter', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('express-rate-limit');
  });

  it('menggunakan fallback legacy RATE_LIMIT_MAX_REQUESTS jika RATE_LIMIT_PUBLIC_MAX tidak ada', () => {
    const { rateLimitMock, restoreEnv } = loadRateLimiterWithEnv({
      RATE_LIMIT_PUBLIC_MAX: '',
      RATE_LIMIT_MAX_REQUESTS: '77',
      RATE_LIMIT_SEARCH_MAX: '33',
      RATE_LIMIT_WINDOW_MS: '5000',
    });

    expect(rateLimitMock).toHaveBeenCalledTimes(2);
    const [publicCall, searchCall] = rateLimitMock.mock.calls;

    expect(publicCall[0].max).toBe(77);
    expect(searchCall[0].max).toBe(33);
    expect(publicCall[0].windowMs).toBe(5000);

    restoreEnv();
  });

  it('menggunakan default saat nilai env tidak valid atau nol', () => {
    const { rateLimitMock, restoreEnv } = loadRateLimiterWithEnv({
      RATE_LIMIT_PUBLIC_MAX: '0',
      RATE_LIMIT_MAX_REQUESTS: 'NaN',
      RATE_LIMIT_SEARCH_MAX: '0',
      RATE_LIMIT_WINDOW_MS: '1',
    });

    expect(rateLimitMock).toHaveBeenCalledTimes(2);
    const [publicCall, searchCall] = rateLimitMock.mock.calls;

    expect(publicCall[0].max).toBe(180);
    expect(searchCall[0].max).toBe(60);
    expect(publicCall[0].windowMs).toBe(1000);

    restoreEnv();
  });

  it('mengekspor dua limiter hasil factory', () => {
    const { module, restoreEnv } = loadRateLimiterWithEnv();

    expect(module.publicApiLimiter).toEqual(expect.objectContaining({ options: expect.any(Object) }));
    expect(module.publicSearchLimiter).toEqual(expect.objectContaining({ options: expect.any(Object) }));

    restoreEnv();
  });
});
