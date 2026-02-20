/**
 * @fileoverview Test route OAuth eksternal
 * @tested_in backend/routes/auth.js
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../config/logger', () => ({
  warn: jest.fn(),
}));

jest.mock('../../services/layananAuthGoogle', () => ({
  buildOAuthState: jest.fn(),
  parseOAuthState: jest.fn(),
  buildGoogleAuthUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  fetchGoogleProfile: jest.fn(),
  buildAppToken: jest.fn(),
  buildFrontendCallbackRedirect: jest.fn(),
  buildFrontendErrorRedirect: jest.fn(),
}));

jest.mock('../../models/modelPengguna', () => ({
  upsertDariGoogle: jest.fn(),
  bootstrapAdmin: jest.fn(),
  ambilPeranUntukAuth: jest.fn(),
  ambilIzin: jest.fn(),
}));

const logger = require('../../config/logger');
const layananAuthGoogle = require('../../services/layananAuthGoogle');
const ModelPengguna = require('../../models/modelPengguna');
const authRouter = require('../../routes/auth');

function createApp() {
  const app = express();
  app.use('/auth', authRouter);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

describe('routes/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    layananAuthGoogle.buildOAuthState.mockReturnValue('encoded-state');
    layananAuthGoogle.parseOAuthState.mockReturnValue({ frontendOrigin: 'https://kateglo.org' });
  });

  it('GET /auth/google melakukan redirect ke URL Google OAuth', async () => {
    layananAuthGoogle.buildGoogleAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?client_id=x');

    const response = await request(createApp()).get('/auth/google');

    expect(response.status).toBe(302);
    expect(layananAuthGoogle.buildOAuthState).toHaveBeenCalledWith({ frontendOrigin: '' });
    expect(layananAuthGoogle.buildGoogleAuthUrl).toHaveBeenCalledWith({ state: 'encoded-state' });
    expect(response.headers.location).toBe('https://accounts.google.com/o/oauth2/v2/auth?client_id=x');
  });

  it('GET /auth/google menerima frontend_origin dan memasukkan ke state', async () => {
    layananAuthGoogle.buildGoogleAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=encoded-state');

    const response = await request(createApp())
      .get('/auth/google?frontend_origin=https%3A%2F%2Fkateglo.onrender.com');

    expect(response.status).toBe(302);
    expect(layananAuthGoogle.buildOAuthState).toHaveBeenCalledWith({ frontendOrigin: 'https://kateglo.onrender.com' });
  });

  it('GET /auth/google meneruskan error ke middleware', async () => {
    layananAuthGoogle.buildGoogleAuthUrl.mockImplementation(() => {
      throw new Error('oauth config invalid');
    });

    const response = await request(createApp()).get('/auth/google');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('oauth config invalid');
  });

  it('GET /auth/google/callback redirect error saat query error ada', async () => {
    layananAuthGoogle.buildFrontendErrorRedirect.mockReturnValue('http://localhost:5173/auth/callback?error=Login%20Google%20dibatalkan');

    const response = await request(createApp()).get('/auth/google/callback?error=access_denied&state=encoded-state');

    expect(response.status).toBe(302);
    expect(layananAuthGoogle.parseOAuthState).toHaveBeenCalledWith('encoded-state');
    expect(layananAuthGoogle.buildFrontendErrorRedirect).toHaveBeenCalledWith('Login Google dibatalkan', {
      frontendOrigin: 'https://kateglo.org',
    });
    expect(response.headers.location).toBe('http://localhost:5173/auth/callback?error=Login%20Google%20dibatalkan');
  });

  it('GET /auth/google/callback redirect error saat code tidak tersedia', async () => {
    layananAuthGoogle.buildFrontendErrorRedirect.mockReturnValue('http://localhost:5173/auth/callback?error=Kode%20OAuth%20tidak%20tersedia');

    const response = await request(createApp()).get('/auth/google/callback?state=encoded-state');

    expect(response.status).toBe(302);
    expect(layananAuthGoogle.buildFrontendErrorRedirect).toHaveBeenCalledWith('Kode OAuth tidak tersedia', {
      frontendOrigin: 'https://kateglo.org',
    });
    expect(response.headers.location).toBe('http://localhost:5173/auth/callback?error=Kode%20OAuth%20tidak%20tersedia');
  });

  it('GET /auth/google/callback menukar code dan redirect dengan app token', async () => {
    layananAuthGoogle.exchangeCodeForToken.mockResolvedValue({ access_token: 'google-access' });
    layananAuthGoogle.fetchGoogleProfile.mockResolvedValue({ id: 'google-id', email: 'u@example.com', name: 'User', picture: 'https://img.example/u.png' });
    ModelPengguna.upsertDariGoogle.mockResolvedValue({ id: 1, peran_id: 1, email: 'u@example.com' });
    ModelPengguna.bootstrapAdmin.mockResolvedValue({ id: 1, peran_id: 1, email: 'u@example.com' });
    ModelPengguna.ambilPeranUntukAuth.mockResolvedValue({ kode: 'pengguna', akses_redaksi: false });
    ModelPengguna.ambilIzin.mockResolvedValue(['lihat_lema']);
    layananAuthGoogle.buildAppToken.mockReturnValue('app-token-123');
    layananAuthGoogle.buildFrontendCallbackRedirect.mockReturnValue('http://localhost:5173/auth/callback#token=app-token-123');

    const response = await request(createApp()).get('/auth/google/callback?code=oauth-code-1&state=encoded-state');

    expect(response.status).toBe(302);
    expect(layananAuthGoogle.exchangeCodeForToken).toHaveBeenCalledWith('oauth-code-1');
    expect(layananAuthGoogle.fetchGoogleProfile).toHaveBeenCalledWith('google-access');
    expect(ModelPengguna.upsertDariGoogle).toHaveBeenCalledWith({
      googleId: 'google-id',
      email: 'u@example.com',
      nama: 'User',
      foto: 'https://img.example/u.png',
    });
    expect(layananAuthGoogle.buildAppToken).toHaveBeenCalledWith(expect.objectContaining({
      id: 'google-id',
      pid: 1,
      peran: 'pengguna',
      akses_redaksi: false,
      izin: ['lihat_lema'],
    }));
    expect(layananAuthGoogle.buildFrontendCallbackRedirect).toHaveBeenCalledWith('app-token-123', {
      frontendOrigin: 'https://kateglo.org',
    });
    expect(response.headers.location).toBe('http://localhost:5173/auth/callback#token=app-token-123');
  });

  it('GET /auth/google/callback menangani error autentikasi dan log warning', async () => {
    layananAuthGoogle.exchangeCodeForToken.mockRejectedValue(new Error('invalid_grant'));
    layananAuthGoogle.buildFrontendErrorRedirect.mockReturnValue('http://localhost:5173/auth/callback?error=Autentikasi%20Google%20gagal');

    const response = await request(createApp()).get('/auth/google/callback?code=oauth-code-2&state=encoded-state');

    expect(response.status).toBe(302);
    expect(logger.warn).toHaveBeenCalledWith('Google OAuth callback gagal', {
      message: 'invalid_grant',
    });
    expect(layananAuthGoogle.buildFrontendErrorRedirect).toHaveBeenCalledWith('Autentikasi Google gagal', {
      frontendOrigin: 'https://kateglo.org',
    });
    expect(response.headers.location).toBe('http://localhost:5173/auth/callback?error=Autentikasi%20Google%20gagal');
  });

  it('GET /auth/google/callback fallback frontendOrigin kosong jika state tidak valid', async () => {
    layananAuthGoogle.parseOAuthState.mockReturnValue({});
    layananAuthGoogle.buildFrontendErrorRedirect.mockReturnValue('http://localhost:5173/auth/callback?error=Kode%20OAuth%20tidak%20tersedia');

    const response = await request(createApp()).get('/auth/google/callback?state=invalid-state');

    expect(response.status).toBe(302);
    expect(layananAuthGoogle.buildFrontendErrorRedirect).toHaveBeenCalledWith('Kode OAuth tidak tersedia', {
      frontendOrigin: '',
    });
  });
});
