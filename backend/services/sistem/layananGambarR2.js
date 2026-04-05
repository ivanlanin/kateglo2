/**
 * @fileoverview Unggah gambar artikel ke Cloudflare R2 public bucket.
 */

const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../config/logger');

const UKURAN_MAKS = 2 * 1024 * 1024; // 2 MB
const TIPE_DIIZINKAN = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PREFIX = 'artikel/gambar';

let cachedClient = null;

function getR2Config() {
  return {
    accessKeyId: String(process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: String(process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    endpoint: String(process.env.R2_ENDPOINT || '').trim(),
    region: String(process.env.R2_REGION || 'auto').trim() || 'auto',
    bucket: String(process.env.R2_BUCKET_PUBLIC || '').trim(),
    publicUrl: String(process.env.R2_BUCKET_PUBLIC_URL || '').trim().replace(/\/$/, ''),
  };
}

function isR2Configured() {
  const c = getR2Config();
  return Boolean(c.accessKeyId && c.secretAccessKey && c.endpoint && c.bucket && c.publicUrl);
}

function getS3Client() {
  if (cachedClient) return cachedClient;
  const c = getR2Config();
  cachedClient = new S3Client({
    region: c.region,
    endpoint: c.endpoint,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
  return cachedClient;
}

function ekstensiBerdasarkanTipe(mimeType) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return map[mimeType] || 'jpg';
}

async function unggahGambarArtikel(buffer, originalname, mimeType) {
  if (!isR2Configured()) {
    throw Object.assign(new Error('R2 tidak dikonfigurasi'), { code: 'R2_NOT_CONFIGURED' });
  }
  if (!TIPE_DIIZINKAN.has(mimeType)) {
    throw Object.assign(new Error('Hanya gambar JPEG, PNG, atau WebP yang diizinkan'), { code: 'INVALID_TYPE' });
  }
  if (buffer.length > UKURAN_MAKS) {
    throw Object.assign(new Error('Ukuran gambar melebihi batas 2 MB'), { code: 'FILE_TOO_LARGE' });
  }

  const ekstensi = ekstensiBerdasarkanTipe(mimeType);
  const hash = crypto.randomBytes(8).toString('hex');
  const baseName = path
    .basename(originalname || 'gambar', path.extname(originalname || ''))
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  const objectKey = `${PREFIX}/${Date.now()}-${hash}-${baseName}.${ekstensi}`;

  const config = getR2Config();
  await getS3Client().send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType,
  }));

  const url = `${config.publicUrl}/${objectKey}`;
  logger.info(`Gambar artikel diunggah ke R2: ${objectKey}`);
  return { url, key: objectKey };
}

module.exports = {
  unggahGambarArtikel,
  isR2Configured,
  __private: {
    getR2Config,
    getS3Client,
    ekstensiBerdasarkanTipe,
    resetCachedClient() {
      cachedClient = null;
    },
  },
};
