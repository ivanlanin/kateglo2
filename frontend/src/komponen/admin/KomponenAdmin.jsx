/**
 * @fileoverview Komponen, hook, dan utilitas bersama untuk halaman admin
 */

import { useState } from 'react';
import Paginasi from '../bersama/Paginasi';

// ─── Utilitas ────────────────────────────────────────────────────────────────

/**
 * Potong teks panjang, tambahkan elipsis
 * @param {string} teks - Teks asli
 * @param {number} maks - Panjang maksimum
 * @returns {string}
 */
export function potongTeks(teks, maks = 80) {
  if (!teks) return '—';
  return teks.length > maks ? teks.slice(0, maks) + ' …' : teks;
}

// ─── Custom Hook ─────────────────────────────────────────────────────────────

/**
 * Hook state pencarian + paginasi untuk halaman admin
 * @param {number} batasPerHalaman - Limit per page (default 50)
 */
export function usePencarianAdmin(batasPerHalaman = 50) {
  const [cari, setCari] = useState('');
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);

  const kirimCari = (nilai) => {
    const val = nilai ?? cari;
    setQ(val);
    setOffset(0);
  };

  const hapusCari = () => {
    setCari('');
    setQ('');
    setOffset(0);
  };

  return { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit: batasPerHalaman };
}

// ─── Komponen ────────────────────────────────────────────────────────────────

/**
 * Form pencarian admin
 */
export function KotakCariAdmin({ nilai, onChange, onCari, onHapus, placeholder = 'Cari …' }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onCari(nilai);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <input
        type="text"
        value={nilai}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg-input dark:text-white focus:outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Cari
      </button>
      {nilai && (
        <button
          type="button"
          onClick={onHapus}
          className="px-3 py-2 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg text-sm"
        >
          ✕
        </button>
      )}
    </form>
  );
}

/**
 * Info ringkasan total
 */
export function InfoTotal({ q, total, label = 'entri' }) {
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      {q ? `Pencarian "${q}": ` : ''}
      Total: <span className="font-semibold">{total.toLocaleString('id-ID')}</span> {label}
    </p>
  );
}

/**
 * Badge status aktif/nonaktif
 */
export function BadgeStatus({ aktif }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
        aktif
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {aktif ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

/**
 * Tabel admin generik dengan kolom yang bisa dikonfigurasi
 *
 * @param {{ key: string, label: string, render?: (item) => ReactNode }[]} kolom
 * @param {Array} data - Baris data
 * @param {boolean} isLoading
 * @param {boolean} isError
 * @param {string} kunciId - Nama properti untuk key baris (default 'id')
 * @param {number} total - Total data untuk paginasi
 * @param {number} limit
 * @param {number} offset
 * @param {(offset: number) => void} onOffset
 * @param {(item: Object) => void} [onKlikBaris] - Callback klik baris (opsional)
 */
export function TabelAdmin({
  kolom,
  data,
  isLoading,
  isError,
  kunciId = 'id',
  total = 0,
  limit,
  offset,
  onOffset,
  onKlikBaris,
}) {
  const thClass =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider';
  const tdClass = 'px-6 py-3 text-sm text-gray-700 dark:text-gray-300';

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
        Memuat data …
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-8 text-center text-red-600 dark:text-red-400">
        Gagal memuat data.
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
        Tidak ada data.
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg">
              <tr>
                {kolom.map((k) => (
                  <th key={k.key} className={thClass}>
                    {k.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item) => (
                <tr
                  key={item[kunciId]}
                  onClick={onKlikBaris ? () => onKlikBaris(item) : undefined}
                  className={`hover:bg-gray-50 dark:hover:bg-dark-bg${onKlikBaris ? ' cursor-pointer' : ''}`}
                >
                  {kolom.map((k) => (
                    <td key={k.key} className={tdClass}>
                      {k.render ? k.render(item) : (item[k.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {total > 0 && limit && onOffset && (
        <div className="mt-4">
          <Paginasi total={total} limit={limit} offset={offset} onChange={onOffset} />
        </div>
      )}
    </>
  );
}
