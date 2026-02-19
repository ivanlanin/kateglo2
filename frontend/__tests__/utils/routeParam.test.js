import { describe, expect, it } from 'vitest';
import { parsePositiveIntegerParam } from '../../src/utils/routeParam';

describe('utils/routeParam', () => {
  it('mengembalikan integer positif untuk nilai valid', () => {
    expect(parsePositiveIntegerParam('1')).toBe(1);
    expect(parsePositiveIntegerParam('42')).toBe(42);
    expect(parsePositiveIntegerParam(7)).toBe(7);
  });

  it('mengembalikan null untuk nilai tidak valid', () => {
    expect(parsePositiveIntegerParam('0')).toBeNull();
    expect(parsePositiveIntegerParam('-2')).toBeNull();
    expect(parsePositiveIntegerParam('abc')).toBeNull();
    expect(parsePositiveIntegerParam('')).toBeNull();
    expect(parsePositiveIntegerParam(null)).toBeNull();
    expect(parsePositiveIntegerParam(undefined)).toBeNull();
  });

  it('memakai parseInt basis 10 untuk string campuran', () => {
    expect(parsePositiveIntegerParam('12xyz')).toBe(12);
    expect(parsePositiveIntegerParam('08')).toBe(8);
  });
});
