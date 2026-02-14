/**
 * @fileoverview Test untuk QueryBuilder class
 * @tested_in backend/db/index.js
 *
 * Test ini TIDAK menggunakan global db mock dari jest.setup.js.
 * Sebaliknya, kita langsung menguji class QueryBuilder dengan mock pool sendiri.
 */

// Bypass global mock — require QueryBuilder langsung
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock pg Pool
const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    on: jest.fn(),
    end: jest.fn()
  }))
}));

// Setelah mock pg, require db module (yang akan pakai mock Pool)
let db;
beforeAll(() => {
  // Unmock db/index.js supaya kita dapat real QueryBuilder
  jest.unmock('../../db/index.js');
  db = require('../../db/index.js');
});

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('QueryBuilder', () => {
  describe('from().select().execute()', () => {
    it('membuat query SELECT dasar', async () => {
      const builder = db.from('phrases');
      await builder.select('*').execute();

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM phrases', []);
    });

    it('mendukung select kolom tertentu', async () => {
      await db.from('phrases').select('id, phrase').execute();

      expect(mockQuery).toHaveBeenCalledWith('SELECT id, phrase FROM phrases', []);
    });

    it('mendukung select dengan array', async () => {
      await db.from('phrases').select(['id', 'phrase']).execute();

      expect(mockQuery).toHaveBeenCalledWith('SELECT id, phrase FROM phrases', []);
    });
  });

  describe('where conditions', () => {
    it('eq() menambahkan kondisi =', async () => {
      await db.from('phrases').select('*').eq('id', 1).execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases WHERE id = $1',
        [1]
      );
    });

    it('neq() menambahkan kondisi !=', async () => {
      await db.from('phrases').select('*').neq('status', 'draft').execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases WHERE status != $1',
        ['draft']
      );
    });

    it('like() menambahkan kondisi LIKE', async () => {
      await db.from('phrases').select('*').like('phrase', '%kata%').execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases WHERE phrase LIKE $1',
        ['%kata%']
      );
    });

    it('ilike() menambahkan kondisi ILIKE', async () => {
      await db.from('phrases').select('*').ilike('phrase', '%kata%').execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases WHERE phrase ILIKE $1',
        ['%kata%']
      );
    });

    it('in() menambahkan kondisi ANY', async () => {
      await db.from('phrases').select('*').in('id', [1, 2, 3]).execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases WHERE id = ANY($1)',
        [[1, 2, 3]]
      );
    });

    it('mendukung multiple where conditions dengan AND', async () => {
      await db.from('phrases')
        .select('*')
        .eq('lex_class', 'n')
        .ilike('phrase', 'kata%')
        .execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases WHERE lex_class = $1 AND phrase ILIKE $2',
        ['n', 'kata%']
      );
    });
  });

  describe('modifiers', () => {
    it('order() ASC', async () => {
      await db.from('phrases').select('*').order('phrase', true).execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases ORDER BY phrase ASC',
        []
      );
    });

    it('order() DESC', async () => {
      await db.from('phrases').select('*').order('phrase', false).execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases ORDER BY phrase DESC',
        []
      );
    });

    it('limit()', async () => {
      await db.from('phrases').select('*').limit(10).execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases LIMIT 10',
        []
      );
    });

    it('offset()', async () => {
      await db.from('phrases').select('*').offset(20).execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases OFFSET 20',
        []
      );
    });
  });

  describe('chaining lengkap', () => {
    it('membangun query kompleks dengan semua modifier', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 1, phrase: 'kata' }],
        rowCount: 1
      });

      const result = await db.from('phrases')
        .select('id, phrase')
        .eq('lex_class', 'n')
        .order('phrase', true)
        .limit(20)
        .offset(5)
        .execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, phrase FROM phrases WHERE lex_class = $1 ORDER BY phrase ASC LIMIT 20 OFFSET 5',
        ['n']
      );
      expect(result).toEqual({ data: [{ id: 1, phrase: 'kata' }], count: 1 });
    });
  });

  describe('db.query() — raw SQL', () => {
    it('menjalankan raw SQL query', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ phrase: 'kata' }],
        rowCount: 1
      });

      const result = await db.query('SELECT * FROM phrases WHERE phrase = $1', ['kata']);

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM phrases WHERE phrase = $1', ['kata']);
      expect(result.rows).toEqual([{ phrase: 'kata' }]);
    });
  });
});
