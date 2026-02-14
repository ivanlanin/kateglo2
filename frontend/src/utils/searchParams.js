/**
 * @fileoverview Utilities for URL search params updates
 */

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

function updateSearchParamsWithOffset(setSearchParams, values, newOffset) {
  const nextParams = compactParams(values);
  if (newOffset > 0) {
    nextParams.offset = String(newOffset);
  }
  setSearchParams(nextParams);
}

export {
  compactParams,
  updateSearchParams,
  updateSearchParamsWithOffset,
};
