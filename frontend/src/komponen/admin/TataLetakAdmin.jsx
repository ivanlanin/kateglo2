/**
 * @fileoverview Layout admin bersama — header + navigasi tab + area konten
 */

import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const menuAdmin = [
  { path: '/admin', label: 'Dasbor', exact: true },
  { path: '/admin/kamus', label: 'Kamus' },
  { path: '/admin/tesaurus', label: 'Tesaurus' },
  { path: '/admin/glosarium', label: 'Glosarium' },
  { path: '/admin/pengguna', label: 'Pengguna' },
];

function TataLetakAdmin({ judul, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = judul
      ? `${judul} — Admin Kateglo`
      : 'Admin Kateglo';
  }, [judul]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      <header className="bg-white dark:bg-dark-bg-elevated shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                &larr; Beranda
              </Link>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Kateglo
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                {user?.email || user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg"
              >
                Keluar
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {menuAdmin.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive(item)
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {judul && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {judul}
          </h2>
        )}
        {children}
      </main>
    </div>
  );
}

export default TataLetakAdmin;
