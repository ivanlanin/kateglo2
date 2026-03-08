/**
 * @fileoverview Lightweight logger wrapper for backend runtime
 */

const levelRank = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function normalisasiLevel(level = 'info') {
  const nilai = String(level || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(levelRank, nilai) ? nilai : 'info';
}

const aktifLevel = normalisasiLevel(process.env.LOG_LEVEL || 'info');

function bolehLog(level) {
  return levelRank[level] <= levelRank[aktifLevel];
}

function serialisasiMeta(meta) {
  if (meta === undefined) return '';
  if (meta instanceof Error) {
    return meta.stack || meta.message || String(meta);
  }
  if (typeof meta === 'string') {
    return meta;
  }
  try {
    return JSON.stringify(meta);
  } catch (_error) {
    return String(meta);
  }
}

function formatPesan(level, message, meta) {
  const timestamp = new Date().toISOString();
  const pesanUtama = String(message || '');
  const metaTeks = serialisasiMeta(meta);
  return metaTeks
    ? `${timestamp} [${level}]: ${pesanUtama} ${metaTeks}`
    : `${timestamp} [${level}]: ${pesanUtama}`;
}

function tulis(consoleMethod, level, message, meta) {
  if (!bolehLog(level)) return;
  consoleMethod(formatPesan(level, message, meta));
}

const logger = {
  error(message, meta) {
    tulis(console.error, 'error', message, meta);
  },
  warn(message, meta) {
    tulis(console.warn, 'warn', message, meta);
  },
  info(message, meta) {
    tulis(console.info, 'info', message, meta);
  },
  debug(message, meta) {
    tulis(console.debug, 'debug', message, meta);
  },
};

module.exports = logger;
module.exports.__private = {
  bolehLog,
  formatPesan,
  normalisasiLevel,
  serialisasiMeta,
};
