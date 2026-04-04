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

function normalizeLocalDateTimeValue(value, { fallback = null } = {}) {
  if (!value) return fallback;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    return dayjs(value).format('YYYY-MM-DDTHH:mm:ss');
  }

  const text = String(value).trim();
  if (!text) return fallback;

  const normalized = text.includes(' ') ? text.replace(' ', 'T') : text;
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/);
  if (!match) return fallback;

  return `${match[1]}T${match[2]}:${match[3] || '00'}`;
}

function formatWallClockDateTime(value, { fallback = '-', separator = ' ' } = {}) {
  const normalized = normalizeLocalDateTimeValue(value, { fallback: null });
  if (!normalized) return fallback;

  const parsed = dayjs(normalized);
  return parsed.isValid() ? parsed.format(`DD MMM YYYY${separator}HH.mm`) : fallback;
}

function formatBilanganRibuan(value, { fallback = '0' } = {}) {
  if (value === null || value === undefined || value === '') return fallback;
  const angka = Number(value);
  if (!Number.isFinite(angka)) return fallback;
  return new Intl.NumberFormat('id-ID').format(Math.trunc(angka));
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

function splitEntriGlosarium(value = '') {
  const text = String(value || '')
    .replace(/\s*;\s*/g, ';')
    .trim();
  if (!text) return [];

  return text
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

function tokenizeKurung(value = '') {
  const text = String(value || '');
  if (!text) return [];

  const regex = /\([^()]*\)/g;
  const chunks = [];
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      chunks.push({ text: text.slice(lastIndex, match.index), isKurung: false });
    }
    chunks.push({ text: match[0], isKurung: true });
    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    chunks.push({ text: text.slice(lastIndex), isKurung: false });
  }

  return chunks;
}

function parseEntriGlosarium(value = '', renderTautan = null) {
  const parts = splitEntriGlosarium(value);

  if (parts.length === 0) return [];

  const renderPart = (part, index) => {
    if (typeof renderTautan === 'function') {
      return renderTautan(part, index);
    }
    return part;
  };

  return parts.flatMap((part, index) => (index === 0 ? [renderPart(part, index)] : ['; ', renderPart(part, index)]));
}

function renderEntriGlosariumTertaut(value = '', renderTautan = null) {
  const parts = splitEntriGlosarium(value);
  if (parts.length === 0) return [];

  const renderTextChunk = (chunk, info) => {
    if (typeof renderTautan !== 'function') return chunk;

    const leading = chunk.match(/^\s*/)?.[0] || '';
    const trailing = chunk.match(/\s*$/)?.[0] || '';
    const textUtama = chunk.trim();
    if (!textUtama) return chunk;

    const rendered = [];
    if (leading) rendered.push(leading);
    rendered.push(renderTautan(textUtama, info));
    if (trailing) rendered.push(trailing);
    return rendered;
  };

  return parts.flatMap((part, partIndex) => {
    const tokens = tokenizeKurung(part);
    const renderedPart = tokens.flatMap((token, tokenIndex) => {
      if (token.isKurung) return [token.text];
      return renderTextChunk(token.text, { part, partIndex, tokenIndex });
    });

    return partIndex === 0 ? renderedPart : ['; ', ...renderedPart];
  });
}

export {
  parseUtcDate,
  formatLocalDateTime,
  normalizeLocalDateTimeValue,
  formatWallClockDateTime,
  formatBilanganRibuan,
  pisahNomorHomonim,
  formatLemaHomonim,
  formatNamaBidang,
  tokenizeKurung,
  parseEntriGlosarium,
  renderEntriGlosariumTertaut,
};
