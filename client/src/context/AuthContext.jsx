// ============================================================
// AUTH CONTEXT
// Shares login state (user, login/register/logout functions) with any
// component in the tree, without manually passing props through every layer
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` covers the brief window on page load where we don't yet know
  // if the user has a valid session — without this, a protected route would
  // briefly flash "redirecting to login" even for an already-logged-in user
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/register', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setAccessToken(null);
    setUser(null);
  }, []);

  // ============================================================
  // SESSION RESTORE — runs once, when the app first loads
  // React state (the `user` variable above) resets to null on every page
  // refresh — but the refresh token cookie survives (it's stored by the
  // browser, not React). So on load, we try to silently exchange that
  // cookie for a new access token, then fetch who it belongs to.
  // If there's no valid cookie, this just fails quietly — the user
  // simply isn't logged in, which is a normal, expected outcome.
  // ============================================================
  useEffect(() => {
    (async () => {
      try {
        const { data: refreshData } = await api.post('/api/auth/refresh');
        setAccessToken(refreshData.accessToken);
        const { data: meData } = await api.get('/api/auth/me');
        setUser(meData.user);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — lets any component do `const { user, login } = useAuth();`
// instead of importing useContext + AuthContext everywhere
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
