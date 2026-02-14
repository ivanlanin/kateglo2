/**
 * @fileoverview Test logger configuration
 * @tested_in backend/config/logger.js
 */

describe('config/logger', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('membuat logger dengan level dari env dan format stack/non-stack', () => {
    const originalLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'debug';

    const mockCreateLogger = jest.fn(() => ({ info: jest.fn(), error: jest.fn() }));
    const mockPrintf = jest.fn((formatter) => formatter);

    jest.doMock('winston', () => ({
      createLogger: mockCreateLogger,
      format: {
        combine: jest.fn((...args) => ({ combined: args })),
        timestamp: jest.fn(() => 'timestamp-format'),
        errors: jest.fn(() => 'errors-format'),
        printf: mockPrintf,
        colorize: jest.fn(() => 'colorize-format'),
        simple: jest.fn(() => 'simple-format')
      },
      transports: {
        Console: jest.fn((options) => ({ options }))
      }
    }));

    const logger = require('../../config/logger');

    expect(logger).toBeDefined();
    expect(mockCreateLogger).toHaveBeenCalledWith(expect.objectContaining({ level: 'debug' }));

    const formatter = mockPrintf.mock.calls[0][0];
    const formattedWithStack = formatter({
      level: 'error',
      message: 'gagal',
      timestamp: '2026-02-14T00:00:00.000Z',
      stack: 'stacktrace'
    });
    const formattedWithoutStack = formatter({
      level: 'info',
      message: 'ok',
      timestamp: '2026-02-14T00:00:00.000Z'
    });

    expect(formattedWithStack).toContain('stacktrace');
    expect(formattedWithoutStack).toBe('2026-02-14T00:00:00.000Z [info]: ok');

    process.env.LOG_LEVEL = originalLevel;
  });

  it('menggunakan level default info saat LOG_LEVEL tidak ada', () => {
    const originalLevel = process.env.LOG_LEVEL;
    delete process.env.LOG_LEVEL;

    const mockCreateLogger = jest.fn(() => ({ info: jest.fn() }));

    jest.doMock('winston', () => ({
      createLogger: mockCreateLogger,
      format: {
        combine: jest.fn((...args) => ({ combined: args })),
        timestamp: jest.fn(() => 'timestamp-format'),
        errors: jest.fn(() => 'errors-format'),
        printf: jest.fn((formatter) => formatter),
        colorize: jest.fn(() => 'colorize-format'),
        simple: jest.fn(() => 'simple-format')
      },
      transports: {
        Console: jest.fn((options) => ({ options }))
      }
    }));

    require('../../config/logger');

    expect(mockCreateLogger).toHaveBeenCalledWith(expect.objectContaining({ level: 'info' }));

    process.env.LOG_LEVEL = originalLevel;
  });
});
