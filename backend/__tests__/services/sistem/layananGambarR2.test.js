/**
 * @fileoverview Test layanan unggah gambar R2
 * @tested_in backend/services/sistem/layananGambarR2.js
 */

function setupModule(env = {}) {
  jest.resetModules();

  const originalEnv = { ...process.env };
  process.env = {
    ...originalEnv,
    R2_ACCESS_KEY_ID: ' key ',
    R2_SECRET_ACCESS_KEY: ' secret ',
    R2_ENDPOINT: ' https://example.r2.cloudflarestorage.com ',
    R2_REGION: ' auto ',
    R2_BUCKET_PUBLIC: ' public-bucket ',
    R2_BUCKET_PUBLIC_URL: ' https://cdn.example.com/ ',
    ...env,
  };

  const send = jest.fn().mockResolvedValue({});
  const mockLogger = { info: jest.fn() };

  class MockS3Client {
    constructor(config) {
      this.config = config;
    }

    send(command) {
      return send(command);
    }
  }

  class PutObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }

  jest.doMock('../../../config/logger', () => mockLogger);
  jest.doMock('@aws-sdk/client-s3', () => ({ S3Client: MockS3Client, PutObjectCommand }));

  let service;
  jest.isolateModules(() => {
    service = require('../../../services/sistem/layananGambarR2');
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

describe('services/sistem/layananGambarR2', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('membaca konfigurasi env, memetakan ekstensi, dan me-reuse klien S3', () => {
    const { service, restoreEnv } = setupModule();
    const { __private } = service;

    expect(__private.getR2Config()).toEqual({
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      endpoint: 'https://example.r2.cloudflarestorage.com',
      region: 'auto',
      bucket: 'public-bucket',
      publicUrl: 'https://cdn.example.com',
    });
    expect(service.isR2Configured()).toBe(true);
    expect(__private.ekstensiBerdasarkanTipe('image/jpeg')).toBe('jpg');
    expect(__private.ekstensiBerdasarkanTipe('image/png')).toBe('png');
    expect(__private.ekstensiBerdasarkanTipe('image/webp')).toBe('webp');
    expect(__private.ekstensiBerdasarkanTipe('image/gif')).toBe('jpg');

    const clientA = __private.getS3Client();
    const clientB = __private.getS3Client();
    expect(clientA).toBe(clientB);
    expect(clientA.config).toEqual({
      region: 'auto',
      endpoint: 'https://example.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      },
    });

    __private.resetCachedClient();
    restoreEnv();
  });

  it('mengembalikan fallback config saat env kosong', () => {
    const { service, restoreEnv } = setupModule({
      R2_ACCESS_KEY_ID: '',
      R2_SECRET_ACCESS_KEY: '',
      R2_ENDPOINT: '',
      R2_REGION: '   ',
      R2_BUCKET_PUBLIC: '',
      R2_BUCKET_PUBLIC_URL: '',
    });

    expect(service.__private.getR2Config()).toEqual({
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      region: 'auto',
      bucket: '',
      publicUrl: '',
    });
    expect(service.isR2Configured()).toBe(false);

    service.__private.resetCachedClient();
    restoreEnv();
  });

  it('memakai fallback region auto ketika env region benar-benar kosong', () => {
    const { service, restoreEnv } = setupModule({ R2_REGION: '' });

    expect(service.__private.getR2Config().region).toBe('auto');

    service.__private.resetCachedClient();
    restoreEnv();
  });

  it('mengunggah gambar valid dan membentuk URL publik yang benar', async () => {
    const { service, send, mockLogger, restoreEnv } = setupModule();
    const { __private } = service;
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    jest.spyOn(require('crypto'), 'randomBytes').mockReturnValue(Buffer.from('1234567890abcdef', 'hex'));

    const hasil = await service.unggahGambarArtikel(
      Buffer.from('isi-gambar'),
      'Foto Uji!!.png',
      'image/png'
    );

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'public-bucket',
      Key: 'artikel/gambar/1700000000000-1234567890abcdef-foto-uji-.png',
      Body: Buffer.from('isi-gambar'),
      ContentType: 'image/png',
    });
    expect(hasil).toEqual({
      url: 'https://cdn.example.com/artikel/gambar/1700000000000-1234567890abcdef-foto-uji-.png',
      key: 'artikel/gambar/1700000000000-1234567890abcdef-foto-uji-.png',
    });
    expect(mockLogger.info).toHaveBeenCalledWith('Gambar artikel diunggah ke R2: artikel/gambar/1700000000000-1234567890abcdef-foto-uji-.png');

    __private.resetCachedClient();
    restoreEnv();
  });

  it('memakai nama file bawaan ketika originalname tidak diberikan', async () => {
    const { service, send, restoreEnv } = setupModule();
    jest.spyOn(Date, 'now').mockReturnValue(1700000000001);
    jest.spyOn(require('crypto'), 'randomBytes').mockReturnValue(Buffer.from('fedcba0987654321', 'hex'));

    const hasil = await service.unggahGambarArtikel(Buffer.from('isi'), undefined, 'image/jpeg');

    expect(send.mock.calls[0][0].input.Key).toBe('artikel/gambar/1700000000001-fedcba0987654321-gambar.jpg');
    expect(hasil).toEqual({
      url: 'https://cdn.example.com/artikel/gambar/1700000000001-fedcba0987654321-gambar.jpg',
      key: 'artikel/gambar/1700000000001-fedcba0987654321-gambar.jpg',
    });

    service.__private.resetCachedClient();
    restoreEnv();
  });

  it('menolak tipe file tidak valid, ukuran terlalu besar, dan konfigurasi kosong', async () => {
    const configured = setupModule();
    await expect(configured.service.unggahGambarArtikel(Buffer.from('x'), 'x.gif', 'image/gif')).rejects.toMatchObject({
      code: 'INVALID_TYPE',
    });
    await expect(configured.service.unggahGambarArtikel(Buffer.alloc((2 * 1024 * 1024) + 1), 'x.png', 'image/png')).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
    configured.service.__private.resetCachedClient();
    configured.restoreEnv();

    const unconfigured = setupModule({ R2_BUCKET_PUBLIC_URL: '   ' });
    expect(unconfigured.service.isR2Configured()).toBe(false);
    await expect(unconfigured.service.unggahGambarArtikel(Buffer.from('x'), 'x.png', 'image/png')).rejects.toMatchObject({
      code: 'R2_NOT_CONFIGURED',
    });
    unconfigured.service.__private.resetCachedClient();
    unconfigured.restoreEnv();
  });
});