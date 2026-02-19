/**
 * @fileoverview Formatter tanggal+waktu lokal berbasis dayjs (input UTC-aware)
 */

import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

function parseUtcDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  if (!text) return null;

  const normalizedBase = text.includes(' ') ? text.replace(' ', 'T') : text;
  const hasTimezoneSuffix = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(normalizedBase);
  const needsSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalizedBase);
  const withSeconds = needsSeconds ? `${normalizedBase}:00` : normalizedBase;
  const normalizedValue = hasTimezoneSuffix ? withSeconds : `${withSeconds}Z`;

  const parsed = dayjs(normalizedValue);
  return parsed.isValid() ? parsed.toDate() : null;
}

function formatLocalDateTime(value, { fallback = '-', separator = ' ' } = {}) {
  const date = parseUtcDate(value);
  if (!date) return fallback;

  return dayjs(date).format(`DD MMM YYYY${separator}HH.mm`);
}

export {
  parseUtcDate,
  formatLocalDateTime,
};
