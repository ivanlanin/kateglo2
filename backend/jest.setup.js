/**
 * @fileoverview Global Jest setup untuk test environment Kateglo backend
 *
 * Mengkonfigurasi test isolation, console capture, dan global mock
 * untuk database. Diload otomatis sebelum semua test via setupFilesAfterEnv.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Console capture untuk output bersih
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

global.__capturedConsole = [];

function captureConsole(method, args) {
  global.__capturedConsole.push({ method, args, timestamp: Date.now() });
}

global.printCapturedConsole = function () {
  if (!global.__capturedConsole.length) return;
  originalConsole.log('--- Captured console output ---');
  for (const entry of global.__capturedConsole) {
    originalConsole[entry.method].apply(console, entry.args);
  }
  originalConsole.log('--- End captured output ---');
};

global.clearCapturedConsole = function () {
  global.__capturedConsole = [];
};

beforeAll(() => {
  if (process.env.JEST_QUIET_MODE !== 'false') {
    console.log = (...args) => captureConsole('log', args);
    console.info = (...args) => captureConsole('info', args);
    console.warn = (...args) => captureConsole('warn', args);
    console.error = (...args) => captureConsole('error', args);
    console.debug = (...args) => captureConsole('debug', args);
  }
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

/**
 * Global mock untuk db/index.js
 * Chainable QueryBuilder mock yang cocok dengan API asli
 */
jest.mock('./db/index.js', () => {
  const createQueryBuilder = () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [], count: 0 })
    };
    return chain;
  };

  const mockPool = {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn()
    }),
    end: jest.fn().mockResolvedValue()
  };

  return {
    pool: mockPool,
    from: jest.fn(() => createQueryBuilder()),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    execute: jest.fn().mockResolvedValue({ data: [], count: 0 }),
    close: jest.fn().mockResolvedValue()
  };
});
