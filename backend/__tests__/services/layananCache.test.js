/**
 * @fileoverview Test layanan cache (Redis + memory fallback)
 * @tested_in backend/services/layananCache.js
 */

function setupModule({
  env = {},
  redis = {},
} = {}) {
  jest.resetModules();

  if (env.CACHE_ENABLED === undefined) delete process.env.CACHE_ENABLED;
  else process.env.CACHE_ENABLED = env.CACHE_ENABLED;
  if (env.CACHE_FALLBACK_MEMORY === undefined) delete process.env.CACHE_FALLBACK_MEMORY;
  else process.env.CACHE_FALLBACK_MEMORY = env.CACHE_FALLBACK_MEMORY;
  if (env.CACHE_TTL_SECONDS === undefined) delete process.env.CACHE_TTL_SECONDS;
  else process.env.CACHE_TTL_SECONDS = env.CACHE_TTL_SECONDS;
  if (env.REDIS_URL === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = env.REDIS_URL;

  const mockLogger = {
    warn: jest.fn(),
    info: jest.fn(),
  };

  const client = {
    isOpen: redis.isOpen ?? false,
    get: redis.get || jest.fn().mockResolvedValue(null),
    setEx: redis.setEx || jest.fn().mockResolvedValue(undefined),
    del: redis.del || jest.fn().mockResolvedValue(1),
    on: jest.fn(),
  };
  client.connect = redis.connect || jest.fn(async function connectDefault() {
    this.isOpen = true;
  });

  const createClient = jest.fn(() => client);

  jest.doMock('../../config/logger', () => mockLogger);
  jest.doMock('redis', () => ({ createClient }));

  let cache;
  jest.isolateModules(() => {
    cache = require('../../services/layananCache');
  });

  return { cache, client, createClient, mockLogger };
}

describe('services/layananCache', () => {
  afterEach(() => {
    delete process.env.CACHE_ENABLED;
    delete process.env.CACHE_FALLBACK_MEMORY;
    delete process.env.CACHE_TTL_SECONDS;
    delete process.env.REDIS_URL;
    jest.restoreAllMocks();
  });

  it('getTtlSeconds mengembalikan minimal 1 detik', () => {
    const { cache } = setupModule({
      env: { CACHE_ENABLED: 'true', CACHE_TTL_SECONDS: '-5' },
    });

    expect(cache.getTtlSeconds()).toBe(1);
  });

  it('helper private parseBoolean dan parser env menutup cabang default', async () => {
    const { cache } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: undefined,
        REDIS_URL: ' redis://localhost:6379 ',
      },
    });

    expect(cache.__private.parseBoolean(undefined, true)).toBe(true);
    expect(cache.__private.parseBoolean('', false)).toBe(false);
    expect(cache.__private.parseBoolean('true')).toBe(true);
    expect(cache.__private.parseBoolean('TRUE', false)).toBe(true);
    expect(cache.__private.isCacheEnabled()).toBe(true);
    expect(cache.__private.isMemoryFallbackEnabled()).toBe(true);
    expect(cache.__private.getRedisUrl()).toBe('redis://localhost:6379');
    await expect(cache.__private.getRedisClient()).resolves.toBeTruthy();
  });

  it('return null/no-op saat cache dinonaktifkan', async () => {
    const { cache } = setupModule({
      env: { CACHE_ENABLED: 'false' },
    });

    await expect(cache.getJson('kunci')).resolves.toBeNull();
    await expect(cache.setJson('kunci', { a: 1 })).resolves.toBeUndefined();
    await expect(cache.delKey('kunci')).resolves.toBeUndefined();
  });

  it('menganggap CACHE_ENABLED string kosong sebagai nonaktif', async () => {
    const { cache } = setupModule({
      env: {
        CACHE_ENABLED: '',
      },
    });

    await expect(cache.getJson('kosong')).resolves.toBeNull();
  });

  it('menggunakan memory fallback jika REDIS_URL kosong', async () => {
    const { cache, createClient } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        REDIS_URL: '',
      },
    });

    await cache.setJson('a', { nilai: 1 }, 20);
    await expect(cache.getJson('a')).resolves.toEqual({ nilai: 1 });
    await cache.delKey('a');
    await expect(cache.getJson('a')).resolves.toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('menghapus cache memory saat entry sudah kedaluwarsa', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1000);

    const { cache } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
      },
    });

    await cache.setJson('exp', { ok: true }, 1);
    nowSpy.mockReturnValue(2500);

    await expect(cache.getJson('exp')).resolves.toBeNull();
  });

  it('helper private memory cache menutup jalur set/get/delete dan ttl fallback', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(5000);
    const { cache } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        CACHE_TTL_SECONDS: '7',
      },
    });

    cache.__private.setToMemory('m', { ok: true }, 0);
    expect(cache.__private.getFromMemory('m')).toEqual({ ok: true });
    cache.__private.deleteFromMemory('m');
    expect(cache.__private.getFromMemory('m')).toBeNull();
    cache.__private.cleanupExpiredMemoryCache(10000);
    nowSpy.mockRestore();
  });

  it('helper private setToMemory menggunakan ttl default saat argumen ttl tidak dikirim', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(7000);
    const { cache } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        CACHE_TTL_SECONDS: '3',
      },
    });

    cache.__private.setToMemory('ttl-default', { ok: true });
    expect(cache.__private.getFromMemory('ttl-default')).toEqual({ ok: true });
    nowSpy.mockRestore();
  });

  it('helper private getRedisClient mengembalikan null ketika cache nonaktif', async () => {
    const { cache } = setupModule({ env: { CACHE_ENABLED: 'false' } });

    await expect(cache.__private.getRedisClient()).resolves.toBeNull();
  });

  it('setJson menggunakan TTL fallback saat ttlSeconds tidak valid', async () => {
    const { cache } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        REDIS_URL: '',
        CACHE_TTL_SECONDS: '11',
      },
    });

    await cache.setJson('ttl-fallback', { nilai: 1 }, 0);
    await expect(cache.getJson('ttl-fallback')).resolves.toEqual({ nilai: 1 });
  });

  it('tidak menyimpan ke memory saat fallback memory nonaktif dan Redis tidak tersedia', async () => {
    const { cache, createClient } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'false',
        REDIS_URL: '',
      },
    });

    await cache.setJson('tanpa-memory', { nilai: 10 }, 5);
    await expect(cache.getJson('tanpa-memory')).resolves.toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('menggunakan Redis ketika tersedia', async () => {
    const connect = jest.fn(async function connectRedis() {
      this.isOpen = true;
    });
    const get = jest.fn().mockResolvedValue('{"foo":123}');
    const setEx = jest.fn().mockResolvedValue(undefined);
    const del = jest.fn().mockResolvedValue(1);

    const redisConfig = {
      isOpen: false,
      connect,
      get,
      setEx,
      del,
    };

    const { cache, createClient, mockLogger } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'false',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: redisConfig,
    });

    await cache.setJson('x', { foo: 123 }, 30);
    await expect(cache.getJson('x')).resolves.toEqual({ foo: 123 });
    await cache.delKey('x');

    expect(createClient).toHaveBeenCalledWith({ url: 'redis://localhost:6379' });
    expect(setEx).toHaveBeenCalledWith('x', 30, JSON.stringify({ foo: 123 }));
    expect(get).toHaveBeenCalledWith('x');
    expect(del).toHaveBeenCalledWith('x');
    expect(mockLogger.info).toHaveBeenCalledWith('Redis cache connected');
  });

  it('mencatat warning saat event error Redis dipicu', async () => {
    const { cache, client, mockLogger } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'false',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: {
        isOpen: true,
      },
    });

    await cache.getJson('event');
    const errorHandler = client.on.mock.calls.find(([event]) => event === 'error')?.[1];
    errorHandler(new Error('event-error'));

    expect(mockLogger.warn).toHaveBeenCalledWith('Redis error: event-error');
  });

  it('menggunakan redisConnectPromise yang sama saat koneksi paralel', async () => {
    let resolveConnect;
    let client;
    const connect = jest.fn(() => new Promise((resolve) => {
      resolveConnect = () => {
        client.isOpen = true;
        resolve();
      };
    }));
    const get = jest.fn().mockResolvedValue(null);

    const setup = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'false',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: {
        isOpen: false,
        connect,
        get,
      },
    });
    const { cache } = setup;
    client = setup.client;

    const p1 = cache.getJson('p1');
    const p2 = cache.getJson('p2');
    resolveConnect();
    await Promise.all([p1, p2]);

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('fallback ke memory saat setEx Redis gagal', async () => {
    const setEx = jest.fn().mockRejectedValue(new Error('setEx gagal'));
    const connect = jest.fn(async function connectRedis() {
      this.isOpen = true;
    });

    const { cache, client, mockLogger } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: {
        isOpen: true,
        setEx,
        connect,
      },
    });

    await cache.setJson('set-gagal', { a: 9 }, 20);
    client.isOpen = false;
    connect.mockRejectedValueOnce(new Error('redis unavailable'));
    await expect(cache.getJson('set-gagal')).resolves.toEqual({ a: 9 });
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Redis set cache gagal (set-gagal):'));
  });

  it('fallback ke memory saat connect Redis gagal', async () => {
    const { cache, client, mockLogger } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: {
        connect: jest.fn().mockRejectedValue(new Error('redis down')),
      },
    });

    await cache.setJson('z', { nilai: 9 }, 15);
    await expect(cache.getJson('z')).resolves.toEqual({ nilai: 9 });

    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Redis cache unavailable: redis down'));
  });

  it('fallback ke memory saat payload Redis bukan JSON valid', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('seed memory'));

    const redisConfig = {
      isOpen: false,
      connect,
      get: jest.fn().mockResolvedValue('bukan-json'),
      setEx: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(1),
    };

    const { cache, client, mockLogger } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: redisConfig,
    });

    await cache.setJson('j', { nilai: 7 }, 10);
    client.connect = jest.fn(async function openRedis() {
      this.isOpen = true;
    });
    client.isOpen = true;
    await expect(cache.getJson('j')).resolves.toEqual({ nilai: 7 });

    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Redis get cache gagal (j):'));
  });

  it('tetap menghapus memory ketika Redis delete gagal', async () => {
    const { cache, mockLogger } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'true',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: {
        isOpen: true,
        del: jest.fn().mockRejectedValue(new Error('del fail')),
      },
    });

    await cache.setJson('hapus', { a: 1 });
    await cache.delKey('hapus');
    await expect(cache.getJson('hapus')).resolves.toBeNull();

    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Redis delete cache gagal (hapus):'));
  });

  it('delKey tidak menyentuh memory saat Redis sukses dan fallback memory nonaktif', async () => {
    const { cache } = setupModule({
      env: {
        CACHE_ENABLED: 'true',
        CACHE_FALLBACK_MEMORY: 'false',
        REDIS_URL: 'redis://localhost:6379',
      },
      redis: {
        isOpen: true,
        del: jest.fn().mockResolvedValue(1),
      },
    });

    await expect(cache.delKey('sukses')).resolves.toBeUndefined();
  });
});
