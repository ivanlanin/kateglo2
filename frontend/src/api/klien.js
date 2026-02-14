/**
 * @fileoverview Klien HTTP untuk API Kateglo
 */

import axios from 'axios';

const klien = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15000,
});

export default klien;
