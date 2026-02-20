/**
 * @fileoverview Utilities for URL/search/route params and Kamus path helpers.
 */

const publicMaxOffset = 1000;

function compactParams(values) {
  return Object.entries(values).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null) return accumulator;
    const stringValue = String(value).trim();
    if (!stringValue) return accumulator;
    accumulator[key] = stringValue;
    return accumulator;
  }, {});
}

function updateSearchParams(setSearchParams, values) {
  setSearchParams(compactParams(values));
}

function normalizeOffset(offset, maxOffset = publicMaxOffset) {
  const parsed = Number.parseInt(String(offset ?? 0), 10);
  const safeOffset = Number.isNaN(parsed) ? 0 : Math.max(parsed, 0);
  const safeMaxOffset = Math.max(Number(maxOffset) || 0, 0);
  return Math.min(safeOffset, safeMaxOffset);
}

function readOffsetFromSearchParams(searchParams, maxOffset = publicMaxOffset) {
  const rawOffset = searchParams?.get('offset') ?? 0;
  return normalizeOffset(rawOffset, maxOffset);
}

function updateSearchParamsWithOffset(setSearchParams, values, newOffset, maxOffset = publicMaxOffset) {
  const nextParams = compactParams(values);
  const offsetAman = normalizeOffset(newOffset, maxOffset);
  if (offsetAman > 0) {
    nextParams.offset = String(offsetAman);
  }
  setSearchParams(nextParams);
}

function parsePositiveIntegerParam(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalisasiIndeksKamus(teks = '') {
  const nilai = String(teks || '').trim();
  if (!nilai) return '';

  const tanpaNomor = nilai.replace(/\s*\([0-9]+\)\s*$/, '');
  const tanpaStripTepi = tanpaNomor.replace(/^-+/, '').replace(/-+$/, '');
  return tanpaStripTepi.trim() || nilai;
}

function buatPathDetailKamus(teks = '') {
  const indeks = normalisasiIndeksKamus(teks);
  if (!indeks) return '/kamus';
  return `/kamus/detail/${encodeURIComponent(indeks)}`;
}

export {
  buatPathDetailKamus,
  compactParams,
  normalisasiIndeksKamus,
  normalizeOffset,
  parsePositiveIntegerParam,
  publicMaxOffset,
  readOffsetFromSearchParams,
  updateSearchParams,
  updateSearchParamsWithOffset,
};