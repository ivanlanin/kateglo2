/**
 * @fileoverview Fungsi autentikasi frontend publik
 */

import klien from './klien';

/* c8 ignore next */
const apiBaseUrlFromEnv = (import.meta.env.VITE_API_URL || '').trim();
const returnToKey = 'kateglo-auth-return-to';

function hostLokal(hostname = '') {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function ambilApiBaseUrl() {
  if (apiBaseUrlFromEnv) {
    try {
      const parsedUrl = new URL(apiBaseUrlFromEnv);
      /* c8 ignore next */
      if (typeof window !== 'undefined') {
        const targetLokal = hostLokal(parsedUrl.hostname);
        const currentLokal = hostLokal(window.location.hostname);
        /* c8 ignore start */
        if (!import.meta.env.DEV && targetLokal && !currentLokal) {
          return window.location.origin;
        }
        /* c8 ignore stop */
      } else {
        const targetLokal = hostLokal(parsedUrl.hostname);
        /* c8 ignore start */
        if (!import.meta.env.DEV && targetLokal) {
          return '';
        }
        /* c8 ignore stop */
      }
    } catch {
      return apiBaseUrlFromEnv;
    }

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
  const apiBaseUrl = ambilApiBaseUrl();
  /* c8 ignore start */
  const loginUrl = apiBaseUrl
    ? new URL('/auth/google', apiBaseUrl)
    : new URL('/auth/google', 'http://localhost');
  /* c8 ignore stop */
  if (frontendOrigin) {
    loginUrl.searchParams.set('frontend_origin', frontendOrigin);
  }

  /* c8 ignore start */
  if (!apiBaseUrl) {
    const search = loginUrl.searchParams.toString();
    return search ? `/auth/google?${search}` : '/auth/google';
  }
  /* c8 ignore stop */

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
