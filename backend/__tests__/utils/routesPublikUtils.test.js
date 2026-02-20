const {
  parsePagination,
  parseCursorPagination,
  rejectTooLargeOffset,
} = require('../../utils/routesPublikUtils');

describe('routesPublikUtils', () => {
  describe('parsePagination', () => {
    it('menggunakan default parameter saat argumen undefined', () => {
      expect(parsePagination(undefined, undefined)).toEqual({ limit: 100, offset: 0 });
    });

    it('menggunakan nilai default saat query kosong', () => {
      expect(parsePagination({})).toEqual({ limit: 100, offset: 0 });
    });

    it('membatasi limit di rentang min/max dan menormalkan offset', () => {
      expect(parsePagination({ limit: '250', offset: '-10' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 200,
        offset: 0,
      });
      expect(parsePagination({ limit: '0', offset: '8' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 50,
        offset: 8,
      });
      expect(parsePagination({ limit: '7', offset: '4' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 7,
        offset: 4,
      });
      expect(parsePagination({ limit: '5', offset: '0' }, { defaultLimit: 50, maxLimit: 200 })).toEqual({
        limit: 5,
        offset: 0,
      });
    });
  });

  describe('parseCursorPagination', () => {
    it('menggunakan default saat argumen kosong atau undefined', () => {
      expect(parseCursorPagination(undefined, undefined)).toEqual({
        limit: 100,
        cursor: null,
        direction: 'next',
        lastPage: false,
      });
      expect(parseCursorPagination({})).toEqual({
        limit: 100,
        cursor: null,
        direction: 'next',
        lastPage: false,
      });
    });

    it('menormalkan limit, cursor, direction, dan lastPage', () => {
      expect(parseCursorPagination(
        { limit: '250', cursor: '  abc123  ', direction: 'prev', lastPage: '1' },
        { defaultLimit: 50, maxLimit: 200 }
      )).toEqual({
        limit: 200,
        cursor: 'abc123',
        direction: 'prev',
        lastPage: true,
      });

      expect(parseCursorPagination(
        { limit: '0', cursor: '   ', direction: 'unknown', lastPage: 'true' },
        { defaultLimit: 50, maxLimit: 200 }
      )).toEqual({
        limit: 50,
        cursor: null,
        direction: 'next',
        lastPage: true,
      });
    });
  });

  describe('rejectTooLargeOffset', () => {
    it('mengembalikan false bila offset masih valid', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      expect(rejectTooLargeOffset(res, 10, 100)).toBe(false);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('mengembalikan true dan merespons 400 bila offset terlalu besar', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      expect(rejectTooLargeOffset(res, 101, 100)).toBe(true);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid Query',
        message: 'Offset maksimal adalah 100',
      });
    });

    it('menggunakan default maxOffset saat argumen ketiga tidak diberikan', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      expect(rejectTooLargeOffset(res, Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  it('mengekspos publicMaxOffset dari env saat module di-load ulang', () => {
    const original = process.env.PUBLIC_MAX_OFFSET;
    process.env.PUBLIC_MAX_OFFSET = '42';
    jest.resetModules();
    const reloaded = require('../../utils/routesPublikUtils');
    expect(reloaded.publicMaxOffset).toBe(42);
    process.env.PUBLIC_MAX_OFFSET = original;
    jest.resetModules();
  });
});
