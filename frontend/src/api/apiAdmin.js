/**
 * @fileoverview API hooks untuk panel admin (statistik, kamus, tesaurus, glosarium, pengguna)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import klien from './klien';

function buildDaftarParams({
  limit,
  cursor,
  direction,
  lastPage,
  q,
  aktif,
  includeAktif = true,
  ...extraParams
} = {}) {
  const params = {
    limit,
    cursor: cursor || undefined,
    direction,
    lastPage: lastPage ? '1' : undefined,
    q: q || undefined,
  };

  if (includeAktif) {
    params.aktif = aktif || undefined;
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    params[key] = value;
  });

  return params;
}

function invalidateQueryKeys(queryClient, keys = []) {
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}

function useDaftarAdmin(path, queryKeyPrefix, {
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
  includeAktif = true,
  ...extraParams
} = {}) {
  const params = buildDaftarParams({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
    includeAktif,
    ...extraParams,
  });

  return useQuery({
    queryKey: [queryKeyPrefix, { limit, cursor, direction, lastPage, q, aktif, ...extraParams }],
    queryFn: () =>
      klien
        .get(path, { params })
        .then((r) => r.data),
  });
}

function useSimpanAdmin({ path, queryKeyPrefix }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data.id) return klien.put(`${path}/${data.id}`, data).then((r) => r.data);
      return klien.post(path, data).then((r) => r.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeyPrefix, `${queryKeyPrefix}-detail`]);
    },
  });
}

function useHapusAdmin({ path, queryKeyPrefix }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`${path}/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeyPrefix, `${queryKeyPrefix}-detail`]);
    },
  });
}

// ─── Statistik ───────────────────────────────────────────────────────────────

export function useStatistikAdmin() {
  return useQuery({
    queryKey: ['admin-statistik'],
    queryFn: () => klien.get('/api/redaksi/statistik').then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useStatistikPencarianAdmin({
  domain = '',
  periode = '7hari',
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  tanggalMulai = '',
  tanggalSelesai = '',
} = {}) {
  return useQuery({
    queryKey: ['admin-statistik-pencarian', {
      domain,
      periode,
      limit,
      cursor,
      direction,
      lastPage,
      tanggalMulai,
      tanggalSelesai,
    }],
    queryFn: () =>
      klien.get('/api/redaksi/statistik/pencarian', {
        params: {
          domain: domain || undefined,
          periode: periode || undefined,
          limit,
          cursor: cursor || undefined,
          direction,
          lastPage: lastPage ? '1' : undefined,
          tanggal_mulai: tanggalMulai || undefined,
          tanggal_selesai: tanggalSelesai || undefined,
        },
      }).then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function useDaftarPencarianHitamAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/pencarianHitam', 'admin-pencarian-hitam', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailPencarianHitamAdmin(id) {
  return useQuery({
    queryKey: ['admin-pencarian-hitam-detail', id],
    queryFn: () => klien.get(`/api/redaksi/pencarianHitam/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useSimpanPencarianHitamAdmin() {
  return useSimpanAdmin({
    path: '/api/redaksi/pencarianHitam',
    queryKeyPrefix: 'admin-pencarian-hitam',
  });
}

export function useHapusPencarianHitamAdmin() {
  return useHapusAdmin({
    path: '/api/redaksi/pencarianHitam',
    queryKeyPrefix: 'admin-pencarian-hitam',
  });
}

// ─── Kamus ───────────────────────────────────────────────────────────────────

export function useDaftarKamusAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
  jenis = '',
  jenisRujuk = '',
  punyaHomograf = '',
  punyaHomonim = '',
  punyaLafal = '',
  punyaPemenggalan = '',
  kelasKata = '',
  ragam = '',
  ragamVarian = '',
  bidang = '',
  bahasa = '',
  punyaIlmiah = '',
  punyaKimia = '',
  penyingkatan = '',
  punyaKiasan = '',
  punyaContoh = '',
} = {}) {
  const params = buildDaftarParams({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
    includeAktif: true,
  });

  if (jenis) params.jenis = jenis;
  if (jenisRujuk) params.jenis_rujuk = jenisRujuk;
  if (punyaHomograf) params.punya_homograf = punyaHomograf;
  if (punyaHomonim) params.punya_homonim = punyaHomonim;
  if (punyaLafal) params.punya_lafal = punyaLafal;
  if (punyaPemenggalan) params.punya_pemenggalan = punyaPemenggalan;
  if (kelasKata) params.kelas_kata = kelasKata;
  if (ragam) params.ragam = ragam;
  if (ragamVarian) params.ragam_varian = ragamVarian;
  if (bidang) params.bidang = bidang;
  if (bahasa) params.bahasa = bahasa;
  if (punyaIlmiah) params.punya_ilmiah = punyaIlmiah;
  if (punyaKimia) params.punya_kimia = punyaKimia;
  if (penyingkatan) params.penyingkatan = penyingkatan;
  if (punyaKiasan) params.punya_kiasan = punyaKiasan;
  if (punyaContoh) params.punya_contoh = punyaContoh;

  return useQuery({
    queryKey: ['admin-kamus', {
      limit,
      cursor,
      direction,
      lastPage,
      q,
      aktif,
      jenis,
      jenisRujuk,
      punyaHomograf,
      punyaHomonim,
      punyaLafal,
      punyaPemenggalan,
      kelasKata,
      ragam,
      ragamVarian,
      bidang,
      bahasa,
      punyaIlmiah,
      punyaKimia,
      penyingkatan,
      punyaKiasan,
      punyaContoh,
    }],
    queryFn: () =>
      klien
        .get('/api/redaksi/kamus', { params })
        .then((r) => r.data),
  });
}

export function useDetailKamusAdmin(id) {
  return useQuery({
    queryKey: ['admin-kamus-detail', id],
    queryFn: () => klien.get(`/api/redaksi/kamus/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useAutocompleteIndukKamus({ q = '', limit = 8, excludeId = null } = {}) {
  const query = String(q || '').trim();
  return useQuery({
    queryKey: ['admin-kamus-induk-autocomplete', { q: query, limit, excludeId }],
    queryFn: () =>
      klien
        .get('/api/redaksi/kamus/opsi-induk', {
          params: {
            q: query || undefined,
            limit,
            exclude_id: excludeId || undefined,
          },
        })
        .then((r) => r.data),
    enabled: query.length >= 1,
  });
}

export function useDaftarKomentarAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/komentar', 'admin-komentar', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailKomentarAdmin(id) {
  return useQuery({
    queryKey: ['admin-komentar-detail', id],
    queryFn: () => klien.get(`/api/redaksi/komentar/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

// ─── Audit Makna ─────────────────────────────────────────────────────────────

export function useDaftarAuditMaknaAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  status = '',
} = {}) {
  const params = buildDaftarParams({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    includeAktif: false,
  });

  if (status) params.status = status;

  return useQuery({
    queryKey: ['admin-audit-makna', { limit, cursor, direction, lastPage, q, status }],
    queryFn: () =>
      klien
        .get('/api/redaksi/audit-makna', { params })
        .then((r) => r.data),
  });
}

// ─── Tesaurus ────────────────────────────────────────────────────────────────

export function useDaftarTesaurusAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/tesaurus', 'admin-tesaurus', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailTesaurusAdmin(id) {
  return useQuery({
    queryKey: ['admin-tesaurus-detail', id],
    queryFn: () => klien.get(`/api/redaksi/tesaurus/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

// ─── Etimologi ───────────────────────────────────────────────────────────────

export function useDaftarEtimologiAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  bahasa = '',
  aktif = '',
  meragukan = '',
} = {}) {
  const params = buildDaftarParams({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
    includeAktif: true,
  });

  if (bahasa) params.bahasa = bahasa;
  if (meragukan === '1' || meragukan === '0') params.meragukan = meragukan;

  return useQuery({
    queryKey: ['admin-etimologi', { limit, cursor, direction, lastPage, q, bahasa, aktif, meragukan }],
    queryFn: () =>
      klien
        .get('/api/redaksi/etimologi', { params })
        .then((r) => r.data),
  });
}

export function useDetailEtimologiAdmin(id) {
  return useQuery({
    queryKey: ['admin-etimologi-detail', id],
    queryFn: () => klien.get(`/api/redaksi/etimologi/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useAutocompleteEntriEtimologi({ q = '', limit = 8 } = {}) {
  const query = String(q || '').trim();
  return useQuery({
    queryKey: ['admin-etimologi-entri-autocomplete', { q: query, limit }],
    queryFn: () =>
      klien
        .get('/api/redaksi/etimologi/opsi-entri', {
          params: {
            q: query || undefined,
            limit,
          },
        })
        .then((r) => r.data),
    enabled: query.length >= 1,
  });
}

// ─── Glosarium ───────────────────────────────────────────────────────────────

export function useDaftarGlosariumAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  bidangId = '',
  sumberId = '',
  aktif = '',
} = {}) {
  const params = buildDaftarParams({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });

  if (bidangId) params.bidang_id = bidangId;
  if (sumberId) params.sumber_id = sumberId;

  return useQuery({
    queryKey: ['admin-glosarium', {
      limit,
      cursor,
      direction,
      lastPage,
      q,
      bidangId,
      sumberId,
      aktif,
    }],
    queryFn: () =>
      klien
        .get('/api/redaksi/glosarium', { params })
        .then((r) => r.data),
  });
}

export function useDetailGlosariumAdmin(id) {
  return useQuery({
    queryKey: ['admin-glosarium-detail', id],
    queryFn: () => klien.get(`/api/redaksi/glosarium/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useDaftarBidangAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/bidang', 'admin-bidang', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailBidangAdmin(id) {
  return useQuery({
    queryKey: ['admin-bidang-detail', id],
    queryFn: () => klien.get(`/api/redaksi/bidang/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useSusunKataHarianAdmin({ tanggal = '', panjang = 5 } = {}) {
  const panjangAman = 5;

  return useQuery({
    queryKey: ['admin-susun-kata-harian', { tanggal, panjang }],
    queryFn: () =>
      klien
        .get('/api/redaksi/susun-kata/harian', {
          params: {
            tanggal: tanggal || undefined,
            panjang: panjangAman,
          },
        })
        .then((r) => r.data),
  });
}

export function useDetailSusunKataHarianAdmin({ tanggal = '', panjang = '' } = {}) {
  const panjangRaw = String(panjang ?? '').trim();
  const tanggalRaw = String(tanggal ?? '').trim();
  const panjangAman = panjangRaw ? 5 : undefined;

  return useQuery({
    queryKey: ['admin-susun-kata-harian-detail', { tanggal: tanggalRaw, panjang: panjangRaw }],
    queryFn: () =>
      klien
        .get('/api/redaksi/susun-kata/harian/detail', {
          params: {
            tanggal: tanggalRaw,
            panjang: panjangAman,
          },
        })
        .then((r) => r.data),
    enabled: Boolean(tanggalRaw && panjangRaw),
  });
}

export function useSusunKataBebasAdmin({ tanggal = '', limit = 200 } = {}) {
  const tanggalAman = String(tanggal ?? '').trim();
  const limitAman = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 1000);

  return useQuery({
    queryKey: ['admin-susun-kata-bebas', { tanggal: tanggalAman, limit: limitAman }],
    queryFn: () =>
      klien
        .get('/api/redaksi/susun-kata/bebas', {
          params: {
            tanggal: tanggalAman || undefined,
            limit: limitAman,
          },
        })
        .then((r) => r.data),
  });
}

export function useDaftarSumberAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  glosarium = '',
  kamus = '',
  tesaurus = '',
  etimologi = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/sumber', 'admin-sumber', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    glosarium,
    kamus,
    tesaurus,
    etimologi,
  });
}

export function useDetailSumberAdmin(id) {
  return useQuery({
    queryKey: ['admin-sumber-detail', id],
    queryFn: () => klien.get(`/api/redaksi/sumber/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

// ─── Label ───────────────────────────────────────────────────────────────────

export function useDaftarLabelAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/label', 'admin-label', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailLabelAdmin(id) {
  return useQuery({
    queryKey: ['admin-label-detail', id],
    queryFn: () => klien.get(`/api/redaksi/label/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useKategoriLabelRedaksi(kategori = []) {
  const nama = kategori.join(',');
  return useQuery({
    queryKey: ['admin-label-kategori', nama],
    queryFn: () =>
      klien
        .get('/api/redaksi/label/kategori', { params: { nama: nama || undefined } })
        .then((r) => r.data),
  });
}

// ─── Pengguna ────────────────────────────────────────────────────────────────

export function useDaftarPengguna({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/pengguna', 'admin-pengguna', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailPengguna(id) {
  return useQuery({
    queryKey: ['admin-pengguna-detail', id],
    queryFn: () => klien.get(`/api/redaksi/pengguna/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useDaftarPeran() {
  return useQuery({
    queryKey: ['admin-peran'],
    queryFn: () =>
      klien.get('/api/redaksi/pengguna/peran').then((r) => r.data),
  });
}

export function useUbahPeran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ penggunaId, peranId }) =>
      klien
        .patch(`/api/redaksi/pengguna/${penggunaId}/peran`, { peran_id: peranId })
        .then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(queryClient, ['admin-pengguna', 'admin-pengguna-detail']);
    },
  });
}

// ─── Peran & Izin ───────────────────────────────────────────────────────────

export function useDaftarPeranAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/peran', 'admin-peran-kelola', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    includeAktif: false,
  });
}

export function useDetailPeranAdmin(id) {
  return useQuery({
    queryKey: ['admin-peran-detail', id],
    queryFn: () => klien.get(`/api/redaksi/peran/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useDaftarIzinAdmin({ q = '' } = {}) {
  return useQuery({
    queryKey: ['admin-izin', { q }],
    queryFn: () =>
      klien
        .get('/api/redaksi/peran/izin', { params: { q: q || undefined } })
        .then((r) => r.data),
  });
}

export function useSimpanPeranAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data.id) return klien.put(`/api/redaksi/peran/${data.id}`, data).then((r) => r.data);
      return klien.post('/api/redaksi/peran', data).then((r) => r.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-peran-kelola', 'admin-peran', 'admin-peran-detail', 'admin-pengguna']);
    },
  });
}

export function useDaftarIzinKelolaAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/izin', 'admin-izin-kelola', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    includeAktif: false,
  });
}

export function useDetailIzinAdmin(id) {
  return useQuery({
    queryKey: ['admin-izin-detail', id],
    queryFn: () => klien.get(`/api/redaksi/izin/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useDaftarPeranUntukIzinAdmin({ q = '' } = {}) {
  return useQuery({
    queryKey: ['admin-izin-peran-opsi', { q }],
    queryFn: () =>
      klien
        .get('/api/redaksi/izin/peran', { params: { q: q || undefined } })
        .then((r) => r.data),
  });
}

export function useSimpanIzinAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data.id) return klien.put(`/api/redaksi/izin/${data.id}`, data).then((r) => r.data);
      return klien.post('/api/redaksi/izin', data).then((r) => r.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-izin-kelola', 'admin-izin', 'admin-izin-detail', 'admin-peran-kelola', 'admin-peran']);
    },
  });
}

// ─── Mutations: Kamus ────────────────────────────────────────────────────────

export function useSimpanKamus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data.id) return klien.put(`/api/redaksi/kamus/${data.id}`, data).then((r) => r.data);
      return klien.post('/api/redaksi/kamus', data).then((r) => r.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-kamus', 'admin-kamus-detail']);
    },
  });
}

export function useHapusKamus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`/api/redaksi/kamus/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-kamus', 'admin-kamus-detail']);
    },
  });
}

export function useSimpanKomentarAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => klien.put(`/api/redaksi/komentar/${data.id}`, data).then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-komentar', 'admin-komentar-detail']);
    },
  });
}

export function useSimpanAuditMaknaAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => klien.put(`/api/redaksi/audit-makna/${data.id}`, data).then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-audit-makna']);
    },
  });
}

// ─── Makna & Contoh ──────────────────────────────────────────────────────────

export function useDaftarMakna(entriId) {
  return useQuery({
    queryKey: ['admin-makna', entriId],
    queryFn: () => klien.get(`/api/redaksi/kamus/${entriId}/makna`).then((r) => r.data),
    enabled: Boolean(entriId),
  });
}

export function useSimpanMakna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entriId, ...data }) => {
      if (data.id) return klien.put(`/api/redaksi/kamus/${entriId}/makna/${data.id}`, data).then((r) => r.data);
      return klien.post(`/api/redaksi/kamus/${entriId}/makna`, data).then((r) => r.data);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.entriId] }),
  });
}

export function useHapusMakna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entriId, maknaId }) => {
      return klien.delete(`/api/redaksi/kamus/${entriId}/makna/${maknaId}`).then((r) => r.data);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.entriId] }),
  });
}

export function useSimpanContoh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entriId, maknaId, ...data }) => {
      if (data.id) return klien.put(`/api/redaksi/kamus/${entriId}/makna/${maknaId}/contoh/${data.id}`, data).then((r) => r.data);
      return klien.post(`/api/redaksi/kamus/${entriId}/makna/${maknaId}/contoh`, data).then((r) => r.data);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.entriId] }),
  });
}

export function useHapusContoh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entriId, maknaId, contohId }) => {
      return klien.delete(`/api/redaksi/kamus/${entriId}/makna/${maknaId}/contoh/${contohId}`).then((r) => r.data);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.entriId] }),
  });
}

// ─── Mutations: Tesaurus ─────────────────────────────────────────────────────

export function useSimpanTesaurus() {
  return useSimpanAdmin({ path: '/api/redaksi/tesaurus', queryKeyPrefix: 'admin-tesaurus' });
}

export function useHapusTesaurus() {
  return useHapusAdmin({ path: '/api/redaksi/tesaurus', queryKeyPrefix: 'admin-tesaurus' });
}

// ─── Mutations: Etimologi ────────────────────────────────────────────────────

export function useSimpanEtimologi() {
  return useSimpanAdmin({ path: '/api/redaksi/etimologi', queryKeyPrefix: 'admin-etimologi' });
}

export function useHapusEtimologi() {
  return useHapusAdmin({ path: '/api/redaksi/etimologi', queryKeyPrefix: 'admin-etimologi' });
}

// ─── Mutations: Glosarium ────────────────────────────────────────────────────

export function useSimpanGlosarium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data.id) return klien.put(`/api/redaksi/glosarium/${data.id}`, data).then((r) => r.data);
      return klien.post('/api/redaksi/glosarium', data).then((r) => r.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        'admin-glosarium',
        'admin-glosarium-detail',
        'admin-bidang',
        'admin-sumber',
        'glosarium-bidang',
        'glosarium-sumber',
      ]);
    },
  });
}

export function useHapusGlosarium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`/api/redaksi/glosarium/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        'admin-glosarium',
        'admin-glosarium-detail',
        'admin-bidang',
        'admin-sumber',
        'glosarium-bidang',
        'glosarium-sumber',
      ]);
    },
  });
}

export function useSimpanBidang() {
  return useSimpanAdmin({ path: '/api/redaksi/bidang', queryKeyPrefix: 'admin-bidang' });
}

export function useHapusBidang() {
  return useHapusAdmin({ path: '/api/redaksi/bidang', queryKeyPrefix: 'admin-bidang' });
}

export function useSimpanSusunKataHarianAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => klien.put('/api/redaksi/susun-kata/harian', data).then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-susun-kata-harian']);
    },
  });
}

export function useBuatSusunKataHarianAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tanggal = '' } = {}) => {
      const tanggalRaw = String(tanggal || '').trim();

      return klien
        .get('/api/redaksi/susun-kata/harian', {
          params: {
            tanggal: tanggalRaw || undefined,
            panjang: 5,
          },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-susun-kata-harian', 'admin-susun-kata-harian-detail']);
    },
  });
}

export function useSimpanSumber() {
  return useSimpanAdmin({ path: '/api/redaksi/sumber', queryKeyPrefix: 'admin-sumber' });
}

export function useHapusSumber() {
  return useHapusAdmin({ path: '/api/redaksi/sumber', queryKeyPrefix: 'admin-sumber' });
}

// ─── Mutations: Label ────────────────────────────────────────────────────────

export function useSimpanLabel() {
  return useSimpanAdmin({ path: '/api/redaksi/label', queryKeyPrefix: 'admin-label' });
}

export function useHapusLabel() {
  return useHapusAdmin({ path: '/api/redaksi/label', queryKeyPrefix: 'admin-label' });
}

// ─── Mutations: Pengguna ─────────────────────────────────────────────────────

export function useSimpanPengguna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      klien.put(`/api/redaksi/pengguna/${data.id}`, data).then((r) => r.data),
    onSuccess: () => {
      invalidateQueryKeys(qc, ['admin-pengguna', 'admin-pengguna-detail']);
    },
  });
}

// ─── Queries: Tagar ──────────────────────────────────────────────────────────

export function useDaftarTagarAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  kategori = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/tagar', 'admin-tagar', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    kategori,
    aktif,
  });
}

export function useDaftarAuditTagarAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  tagarId = '',
  jenis = 'turunan',
  punyaTagar = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/audit-tagar', 'admin-audit-tagar', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    includeAktif: false,
    tagar_id: tagarId,
    jenis,
    punya_tagar: punyaTagar,
  });
}

export function useDaftarEntriTagarAdmin(options = {}) {
  return useDaftarAuditTagarAdmin(options);
}

export function useDetailTagarAdmin(id) {
  return useQuery({
    queryKey: ['admin-tagar-detail', id],
    queryFn: () => klien.get(`/api/redaksi/tagar/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

/** Ambil tagar untuk satu entri (chip editor di KamusAdmin) */
export function useTagarEntri(entriId) {
  return useQuery({
    queryKey: ['tagar-entri', entriId],
    queryFn: () =>
      klien.get(`/api/redaksi/kamus/${entriId}/tagar`).then((r) => r.data),
    enabled: Boolean(entriId),
  });
}

/** Ambil semua tagar aktif untuk dropdown/autocomplete */
export function useDaftarTagarUntukPilih() {
  return useQuery({
    queryKey: ['semua-tagar-aktif'],
    queryFn: () => klien.get('/api/publik/tagar').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useKategoriTagarAdmin() {
  return useQuery({
    queryKey: ['admin-tagar-kategori'],
    queryFn: () => klien.get('/api/redaksi/tagar/kategori').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations: Tagar ────────────────────────────────────────────────────────

export function useSimpanTagar() {
  return useSimpanAdmin({ path: '/api/redaksi/tagar', queryKeyPrefix: 'admin-tagar' });
}

export function useHapusTagar() {
  return useHapusAdmin({ path: '/api/redaksi/tagar', queryKeyPrefix: 'admin-tagar' });
}

/** Simpan (replace) tagar untuk satu entri */
export function useSimpanTagarEntri() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entriId, tagar_ids }) =>
      klien
        .put(`/api/redaksi/kamus/${entriId}/tagar`, { tagar_ids })
        .then((r) => r.data),
    onSuccess: (_data, { entriId }) => {
      invalidateQueryKeys(qc, ['tagar-entri', 'admin-audit-tagar']);
      qc.invalidateQueries({ queryKey: ['tagar-entri', entriId] });
    },
  });
}
