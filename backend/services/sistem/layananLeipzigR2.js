/**
 * @fileoverview Sinkronisasi artefak SQLite Leipzig dengan Cloudflare R2.
 */

const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { createWriteStream, createReadStream } = require('fs');
const { createGzip, createGunzip } = require('zlib');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../config/logger');
const LeipzigDb = require('../../db/leipzig');

let cachedClient = null;

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).trim().toLowerCase() === 'true';
}

function getActiveCorpora() {
  return String(process.env.LEIPZIG_ACTIVE_CORPORA || '')
    .split(',')
    .map((item) => LeipzigDb.normalizeCorpusId(item))
    .filter(Boolean);
}

function getR2Prefix() {
  return String(process.env.LEIPZIG_R2_PREFIX || 'leipzig/sqlite').trim().replace(/^\/+|\/+$/g, '');
}

function shouldSyncFromR2() {
  return parseBoolean(process.env.LEIPZIG_SYNC_FROM_R2, false);
}

function isSyncRequired() {
  return parseBoolean(process.env.LEIPZIG_SYNC_REQUIRED, false);
}

function getR2Config() {
  return {
    accountId: String(process.env.R2_ACCOUNT_ID || '').trim(),
    accessKeyId: String(process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: String(process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    endpoint: String(process.env.R2_ENDPOINT || '').trim(),
    region: String(process.env.R2_REGION || 'auto').trim() || 'auto',
    bucket: String(process.env.R2_BUCKET_PRIVATE || '').trim(),
  };
}

function isR2Configured() {
  const config = getR2Config();
  return Boolean(config.accessKeyId && config.secretAccessKey && config.endpoint && config.bucket);
}

function buildObjectKey(corpusId) {
  return `${getR2Prefix()}/${LeipzigDb.normalizeCorpusId(corpusId)}.sqlite.gz`;
}

function getS3Client() {
  if (cachedClient) return cachedClient;
  const config = getR2Config();
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedClient;
}

async function createTemporaryGzipFile(filePath) {
  const gzipPath = `${filePath}.${process.pid}.${Date.now()}.gz`;

  await pipeline(
    createReadStream(filePath),
    createGzip({ level: 9 }),
    createWriteStream(gzipPath)
  );

  return {
    gzipPath,
    contentLength: fs.statSync(gzipPath).size,
  };
}

async function uploadCorpusSqliteToR2(corpusId) {
  if (!isR2Configured()) throw new Error('Konfigurasi R2 belum lengkap');

  const normalized = LeipzigDb.normalizeCorpusId(corpusId);
  const databasePath = LeipzigDb.getCorpusDatabasePath(normalized);
  if (!fs.existsSync(databasePath)) {
    throw new Error(`File SQLite Leipzig tidak ditemukan: ${databasePath}`);
  }

  const config = getR2Config();
  const objectKey = buildObjectKey(normalized);
  const { gzipPath, contentLength } = await createTemporaryGzipFile(databasePath);

  try {
    await getS3Client().send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: createReadStream(gzipPath),
      ContentLength: contentLength,
      ContentType: 'application/gzip',
      CacheControl: 'private, max-age=0, no-cache',
      Metadata: {
        corpusid: normalized,
        uploadedat: new Date().toISOString(),
      },
    }));
  } finally {
    if (fs.existsSync(gzipPath)) fs.unlinkSync(gzipPath);
  }

  logger.info('Artefak Leipzig berhasil diunggah ke R2', {
    corpusId: normalized,
    bucket: config.bucket,
    objectKey,
  });

  return {
    corpusId: normalized,
    bucket: config.bucket,
    objectKey,
  };
}

async function downloadCorpusSqliteFromR2(corpusId, options = {}) {
  if (!isR2Configured()) throw new Error('Konfigurasi R2 belum lengkap');

  const normalized = LeipzigDb.normalizeCorpusId(corpusId);
  const databasePath = LeipzigDb.getCorpusDatabasePath(normalized);
  const force = parseBoolean(options.force, false);

  if (fs.existsSync(databasePath) && !force) {
    return {
      corpusId: normalized,
      skipped: true,
      path: databasePath,
      objectKey: buildObjectKey(normalized),
    };
  }

  const config = getR2Config();
  const objectKey = buildObjectKey(normalized);
  const tempPath = `${databasePath}.part`;

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  LeipzigDb.closeAllDatabases();

  const response = await getS3Client().send(new GetObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  }));

  await pipeline(response.Body, createGunzip(), createWriteStream(tempPath));
  if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
  fs.renameSync(tempPath, databasePath);

  logger.info('Artefak Leipzig berhasil diunduh dari R2', {
    corpusId: normalized,
    bucket: config.bucket,
    objectKey,
    path: databasePath,
  });

  return {
    corpusId: normalized,
    skipped: false,
    path: databasePath,
    objectKey,
  };
}

async function sinkronkanKorpusLeipzigSaatStartup() {
  if (!shouldSyncFromR2()) {
    logger.info('Sinkronisasi Leipzig dari R2 dinonaktifkan');
    return { attempted: false, results: [] };
  }

  if (!isR2Configured()) {
    const error = new Error('Sinkronisasi Leipzig aktif tetapi konfigurasi R2 belum lengkap');
    if (isSyncRequired()) throw error;
    logger.warn(error.message);
    return { attempted: false, results: [] };
  }

  const corpora = getActiveCorpora();
  if (corpora.length === 0) {
    logger.info('Tidak ada korpus Leipzig aktif yang perlu disinkronkan');
    return { attempted: false, results: [] };
  }

  const results = [];
  for (const corpusId of corpora) {
    try {
      results.push(await downloadCorpusSqliteFromR2(corpusId));
    } catch (error) {
      if (isSyncRequired()) throw error;
      logger.warn(`Gagal menyinkronkan korpus Leipzig ${corpusId}: ${error.message}`);
      results.push({ corpusId, error: error.message, skipped: false });
    }
  }

  return {
    attempted: true,
    results,
  };
}

module.exports = {
  uploadCorpusSqliteToR2,
  downloadCorpusSqliteFromR2,
  sinkronkanKorpusLeipzigSaatStartup,
  shouldSyncFromR2,
  isR2Configured,
  getActiveCorpora,
  buildObjectKey,
};

module.exports.__private = {
  createTemporaryGzipFile,
  parseBoolean,
  getR2Config,
  getR2Prefix,
  isSyncRequired,
  getS3Client,
};