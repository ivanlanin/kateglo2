/**
 * @fileoverview Ringkasan total data untuk hasil admin
 */

function InfoTotal({ q, total, label = 'entri' }) {
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      {q ? `Pencarian "${q}": ` : ''}
      Total: <span className="font-semibold">{total.toLocaleString('id-ID')}</span> {label}
    </p>
  );
}

export default InfoTotal;