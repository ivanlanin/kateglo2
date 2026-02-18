const {
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../utils/routesRedaksiUtils');

describe('routesRedaksiUtils', () => {
  describe('parsePagination', () => {
    it('menggunakan default parameter saat argumen undefined', () => {
      expect(parsePagination(undefined, undefined)).toEqual({ limit: 50, offset: 0 });
    });

    it('menggunakan default saat query kosong', () => {
      expect(parsePagination({})).toEqual({ limit: 50, offset: 0 });
    });

    it('membatasi nilai limit dan offset sesuai aturan', () => {
      expect(parsePagination({ limit: '500', offset: '-9' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 200,
        offset: 0,
      });
      expect(parsePagination({ limit: '0', offset: '4' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 50,
        offset: 4,
      });
      expect(parsePagination({ limit: '12', offset: '3' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 12,
        offset: 3,
      });
      expect(parsePagination({ limit: '1', offset: '0' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 1,
        offset: 0,
      });
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
