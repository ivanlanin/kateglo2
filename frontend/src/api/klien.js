/**
 * @fileoverview Klien HTTP untuk API Kateglo
 */

import axios from 'axios';

const frontendSharedKey = import.meta.env.VITE_FRONTEND_SHARED_KEY;

const klien = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15000,
  headers: frontendSharedKey ? { 'X-Frontend-Key': frontendSharedKey } : undefined,
});

export default klien;
