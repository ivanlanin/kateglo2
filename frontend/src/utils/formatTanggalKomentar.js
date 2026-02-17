/**
 * @fileoverview Formatter tanggal+waktu komentar (lokal pembaca)
 */

function parseKomentarDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  if (!text) return null;

  const normalizedBase = text.includes(' ') ? text.replace(' ', 'T') : text;
  const hasTimezoneSuffix = /(?:[zZ]|[+\-]\d{2}:?\d{2})$/.test(normalizedBase);
  const normalizedValue = hasTimezoneSuffix ? normalizedBase : `${normalizedBase}Z`;

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTanggalKomentar(value) {
  const date = parseKomentarDate(value);
  if (!date) return '-';

  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const waktu = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(':', '.');

  return `${tanggal} ${waktu}`;
}
