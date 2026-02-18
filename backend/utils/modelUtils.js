/**
 * @fileoverview Utilitas bersama untuk model database
 */

/**
 * Normalisasi nilai truthy/falsy lintas tipe ke boolean.
 * @param {unknown} value - Nilai input
 * @param {boolean} [defaultValue=true] - Nilai default untuk input nullish/tidak dikenali
 * @returns {boolean}
 */
function normalizeBoolean(value, defaultValue = true) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'ya', 'yes', 'aktif'].includes(normalized);
  }
  return defaultValue;
}

/**
 * Parse nilai total hitungan SQL (COUNT) dengan fallback aman.
 * @param {unknown} value - Nilai total dari database
 * @returns {number}
 */
function parseCount(value) {
  const parsed = Number.parseInt(value ?? '0', 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

module.exports = {
  normalizeBoolean,
  parseCount,
};
