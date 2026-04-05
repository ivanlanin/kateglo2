/**
 * @fileoverview Test sinkronisasi Leipzig R2.
 * @tested_in backend/services/sistem/layananLeipzigR2.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const { gzipSync, gunzipSync } = require('zlib');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kateglo-leipzig-r2-'));
}

async function bodyToBuffer(body) {
  if (Buffer.isBuffer(body)) return body;

  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function setupModule({ env = {}, sendImpl } = {}) {
  jest.resetModules();

  const originalEnv = { ...process.env };
  process.env = {
    ...originalEnv,
    R2_ACCOUNT_ID: 'account-id',
    R2_ACCESS_KEY_ID: 'access-key',
    R2_SECRET_ACCESS_KEY: 'secret-key',
    R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
    R2_REGION: 'auto',
    R2_BUCKET_PRIVATE: 'kateglo-corpus-private',
    LEIPZIG_R2_PREFIX: 'leipzig/sqlite',
    ...env,
  };

  const send = jest.fn(sendImpl);
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
  };

  class MockS3Client {
    send(command) {
      return send(command);
    }
  }

  class GetObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }

  class PutObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }

  jest.doMock('../../../config/logger', () => mockLogger);
  jest.doMock('@aws-sdk/client-s3', () => ({ S3Client: MockS3Client, GetObjectCommand, PutObjectCommand }));

  let service;
  jest.isolateModules(() => {
    service = require('../../../services/sistem/layananLeipzigR2');
  });

  return {
    service,
    send,
    mockLogger,
    restoreEnv() {
      process.env = originalEnv;
    },
  };
}

describe('services/sistem/layananLeipzigR2', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mengunggah file sqlite lokal sebagai gzip ke R2', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const sqlitePath = path.join(sqliteDir, 'ind_news_2024_10K.sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(sqlitePath, Buffer.from('sqlite-data-uji'));

    let uploadedBody = Buffer.alloc(0);
    const { service, send, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
      },
      sendImpl: async (command) => {
        uploadedBody = await bodyToBuffer(command.input.Body);
        return {};
      },
    });

    const result = await service.uploadCorpusSqliteToR2('ind_news_2024_10K');

    expect(result.objectKey).toBe('leipzig/sqlite/ind_news_2024_10K.sqlite.gz');
    expect(gunzipSync(uploadedBody).toString('utf8')).toBe('sqlite-data-uji');
    expect(send).toHaveBeenCalledTimes(1);
    restoreEnv();
  });

  it('gagal mengunggah jika konfigurasi R2 tidak lengkap', async () => {
    const { service, restoreEnv } = setupModule({
      env: {
        R2_ACCESS_KEY_ID: '',
      },
    });

    await expect(service.uploadCorpusSqliteToR2('ind_news_2024_10K')).rejects.toThrow('Konfigurasi R2 belum lengkap');
    restoreEnv();
  });

  it('gagal mengunggah jika file sqlite lokal tidak ditemukan', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const { service, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
      },
    });

    await expect(service.uploadCorpusSqliteToR2('ind_news_2024_10K')).rejects.toThrow('File SQLite Leipzig tidak ditemukan');
    restoreEnv();
  });

  it('tetap menghapus file gzip sementara ketika unggah ke R2 gagal', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const sqlitePath = path.join(sqliteDir, 'ind_news_2024_10K.sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(sqlitePath, Buffer.from('sqlite-data-uji'));

    const { service, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
      },
      sendImpl: async (command) => {
        await bodyToBuffer(command.input.Body);
        throw new Error('unggah gagal');
      },
    });

    await expect(service.uploadCorpusSqliteToR2('ind_news_2024_10K')).rejects.toThrow('unggah gagal');
    expect(fs.readdirSync(sqliteDir).filter((name) => name.endsWith('.gz'))).toEqual([]);
    restoreEnv();
  });

  it('melewati penghapusan file sementara jika gzip sudah tidak ada saat unggah selesai', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const sqlitePath = path.join(sqliteDir, 'ind_news_2024_10K.sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(sqlitePath, Buffer.from('sqlite-data-uji'));

    const originalExistsSync = fs.existsSync;
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((targetPath) => {
      if (String(targetPath).endsWith('.gz')) return false;
      return originalExistsSync(targetPath);
    });

    const { service, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
      },
      sendImpl: async (command) => {
        await bodyToBuffer(command.input.Body);
        return {};
      },
    });

    await expect(service.uploadCorpusSqliteToR2('ind_news_2024_10K')).resolves.toEqual({
      corpusId: 'ind_news_2024_10K',
      bucket: 'kateglo-corpus-private',
      objectKey: 'leipzig/sqlite/ind_news_2024_10K.sqlite.gz',
    });

    existsSyncSpy.mockRestore();
    restoreEnv();
  });

  it('mengunduh file gzip dari R2 dan mengekstraknya menjadi sqlite lokal', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const payload = gzipSync(Buffer.from('sqlite-data-r2'));

    const { service, send, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
      },
      sendImpl: async () => ({ Body: Readable.from(payload) }),
    });

    const result = await service.downloadCorpusSqliteFromR2('ind_news_2024_10K', { force: true });

    expect(result.skipped).toBe(false);
    expect(fs.readFileSync(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'), 'utf8')).toBe('sqlite-data-r2');
    expect(send).toHaveBeenCalledTimes(1);
    restoreEnv();
  });

  it('melewati unduhan jika file sqlite lokal sudah ada dan force tidak aktif', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const sqlitePath = path.join(sqliteDir, 'ind_news_2024_10K.sqlite');
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(sqlitePath, 'sudah-ada');

    const { service, send, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
      },
      sendImpl: async () => ({ Body: Readable.from([]) }),
    });

    await expect(service.downloadCorpusSqliteFromR2('ind_news_2024_10K')).resolves.toEqual({
      corpusId: 'ind_news_2024_10K',
      skipped: true,
      path: sqlitePath,
      objectKey: 'leipzig/sqlite/ind_news_2024_10K.sqlite.gz',
    });
    expect(send).not.toHaveBeenCalled();
    restoreEnv();
  });

  it('menimpa file sqlite lama dan file part ketika force aktif', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const sqlitePath = path.join(sqliteDir, 'ind_news_2024_10K.sqlite');
    const partPath = `${sqlitePath}.part`;
    fs.mkdirSync(sqliteDir, { recursive: true });
    fs.writeFileSync(sqlitePath, 'lama');
    fs.writeFileSync(partPath, 'part-lama');

    const { service, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
      },
      sendImpl: async () => ({ Body: Readable.from(gzipSync(Buffer.from('baru'))) }),
    });

    await expect(service.downloadCorpusSqliteFromR2('ind_news_2024_10K', { force: true })).resolves.toEqual({
      corpusId: 'ind_news_2024_10K',
      skipped: false,
      path: sqlitePath,
      objectKey: 'leipzig/sqlite/ind_news_2024_10K.sqlite.gz',
    });
    expect(fs.readFileSync(sqlitePath, 'utf8')).toBe('baru');
    expect(fs.existsSync(partPath)).toBe(false);
    restoreEnv();
  });

  it('gagal mengunduh jika konfigurasi R2 tidak lengkap', async () => {
    const { service, restoreEnv } = setupModule({
      env: {
        R2_ENDPOINT: '',
      },
    });

    await expect(service.downloadCorpusSqliteFromR2('ind_news_2024_10K')).rejects.toThrow('Konfigurasi R2 belum lengkap');
    restoreEnv();
  });

  it('sinkronisasi startup menghormati flag env dan helper private', async () => {
    const { service, mockLogger, restoreEnv } = setupModule({
      env: {
        LEIPZIG_SYNC_FROM_R2: 'false',
        LEIPZIG_R2_PREFIX: ' /leipzig/sqlite/ ',
        R2_REGION: '   ',
      },
      sendImpl: async () => ({ Body: Readable.from(gzipSync(Buffer.from('x'))) }),
    });

    expect(service.shouldSyncFromR2()).toBe(false);
    expect(service.isR2Configured()).toBe(true);
    expect(service.getActiveCorpora()).toEqual([]);
    expect(service.buildObjectKey('ind_news_2024_10K')).toBe('leipzig/sqlite/ind_news_2024_10K.sqlite.gz');
    expect(service.__private.parseBoolean(undefined, true)).toBe(true);
    expect(service.__private.parseBoolean('', true)).toBe(true);
    expect(service.__private.parseBoolean('true', false)).toBe(true);
    expect(service.__private.parseBoolean('false', true)).toBe(false);
    expect(service.__private.getR2Prefix()).toBe('leipzig/sqlite');
    expect(service.__private.getR2Config()).toEqual(expect.objectContaining({ region: 'auto' }));
    expect(service.__private.isSyncRequired()).toBe(false);
    expect(service.__private.getS3Client()).toBeTruthy();

    await expect(service.sinkronkanKorpusLeipzigSaatStartup()).resolves.toEqual({ attempted: false, results: [] });
    expect(mockLogger.info).toHaveBeenCalledWith('Sinkronisasi Leipzig dari R2 dinonaktifkan');
    restoreEnv();
  });

  it('helper private memakai fallback default saat env kosong', () => {
    const { service, restoreEnv } = setupModule({
      env: {
        R2_ACCOUNT_ID: '',
        R2_ACCESS_KEY_ID: '',
        R2_SECRET_ACCESS_KEY: '',
        R2_ENDPOINT: '',
        R2_REGION: '',
        R2_BUCKET_PRIVATE: '',
        LEIPZIG_R2_PREFIX: '',
      },
    });

    expect(service.__private.parseBoolean(undefined)).toBe(false);
    expect(service.__private.getR2Prefix()).toBe('leipzig/sqlite');
    expect(service.__private.getR2Config()).toEqual({
      accountId: '',
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      region: 'auto',
      bucket: '',
    });
    restoreEnv();
  });

  it('sinkronisasi startup memberi peringatan jika aktif tetapi konfigurasi R2 tidak lengkap', async () => {
    const { service, mockLogger, restoreEnv } = setupModule({
      env: {
        LEIPZIG_SYNC_FROM_R2: 'true',
        LEIPZIG_SYNC_REQUIRED: 'false',
        R2_BUCKET_PRIVATE: '',
      },
    });

    await expect(service.sinkronkanKorpusLeipzigSaatStartup()).resolves.toEqual({ attempted: false, results: [] });
    expect(mockLogger.warn).toHaveBeenCalledWith('Sinkronisasi Leipzig aktif tetapi konfigurasi R2 belum lengkap');
    restoreEnv();
  });

  it('sinkronisasi startup gagal keras jika konfigurasi wajib tetapi tidak lengkap', async () => {
    const { service, restoreEnv } = setupModule({
      env: {
        LEIPZIG_SYNC_FROM_R2: 'true',
        LEIPZIG_SYNC_REQUIRED: 'true',
        R2_BUCKET_PRIVATE: '',
      },
    });

    await expect(service.sinkronkanKorpusLeipzigSaatStartup()).rejects.toThrow('Sinkronisasi Leipzig aktif tetapi konfigurasi R2 belum lengkap');
    restoreEnv();
  });

  it('sinkronisasi startup berhenti tanpa aksi ketika tidak ada korpus aktif', async () => {
    const { service, mockLogger, restoreEnv } = setupModule({
      env: {
        LEIPZIG_SYNC_FROM_R2: 'true',
        LEIPZIG_ACTIVE_CORPORA: '',
      },
    });

    await expect(service.sinkronkanKorpusLeipzigSaatStartup()).resolves.toEqual({ attempted: false, results: [] });
    expect(mockLogger.info).toHaveBeenCalledWith('Tidak ada korpus Leipzig aktif yang perlu disinkronkan');
    restoreEnv();
  });

  it('sinkronisasi startup mengembalikan hasil sukses dan gagal per korpus saat mode tidak wajib', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    let callCount = 0;

    const { service, mockLogger, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
        LEIPZIG_SYNC_FROM_R2: 'true',
        LEIPZIG_SYNC_REQUIRED: 'false',
        LEIPZIG_ACTIVE_CORPORA: 'ind_news_2024_10K, bad_corpus ',
      },
      sendImpl: async () => {
        callCount += 1;
        if (callCount === 1) return { Body: Readable.from(gzipSync(Buffer.from('isi-pertama'))) };
        throw new Error('objek hilang');
      },
    });

    const hasil = await service.sinkronkanKorpusLeipzigSaatStartup();

    expect(hasil).toEqual({
      attempted: true,
      results: [
        {
          corpusId: 'ind_news_2024_10K',
          skipped: false,
          path: path.join(sqliteDir, 'ind_news_2024_10K.sqlite'),
          objectKey: 'leipzig/sqlite/ind_news_2024_10K.sqlite.gz',
        },
        {
          corpusId: 'bad_corpus',
          error: 'objek hilang',
          skipped: false,
        },
      ],
    });
    expect(fs.readFileSync(path.join(sqliteDir, 'ind_news_2024_10K.sqlite'), 'utf8')).toBe('isi-pertama');
    expect(mockLogger.warn).toHaveBeenCalledWith('Gagal menyinkronkan korpus Leipzig bad_corpus: objek hilang');
    restoreEnv();
  });

  it('sinkronisasi startup melempar error unduhan per korpus saat mode wajib', async () => {
    const rootDir = makeTempDir();
    const sqliteDir = path.join(rootDir, 'sqlite');
    const { service, restoreEnv } = setupModule({
      env: {
        LEIPZIG_DATA_DIR: rootDir,
        LEIPZIG_SQLITE_DIR: sqliteDir,
        LEIPZIG_SYNC_FROM_R2: 'true',
        LEIPZIG_SYNC_REQUIRED: 'true',
        LEIPZIG_ACTIVE_CORPORA: 'ind_news_2024_10K',
      },
      sendImpl: async () => {
        throw new Error('unduh gagal');
      },
    });

    await expect(service.sinkronkanKorpusLeipzigSaatStartup()).rejects.toThrow('unduh gagal');
    restoreEnv();
  });
});