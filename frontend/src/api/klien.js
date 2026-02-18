/**
 * @fileoverview Klien HTTP untuk API Kateglo
 */

import axios from 'axios';

const frontendSharedKey = import.meta.env.VITE_FRONTEND_SHARED_KEY;
const apiBaseUrlFromEnv = (import.meta.env.VITE_API_URL || '').trim();

const storageKey = 'kateglo-auth-token';

function hostLokal(hostname = '') {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function resolveApiBaseUrl() {
  if (!apiBaseUrlFromEnv) return undefined;

  let parsedUrl;
  try {
    parsedUrl = new URL(apiBaseUrlFromEnv);
  } catch {
    return apiBaseUrlFromEnv;
  }

  if (typeof window !== 'undefined') {
    const targetLokal = hostLokal(parsedUrl.hostname);
    const currentLokal = hostLokal(window.location.hostname);

    if (!import.meta.env.DEV && targetLokal && !currentLokal) {
      return window.location.origin;
    }
  }

  return apiBaseUrlFromEnv;
}

const klien = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

klien.interceptors.request.use((config) => {
  if (frontendSharedKey) {
    config.headers['X-Frontend-Key'] = frontendSharedKey;
  }
  /* c8 ignore next */
  const token = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default klien;
