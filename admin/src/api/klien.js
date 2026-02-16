/**
 * @fileoverview Klien HTTP untuk Admin API Kateglo
 */

import axios from 'axios';

const storageKey = 'kateglo-admin-token';
const frontendSharedKey = import.meta.env.VITE_FRONTEND_SHARED_KEY;

const klien = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

klien.interceptors.request.use((config) => {
  if (frontendSharedKey) {
    config.headers['X-Frontend-Key'] = frontendSharedKey;
  }
  const token = localStorage.getItem(storageKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

klien.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(storageKey);
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default klien;
