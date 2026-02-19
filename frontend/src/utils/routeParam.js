/**
 * Parse route param menjadi bilangan bulat positif.
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
export function parsePositiveIntegerParam(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
