/**
 * @fileoverview Fungsi-fungsi API publik Kateglo
 */

import klien from './klien';

// === BERANDA ===

export async function ambilDataBeranda() {
  const response = await klien.get('/api/public/beranda');
  return response.data;
}

// === KAMUS (PENCARIAN & DETAIL) ===

export async function cariKamus(query, limit = 20) {
  const response = await klien.get('/api/public/pencarian', {
    params: { q: query, limit },
  });
  return response.data;
}

export async function ambilDetailKamus(slug) {
  const response = await klien.get(`/api/public/kamus/${encodeURIComponent(slug)}`);
  return response.data;
}

// === GLOSARIUM ===

export async function cariGlosarium({ q = '', bidang = '', sumber = '', bahasa = '', limit = 20, offset = 0 } = {}) {
  const response = await klien.get('/api/public/glosarium', {
    params: { q, bidang, sumber, bahasa, limit, offset },
  });
  return response.data;
}

export async function ambilDaftarBidang() {
  const response = await klien.get('/api/public/glosarium/bidang');
  return response.data;
}

export async function ambilDaftarSumber() {
  const response = await klien.get('/api/public/glosarium/sumber');
  return response.data;
}

// === PERIBAHASA ===

export async function cariPeribahasa({ q = '', limit = 20, offset = 0 } = {}) {
  const response = await klien.get('/api/public/peribahasa', {
    params: { q, limit, offset },
  });
  return response.data;
}

// === SINGKATAN ===

export async function cariSingkatan({ q = '', kependekan = '', tag = '', limit = 20, offset = 0 } = {}) {
  const response = await klien.get('/api/public/singkatan', {
    params: { q, kependekan, tag, limit, offset },
  });
  return response.data;
}
