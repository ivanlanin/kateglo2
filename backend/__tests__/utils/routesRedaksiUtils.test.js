const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

describe('routesRedaksiUtils', () => {
  describe('parsePagination', () => {
    it('menggunakan default parameter saat argumen undefined', () => {
      expect(parsePagination(undefined, undefined)).toEqual({
        limit: 50,
        offset: 0,
        cursor: null,
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });
    });

    it('menggunakan default saat query kosong', () => {
      expect(parsePagination({})).toEqual({
        limit: 50,
        offset: 0,
        cursor: null,
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });
    });

    it('membatasi nilai limit dan offset sesuai aturan', () => {
      expect(parsePagination({ limit: '500', offset: '-9' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 200,
        offset: 0,
        cursor: null,
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });
      expect(parsePagination({ limit: '0', offset: '4' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 50,
        offset: 0,
        cursor: null,
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });
      expect(parsePagination({ limit: '12', offset: '3' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 12,
        offset: 0,
        cursor: null,
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });
      expect(parsePagination({ limit: '1', offset: '0' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 1,
        offset: 0,
        cursor: null,
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });
    });

    it('mendukung cursor mode untuk navigasi redaksi', () => {
      const cursor = Buffer.from(JSON.stringify({ offset: 20, total: 95 }), 'utf8').toString('base64url');

      expect(parsePagination({ limit: '10', cursor })).toEqual({
        limit: 10,
        offset: 20,
        cursor,
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });

      expect(parsePagination({ limit: '10', cursor, direction: 'prev', lastPage: 'true' })).toEqual({
        limit: 10,
        offset: 90,
        cursor,
        direction: 'prev',
        lastPage: true,
        mode: 'cursor',
      });

      expect(parsePagination({ limit: '10', cursor, lastPage: '1' })).toEqual({
        limit: 10,
        offset: 90,
        cursor,
        direction: 'next',
        lastPage: true,
        mode: 'cursor',
      });
    });

    it('menggunakan offset 0 saat cursor tidak valid dan tetap mode cursor', () => {
      expect(parsePagination({ limit: '10', cursor: '!!not-base64!!' })).toEqual({
        limit: 10,
        offset: 0,
        cursor: '!!not-base64!!',
        direction: 'next',
        lastPage: false,
        mode: 'cursor',
      });
    });
  });

  it('buildPaginatedResult menghitung pageInfo default dengan cursor prev/next', () => {
    const result = buildPaginatedResult({
      data: [{ id: 1 }, { id: 2 }],
      total: 10,
      pagination: { limit: 2, offset: 4 },
    });

    expect(result.limit).toBe(2);
    expect(result.offset).toBe(4);
    expect(result.pageInfo.hasPrev).toBe(true);
    expect(result.pageInfo.hasNext).toBe(true);
    expect(result.pageInfo.prevCursor).toEqual(expect.any(String));
    expect(result.pageInfo.nextCursor).toEqual(expect.any(String));
  });

  it('buildPaginatedResult memakai pageInfo override saat disediakan', () => {
    const result = buildPaginatedResult({
      data: [{ id: 1 }],
      total: 1,
      pagination: { limit: 10, offset: 0 },
      pageInfo: { hasPrev: false, hasNext: false, prevCursor: undefined, nextCursor: undefined },
    });

    expect(result.pageInfo).toEqual({
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('buildPaginatedResult fallback aman untuk data non-array dan angka tidak valid', () => {
    const result = buildPaginatedResult({
      data: { id: 1 },
      total: 'abc',
      pagination: { limit: 'abc', offset: '-5' },
    });

    expect(result.limit).toBe('abc');
    expect(result.offset).toBe('-5');
    expect(result.pageInfo).toEqual({
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('buildPaginatedResult aman saat dipanggil tanpa argumen', () => {
    const result = buildPaginatedResult();

    expect(result).toEqual({
      data: [],
      total: 0,
      limit: undefined,
      offset: undefined,
      pageInfo: {
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      },
    });
  });

  it('parseSearchQuery menormalkan input string', () => {
    expect(parseSearchQuery('  kata  ')).toBe('kata');
    expect(parseSearchQuery(undefined)).toBe('');
  });

  it('parseIdParam mengembalikan Number dari param', () => {
    expect(parseIdParam('9')).toBe(9);
    expect(Number.isNaN(parseIdParam('abc'))).toBe(true);
  });

  it('parseTrimmedString menormalkan nilai nullable', () => {
    expect(parseTrimmedString('  teks  ')).toBe('teks');
    expect(parseTrimmedString(null)).toBe('');
  });
});
