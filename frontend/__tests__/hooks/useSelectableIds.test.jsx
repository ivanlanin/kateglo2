import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSelectableIds } from '../../src/hooks/redaksi/useSelectableIds';

describe('useSelectableIds', () => {
  it('menormalisasi selectedIds dan hasId bekerja', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelectableIds([1, '2', 0, 'x', -1], onChange));

    expect(result.current.selectedIds).toEqual([1, 2]);
    expect(result.current.hasId(1)).toBe(true);
    expect(result.current.hasId('2')).toBe(true);
    expect(result.current.hasId(3)).toBe(false);
  });

  it('toggleId menambah, menghapus, dan mengabaikan id tidak valid', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ ids }) => useSelectableIds(ids, onChange),
      { initialProps: { ids: [11] } }
    );

    act(() => {
      result.current.toggleId(12);
    });
    expect(onChange).toHaveBeenCalledWith([11, 12]);

    rerender({ ids: [11, 12] });
    act(() => {
      result.current.toggleId(12);
    });
    expect(onChange).toHaveBeenCalledWith([11]);

    onChange.mockClear();
    act(() => {
      result.current.toggleId(0);
      result.current.toggleId('abc');
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selectedIds kosong saat input bukan array', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelectableIds(null, onChange));
    expect(result.current.selectedIds).toEqual([]);
  });
});
