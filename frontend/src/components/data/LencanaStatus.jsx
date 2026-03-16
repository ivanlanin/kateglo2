/**
 * @fileoverview Lencana status serbaguna untuk aktif/nonaktif dan ragu/pasti
 */

const konfigurasiStatus = {
  aktif: {
    true: {
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      label: 'Aktif',
    },
    false: {
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      label: 'Nonaktif',
    },
  },
  meragukan: {
    true: {
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      label: 'Ragu',
    },
    false: {
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      label: 'Pasti',
    },
  },
};

function LencanaStatus({ jenis = 'aktif', nilai, aktif, meragukan }) {
  const finalJenis = meragukan !== undefined ? 'meragukan' : jenis;
  const finalNilai = nilai ?? (meragukan !== undefined ? meragukan : aktif);
  const key = finalNilai ? 'true' : 'false';
  const konfigurasi = konfigurasiStatus[finalJenis]?.[key] || konfigurasiStatus.aktif.false;

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${konfigurasi.className}`}>
      {konfigurasi.label}
    </span>
  );
}

export default LencanaStatus;