/**
 * @fileoverview Test untuk error handling middleware
 * @tested_in backend/middleware/errorHandler.js
 */

const { notFoundHandler, errorHandler } = require('../../middleware/errorHandler');

// Mock logger
jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

// Helper: buat mock req/res
function createMockReqRes(overrides = {}) {
  const req = {
    method: 'GET',
    path: '/api/test',
    ...overrides
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return { req, res };
}

describe('notFoundHandler', () => {
  it('mengembalikan 404 dengan info route', () => {
    const { req, res } = createMockReqRes({ method: 'POST', path: '/api/unknown' });

    notFoundHandler(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Route POST /api/unknown not found',
      path: '/api/unknown'
    });
  });
});

describe('errorHandler', () => {
  it('menangani error umum dengan status 500', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('Something broke');

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Something broke' })
    );
  });

  it('menangani error dengan status kustom', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('Forbidden');
    err.status = 403;

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('menangani PostgreSQL unique violation (23505)', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('duplicate key');
    err.code = '23505';

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Duplicate entry' })
    );
  });

  it('menangani PostgreSQL foreign key violation (23503)', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('fk violation');
    err.code = '23503';

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid reference' })
    );
  });

  it('menangani PostgreSQL invalid input (22P02)', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('invalid input');
    err.code = '22P02';

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid input format' })
    );
  });

  it('menangani JsonWebTokenError', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid token' })
    );
  });

  it('menangani TokenExpiredError', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token expired' })
    );
  });

  it('menangani Joi validation error', () => {
    const { req, res } = createMockReqRes();
    const err = new Error('validation failed');
    err.isJoi = true;
    err.details = [
      { message: '"name" is required' },
      { message: '"email" must be valid' }
    ];

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '"name" is required, "email" must be valid'
      })
    );
  });

  it('menyertakan stack trace di mode development', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { req, res } = createMockReqRes();
    const err = new Error('dev error');

    errorHandler(err, req, res, jest.fn());

    const response = res.json.mock.calls[0][0];
    expect(response.stack).toBeDefined();

    process.env.NODE_ENV = origEnv;
  });

  it('tidak menyertakan stack trace di mode production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { req, res } = createMockReqRes();
    const err = new Error('prod error');

    errorHandler(err, req, res, jest.fn());

    const response = res.json.mock.calls[0][0];
    expect(response.stack).toBeUndefined();

    process.env.NODE_ENV = origEnv;
  });

  it('memakai fallback pesan internal saat message kosong', () => {
    const { req, res } = createMockReqRes();
    const err = { name: 'Error', message: '', stack: 'stack' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal Server Error' })
    );
  });

  it('memakai fallback nama error saat err.name kosong', () => {
    const { req, res } = createMockReqRes();
    const err = { message: 'boom', stack: 'trace' };

    errorHandler(err, req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error' })
    );
  });

  it('di mode development tidak menyertakan stack jika stack kosong', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { req, res } = createMockReqRes();
    const err = { name: 'Error', message: 'x', stack: '' };

    errorHandler(err, req, res, jest.fn());

    const response = res.json.mock.calls[0][0];
    expect(response.stack).toBeUndefined();

    process.env.NODE_ENV = origEnv;
  });
});
