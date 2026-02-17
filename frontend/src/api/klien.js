/**
 * @fileoverview Klien HTTP untuk API Kateglo
 */

import axios from 'axios';

const frontendSharedKey = import.meta.env.VITE_FRONTEND_SHARED_KEY;

const storageKey = 'kateglo-auth-token';

const klien = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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
