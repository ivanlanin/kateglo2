/**
 * @fileoverview Halaman kelola pengguna (admin)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { useDaftarPengguna, useDaftarPeran, useUbahPeran } from '../../api/apiAdmin';

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PenggunaAdmin() {
  const { user, logout } = useAuth();
  const [halaman, setHalaman] = useState(0);
  const batasPerHalaman = 20;

  const { data: penggunaData, isLoading, isError } = useDaftarPengguna({
    limit: batasPerHalaman,
    offset: halaman * batasPerHalaman,
  });

  const { data: peranData } = useDaftarPeran();
  const ubahPeran = useUbahPeran();

  const daftarPengguna = penggunaData?.data || [];
  const total = penggunaData?.total || 0;
  const daftarPeran = peranData?.data || [];
  const totalHalaman = Math.ceil(total / batasPerHalaman);

  const handleUbahPeran = (penggunaId, peranId) => {
    ubahPeran.mutate({ penggunaId, peranId });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      {/* Header */}
      <header className="bg-white dark:bg-dark-bg-elevated shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                &larr; Dasbor
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Kelola Pengguna
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email || user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow">
          {/* Summary */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold">{total}</span> pengguna
            </p>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">Gagal memuat data pengguna.</div>
          ) : daftarPengguna.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Belum ada pengguna.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-bg">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Surel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Peran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Login Terakhir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Terdaftar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {daftarPengguna.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {p.foto ? (
                            <img
                              src={p.foto}
                              alt={p.nama}
                              className="w-8 h-8 rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                              {p.nama?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{p.nama}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {p.surel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={daftarPeran.find((r) => r.kode === p.peran_kode)?.id || ''}
                          onChange={(e) => handleUbahPeran(p.id, Number(e.target.value))}
                          disabled={ubahPeran.isPending}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 bg-white dark:bg-dark-bg dark:text-white"
                        >
                          {daftarPeran.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nama}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTanggal(p.login_terakhir)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTanggal(p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalHalaman > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Halaman {halaman + 1} dari {totalHalaman}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setHalaman((h) => Math.max(0, h - 1))}
                  disabled={halaman === 0}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setHalaman((h) => Math.min(totalHalaman - 1, h + 1))}
                  disabled={halaman >= totalHalaman - 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PenggunaAdmin;
