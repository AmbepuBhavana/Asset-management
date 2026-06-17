import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import client, { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'oam_token';
const USER_KEY = 'oam_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) setAuthToken(token);
    else setAuthToken(null);
  }, [token]);

  useEffect(() => {
    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await client.get('/api/auth/me');
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        setUser(null);
        setToken('');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setAuthToken(data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    setUser(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isManager: user?.role === 'manager',
      isEmployee: user?.role === 'employee',
      canManageAssets: user?.role === 'admin' || user?.role === 'manager',
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
