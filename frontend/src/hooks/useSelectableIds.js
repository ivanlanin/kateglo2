/**
 * @fileoverview Hook redaksi untuk mengelola daftar ID terpilih (checkbox)
 */

import { useCallback, useMemo } from 'react';

function normalizeIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

export function useSelectableIds(selectedIds, onChange) {
  const normalizedIds = useMemo(() => normalizeIds(selectedIds), [selectedIds]);

  const hasId = useCallback((id) => {
    const normalizedId = Number(id);
    return normalizedIds.includes(normalizedId);
  }, [normalizedIds]);

  const toggleId = useCallback((id) => {
    const normalizedId = Number(id);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) return;

    if (normalizedIds.includes(normalizedId)) {
      onChange(normalizedIds.filter((item) => item !== normalizedId));
      return;
    }

    onChange([...normalizedIds, normalizedId]);
  }, [normalizedIds, onChange]);

  return {
    selectedIds: normalizedIds,
    hasId,
    toggleId,
  };
}
