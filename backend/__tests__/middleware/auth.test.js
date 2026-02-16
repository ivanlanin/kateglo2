/**
 * @fileoverview Test middleware autentikasi JWT
 * @tested_in backend/middleware/auth.js
 */

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { authenticate } = require('../../middleware/auth');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('middleware/auth.authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  it('mengembalikan 401 jika authorization header kosong', () => {
    const req = { get: jest.fn().mockReturnValue('') };
    const res = createRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token autentikasi tidak ditemukan',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('mengembalikan 401 jika skema bukan Bearer', () => {
    const req = { get: jest.fn().mockReturnValue('Basic abc123') };
    const res = createRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('mengembalikan 503 jika JWT_SECRET belum diatur', () => {
    const req = { get: jest.fn().mockReturnValue('Bearer token-valid') };
    const res = createRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Konfigurasi autentikasi belum lengkap',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('mengembalikan 401 jika token tidak valid', () => {
    process.env.JWT_SECRET = 'secret-test';
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = { get: jest.fn().mockReturnValue('Bearer token-invalid') };
    const res = createRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token-invalid', 'secret-test');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token tidak valid atau kedaluwarsa',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('menetapkan req.user dan lanjut next jika token valid', () => {
    process.env.JWT_SECRET = 'secret-test';
    const payload = { sub: 'u-1', email: 'u@test.dev' };
    jwt.verify.mockReturnValue(payload);

    const req = { get: jest.fn().mockReturnValue('Bearer token-valid') };
    const res = createRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token-valid', 'secret-test');
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
