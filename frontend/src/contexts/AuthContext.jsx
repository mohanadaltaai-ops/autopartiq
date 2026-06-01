import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getMarketCode } from '../lib/market';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('ae_magic_app_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api('/auth/me', { token })
      .then(r => {
        localStorage.setItem('token', token);
        sessionStorage.removeItem('ae_magic_app_token');
        setUser(r.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('ae_magic_app_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function sendMagicLink(email) {
    const market = getMarketCode();

    if (market !== 'AE') {
      throw new Error('Magic Link is only available for PartLink AE');
    }

    if (!supabase) {
      throw new Error('Supabase is not configured for this app build');
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) throw new Error(error.message || 'Could not send magic link');

    return { ok: true };
  }

  async function completeSupabaseLogin(accessToken) {
    const market = getMarketCode();
    const res = await api('/auth/supabase-login', {
      method: 'POST',
      body: { accessToken, market }
    });

    localStorage.setItem('token', res.token);
    sessionStorage.setItem('ae_magic_app_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  }

  async function requestOtp(phone) {
    const market = getMarketCode();
    return api('/auth/request-otp', { method: 'POST', body: { phone, market } });
  }

  async function login(phone, otp) {
    const market = getMarketCode();
    const res = await api('/auth/login', { method: 'POST', body: { phone, otp, market } });
    localStorage.setItem('token', res.token);
    sessionStorage.setItem('ae_magic_app_token', res.token);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem('token');
    supabase?.auth?.signOut?.().catch(() => {});
    setToken(null);
    setUser(null);
    setLoading(false);
  }

  return <AuthContext.Provider value={{ token, user, loading, sendMagicLink, completeSupabaseLogin, requestOtp, login, logout, setUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
