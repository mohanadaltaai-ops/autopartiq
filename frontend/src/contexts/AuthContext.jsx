import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api('/auth/me', { token })
      .then(r => setUser(r.user))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(phone, otp) {
    const res = await api('/auth/login', { method: 'POST', body: { phone, otp } });
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }

  return <AuthContext.Provider value={{ token, user, loading, login, logout, setUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
