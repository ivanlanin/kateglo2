/**
 * @fileoverview Fungsi autentikasi frontend publik
 */

import klien from './klien';

/* c8 ignore next */
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const returnToKey = 'kateglo-auth-return-to';

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

export function buatUrlLoginGoogle(frontendOrigin = '') {
  const loginUrl = new URL(`${apiBaseUrl}/auth/google`);
  if (frontendOrigin) {
    loginUrl.searchParams.set('frontend_origin', frontendOrigin);
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
