import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ambilProfilSaya, mulaiLoginGoogle } from '../api/apiAuth';

const storageKey = 'kateglo-auth-token';
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tersimpan = localStorage.getItem(storageKey) || '';
    if (!tersimpan) {
      setIsLoading(false);
      return;
    }
    setToken(tersimpan);
    setIsLoading(true);
  }, []);

  const setAuthToken = useCallback((nextToken) => {
    if (typeof window === 'undefined') {
      setToken(nextToken || '');
      setUser(null);
      setIsLoading(Boolean(nextToken));
      return;
    }

    if (!nextToken) {
      localStorage.removeItem(storageKey);
      setToken('');
      setUser(null);
      setIsLoading(false);
      return;
    }

    localStorage.setItem(storageKey, nextToken);
    setToken(nextToken);
    setIsLoading(true);
  }, []);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') {
      setToken('');
      setUser(null);
      setIsLoading(false);
      return;
    }

    localStorage.removeItem(storageKey);
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
          }
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
