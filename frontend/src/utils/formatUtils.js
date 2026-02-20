/**
 * @fileoverview Formatter umum: tanggal+waktu lokal dan teks lema
 */

import dayjs from 'dayjs';
import { Fragment, createElement } from 'react';
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

function pisahNomorHomonim(lema = '') {
  const teks = String(lema || '').trim();
  const match = teks.match(/^(.*)\s\((\d+)\)\s*$/);

  if (!match) {
    return { dasar: teks, nomor: null };
  }

  return {
    dasar: match[1],
    nomor: match[2],
  };
}

function formatLemaHomonim(lema = '') {
  const { dasar, nomor } = pisahNomorHomonim(lema);
  if (!nomor) return dasar;
  return createElement(Fragment, null, dasar, createElement('sup', null, nomor));
}

function formatNamaBidang(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';

  return text
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && lower === 'dan') return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function parseEntriGlosarium(value = '', renderTautan = null) {
  const text = String(value || '').trim();
  if (!text) return [];

  const parts = text
    .split(';')
    .map((part) => part.replace(/^\s*\d+\s*\.?\s*/, '').trim())
    .filter(Boolean);

  if (parts.length === 0) return [];

  const renderPart = (part, index) => {
    if (typeof renderTautan === 'function') {
      return renderTautan(part, index);
    }
    return part;
  };

  return parts.flatMap((part, index) => (index === 0 ? [renderPart(part, index)] : ['; ', renderPart(part, index)]));
}

export {
  parseUtcDate,
  formatLocalDateTime,
  pisahNomorHomonim,
  formatLemaHomonim,
  formatNamaBidang,
  parseEntriGlosarium,
};
