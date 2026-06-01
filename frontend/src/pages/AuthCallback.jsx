import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function AuthCallback() {
  const { completeSupabaseLogin } = useAuth();
  const { direction } = useLanguage();
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      try {
        if (!supabase) {
          throw new Error('Supabase is not configured for this app build');
        }

        // In implicit flow, Supabase detects the session from the URL hash.
        // Give the client a moment to persist the session after page load.
        let session = null;

        for (let i = 0; i < 12; i += 1) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;

          session = data?.session || null;
          if (session?.access_token) break;

          await sleep(300);
        }

        const accessToken = session?.access_token;

        if (!accessToken) {
          throw new Error('Magic link session was not found. Please request a new link and open the latest email in the same browser.');
        }

        if (cancelled) return;

        await completeSupabaseLogin(accessToken);
        window.history.replaceState({}, '', '/');
        window.location.href = '/';
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || 'Magic Link login failed. Please try again.');
        }
      }
    }

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [completeSupabaseLogin]);

  return (
    <div dir={direction} className="min-h-screen flex items-center justify-center bg-slate-600 p-4">
      <div className="phone-frame rounded-[42px] border-[7px] border-slate-950 overflow-hidden shadow-2xl flex flex-col relative bg-[#F5F7FC]">
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
            <div className="text-[#081B4B] font-black text-xl">PartLink AE</div>
            <div className="text-slate-500 font-bold text-sm mt-3">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
