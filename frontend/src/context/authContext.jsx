import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ambilProfilSaya, mulaiLoginGoogle } from '../api/apiAuth';

const storageKey = 'kateglo-auth-token';
const defaultRefreshIntervalMs = 120000;
const refreshIntervalFromEnv = Number(import.meta.env.VITE_AUTH_PROFILE_REFRESH_MS);
const profileRefreshIntervalMs = Number.isFinite(refreshIntervalFromEnv) && refreshIntervalFromEnv >= 30000
  ? refreshIntervalFromEnv
  : defaultRefreshIntervalMs;
const AuthContext = createContext(null);

function getStorage() {
  return globalThis.localStorage;
}

function AuthProvider({ children }) {
  // Inisialisasi token langsung dari localStorage agar render pertama
  // sudah memiliki token — menghindari race condition di mana useEffect
  // belum sempat meng-set token saat route guard sudah mengevaluasi.
  const [token, setToken] = useState(() => {
    const storage = getStorage();
    return storage ? (storage.getItem(storageKey) || '') : '';
  });
  const [user, setUser] = useState(null);
  const isRefreshInFlight = useRef(false);
  // Mulai dalam kondisi loading jika ada token tersimpan,
  // agar route guard tidak redirect sebelum profil selesai dimuat.
  const [isLoading, setIsLoading] = useState(() => {
    const storage = getStorage();
    return storage ? Boolean(storage.getItem(storageKey)) : false;
  });

  const setAuthToken = useCallback((nextToken) => {
    const storage = getStorage();
    if (!storage) {
      setToken(nextToken || '');
      setUser(null);
      setIsLoading(Boolean(nextToken));
      return;
    }

    if (!nextToken) {
      storage.removeItem(storageKey);
      setToken('');
      setUser(null);
      setIsLoading(false);
      return;
    }

    storage.setItem(storageKey, nextToken);
    setToken(nextToken);
    setIsLoading(true);
  }, []);

  const logout = useCallback(() => {
    const storage = getStorage();
    if (!storage) {
      setToken('');
      setUser(null);
      setIsLoading(false);
      return;
    }

    storage.removeItem(storageKey);
    setToken('');
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshProfil = useCallback(async ({ denganLoading = false } = {}) => {
    if (!token || isRefreshInFlight.current) return;

    isRefreshInFlight.current = true;
    if (denganLoading) setIsLoading(true);

    try {
      const profile = await ambilProfilSaya(token);
      setUser(profile);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        getStorage()?.removeItem(storageKey);
        setToken('');
        setUser(null);
      }
    } finally {
      if (denganLoading) setIsLoading(false);
      isRefreshInFlight.current = false;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    refreshProfil({ denganLoading: true });
  }, [refreshProfil, token]);

  useEffect(() => {
    if (!token) return;

    const handleFocus = () => {
      refreshProfil();
    };

    const intervalId = setInterval(refreshProfil, profileRefreshIntervalMs);

    const handleVisibilityChange = () => {
      refreshProfil();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProfil, token]);

  const punyaIzin = useCallback((kodeIzin) => {
    if (!kodeIzin) return false;
    const daftarIzin = Array.isArray(user?.izin) ? user.izin : [];
    return daftarIzin.some((izin) => {
      if (typeof izin === 'string') {
        return izin === kodeIzin;
      }
      if (izin && typeof izin === 'object' && typeof izin.kode === 'string') {
        return izin.kode === kodeIzin;
      }
      return false;
    });
  }, [user]);

  const value = useMemo(() => ({
    token,
    user,
    isLoading,
    isAuthenticated: Boolean(token && user),
    adalahAdmin: user?.peran === 'admin',
    adalahRedaksi: Boolean(user?.akses_redaksi) || user?.peran === 'admin' || user?.peran === 'penyunting',
    punyaIzin,
    refreshProfil,
    loginDenganGoogle: mulaiLoginGoogle,
    setAuthToken,
    logout,
  }), [token, user, isLoading, punyaIzin, refreshProfil, setAuthToken, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}

function useAuthOptional() {
  return useContext(AuthContext);
}

export { AuthProvider, useAuth, useAuthOptional };
