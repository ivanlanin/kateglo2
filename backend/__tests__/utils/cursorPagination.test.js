/**
 * @fileoverview Test util cursor pagination
 * @tested_in backend/utils/cursorPagination.js
 */

const { encodeCursor, decodeCursor } = require('../../utils/cursorPagination');

describe('cursorPagination utils', () => {
  it('encodeCursor mengembalikan null saat payload tidak valid', () => {
    expect(encodeCursor()).toBeNull();
    expect(encodeCursor(null)).toBeNull();
    expect(encodeCursor('abc')).toBeNull();
  });

  it('encodeCursor/decodeCursor melakukan round-trip payload object', () => {
    const token = encodeCursor({ id: 7, entri: 'kata', prioritas: 1 });

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(decodeCursor(token)).toEqual({ id: 7, entri: 'kata', prioritas: 1 });
  });

  it('decodeCursor mengembalikan null untuk token tidak valid', () => {
    expect(decodeCursor()).toBeNull();
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(123)).toBeNull();
    expect(decodeCursor('@@@')).toBeNull();
  });

  it('decodeCursor mengembalikan null ketika payload valid JSON tapi bukan object', () => {
    const token = Buffer.from('"teks"', 'utf8').toString('base64url');
    expect(decodeCursor(token)).toBeNull();
  });
});
