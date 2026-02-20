import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCursorPagination } from '../../src/hooks/bersama/useCursorPagination';

describe('useCursorPagination', () => {
  it('mode offset: resetOn mereset offset dan handleCursor menangani first/last/next/prev', () => {
    const { result, rerender } = renderHook(
      ({ resetOn }) => useCursorPagination({ limit: 10, resetOn, mode: 'offset' }),
      { initialProps: { resetOn: 'awal' } }
    );

    act(() => {
      result.current.setOffset(30);
    });
    expect(result.current.offset).toBe(30);

    rerender({ resetOn: 'baru' });
    expect(result.current.offset).toBe(0);

    act(() => {
      result.current.handleCursor('last', { total: 95 });
    });
    expect(result.current.offset).toBe(90);

    act(() => {
      result.current.handleCursor('prev', { total: 95 });
    });
    expect(result.current.offset).toBe(80);

    act(() => {
      result.current.handleCursor('next', { total: 95 });
    });
    expect(result.current.offset).toBe(90);

    act(() => {
      result.current.handleCursor('first', { total: 95 });
    });
    expect(result.current.offset).toBe(0);

    act(() => {
      result.current.handleCursor('unknown', { total: 95 });
    });
    expect(result.current.offset).toBe(0);
  });

  it('mode cursor: handleCursor menangani first/last/next/prev', () => {
    const { result } = renderHook(() => useCursorPagination({ limit: 10, resetOn: 'q', mode: 'cursor' }));

    act(() => {
      result.current.handleCursor('next', {
        pageInfo: { hasNext: true, nextCursor: 'next-1' },
        total: 100,
      });
    });
    expect(result.current.cursorState).toMatchObject({
      cursor: 'next-1',
      direction: 'next',
      lastPage: false,
      page: 2,
    });

    act(() => {
      result.current.handleCursor('prev', {
        pageInfo: { hasPrev: true, prevCursor: 'prev-1' },
        total: 100,
      });
    });
    expect(result.current.cursorState).toMatchObject({
      cursor: 'prev-1',
      direction: 'prev',
      lastPage: false,
      page: 1,
    });

    act(() => {
      result.current.handleCursor('last', {
        pageInfo: { nextCursor: 'last-cursor' },
        total: 37,
      });
    });
    expect(result.current.cursorState).toMatchObject({
      cursor: 'last-cursor',
      direction: 'next',
      lastPage: true,
      page: 4,
    });

    act(() => {
      result.current.handleCursor('first', { pageInfo: {}, total: 37 });
    });
    expect(result.current.cursorState).toMatchObject({
      cursor: null,
      direction: 'next',
      lastPage: false,
      page: 1,
    });
  });

  it('mode offset: fallback angka saat limit/offset/total tidak valid', () => {
    const { result } = renderHook(() => useCursorPagination({ limit: 0, resetOn: 'x', mode: 'offset' }));

    act(() => {
      result.current.setOffset('abc');
      result.current.handleCursor('last', { total: 'abc' });
    });

    expect(result.current.offset).toBe(0);
  });
});
