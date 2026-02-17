/**
 * @fileoverview Fungsi-fungsi API publik Kateglo
 */

import klien from './klien';

// === KAMUS ===

export async function ambilKategoriKamus() {
  const response = await klien.get('/api/publik/kamus/kategori');
  return response.data;
}

export async function ambilEntriPerKategori(kategori, kode, { limit = 20, offset = 0 } = {}) {
  const response = await klien.get(`/api/publik/kamus/kategori/${encodeURIComponent(kategori)}/${encodeURIComponent(kode)}`, {
    params: { limit, offset },
  });
  return response.data;
}

export async function cariKamus(kata, { limit = 100, offset = 0 } = {}) {
  const response = await klien.get(`/api/publik/kamus/cari/${encodeURIComponent(kata)}`, {
    params: { limit, offset },
  });
  return response.data;
}

export async function ambilDetailKamus(indeks) {
  try {
    const response = await klien.get(`/api/publik/kamus/detail/${encodeURIComponent(indeks)}`);
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const saran = err.response.data?.saran || [];
      const error = new Error('Entri tidak ditemukan');
      error.saran = saran;
      throw error;
    }
    throw err;
  }
}

// === TESAURUS ===

export async function cariTesaurus(kata, { limit = 100, offset = 0 } = {}) {
  const response = await klien.get(`/api/publik/tesaurus/cari/${encodeURIComponent(kata)}`, {
    params: { limit, offset },
  });
  return response.data;
}

// === AUTOCOMPLETE (shared) ===

export async function autocomplete(kategori, kata) {
  if (!kata || kata.length < 2) return [];
  const url = `/api/publik/${kategori}/autocomplete/${encodeURIComponent(kata)}`;
  const response = await klien.get(url);
  return response.data.data.map((item) =>
    typeof item === 'string' ? { value: item } : item
  );
}

// === GLOSARIUM ===

export async function cariGlosarium(kata, { limit = 100, offset = 0 } = {}) {
  const response = await klien.get(`/api/publik/glosarium/cari/${encodeURIComponent(kata)}`, {
    params: { limit, offset },
  });
  return response.data;
}

export async function ambilGlosariumPerBidang(bidang, { limit = 100, offset = 0 } = {}) {
  const response = await klien.get(`/api/publik/glosarium/bidang/${encodeURIComponent(bidang)}`, {
    params: { limit, offset },
  });
  return response.data;
}

export async function ambilGlosariumPerSumber(sumber, { limit = 100, offset = 0 } = {}) {
  const response = await klien.get(`/api/publik/glosarium/sumber/${encodeURIComponent(sumber)}`, {
    params: { limit, offset },
  });
  return response.data;
}

export async function ambilDaftarBidang() {
  const response = await klien.get('/api/publik/glosarium/bidang');
  return response.data;
}

export async function ambilDaftarSumber() {
  const response = await klien.get('/api/publik/glosarium/sumber');
  return response.data;
}
