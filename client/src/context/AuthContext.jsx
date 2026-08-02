import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On first load, if we have a stored token, validate it against /api/auth/me
  // so a refresh doesn't bounce a logged-in user back to the login screen.
  useEffect(() => {
    const token = localStorage.getItem('jnv_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('jnv_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('jnv_token', data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in. Please try again.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jnv_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
