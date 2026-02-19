/**
 * @fileoverview API hooks untuk panel admin (statistik, kamus, tesaurus, glosarium, pengguna)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import klien from './klien';

function useDaftarAdmin(path, queryKeyPrefix, { limit = 50, offset = 0, q = '', aktif = '' } = {}) {
  const params = {
    limit,
    offset,
    q: q || undefined,
    aktif: aktif || undefined,
  };

  return useQuery({
    queryKey: [queryKeyPrefix, { limit, offset, q, aktif }],
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
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKeyPrefix] }),
  });
}

function useHapusAdmin({ path, queryKeyPrefix }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`${path}/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKeyPrefix] }),
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
  offset = 0,
  q = '',
  aktif = '',
  jenis = '',
  jenisRujuk = '',
  punyaHomograf = '',
  punyaHomonim = '',
} = {}) {
  const params = {
    limit,
    offset,
    q: q || undefined,
  };

  if (jenis) params.jenis = jenis;
  if (aktif) params.aktif = aktif;
  if (jenisRujuk) params.jenis_rujuk = jenisRujuk;
  if (punyaHomograf) params.punya_homograf = punyaHomograf;
  if (punyaHomonim) params.punya_homonim = punyaHomonim;

  return useQuery({
    queryKey: ['admin-kamus', {
      limit,
      offset,
      q,
      aktif,
      jenis,
      jenisRujuk,
      punyaHomograf,
      punyaHomonim,
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

export function useDaftarKomentarAdmin({ limit = 50, offset = 0, q = '', aktif = '' } = {}) {
  return useDaftarAdmin('/api/redaksi/komentar', 'admin-komentar', { limit, offset, q, aktif });
}

export function useDetailKomentarAdmin(id) {
  return useQuery({
    queryKey: ['admin-komentar-detail', id],
    queryFn: () => klien.get(`/api/redaksi/komentar/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

// ─── Tesaurus ────────────────────────────────────────────────────────────────

export function useDaftarTesaurusAdmin({ limit = 50, offset = 0, q = '', aktif = '' } = {}) {
  return useDaftarAdmin('/api/redaksi/tesaurus', 'admin-tesaurus', { limit, offset, q, aktif });
}

export function useDetailTesaurusAdmin(id) {
  return useQuery({
    queryKey: ['admin-tesaurus-detail', id],
    queryFn: () => klien.get(`/api/redaksi/tesaurus/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

// ─── Glosarium ───────────────────────────────────────────────────────────────

export function useDaftarGlosariumAdmin({ limit = 50, offset = 0, q = '', aktif = '' } = {}) {
  return useDaftarAdmin('/api/redaksi/glosarium', 'admin-glosarium', { limit, offset, q, aktif });
}

export function useDetailGlosariumAdmin(id) {
  return useQuery({
    queryKey: ['admin-glosarium-detail', id],
    queryFn: () => klien.get(`/api/redaksi/glosarium/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

// ─── Label ───────────────────────────────────────────────────────────────────

export function useDaftarLabelAdmin({ limit = 50, offset = 0, q = '', aktif = '' } = {}) {
  return useDaftarAdmin('/api/redaksi/label', 'admin-label', { limit, offset, q, aktif });
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

export function useDaftarPengguna({ limit = 50, offset = 0, q = '', aktif = '' } = {}) {
  return useQuery({
    queryKey: ['admin-pengguna', { limit, offset, q, aktif }],
    queryFn: () =>
      klien
        .get('/api/redaksi/pengguna', { params: { limit, offset, q: q || undefined, aktif: aktif || undefined } })
        .then((r) => r.data),
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
      queryClient.invalidateQueries({ queryKey: ['admin-pengguna'] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-kamus'] }),
  });
}

export function useHapusKamus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`/api/redaksi/kamus/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-kamus'] }),
  });
}

export function useSimpanKomentarAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => klien.put(`/api/redaksi/komentar/${data.id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-komentar'] }),
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
  return useSimpanAdmin({ path: '/api/redaksi/glosarium', queryKeyPrefix: 'admin-glosarium' });
}

export function useHapusGlosarium() {
  return useHapusAdmin({ path: '/api/redaksi/glosarium', queryKeyPrefix: 'admin-glosarium' });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pengguna'] }),
  });
}
