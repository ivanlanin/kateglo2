/**
 * @fileoverview Test layanan autentikasi Google OAuth
 * @tested_in backend/services/layananAuthGoogle.js
 */

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

function loadServiceWithJwt() {
  jest.resetModules();
  const service = require('../../services/layananAuthGoogle');
  const jwt = require('jsonwebtoken');
  return { service, jwt };
}

describe('services/layananAuthGoogle', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.FRONTEND_AUTH_CALLBACK_URL;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('buildGoogleAuthUrl melempar error saat env wajib belum lengkap', () => {
    const { service } = loadServiceWithJwt();

    expect(() => service.buildGoogleAuthUrl()).toThrow('Konfigurasi GOOGLE_CLIENT_ID belum diatur');
  });

  it('buildGoogleAuthUrl membentuk URL OAuth dengan query param wajib', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

    const { service } = loadServiceWithJwt();
    const authUrl = service.buildGoogleAuthUrl();
    const parsed = new URL(authUrl);

    expect(parsed.origin).toBe('https://accounts.google.com');
    expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
    expect(parsed.searchParams.get('client_id')).toBe('google-client');
    expect(parsed.searchParams.get('redirect_uri')).toBe('http://localhost:3000/auth/google/callback');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toBe('openid email profile');
  });

  it('buildGoogleAuthUrl menyertakan state jika diberikan', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

    const { service } = loadServiceWithJwt();
    const authUrl = service.buildGoogleAuthUrl({ state: 'state-token' });
    const parsed = new URL(authUrl);

    expect(parsed.searchParams.get('state')).toBe('state-token');
  });

  it('buildOAuthState dan parseOAuthState melakukan round-trip payload', () => {
    const { service } = loadServiceWithJwt();
    const state = service.buildOAuthState({ frontendOrigin: 'https://kateglo.org' });
    const parsed = service.parseOAuthState(state);

    expect(parsed).toEqual({ frontendOrigin: 'https://kateglo.org' });
  });

  it('parseOAuthState mengembalikan object kosong untuk state tidak valid', () => {
    const { service } = loadServiceWithJwt();

    expect(service.parseOAuthState('invalid@@@')).toEqual({});
    expect(service.parseOAuthState('')).toEqual({});
  });

  it('exchangeCodeForToken mengembalikan payload saat response OK', async () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

    const payload = { access_token: 'google-access' };
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    });

    const { service } = loadServiceWithJwt();
    const result = await service.exchangeCodeForToken('oauth-code-123');

    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(String(options.body)).toContain('code=oauth-code-123');
  });

  it('exchangeCodeForToken melempar error 401 saat response gagal', async () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

    global.fetch.mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue('bad request'),
    });

    const { service } = loadServiceWithJwt();

    await expect(service.exchangeCodeForToken('oauth-code-123')).rejects.toMatchObject({
      message: 'Gagal menukar code OAuth: bad request',
      status: 401,
    });
  });

  it('fetchGoogleProfile mengembalikan profil saat response OK', async () => {
    const profile = { id: 'g-1', email: 'user@google.dev' };
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(profile),
    });

    const { service } = loadServiceWithJwt();
    const result = await service.fetchGoogleProfile('access-token-1');

    expect(result).toEqual(profile);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: 'Bearer access-token-1',
        },
      }
    );
  });

  it('fetchGoogleProfile melempar error 401 saat response gagal', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue('unauthorized'),
    });

    const { service } = loadServiceWithJwt();

    await expect(service.fetchGoogleProfile('access-token-2')).rejects.toMatchObject({
      message: 'Gagal mengambil profil Google: unauthorized',
      status: 401,
    });
  });

  it('buildAppToken menggunakan default expiresIn 7d', () => {
    process.env.JWT_SECRET = 'jwt-secret';
    const { service, jwt } = loadServiceWithJwt();
    jwt.sign.mockReturnValue('signed-default');

    const profile = {
      id: 'g-100',
      email: 'person@example.com',
      name: 'Person',
      picture: 'https://img.example/p.png',
    };

    const token = service.buildAppToken(profile);

    expect(token).toBe('signed-default');
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        sub: 'g-100',
        email: 'person@example.com',
        name: 'Person',
        picture: 'https://img.example/p.png',
        provider: 'google',
        role: 'user',
      },
      'jwt-secret',
      { expiresIn: '7d' }
    );
  });

  it('buildAppToken menggunakan JWT_EXPIRES_IN jika tersedia', () => {
    process.env.JWT_SECRET = 'jwt-secret';
    process.env.JWT_EXPIRES_IN = '12h';
    const { service, jwt } = loadServiceWithJwt();
    jwt.sign.mockReturnValue('signed-custom');

    const token = service.buildAppToken({
      id: 'g-200',
      email: 'other@example.com',
      name: 'Other',
      picture: 'https://img.example/o.png',
    });

    expect(token).toBe('signed-custom');
    expect(jwt.sign).toHaveBeenCalledWith(expect.any(Object), 'jwt-secret', { expiresIn: '12h' });
  });

  it('buildFrontendCallbackRedirect menggunakan default callback URL', () => {
    const { service } = loadServiceWithJwt();
    const url = service.buildFrontendCallbackRedirect('token-abc');

    expect(url).toBe('http://localhost:5173/auth/callback#token=token-abc');
  });

  it('resolveFrontendCallbackUrl menggunakan origin yang diizinkan', () => {
    process.env.FRONTEND_AUTH_CALLBACK_URL = 'https://kateglo.org/auth/callback';
    process.env.FRONTEND_ALLOWED_ORIGINS = 'https://kateglo.org, https://kateglo.onrender.com, http://localhost:5173';

    const { service } = loadServiceWithJwt();
    const callbackUrl = service.resolveFrontendCallbackUrl('https://kateglo.onrender.com');

    expect(callbackUrl).toBe('https://kateglo.onrender.com/auth/callback');
  });

  it('resolveFrontendCallbackUrl fallback ke default saat origin tidak diizinkan', () => {
    process.env.FRONTEND_AUTH_CALLBACK_URL = 'https://kateglo.org/auth/callback';
    process.env.FRONTEND_ALLOWED_ORIGINS = 'https://kateglo.org,http://localhost:5173';

    const { service } = loadServiceWithJwt();
    const callbackUrl = service.resolveFrontendCallbackUrl('https://evil.example');

    expect(callbackUrl).toBe('https://kateglo.org/auth/callback');
  });

  it('buildFrontendCallbackRedirect mengikuti frontendOrigin bila valid', () => {
    process.env.FRONTEND_AUTH_CALLBACK_URL = 'https://kateglo.org/auth/callback';
    process.env.FRONTEND_ALLOWED_ORIGINS = 'https://kateglo.org,https://kateglo.onrender.com';

    const { service } = loadServiceWithJwt();
    const url = service.buildFrontendCallbackRedirect('token-abc', {
      frontendOrigin: 'https://kateglo.onrender.com',
    });

    expect(url).toBe('https://kateglo.onrender.com/auth/callback#token=token-abc');
  });

  it('buildFrontendErrorRedirect menggunakan FRONTEND_AUTH_CALLBACK_URL jika tersedia', () => {
    process.env.FRONTEND_AUTH_CALLBACK_URL = 'https://kateglo.id/auth/callback';

    const { service } = loadServiceWithJwt();
    const url = service.buildFrontendErrorRedirect('Autentikasi gagal');
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://kateglo.id');
    expect(parsed.pathname).toBe('/auth/callback');
    expect(parsed.searchParams.get('error')).toBe('Autentikasi gagal');
  });

  it('getAllowedFrontendOrigins memuat origin default callback dan daftar env', () => {
    process.env.FRONTEND_AUTH_CALLBACK_URL = 'https://kateglo.org/auth/callback';
    process.env.FRONTEND_ALLOWED_ORIGINS = 'https://kateglo.org,https://kateglo.onrender.com,http://localhost:5173';

    const { service } = loadServiceWithJwt();
    const origins = service.getAllowedFrontendOrigins();

    expect(origins).toContain('https://kateglo.org');
    expect(origins).toContain('https://kateglo.onrender.com');
    expect(origins).toContain('http://localhost:5173');
  });
});
