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
    const paging = glosariumPaging && typeof glosariumPaging === 'object' ? glosariumPaging : null;
    const sumberPelacakan = String(paging?.sumberPelacakan || '').trim().toLowerCase();
    const params = {
      ...(paging ? {
        limit: Math.min(Math.max(Number(paging.glosariumLimit) || 20, 1), 100),
        ...(paging.glosariumCursor ? { cursor: paging.glosariumCursor } : {}),
        ...(paging.glosariumDirection === 'prev' ? { direction: 'prev' } : {}),
      } : {}),
      ...(sumberPelacakan === 'susun-kata' ? { sumber: 'susun-kata' } : {}),
    };

    const response = await klien.get(url, { params });
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

export async function ambilEntriAcakKamus() {
  const response = await klien.get('/api/publik/kamus/acak');
  return response.data;
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

function formatTanggalLokalBrowser(value = new Date()) {
  const tahun = value.getFullYear();
  const bulan = String(value.getMonth() + 1).padStart(2, '0');
  const tanggal = String(value.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${tanggal}`;
}

export async function ambilPencarianPopuler({ tanggal = null } = {}) {
  const tanggalAman = /^\d{4}-\d{2}-\d{2}$/.test(String(tanggal || '').trim())
    ? String(tanggal).trim()
    : formatTanggalLokalBrowser();

  const response = await klien.get('/api/publik/pencarian/populer', {
    params: { tanggal: tanggalAman },
  });
  return response.data;
}

export async function ambilKataHariIni({ tanggal = null } = {}) {
  const tanggalRaw = String(tanggal || '').trim();
  const params = /^\d{4}-\d{2}-\d{2}$/.test(tanggalRaw)
    ? { tanggal: tanggalRaw }
    : {};

  const response = await klien.get('/api/publik/kamus/kata-hari-ini', {
    params,
  });
  return response.data;
}

// === GIM: KUIS KATA ===

export async function ambilRondeKuisKata({ riwayat = [] } = {}) {
  const response = await klien.get('/api/publik/gim/kuis-kata/ronde', {
    params: riwayat.length > 0 ? { riwayat: JSON.stringify(riwayat) } : {},
  });
  return response.data;
}

export async function ambilStatusKuisKata() {
  const response = await klien.get('/api/publik/gim/kuis-kata/status');
  return response.data;
}

export async function submitRekapKuisKata({
  jumlahBenar = 0,
  jumlahPertanyaan = 5,
  durasiDetik = 0,
} = {}) {
  const response = await klien.post('/api/publik/gim/kuis-kata/submit', {
    jumlahBenar: Math.min(Math.max(Number(jumlahBenar) || 0, 0), 100),
    jumlahPertanyaan: Math.min(Math.max(Number(jumlahPertanyaan) || 0, 0), 100),
    durasiDetik: Math.min(Math.max(Number(durasiDetik) || 0, 0), 86400),
  });
  return response.data;
}

export async function ambilKlasemenKuisKata({ limit = 10 } = {}) {
  const response = await klien.get('/api/publik/gim/kuis-kata/klasemen', {
    params: {
      limit: Math.min(Math.max(Number(limit) || 10, 1), 50),
    },
  });
  return response.data;
}

// === GIM: SUSUN KATA ===

export async function ambilPuzzleSusunKata({ panjang = 5 } = {}) {
  const response = await klien.get('/api/publik/gim/susun-kata/harian', {
    params: {
      panjang: Math.min(Math.max(Number(panjang) || 5, 4), 8),
    },
  });
  return response.data;
}

function normalisasiPanjangSusunKata(value, { min = 4, max = 8, fallback = 5 } = {}) {
  return Math.min(Math.max(Number(value) || fallback, min), max);
}

async function ambilModeSusunKata(mode, { panjang, min = 4, max = 8 } = {}) {
  const params = {};
  if (panjang !== null && panjang !== undefined && String(panjang).trim() !== '') {
    params.panjang = normalisasiPanjangSusunKata(panjang, { min, max, fallback: 5 });
  }

  const response = await klien.get(`/api/publik/gim/susun-kata/${mode}`, {
    params,
  });
  return response.data;
}

export async function ambilHarianSusunKata({ panjang = 5 } = {}) {
  return ambilModeSusunKata('harian', { panjang, min: 4, max: 8 });
}

export async function ambilBebasSusunKata({ panjang = null } = {}) {
  return ambilModeSusunKata('bebas', { panjang, min: 4, max: 6 });
}

export async function submitSkorSusunKata({
  panjang = 5,
  percobaan = 6,
  detik = 0,
  menang = false,
  tebakan = '',
} = {}) {
  const response = await klien.post('/api/publik/gim/susun-kata/harian/submit', {
    panjang: Math.min(Math.max(Number(panjang) || 5, 4), 8),
    percobaan: Math.min(Math.max(Number(percobaan) || 6, 1), 6),
    detik: Math.min(Math.max(Number(detik) || 0, 0), 86400),
    menang: Boolean(menang),
    tebakan: String(tebakan || '').trim().toLowerCase(),
  });
  return response.data;
}

export async function simpanProgresSusunKata({
  panjang = 5,
  tebakan = '',
} = {}) {
  const response = await klien.post('/api/publik/gim/susun-kata/harian/progres', {
    panjang: Math.min(Math.max(Number(panjang) || 5, 4), 8),
    tebakan: String(tebakan || '').trim().toLowerCase(),
  });
  return response.data;
}

export async function submitSkorSusunKataBebas({
  tanggal = null,
  panjang = 5,
  kata = '',
  percobaan = 6,
  detik = 0,
  menang = false,
  tebakan = '',
} = {}) {
  const response = await klien.post('/api/publik/gim/susun-kata/bebas/submit', {
    tanggal,
    panjang: normalisasiPanjangSusunKata(panjang, { min: 4, max: 6, fallback: 5 }),
    kata: String(kata || '').trim().toLowerCase(),
    percobaan: Math.min(Math.max(Number(percobaan) || 6, 1), 6),
    detik: Math.min(Math.max(Number(detik) || 0, 0), 86400),
    menang: Boolean(menang),
    tebakan: String(tebakan || '').trim().toLowerCase(),
  });
  return response.data;
}

export async function ambilKlasemenSusunKata({ panjang = 5, limit = 10 } = {}) {
  const response = await klien.get('/api/publik/gim/susun-kata/harian/klasemen', {
    params: {
      panjang: Math.min(Math.max(Number(panjang) || 5, 4), 8),
      limit: Math.min(Math.max(Number(limit) || 10, 1), 50),
    },
  });
  return response.data;
}

export async function ambilKlasemenSusunKataBebas({ limit = 10 } = {}) {
  const response = await klien.get('/api/publik/gim/susun-kata/bebas/klasemen', {
    params: {
      limit: Math.min(Math.max(Number(limit) || 10, 1), 50),
    },
  });
  return response.data;
}

// === ALAT: KORPUS LEIPZIG ===

function buildLeipzigParams({ limit, offset } = {}) {
  return {
    ...(limit != null ? { limit: Math.min(Math.max(Number(limit) || 0, 1), 100) } : {}),
    ...(offset != null ? { offset: Math.max(Number(offset) || 0, 0) } : {}),
  };
}

function buildLeipzigRequestConfig({ limit, offset } = {}) {
  const params = buildLeipzigParams({ limit, offset });

  return {
    timeout: 60000,
    ...(Object.keys(params).length ? { params } : {}),
  };
}

export async function ambilDaftarKorpusLeipzig() {
  const response = await klien.get('/api/publik/leipzig/korpus', buildLeipzigRequestConfig());
  return response.data;
}

export async function ambilInfoKataLeipzig(korpusId, kata) {
  const response = await klien.get(
    `/api/publik/leipzig/korpus/${encodeURIComponent(korpusId)}/kata/${encodeURIComponent(kata)}`,
    buildLeipzigRequestConfig()
  );
  return response.data;
}

export async function ambilPeringkatKataLeipzig(korpusId, { limit = 25, offset = 0 } = {}) {
  const response = await klien.get(
    `/api/publik/leipzig/korpus/${encodeURIComponent(korpusId)}/peringkat`,
    buildLeipzigRequestConfig({ limit, offset })
  );
  return response.data;
}

export async function ambilContohKataLeipzig(korpusId, kata, { limit = 8, offset = 0 } = {}) {
  const response = await klien.get(
    `/api/publik/leipzig/korpus/${encodeURIComponent(korpusId)}/kata/${encodeURIComponent(kata)}/contoh`,
    buildLeipzigRequestConfig({ limit, offset })
  );
  return response.data;
}

export async function ambilKookurensiSekalimatLeipzig(korpusId, kata, { limit = 10, offset = 0 } = {}) {
  const response = await klien.get(
    `/api/publik/leipzig/korpus/${encodeURIComponent(korpusId)}/kata/${encodeURIComponent(kata)}/kookurensi-sekalimat`,
    buildLeipzigRequestConfig({ limit, offset })
  );
  return response.data;
}

export async function ambilKookurensiTetanggaLeipzig(korpusId, kata, { limit = 8 } = {}) {
  const response = await klien.get(
    `/api/publik/leipzig/korpus/${encodeURIComponent(korpusId)}/kata/${encodeURIComponent(kata)}/kookurensi-tetangga`,
    buildLeipzigRequestConfig({ limit })
  );
  return response.data;
}

export async function ambilGrafKataLeipzig(korpusId, kata, { limit = 10 } = {}) {
  const response = await klien.get(
    `/api/publik/leipzig/korpus/${encodeURIComponent(korpusId)}/kata/${encodeURIComponent(kata)}/graf`,
    buildLeipzigRequestConfig({ limit })
  );
  return response.data;
}

export async function ambilMiripKonteksLeipzig(korpusId, kata, {
  limit = 12,
  minimumKonteksSama = null,
} = {}) {
  const response = await klien.get(
    `/api/publik/leipzig/korpus/${encodeURIComponent(korpusId)}/kata/${encodeURIComponent(kata)}/mirip-konteks`,
    {
      ...buildLeipzigRequestConfig({ limit }),
      params: {
        ...buildLeipzigParams({ limit }),
        ...(minimumKonteksSama != null ? { minimumKonteksSama: Math.min(Math.max(Number(minimumKonteksSama) || 0, 1), 20) } : {}),
      },
    }
  );
  return response.data;
}

export async function validasiKataSusunKata(kata, { panjang = 5 } = {}) {
  const kataAman = String(kata || '').trim().toLowerCase();
  const response = await klien.get(`/api/publik/gim/susun-kata/validasi/${encodeURIComponent(kataAman)}`, {
    params: {
      panjang: Math.min(Math.max(Number(panjang) || 5, 4), 8),
    },
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

export async function ambilDetailGlosarium(asing, { mengandungCursor, miripCursor, limit } = {}) {
  const params = {};
  if (limit) params.limit = limit;
  if (mengandungCursor) params.mengandungCursor = mengandungCursor;
  if (miripCursor) params.miripCursor = miripCursor;
  const response = await klien.get(`/api/publik/glosarium/detail/${encodeURIComponent(asing)}`, { params });
  return response.data;
}

export async function ambilDaftarSumber() {
  const response = await klien.get('/api/publik/glosarium/sumber');
  return response.data;
}

// === TAGAR ===

export async function ambilSemuaTagar() {
  const response = await klien.get('/api/publik/tagar');
  return response.data;
}

export async function cariEntriPerTagar(kode, {
  limit = 100,
  cursor = null,
  direction = 'next',
  lastPage = false,
} = {}) {
  const response = await klien.get(`/api/publik/tagar/${encodeURIComponent(kode)}`, {
    params: buildCursorParams({ limit, cursor, direction, lastPage }),
  });
  return response.data;
}
