/**
 * @fileoverview Layanan cache sederhana dengan Redis + fallback in-memory
 */

const { createClient } = require('redis');
const logger = require('../config/logger');

const memoryCache = new Map();

let redisClient = null;
let redisConnectPromise = null;

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
}

function getTtlSeconds() {
  const ttl = Number(process.env.CACHE_TTL_SECONDS) || 900;
  return Math.max(ttl, 1);
}

function isCacheEnabled() {
  return parseBoolean(process.env.CACHE_ENABLED, false);
}

function isMemoryFallbackEnabled() {
  return parseBoolean(process.env.CACHE_FALLBACK_MEMORY, true);
}

function getRedisUrl() {
  return (process.env.REDIS_URL || '').trim();
}

function cleanupExpiredMemoryCache(now = Date.now()) {
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

function getFromMemory(key) {
  if (!isMemoryFallbackEnabled()) return null;
  cleanupExpiredMemoryCache();
  const entry = memoryCache.get(key);
  return entry ? entry.value : null;
}

function setToMemory(key, value, ttlSeconds = getTtlSeconds()) {
  if (!isMemoryFallbackEnabled()) return;
  const ttlMs = Math.max(Number(ttlSeconds) || getTtlSeconds(), 1) * 1000;
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function deleteFromMemory(key) {
  memoryCache.delete(key);
}

async function getRedisClient() {
  if (!isCacheEnabled()) return null;

  const redisUrl = getRedisUrl();
  if (!redisUrl) return null;

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (error) => {
      logger.warn(`Redis error: ${error.message}`);
    });
  }

  if (!redisConnectPromise) {
    redisConnectPromise = redisClient.connect()
      .then(() => {
        logger.info('Redis cache connected');
      })
      .catch((error) => {
        logger.warn(`Redis cache unavailable: ${error.message}`);
        redisClient = null;
      })
      .finally(() => {
        redisConnectPromise = null;
      });
  }

  await redisConnectPromise;
  return redisClient?.isOpen ? redisClient : null;
}

async function getJson(key) {
  if (!isCacheEnabled()) return null;

  try {
    const client = await getRedisClient();
    if (client) {
      const raw = await client.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    }
  } catch (error) {
    logger.warn(`Redis get cache gagal (${key}): ${error.message}`);
  }

  return getFromMemory(key);
}

async function setJson(key, value, ttlSeconds = getTtlSeconds()) {
  if (!isCacheEnabled()) return;

  const ttl = Math.max(Number(ttlSeconds) || getTtlSeconds(), 1);

  try {
    const client = await getRedisClient();
    if (client) {
      await client.setEx(key, ttl, JSON.stringify(value));
      return;
    }
  } catch (error) {
    logger.warn(`Redis set cache gagal (${key}): ${error.message}`);
  }

  setToMemory(key, value, ttl);
}

async function delKey(key) {
  if (!isCacheEnabled()) return;

  let deleted = false;

  try {
    const client = await getRedisClient();
    if (client) {
      await client.del(key);
      deleted = true;
    }
  } catch (error) {
    logger.warn(`Redis delete cache gagal (${key}): ${error.message}`);
  }

  if (!deleted || isMemoryFallbackEnabled()) {
    deleteFromMemory(key);
  }
}

module.exports = {
  getJson,
  setJson,
  delKey,
  getTtlSeconds,
};

module.exports.__private = {
  parseBoolean,
  isCacheEnabled,
  isMemoryFallbackEnabled,
  getRedisUrl,
  cleanupExpiredMemoryCache,
  getFromMemory,
  setToMemory,
  deleteFromMemory,
  getRedisClient,
};
