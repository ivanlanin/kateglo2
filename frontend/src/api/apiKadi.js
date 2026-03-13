/**
 * @fileoverview API hooks untuk modul KADI (Kamus Deskriptif Indonesia)
 * Kandidat kata, atestasi, riwayat kurasi
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import klien from './klien';

const BASE = '/api/redaksi/kandidat-kata';
const QK = 'admin-kandidat-kata';

function invalidate(qc, keys) {
  keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
}

// ─── Daftar + Filter ─────────────────────────────────────────────────────────

export function useDaftarKandidatKataAdmin({
  limit = 50,
  cursor = null,
  direction = 'next',
  lastPage = false,
  q = '',
  status = '',
  jenis = '',
  sumberScraper = '',
  prioritas = '',
} = {}) {
  const params = {
    limit,
    cursor: cursor || undefined,
    direction,
    lastPage: lastPage ? '1' : undefined,
    q: q || undefined,
    status: status || undefined,
    jenis: jenis || undefined,
    sumber_scraper: sumberScraper || undefined,
    prioritas: prioritas !== '' ? prioritas : undefined,
  };

  return useQuery({
    queryKey: [QK, { limit, cursor, direction, lastPage, q, status, jenis, sumberScraper, prioritas }],
    queryFn: () => klien.get(BASE, { params }).then((r) => r.data),
  });
}

// ─── Detail ──────────────────────────────────────────────────────────────────

export function useDetailKandidatKataAdmin(id) {
  return useQuery({
    queryKey: [`${QK}-detail`, id],
    queryFn: () => klien.get(`${BASE}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

// ─── Simpan (edit) ───────────────────────────────────────────────────────────

export function useSimpanKandidatKata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => klien.put(`${BASE}/${data.id}`, data).then((r) => r.data),
    onSuccess: () => invalidate(qc, [QK, `${QK}-detail`, `${QK}-stats`]),
  });
}

// ─── Ubah Status ─────────────────────────────────────────────────────────────

export function useUbahStatusKandidatKata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, catatan }) =>
      klien.put(`${BASE}/${id}/status`, { status, catatan }).then((r) => r.data),
    onSuccess: () => invalidate(qc, [QK, `${QK}-detail`, `${QK}-stats`]),
  });
}

// ─── Hapus ───────────────────────────────────────────────────────────────────

export function useHapusKandidatKata() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => klien.delete(`${BASE}/${id}`).then((r) => r.data),
    onSuccess: () => invalidate(qc, [QK, `${QK}-detail`, `${QK}-stats`]),
  });
}

// ─── Statistik Antrian ───────────────────────────────────────────────────────

export function useStatistikKandidatKata({ enabled = true } = {}) {
  return useQuery({
    queryKey: [`${QK}-stats`],
    queryFn: () => klien.get(`${BASE}/stats`).then((r) => r.data),
    enabled,
    staleTime: 30 * 1000,
  });
}

// ─── Atestasi ────────────────────────────────────────────────────────────────

export function useDaftarAtestasi(kandidatId) {
  return useQuery({
    queryKey: [`${QK}-atestasi`, kandidatId],
    queryFn: () => klien.get(`${BASE}/${kandidatId}/atestasi`).then((r) => r.data),
    enabled: Boolean(kandidatId),
  });
}

export function useTambahAtestasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kandidatId, ...data }) =>
      klien.post(`${BASE}/${kandidatId}/atestasi`, data).then((r) => r.data),
    onSuccess: () => invalidate(qc, [`${QK}-atestasi`, `${QK}-detail`]),
  });
}

// ─── Riwayat Kurasi ──────────────────────────────────────────────────────────

export function useDaftarRiwayat(kandidatId) {
  return useQuery({
    queryKey: [`${QK}-riwayat`, kandidatId],
    queryFn: () => klien.get(`${BASE}/${kandidatId}/riwayat`).then((r) => r.data),
    enabled: Boolean(kandidatId),
  });
}
