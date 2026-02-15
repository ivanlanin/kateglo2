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
const mockOn = jest.fn();
const mockEnd = jest.fn();
const poolEventHandlers = {};

mockOn.mockImplementation((event, handler) => {
  poolEventHandlers[event] = handler;
});

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    on: mockOn,
    end: mockEnd
  }))
}));

// Setelah mock pg, require db module (yang akan pakai mock Pool)
let db;
let logger;
beforeAll(() => {
  // Unmock db/index.js supaya kita dapat real QueryBuilder
  jest.unmock('../../db/index.js');
  db = require('../../db/index.js');
  logger = require('../../config/logger');
});

beforeEach(() => {
  mockQuery.mockReset();
  mockEnd.mockReset();
  logger.warn.mockReset();
  logger.info.mockReset();
  logger.error.mockReset();
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
    
      it('select() tanpa argumen memakai default *', async () => {
        await db.from('phrases').select().execute();
      
        expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM phrases', []);
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

    it('order() default menggunakan ASC', async () => {
      await db.from('phrases').select('*').order('phrase').execute();

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

    it('offset(0) tidak menambahkan OFFSET clause', async () => {
      await db.from('phrases').select('*').offset(0).execute();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM phrases',
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

    it('retry 1x saat terjadi transient connection error', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('connection terminated due to connection timeout'))
        .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

      const result = await db.query('SELECT 1', []);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith('Retrying PostgreSQL query after transient connection error');
      expect(result.rows).toEqual([{ ok: true }]);
    });

    it('retry untuk pesan timeout expired', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('timeout expired'))
        .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

      const result = await db.query('SELECT 1', []);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result.rows).toEqual([{ ok: true }]);
    });

    it('retry untuk pesan database system starting up', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('the database system is starting up'))
        .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 });

      const result = await db.query('SELECT 1', []);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result.rows).toEqual([{ ok: true }]);
    });

    it('tidak retry saat error bernilai undefined', async () => {
      mockQuery.mockRejectedValueOnce(undefined);

      await expect(db.query('SELECT broken', [])).rejects.toBeUndefined();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('tidak retry saat error tanpa message', async () => {
      mockQuery.mockRejectedValueOnce({});

      await expect(db.query('SELECT broken', [])).rejects.toEqual({});
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('berhenti retry setelah jatah habis', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('timeout expired'))
        .mockRejectedValueOnce(new Error('timeout expired'));

      await expect(db.query('SELECT 1', [])).rejects.toThrow('timeout expired');
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('tidak retry untuk error non-transient', async () => {
      const hardError = new Error('syntax error at or near SELECT');
      mockQuery.mockRejectedValue(hardError);

      await expect(db.query('SELECT broken', [])).rejects.toThrow('syntax error at or near SELECT');
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('db.execute mengembalikan format {data, count}', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

      const result = await db.execute('SELECT id FROM phrases', []);

      expect(result).toEqual({ data: [{ id: 1 }], count: 1 });
    });

    it('db.close memanggil pool.end', async () => {
      mockEnd.mockResolvedValue();

      await db.close();

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('pool event handlers', () => {
    it('handler connect menulis log info', () => {
      expect(typeof poolEventHandlers.connect).toBe('function');

      poolEventHandlers.connect();

      expect(logger.info).toHaveBeenCalledWith('🗄️  PostgreSQL connected');
    });

    it('handler error menulis log error dan exit process', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
      const err = new Error('idle client error');

      expect(typeof poolEventHandlers.error).toBe('function');
      poolEventHandlers.error(err);

      expect(logger.error).toHaveBeenCalledWith('Unexpected error on idle client', err);
      expect(exitSpy).toHaveBeenCalledWith(-1);

      exitSpy.mockRestore();
    });
  });
});
