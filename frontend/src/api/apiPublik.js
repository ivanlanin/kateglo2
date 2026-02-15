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

export async function ambilKategoriKamus() {
  const response = await klien.get('/api/public/kamus/kategori');
  return response.data;
}

export async function ambilLemaPerKategori(kategori, kode, { limit = 20, offset = 0 } = {}) {
  const response = await klien.get(`/api/public/kamus/kategori/${encodeURIComponent(kategori)}/${encodeURIComponent(kode)}`, {
    params: { limit, offset },
  });
  return response.data;
}

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

// === AUTOCOMPLETE (shared) ===

export async function autocomplete(kategori, kata) {
  if (!kata || kata.length < 2) return [];
  const url = kategori === 'glosarium'
    ? `/api/public/glosarium/autocomplete?q=${encodeURIComponent(kata)}`
    : `/api/public/${kategori}/autocomplete/${encodeURIComponent(kata)}`;
  const response = await klien.get(url);
  return response.data.data.map((item) =>
    typeof item === 'string' ? { value: item } : item
  );
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
