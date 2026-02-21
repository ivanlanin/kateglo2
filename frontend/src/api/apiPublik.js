/**
 * @fileoverview Fungsi-fungsi API publik Kateglo
 */

import klien from './klien';

function buildCursorParams({ limit = 100, cursor = null, direction = 'next', lastPage = false } = {}) {
  return {
    limit,
    ...(cursor ? { cursor } : {}),
    ...(direction && direction !== 'next' ? { direction } : {}),
    ...(lastPage ? { lastPage: 1 } : {}),
  };
}

function normalisasiItemAutocomplete(item) {
  if (typeof item === 'string') {
    const value = item.trim();
    return value ? { value } : null;
  }

  if (!item || typeof item !== 'object') return null;

  const kandidatValue = [item.value, item.entri, item.lema, item.indeks, item.indonesia, item.term]
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

export async function ambilEntriPerKategori(kategori, kode, {
  limit = 20,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/kamus/kategori/${encodeURIComponent(kategori)}/${encodeURIComponent(kode)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
  });
  return response.data;
}

export async function cariKamus(kata, {
  limit = 100,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/kamus/cari/${encodeURIComponent(kata)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
  });
  return response.data;
}

export async function ambilDetailKamus(indeks, glosariumPaging = null) {
  try {
    const url = `/api/publik/kamus/detail/${encodeURIComponent(indeks)}`;
    const params = glosariumPaging && typeof glosariumPaging === 'object'
      ? {
        limit: Math.min(Math.max(Number(glosariumPaging.glosariumLimit) || 20, 1), 100),
        ...(glosariumPaging.glosariumCursor ? { cursor: glosariumPaging.glosariumCursor } : {}),
        ...(glosariumPaging.glosariumDirection === 'prev' ? { direction: 'prev' } : {}),
      }
      : null;

    const response = params
      ? await klien.get(url, { params })
      : await klien.get(url);
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

export async function cariTesaurus(kata, {
  limit = 100,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/tesaurus/cari/${encodeURIComponent(kata)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
  });
  return response.data;
}

export async function ambilContohTesaurus() {
  const response = await klien.get('/api/publik/tesaurus/contoh');
  return response.data;
}

// === MAKNA (kamus terbalik) ===

export async function ambilContohMakna() {
  const response = await klien.get('/api/publik/makna/contoh');
  return response.data;
}

export async function cariMakna(kata, {
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/makna/cari/${encodeURIComponent(kata)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
  });
  return response.data;
}

// === RIMA ===

export async function cariRima(kata, {
  limit = 50,
  cursorAkhir = null,
  directionAkhir = 'next',
  cursorAwal = null,
  directionAwal = 'next',
} = {}) {
  const response = await klien.get(`/api/publik/rima/cari/${encodeURIComponent(kata)}`, {
    params: {
      limit,
      ...(cursorAkhir ? { cursor_akhir: cursorAkhir } : {}),
      ...(directionAkhir !== 'next' ? { dir_akhir: directionAkhir } : {}),
      ...(cursorAwal ? { cursor_awal: cursorAwal } : {}),
      ...(directionAwal !== 'next' ? { dir_awal: directionAwal } : {}),
    },
  });
  return response.data;
}

export async function ambilContohRima() {
  const response = await klien.get('/api/publik/rima/contoh');
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

export async function cariGlosarium(kata, {
  limit = 100,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/glosarium/cari/${encodeURIComponent(kata)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
  });
  return response.data;
}

export async function ambilGlosariumPerBidang(bidang, {
  limit = 100,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/glosarium/bidang/${encodeURIComponent(bidang)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
  });
  return response.data;
}

export async function ambilGlosariumPerSumber(sumber, {
  limit = 100,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/glosarium/sumber/${encodeURIComponent(sumber)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
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
