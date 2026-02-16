/**
 * @fileoverview Layanan autentikasi Google OAuth untuk aplikasi publik
 */

const jwt = require('jsonwebtoken');

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') return '';

  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch (_error) {
    return '';
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Konfigurasi ${name} belum diatur`);
    error.status = 503;
    throw error;
  }
  return value;
}

function getFrontendCallbackUrl() {
  return process.env.FRONTEND_AUTH_CALLBACK_URL || 'http://localhost:5173/auth/callback';
}

function getAllowedFrontendOrigins() {
  const configuredOrigins = (process.env.FRONTEND_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean);

  const defaultOrigin = normalizeOrigin(getFrontendCallbackUrl());
  if (defaultOrigin) {
    configuredOrigins.push(defaultOrigin);
  }

  return [...new Set(configuredOrigins)];
}

function resolveFrontendCallbackUrl(frontendOrigin = '') {
  const normalizedFrontendOrigin = normalizeOrigin(frontendOrigin);
  const allowedOrigins = getAllowedFrontendOrigins();

  if (normalizedFrontendOrigin && allowedOrigins.includes(normalizedFrontendOrigin)) {
    return `${normalizedFrontendOrigin}/auth/callback`;
  }

  return getFrontendCallbackUrl();
}

function buildOAuthState(payload = {}) {
  const encoded = Buffer.from(JSON.stringify(payload));
  return encoded.toString('base64url');
}

function parseOAuthState(state) {
  if (!state || typeof state !== 'string') {
    return {};
  }

  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function buildGoogleAuthUrl({ state = '' } = {}) {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
  const redirectUri = getRequiredEnv('GOOGLE_REDIRECT_URI');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  if (state) {
    params.set('state', state);
  }

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET');
  const redirectUri = getRequiredEnv('GOOGLE_REDIRECT_URI');

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const payload = await response.text();
    const error = new Error(`Gagal menukar code OAuth: ${payload}`);
    error.status = 401;
    throw error;
  }

  return response.json();
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    const error = new Error(`Gagal mengambil profil Google: ${payload}`);
    error.status = 401;
    throw error;
  }

  return response.json();
}

function buildAppToken(profile) {
  const jwtSecret = getRequiredEnv('JWT_SECRET');
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const payload = {
    sub: profile.id,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    provider: 'google',
  };

  // Tambah data otorisasi dari database jika tersedia
  if (profile.pid != null) payload.pid = profile.pid;
  if (profile.peran) payload.peran = profile.peran;
  if (profile.izin) payload.izin = profile.izin;

  return jwt.sign(payload, jwtSecret, { expiresIn });
}

function buildFrontendCallbackRedirect(token, options = {}) {
  const callbackUrl = new URL(resolveFrontendCallbackUrl(options.frontendOrigin));
  callbackUrl.hash = new URLSearchParams({ token }).toString();
  return callbackUrl.toString();
}

function buildFrontendErrorRedirect(message, options = {}) {
  const callbackUrl = new URL(resolveFrontendCallbackUrl(options.frontendOrigin));
  callbackUrl.searchParams.set('error', message);
  return callbackUrl.toString();
}

module.exports = {
  buildOAuthState,
  parseOAuthState,
  buildGoogleAuthUrl,
  exchangeCodeForToken,
  fetchGoogleProfile,
  buildAppToken,
  buildFrontendCallbackRedirect,
  buildFrontendErrorRedirect,
  resolveFrontendCallbackUrl,
  getAllowedFrontendOrigins,
};
