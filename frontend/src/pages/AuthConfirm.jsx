import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms);
    })
  ]);
}

function getGlobalConfirmStore() {
  if (!globalThis.__AE_MAGIC_CONFIRM_PROMISES__) {
    globalThis.__AE_MAGIC_CONFIRM_PROMISES__ = new Map();
  }

  return globalThis.__AE_MAGIC_CONFIRM_PROMISES__;
}

async function createPartLinkSession(accessToken) {
  const res = await api('/auth/supabase-login', {
    method: 'POST',
    body: {
      accessToken,
      market: 'AE'
    }
  });

  if (!res?.token) {
    throw new Error('PartLink AE session was not created. Please try again.');
  }

  localStorage.setItem('token', res.token);
  sessionStorage.setItem('ae_magic_app_token', res.token);

  return res;
}

export default function AuthConfirm() {
  const { direction } = useLanguage();
  const [message, setMessage] = useState('Signing you in...');
  const [details, setDetails] = useState('');

  useEffect(() => {
    async function confirmMagicLinkOnce() {
      if (!supabase) {
        throw new Error('Supabase is not configured for this app build');
      }

      const existingAppToken = localStorage.getItem('token') || sessionStorage.getItem('ae_magic_app_token');

      if (existingAppToken) {
        localStorage.setItem('token', existingAppToken);
        return { status: 'already_signed_in' };
      }

      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type') || 'email';

      if (!tokenHash) {
        throw new Error('Magic Link token is missing. Please request a new link.');
      }

      setMessage('Verifying email link...');
      setDetails('Checking the secure login link.');

      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type
        }),
        15000,
        'Email verification'
      );

      if (error) throw error;

      const accessToken = data?.session?.access_token;

      if (!accessToken) {
        throw new Error('Magic Link session was not created. Please request a new link.');
      }

      setMessage('Creating PartLink AE session...');
      setDetails('Opening your account.');

      await withTimeout(
        createPartLinkSession(accessToken),
        15000,
        'PartLink AE session creation'
      );

      return { status: 'success' };
    }

    async function run() {
      try {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get('token_hash');

        if (!tokenHash) {
          throw new Error('Magic Link token is missing. Please request a new link.');
        }

        const store = getGlobalConfirmStore();

        if (!store.has(tokenHash)) {
          store.set(tokenHash, confirmMagicLinkOnce());
        } else {
          setMessage('Finishing sign in...');
          setDetails('Completing your secure login.');
        }

        const result = await store.get(tokenHash);

        if (result?.status === 'already_signed_in') {
          setMessage('Already signed in. Opening app...');
        } else {
          setMessage('Login successful. Opening app...');
        }

        setDetails('');

        window.history.replaceState({}, '', '/');

        setTimeout(() => {
          window.location.replace('/');
        }, 700);
      } catch (error) {
        setMessage(error.message || 'Magic Link login failed. Please try again.');
        setDetails('Request a fresh link from the login screen. Do not reuse an old email link.');
      }
    }

    run();
  }, []);

  return (
    <div dir={direction} className="min-h-screen flex items-center justify-center bg-slate-600 p-4">
      <div className="phone-frame rounded-[42px] border-[7px] border-slate-950 overflow-hidden shadow-2xl flex flex-col relative bg-[#F5F7FC]">
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
            <div className="text-[#081B4B] font-black text-xl">PartLink AE</div>
            <div className="text-slate-500 font-bold text-sm mt-3">{message}</div>
            {details && <div className="text-slate-400 font-bold text-xs mt-2">{details}</div>}

            <button
              type="button"
              onClick={() => window.location.replace('/')}
              className="mt-5 w-full h-11 rounded-2xl bg-[#27439C] text-white text-sm font-black"
            >
              Back to app
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
