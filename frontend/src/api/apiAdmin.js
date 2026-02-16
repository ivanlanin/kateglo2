/**
 * @fileoverview API hooks untuk pengelolaan admin (pengguna, dsb.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import klien from './klien';

export function useDaftarPengguna({ limit = 50, offset = 0 } = {}) {
  return useQuery({
    queryKey: ['pengguna', { limit, offset }],
    queryFn: () =>
      klien
        .get('/api/admin/pengguna', { params: { limit, offset } })
        .then((r) => r.data),
  });
}

export function useDaftarPeran() {
  return useQuery({
    queryKey: ['peran'],
    queryFn: () =>
      klien.get('/api/admin/pengguna/peran').then((r) => r.data),
  });
}

export function useUbahPeran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ penggunaId, peranId }) =>
      klien
        .patch(`/api/admin/pengguna/${penggunaId}/peran`, { peran_id: peranId })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pengguna'] });
    },
  });
}
