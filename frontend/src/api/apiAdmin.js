/**
 * @fileoverview API hooks untuk panel admin (statistik, kamus, tesaurus, glosarium, pengguna)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import klien from './klien';

// ─── Statistik ───────────────────────────────────────────────────────────────

export function useStatistikAdmin() {
  return useQuery({
    queryKey: ['admin-statistik'],
    queryFn: () => klien.get('/api/redaksi/statistik').then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

// ─── Kamus ───────────────────────────────────────────────────────────────────

export function useDaftarKamusAdmin({ limit = 50, offset = 0, q = '' } = {}) {
  return useQuery({
    queryKey: ['admin-kamus', { limit, offset, q }],
    queryFn: () =>
      klien
        .get('/api/redaksi/kamus', { params: { limit, offset, q: q || undefined } })
        .then((r) => r.data),
  });
}

// ─── Tesaurus ────────────────────────────────────────────────────────────────

export function useDaftarTesaurusAdmin({ limit = 50, offset = 0, q = '' } = {}) {
  return useQuery({
    queryKey: ['admin-tesaurus', { limit, offset, q }],
    queryFn: () =>
      klien
        .get('/api/redaksi/tesaurus', { params: { limit, offset, q: q || undefined } })
        .then((r) => r.data),
  });
}

// ─── Glosarium ───────────────────────────────────────────────────────────────

export function useDaftarGlosariumAdmin({ limit = 50, offset = 0, q = '' } = {}) {
  return useQuery({
    queryKey: ['admin-glosarium', { limit, offset, q }],
    queryFn: () =>
      klien
        .get('/api/redaksi/glosarium', { params: { limit, offset, q: q || undefined } })
        .then((r) => r.data),
  });
}

// ─── Pengguna ────────────────────────────────────────────────────────────────

export function useDaftarPengguna({ limit = 50, offset = 0 } = {}) {
  return useQuery({
    queryKey: ['admin-pengguna', { limit, offset }],
    queryFn: () =>
      klien
        .get('/api/redaksi/pengguna', { params: { limit, offset } })
        .then((r) => r.data),
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

// ─── Makna & Contoh ──────────────────────────────────────────────────────────

export function useDaftarMakna(lemaId) {
  return useQuery({
    queryKey: ['admin-makna', lemaId],
    queryFn: () => klien.get(`/api/redaksi/kamus/${lemaId}/makna`).then((r) => r.data),
    enabled: Boolean(lemaId),
  });
}

export function useSimpanMakna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lemaId, ...data }) => {
      if (data.id) return klien.put(`/api/redaksi/kamus/${lemaId}/makna/${data.id}`, data).then((r) => r.data);
      return klien.post(`/api/redaksi/kamus/${lemaId}/makna`, data).then((r) => r.data);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.lemaId] }),
  });
}

export function useHapusMakna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lemaId, maknaId }) => klien.delete(`/api/redaksi/kamus/${lemaId}/makna/${maknaId}`).then((r) => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.lemaId] }),
  });
}

export function useSimpanContoh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lemaId, maknaId, ...data }) => {
      if (data.id) return klien.put(`/api/redaksi/kamus/${lemaId}/makna/${maknaId}/contoh/${data.id}`, data).then((r) => r.data);
      return klien.post(`/api/redaksi/kamus/${lemaId}/makna/${maknaId}/contoh`, data).then((r) => r.data);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.lemaId] }),
  });
}

export function useHapusContoh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lemaId, maknaId, contohId }) => klien.delete(`/api/redaksi/kamus/${lemaId}/makna/${maknaId}/contoh/${contohId}`).then((r) => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin-makna', vars.lemaId] }),
  });
}

// ─── Mutations: Tesaurus ─────────────────────────────────────────────────────

export function useSimpanTesaurus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data.id) return klien.put(`/api/redaksi/tesaurus/${data.id}`, data).then((r) => r.data);
      return klien.post('/api/redaksi/tesaurus', data).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tesaurus'] }),
  });
}

export function useHapusTesaurus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`/api/redaksi/tesaurus/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tesaurus'] }),
  });
}

// ─── Mutations: Glosarium ────────────────────────────────────────────────────

export function useSimpanGlosarium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data.id) return klien.put(`/api/redaksi/glosarium/${data.id}`, data).then((r) => r.data);
      return klien.post('/api/redaksi/glosarium', data).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-glosarium'] }),
  });
}

export function useHapusGlosarium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`/api/redaksi/glosarium/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-glosarium'] }),
  });
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
