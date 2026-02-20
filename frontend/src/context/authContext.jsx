import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ambilProfilSaya, mulaiLoginGoogle } from '../api/apiAuth';

const storageKey = 'kateglo-auth-token';
const AuthContext = createContext(null);

function getStorage() {
  return globalThis.localStorage;
}

function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  // Mulai dalam kondisi loading jika ada token tersimpan,
  // agar route guard tidak redirect sebelum profil selesai dimuat.
  const [isLoading, setIsLoading] = useState(() => {
    const storage = getStorage();
    return storage ? Boolean(storage.getItem(storageKey)) : false;
  });

  useEffect(() => {
    const storage = getStorage();
    if (!storage) return;
    const tersimpan = storage.getItem(storageKey) || '';
    if (!tersimpan) {
      setIsLoading(false);
      return;
    }
    setToken(tersimpan);
    setIsLoading(true);
  }, []);

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

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        const profile = await ambilProfilSaya(token);
        if (isMounted) {
          setUser(profile);
        }
      } catch (_error) {
        if (isMounted) {
          getStorage()?.removeItem(storageKey);
          setToken('');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const punyaIzin = useCallback(
    (kodeIzin) => (user?.izin || []).includes(kodeIzin),
    [user]
  );

  const value = useMemo(() => ({
    token,
    user,
    isLoading,
    isAuthenticated: Boolean(token && user),
    adalahAdmin: user?.peran === 'admin',
    adalahRedaksi: Boolean(user?.akses_redaksi) || user?.peran === 'admin' || user?.peran === 'penyunting',
    punyaIzin,
    loginDenganGoogle: mulaiLoginGoogle,
    setAuthToken,
    logout,
  }), [token, user, isLoading, punyaIzin, setAuthToken, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
