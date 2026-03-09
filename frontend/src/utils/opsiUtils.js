/**
 * @fileoverview Helper opsi lookup admin untuk dropdown berbasis id/nama
 */

export function ambilDaftarLookup(resp) {
  return Array.isArray(resp?.data) ? resp.data : [];
}

export function mapOpsiIdNama(data = [], { emptyLabel = '', includeEmpty = false } = {}) {
  const opsi = (Array.isArray(data) ? data : []).map((item) => ({
    value: String(item?.id ?? ''),
    label: String(item?.nama || item?.id || ''),
  }));

  if (!includeEmpty) return opsi;
  return [{ value: '', label: emptyLabel }, ...opsi];
}
