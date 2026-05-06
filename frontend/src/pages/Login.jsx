import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [phone, setPhone] = useState('');
  const [screen, setScreen] = useState('landing');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError(t('otpRequired'));
      return;
    }

    try {
      setError('');
      await login(phone, cleanOtp);
    } catch (e) {
      const message = e.message || '';

      if (
        message.includes('Failed to reach API') ||
        message.includes('Internal server error') ||
        message.includes('API request failed with status')
      ) {
        setError(t('loginServerError'));
        return;
      }

      setError(t('incorrectOtp'));
    }
  }

  return <div className="min-h-screen flex items-center justify-center bg-slate-600 p-4">
    <div className="phone-frame rounded-[42px] border-[7px] border-slate-950 overflow-hidden shadow-2xl flex flex-col relative apiq-page">
      <button
        onClick={toggleLanguage}
        className="absolute top-5 left-5 z-10 px-3 h-9 rounded-2xl bg-white/90 text-slate-900 text-xs font-black shadow-lg border border-white/60 backdrop-blur"
        title={t('language')}
      >
        {language === 'en' ? 'AR' : 'EN'}
      </button>

      <button
        onClick={() => { window.location.href = '/super-access'; }}
        className="absolute top-5 right-5 z-10 px-3 h-9 rounded-2xl bg-slate-950/80 text-white text-[10px] font-black shadow-lg border border-white/10 backdrop-blur"
        title={t('adminAccess')}
      >
        SA
      </button>

      {screen === 'landing' ? (
        <div className="flex-1 p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(30,58,138,0.20),transparent_40%)]" />

          <div className="relative pt-16 space-y-7">
            <div className="logo-surface w-24 h-24 rounded-[28px] shadow-2xl flex items-center justify-center p-2 border border-white/70">
              <img src={logo} alt="AutoParts IQ Logo" className="w-full h-full object-contain scale-95" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-[11px] font-black border border-orange-100">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                {t('iraqiPartsMarket')}
              </div>

              <div>
                <h1 className="text-[38px] leading-[0.95] font-black tracking-tight text-slate-950">
                  AutoParts<br />IQ
                </h1>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed max-w-[260px]">
                  {t('landingSubtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="relative space-y-3">
            <div className="space-y-3">
              <div className="apiq-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide text-blue-600">Popular Part</div>
                    <div className="text-lg font-black text-slate-900 mt-1">Brake Pads</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">Fast matching from trusted suppliers</div>
                  </div>
                  <div className="apiq-chip">+24</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="apiq-card-muted p-4">
                  <div className="text-[11px] font-black uppercase tracking-wide text-orange-600">Offers</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">12</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1">Active today</div>
                </div>
                <div className="apiq-card-muted p-4">
                  <div className="text-[11px] font-black uppercase tracking-wide text-blue-600">Suppliers</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">150+</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1">Across العراق</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => setScreen('phone')} className="w-full py-4 apiq-button-primary">
                {t('enterLogin')}
              </button>

              <button onClick={() => setScreen('phone')} className="w-full py-4 apiq-button-accent">
                {t('phoneLogin')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-7 pt-20 pb-6 bg-white/80 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="logo-surface w-16 h-16 rounded-3xl flex items-center justify-center p-1.5 shadow-lg border border-slate-200">
                <img src={logo} alt="AutoParts IQ Logo" className="w-full h-full object-contain scale-95" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-950 tracking-tight">AutoParts IQ</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{t('phoneLogin')}</div>
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-black text-orange-600 uppercase tracking-wide">
                {screen === 'phone' ? t('phoneNumber') : t('enterOtp')}
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                {screen === 'phone' ? t('enterPhone') : t('verifySignIn')}
              </h1>
            </div>

            {screen === 'phone' ? (
              <>
                <div className="apiq-card p-3">
                  <input
                    className="w-full p-4 rounded-2xl bg-slate-50 border outline-none text-lg font-bold"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    placeholder={t('phoneNumber')}
                  />
                </div>

                <button onClick={() => setScreen('otp')} disabled={!phone.trim()} className="w-full py-4 apiq-button-primary disabled:opacity-40">
                  {t('continue')}
                </button>

                <button onClick={() => setScreen('landing')} className="text-slate-500 text-sm font-bold">
                  {t('back')}
                </button>
              </>
            ) : (
              <>
                <div className="apiq-card p-3">
                  <input
                    className="w-full p-4 rounded-2xl bg-slate-50 border outline-none text-center text-2xl tracking-[.5em] font-black"
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value);
                      setError('');
                    }}
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="••••"
                  />
                </div>

                <button onClick={submit} disabled={!otp.trim()} className="w-full py-4 apiq-button-primary disabled:opacity-40">
                  {t('verifySignIn')}
                </button>

                <button onClick={() => setScreen('phone')} className="text-slate-500 text-sm font-bold">
                  {t('changeNumber')}
                </button>
              </>
            )}

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold p-3">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>;
}
