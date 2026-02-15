/**
 * @fileoverview Test konfigurasi SSL db/index berdasarkan env
 * @tested_in backend/db/index.js
 */

describe('db/index env SSL config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('mengaktifkan SSL saat DATABASE_SSL=true', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@example.com/db';
    process.env.DATABASE_SSL = 'true';

    const mockPoolFactory = jest.fn(() => ({ query: jest.fn(), on: jest.fn(), end: jest.fn() }));

    jest.doMock('pg', () => ({
      Pool: mockPoolFactory,
    }));
    jest.doMock('../../config/logger', () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }));
    jest.unmock('../../db/index.js');

    jest.isolateModules(() => {
      require('../../db/index.js');
    });

    expect(mockPoolFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: false },
      })
    );
  });

  it('mengaktifkan SSL saat DATABASE_URL berisi render.com', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@hostname.render.com/db';
    delete process.env.DATABASE_SSL;

    const mockPoolFactory = jest.fn(() => ({ query: jest.fn(), on: jest.fn(), end: jest.fn() }));

    jest.doMock('pg', () => ({
      Pool: mockPoolFactory,
    }));
    jest.doMock('../../config/logger', () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }));
    jest.unmock('../../db/index.js');

    jest.isolateModules(() => {
      require('../../db/index.js');
    });

    expect(mockPoolFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: false },
      })
    );
  });

  it('mengaktifkan SSL saat PGSSLMODE=require', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@example.com/db';
    process.env.PGSSLMODE = 'require';
    delete process.env.DATABASE_SSL;

    const mockPoolFactory = jest.fn(() => ({ query: jest.fn(), on: jest.fn(), end: jest.fn() }));

    jest.doMock('pg', () => ({
      Pool: mockPoolFactory,
    }));
    jest.doMock('../../config/logger', () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }));
    jest.unmock('../../db/index.js');

    jest.isolateModules(() => {
      require('../../db/index.js');
    });

    expect(mockPoolFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: { rejectUnauthorized: false },
      })
    );
  });
});
