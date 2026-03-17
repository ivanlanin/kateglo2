/**
 * @fileoverview Halaman login admin via Google OAuth
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/authContext';
import TombolMasuk from '../../../components/tombol/TombolMasuk';

function LoginAdmin() {
  const { isAuthenticated, adalahRedaksi, isLoading, loginDenganGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authError = location.state?.authError;

  useEffect(() => {
    if (isAuthenticated && adalahRedaksi) {
      navigate('/redaksi', { replace: true });
    }
  }, [isAuthenticated, adalahRedaksi, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <p className="text-gray-600 dark:text-gray-400">Memeriksa sesi …</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
      <div className="max-w-md w-full bg-white dark:bg-dark-bg-elevated rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">Redaksi Kateglo</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          Masuk dengan akun Google yang terdaftar sebagai redaksi
        </p>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {authError}
          </div>
        )}

        {isAuthenticated && !adalahRedaksi && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
            Akun Anda tidak memiliki akses redaksi.
          </div>
        )}

        <TombolMasuk onClick={() => loginDenganGoogle('/redaksi')} />
      </div>
    </div>
  );
}

export default LoginAdmin;
