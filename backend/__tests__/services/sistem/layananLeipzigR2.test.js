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

  it('sinkronisasi startup menghormati flag env dan helper private', async () => {
    const { service, mockLogger, restoreEnv } = setupModule({
      env: {
        LEIPZIG_SYNC_FROM_R2: 'false',
      },
      sendImpl: async () => ({ Body: Readable.from(gzipSync(Buffer.from('x'))) }),
    });

    expect(service.shouldSyncFromR2()).toBe(false);
    expect(service.isR2Configured()).toBe(true);
    expect(service.getActiveCorpora()).toEqual([]);
    expect(service.buildObjectKey('ind_news_2024_10K')).toBe('leipzig/sqlite/ind_news_2024_10K.sqlite.gz');
    expect(service.__private.parseBoolean(undefined, true)).toBe(true);
    expect(service.__private.getR2Prefix()).toBe('leipzig/sqlite');
    expect(service.__private.isSyncRequired()).toBe(false);
    expect(service.__private.getS3Client()).toBeTruthy();

    await expect(service.sinkronkanKorpusLeipzigSaatStartup()).resolves.toEqual({ attempted: false, results: [] });
    expect(mockLogger.info).toHaveBeenCalledWith('Sinkronisasi Leipzig dari R2 dinonaktifkan');
    restoreEnv();
  });
});