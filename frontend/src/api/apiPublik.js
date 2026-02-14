/**
 * @fileoverview Fungsi-fungsi API publik Kateglo
 */

import klien from './klien';

// === BERANDA ===

export async function ambilDataBeranda() {
  const response = await klien.get('/api/public/beranda');
  return response.data;
}

// === KAMUS ===

export async function cariKamus(kata) {
  const response = await klien.get(`/api/public/kamus/cari/${encodeURIComponent(kata)}`);
  return response.data;
}

export async function ambilDetailKamus(entri) {
  const response = await klien.get(`/api/public/kamus/detail/${encodeURIComponent(entri)}`);
  return response.data;
}

// === TESAURUS ===

export async function cariTesaurus(kata) {
  const response = await klien.get(`/api/public/tesaurus/cari/${encodeURIComponent(kata)}`);
  return response.data;
}

export async function ambilDetailTesaurus(kata) {
  const response = await klien.get(`/api/public/tesaurus/${encodeURIComponent(kata)}`);
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
