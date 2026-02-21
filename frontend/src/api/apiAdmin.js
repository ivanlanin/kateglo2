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
} = {}) {
  const params = buildDaftarParams({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
    includeAktif,
  });

  return useQuery({
    queryKey: [queryKeyPrefix, { limit, cursor, direction, lastPage, q, aktif }],
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
  kelasKata = '',
  ragam = '',
  bidang = '',
  bahasa = '',
  punyaIlmiah = '',
  punyaKimia = '',
  tipePenyingkat = '',
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
  if (kelasKata) params.kelas_kata = kelasKata;
  if (ragam) params.ragam = ragam;
  if (bidang) params.bidang = bidang;
  if (bahasa) params.bahasa = bahasa;
  if (punyaIlmiah) params.punya_ilmiah = punyaIlmiah;
  if (punyaKimia) params.punya_kimia = punyaKimia;
  if (tipePenyingkat) params.tipe_penyingkat = tipePenyingkat;
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
      kelasKata,
      ragam,
      bidang,
      bahasa,
      punyaIlmiah,
      punyaKimia,
      tipePenyingkat,
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

export function useDaftarBidangGlosariumAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/glosarium/bidang-master', 'admin-glosarium-bidang', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailBidangGlosariumAdmin(id) {
  return useQuery({
    queryKey: ['admin-glosarium-bidang-detail', id],
    queryFn: () => klien.get(`/api/redaksi/glosarium/bidang-master/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useDaftarSumberGlosariumAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  aktif = '',
} = {}) {
  return useDaftarAdmin('/api/redaksi/glosarium/sumber-master', 'admin-glosarium-sumber', {
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif,
  });
}

export function useDetailSumberGlosariumAdmin(id) {
  return useQuery({
    queryKey: ['admin-glosarium-sumber-detail', id],
    queryFn: () => klien.get(`/api/redaksi/glosarium/sumber-master/${id}`).then((r) => r.data),
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
        'admin-glosarium-bidang',
        'admin-glosarium-sumber',
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
        'admin-glosarium-bidang',
        'admin-glosarium-sumber',
        'glosarium-bidang',
        'glosarium-sumber',
      ]);
    },
  });
}

export function useSimpanBidangGlosarium() {
  return useSimpanAdmin({ path: '/api/redaksi/glosarium/bidang-master', queryKeyPrefix: 'admin-glosarium-bidang' });
}

export function useHapusBidangGlosarium() {
  return useHapusAdmin({ path: '/api/redaksi/glosarium/bidang-master', queryKeyPrefix: 'admin-glosarium-bidang' });
}

export function useSimpanSumberGlosarium() {
  return useSimpanAdmin({ path: '/api/redaksi/glosarium/sumber-master', queryKeyPrefix: 'admin-glosarium-sumber' });
}

export function useHapusSumberGlosarium() {
  return useHapusAdmin({ path: '/api/redaksi/glosarium/sumber-master', queryKeyPrefix: 'admin-glosarium-sumber' });
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
