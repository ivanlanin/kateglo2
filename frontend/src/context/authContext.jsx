import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ambilProfilSaya, mulaiLoginGoogle } from '../api/apiAuth';

const storageKey = 'kateglo-auth-token';
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey) || '');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem(storageKey)));

  const setAuthToken = useCallback((nextToken) => {
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
          localStorage.removeItem(storageKey);
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

  const value = useMemo(() => ({
    token,
    user,
    isLoading,
    isAuthenticated: Boolean(token && user),
    loginDenganGoogle: mulaiLoginGoogle,
    setAuthToken,
    logout,
  }), [token, user, isLoading, setAuthToken, logout]);

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
