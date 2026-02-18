/**
 * @fileoverview Fungsi autentikasi frontend publik
 */

import klien from './klien';

/* c8 ignore next */
const apiBaseUrlFromEnv = (import.meta.env.VITE_API_URL || '').trim();
const returnToKey = 'kateglo-auth-return-to';

function ambilApiBaseUrl() {
  if (apiBaseUrlFromEnv) {
    return apiBaseUrlFromEnv;
  }

  /* c8 ignore next */
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

export function simpanReturnTo(path = '') {
  /* c8 ignore next */
  if (typeof window === 'undefined') return;
  const currentPath = path || `${window.location.pathname}${window.location.search}`;
  if (currentPath && currentPath !== '/auth/callback') {
    localStorage.setItem(returnToKey, currentPath);
  }
}

export function ambilReturnTo() {
  /* c8 ignore next */
  if (typeof window === 'undefined') return '/';
  const returnTo = localStorage.getItem(returnToKey) || '/';
  localStorage.removeItem(returnToKey);
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/';
  }
  return returnTo;
}

export function buatUrlLoginGoogle(frontendOrigin = '') {
  const loginUrl = new URL('/auth/google', ambilApiBaseUrl());
  if (frontendOrigin) {
    loginUrl.searchParams.set('frontend_origin', frontendOrigin);
  }
  return loginUrl.toString();
}

export function mulaiLoginGoogle(path = '') {
  /* c8 ignore next */
  if (typeof window === 'undefined') return;
  simpanReturnTo(path);
  window.location.assign(buatUrlLoginGoogle(window.location.origin));
}

export async function ambilProfilSaya(token) {
  const response = await klien.get('/api/publik/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data?.data || null;
}
