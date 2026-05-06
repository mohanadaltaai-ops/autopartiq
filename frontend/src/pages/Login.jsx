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

  return <div className="min-h-screen flex items-center justify-center bg-slate-600 p-5">
    <div className="phone-frame bg-white rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl flex flex-col relative">
      <button
        onClick={toggleLanguage}
        className="absolute bottom-4 left-4 z-10 px-3 h-9 rounded-full bg-slate-950/90 text-white text-xs font-black shadow-lg border border-white/20 ring-1 ring-white/20 backdrop-blur"
        title={t('language')}
      >
        {language === 'en' ? 'AR' : 'EN'}
      </button>

      <button
        onClick={() => { window.location.href = '/super-access'; }}
        className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 text-white text-[10px] font-black shadow-lg"
        title={t('adminAccess')}
      >
        SA
      </button>

      {screen === 'landing' ? <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 flex flex-col items-center justify-center text-center gap-8">
        <div className="space-y-5">
          <div className="logo-surface mx-auto w-36 h-36 rounded-[32px] shadow-2xl flex items-center justify-center p-2">
            <img src={logo} alt="AutoParts IQ Logo" className="w-full h-full object-contain scale-95" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tight">AutoParts IQ</div>
            <div className="text-white/60 mt-3 text-sm">{t('iraqiPartsMarket')}</div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <button onClick={() => setScreen('phone')} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black shadow-lg">
            {t('enterLogin')}
          </button>
          <div className="text-xs text-white/50 px-4">{t('landingSubtitle')}</div>
        </div>
      </div> : <>
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white p-8 text-center">
          <div className="logo-surface mx-auto w-28 h-28 rounded-3xl flex items-center justify-center p-2 mb-4 shadow-lg">
            <img src={logo} alt="AutoParts IQ Logo" className="w-full h-full object-contain scale-95" />
          </div>
          <div className="text-3xl font-black">AutoParts IQ</div>
          <div className="text-white/50 mt-2">{t('phoneLogin')}</div>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-center gap-4">
          <h1 className="text-xl font-black text-slate-900">{screen === 'phone' ? t('enterPhone') : t('enterOtp')}</h1>

          {screen === 'phone' ? <>
            <input
              className="p-4 rounded-2xl bg-slate-50 border outline-none"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t('phoneNumber')}
            />
            <button onClick={() => setScreen('otp')} disabled={!phone.trim()} className="bg-slate-900 text-white rounded-2xl py-4 font-bold disabled:opacity-40">
              {t('continue')}
            </button>
            <button onClick={() => setScreen('landing')} className="text-slate-500 text-sm">
              {t('back')}
            </button>
          </> : <>
            <input
              className="p-4 rounded-2xl bg-slate-50 border outline-none text-center text-2xl tracking-[.5em]"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={4}
            />
            <button onClick={submit} className="bg-orange-600 text-white rounded-2xl py-4 font-bold">
              {t('verifySignIn')}
            </button>
            <button onClick={() => setScreen('phone')} className="text-slate-500 text-sm">
              {t('changeNumber')}
            </button>
          </>}

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </>}
    </div>
  </div>;
}
