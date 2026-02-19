/**
 * @fileoverview Utilities for URL search params updates
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

export {
  compactParams,
  publicMaxOffset,
  normalizeOffset,
  readOffsetFromSearchParams,
  updateSearchParams,
  updateSearchParamsWithOffset,
};
