/**
 * @fileoverview Test lightweight logger backend
 * @tested_in backend/config/logger.js
 */

describe('config/logger', () => {
  const originalLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    if (originalLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLevel;
    }
  });

  it('memakai level info default dan menulis meta object/error/string', () => {
    delete process.env.LOG_LEVEL;

    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    const logger = require('../../config/logger');

    logger.info('info jalan', { fitur: 'kamus' });
    logger.warn('warn jalan', 'teks tambahan');
    logger.error('error jalan', new Error('gagal'));
    logger.debug('debug tersembunyi');

    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[info]: info jalan {"fitur":"kamus"}'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[warn]: warn jalan teks tambahan'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[error]: error jalan Error: gagal'));
    expect(debugSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('mengekspos helper privat untuk normalisasi, serialisasi, dan format pesan', () => {
    delete process.env.LOG_LEVEL;

    const { __private } = require('../../config/logger');
    const errorDenganPesan = new Error('hanya pesan');
    const errorFallback = new Error('');
    const tanpaMeta = __private.formatPesan('info', undefined);
    const circular = {};

    errorDenganPesan.stack = '';
    errorFallback.stack = '';
    circular.self = circular;

    expect(__private.normalisasiLevel()).toBe('info');
    expect(__private.normalisasiLevel(' DEBUG ')).toBe('debug');
    expect(__private.normalisasiLevel(null)).toBe('info');
    expect(__private.normalisasiLevel('verbose')).toBe('info');

    expect(__private.serialisasiMeta()).toBe('');
    expect(__private.serialisasiMeta('teks')).toBe('teks');
    expect(__private.serialisasiMeta({ fitur: 'kamus' })).toBe('{"fitur":"kamus"}');
    expect(__private.serialisasiMeta(errorDenganPesan)).toBe('hanya pesan');
    expect(__private.serialisasiMeta(errorFallback)).toBe('Error');
    expect(__private.serialisasiMeta(circular)).toBe('[object Object]');

    expect(tanpaMeta).toContain('[info]: ');
    expect(tanpaMeta).not.toContain('undefined');
  });

  it('memakai fallback level info untuk env tidak valid dan menangani meta sirkular', () => {
    process.env.LOG_LEVEL = 'verbose';

    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const circular = {};
    circular.self = circular;

    const logger = require('../../config/logger');

    logger.info('meta sirkular', circular);
    logger.debug('debug tetap tersembunyi');

    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[info]: meta sirkular [object Object]'));
    expect(debugSpy).not.toHaveBeenCalled();

    infoSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('mengizinkan debug saat level debug aktif', () => {
    process.env.LOG_LEVEL = 'debug';

    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = require('../../config/logger');

    logger.debug('debug aktif');

    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('[debug]: debug aktif'));

    debugSpy.mockRestore();
  });

  it('menghitung izin level sesuai level aktif', () => {
    process.env.LOG_LEVEL = 'warn';

    const { __private } = require('../../config/logger');

    expect(__private.bolehLog('error')).toBe(true);
    expect(__private.bolehLog('warn')).toBe(true);
    expect(__private.bolehLog('info')).toBe(false);
  });
});