/**
 * @fileoverview Dasbor admin Kateglo
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

function DasborAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      {/* Header */}
      <header className="bg-white dark:bg-dark-bg-elevated shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                &larr; Beranda
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Kateglo
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-bg-elevated p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Total Lema</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-elevated p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Total Glosarium</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white dark:bg-dark-bg-elevated p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Total Peribahasa</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Tambah Lema
            </button>
            <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Tambah Glosarium
            </button>
            <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Tambah Peribahasa
            </button>
            <Link
              to="/admin/pengguna"
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
            >
              Kelola Pengguna
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DasborAdmin;
