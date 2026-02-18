/**
 * @fileoverview Fungsi-fungsi API publik Kateglo
 */

import klien from './klien';

function normalisasiItemAutocomplete(item) {
  if (typeof item === 'string') {
    const value = item.trim();
    return value ? { value } : null;
  }

  if (!item || typeof item !== 'object') return null;

  const kandidatValue = [item.value, item.entri, item.lema, item.indonesia, item.term]
    .find((nilai) => typeof nilai === 'string' && nilai.trim());

  if (!kandidatValue) return null;

  const kandidatAsing = [item.asing, item.foreign, item.original]
    .find((nilai) => typeof nilai === 'string' && nilai.trim());

  return {
    value: kandidatValue.trim(),
    ...(kandidatAsing ? { asing: kandidatAsing.trim() } : {}),
  };
}

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

export async function ambilKomentarKamus(indeks) {
  const response = await klien.get(`/api/publik/kamus/komentar/${encodeURIComponent(indeks)}`);
  return response.data;
}

export async function simpanKomentarKamus(indeks, komentar) {
  const response = await klien.post(`/api/publik/kamus/komentar/${encodeURIComponent(indeks)}`, {
    komentar,
  });
  return response.data;
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
  const trimmedKata = (kata || '').trim();
  if (trimmedKata.length < 1) return [];
  const url = `/api/publik/${kategori}/autocomplete/${encodeURIComponent(trimmedKata)}`;
  const response = await klien.get(url, {
    params: { _ac: Date.now() },
  });
  const daftar = Array.isArray(response?.data?.data) ? response.data.data : [];
  return daftar
    .map(normalisasiItemAutocomplete)
    .filter(Boolean);
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
