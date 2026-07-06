import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { loginUser, registerUser } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const persistSession = useCallback((nextUser, nextToken) => {
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const res = await loginUser(credentials);
      persistSession(res.data.user, res.data.token);
      return res.data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await registerUser(payload);
      persistSession(res.data.user, res.data.token);
      return res.data.user;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token, login, register, logout }),
    [user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
