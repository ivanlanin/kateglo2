/**
 * @fileoverview Fungsi autentikasi frontend publik
 */

import klien from './klien';

const apiBaseUrlFromEnv = [import.meta.env.VITE_API_URL].join('').trim();
const returnToKey = 'kateglo-auth-return-to';

function hostLokal(hostname = '') {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function ambilApiBaseUrl(options = {}) {
  const baseUrl = options.apiBaseUrl ?? apiBaseUrlFromEnv;
  const runtimeWindow = options.runtimeWindow ?? (typeof window !== 'undefined' ? window : undefined);
  const rewriteLocalhost = options.rewriteLocalhost ?? !import.meta.env.DEV;

  if (baseUrl) {
    try {
      const parsedUrl = new URL(baseUrl);
      if (runtimeWindow) {
        const targetLokal = hostLokal(parsedUrl.hostname);
        const currentLokal = hostLokal(runtimeWindow.location.hostname);
        if (rewriteLocalhost && targetLokal && !currentLokal) {
          return runtimeWindow.location.origin;
        }
      } else {
        const targetLokal = hostLokal(parsedUrl.hostname);
        if (rewriteLocalhost && targetLokal) {
          return '';
        }
      }
    } catch {
      return baseUrl;
    }

    return baseUrl;
  }

  if (runtimeWindow?.location?.origin) {
    return runtimeWindow.location.origin;
  }

  return 'http://localhost:3000';
}

export function simpanReturnTo(path = '') {
  if (typeof window === 'undefined') return;
  const currentPath = path || `${window.location.pathname}${window.location.search}`;
  if (currentPath && currentPath !== '/auth/callback') {
    localStorage.setItem(returnToKey, currentPath);
  }
}

export function ambilReturnTo() {
  if (typeof window === 'undefined') return '/';
  const returnTo = localStorage.getItem(returnToKey) || '/';
  localStorage.removeItem(returnToKey);
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/';
  }
  return returnTo;
}

export function buatUrlLoginGoogle(frontendOrigin = '', options = {}) {
  const apiBaseUrl = ambilApiBaseUrl(options);
  const loginUrl = apiBaseUrl
    ? new URL('/auth/google', apiBaseUrl)
    : new URL('/auth/google', 'http://localhost');
  if (frontendOrigin) {
    loginUrl.searchParams.set('frontend_origin', frontendOrigin);
  }

  if (!apiBaseUrl) {
    const search = loginUrl.searchParams.toString();
    return search ? `/auth/google?${search}` : '/auth/google';
  }

  return loginUrl.toString();
}

export function mulaiLoginGoogle(path = '') {
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

export const __private = {
  hostLokal,
  ambilApiBaseUrl,
};
