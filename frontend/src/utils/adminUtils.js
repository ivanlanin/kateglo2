/**
 * @fileoverview Helper umum untuk halaman admin
 */

function potongTeks(teks, maks = 80) {
  if (!teks) return '—';
  return teks.length > maks ? teks.slice(0, maks) + ' …' : teks;
}

function validateRequiredFields(data, fields = []) {
  for (const field of fields) {
    const value = data?.[field.name];
    if (!String(value ?? '').trim()) {
      return `${field.label} wajib diisi`;
    }
  }
  return '';
}

function getApiErrorMessage(error, fallback = 'Terjadi kesalahan') {
  return error?.response?.data?.error || error?.response?.data?.message || fallback;
}

const opsiFilterStatusAktif = [
  { value: '', label: '—Status—' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

const opsiFilterMeragukan = [
  { value: '', label: '—Meragukan—' },
  { value: '1', label: 'Ragu' },
  { value: '0', label: 'Pasti' },
];

export {
  potongTeks,
  validateRequiredFields,
  getApiErrorMessage,
  opsiFilterStatusAktif,
  opsiFilterMeragukan,
};