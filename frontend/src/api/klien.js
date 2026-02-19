/**
 * @fileoverview Klien HTTP untuk API Kateglo
 */

import axios from 'axios';

const frontendSharedKey = import.meta.env.VITE_FRONTEND_SHARED_KEY;
const apiBaseUrlFromEnv = [import.meta.env.VITE_API_URL].join('').trim();

const storageKey = 'kateglo-auth-token';

function hostLokal(hostname = '') {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function resolveApiBaseUrl(options = {}) {
  const baseUrl = options.apiBaseUrl ?? apiBaseUrlFromEnv;
  const runtimeWindow = options.runtimeWindow ?? (typeof window !== 'undefined' ? window : undefined);
  const rewriteLocalhost = options.rewriteLocalhost ?? !import.meta.env.DEV;

  if (!baseUrl) return undefined;

  let parsedUrl;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    return baseUrl;
  }

  if (runtimeWindow) {
    const targetLokal = hostLokal(parsedUrl.hostname);
    const currentLokal = hostLokal(runtimeWindow.location.hostname);

    if (rewriteLocalhost && targetLokal && !currentLokal) {
      return runtimeWindow.location.origin;
    }
  }

  return baseUrl;
}

const klien = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

klien.interceptors.request.use((config) => {
  if (frontendSharedKey) {
    config.headers['X-Frontend-Key'] = frontendSharedKey;
  }
  const token = globalThis?.localStorage?.getItem(storageKey) || '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const __private = {
  hostLokal,
  resolveApiBaseUrl,
};

export default klien;
