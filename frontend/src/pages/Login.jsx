import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [screen, setScreen] = useState('landing');
  const [otp, setOtp] = useState('1234');
  const [error, setError] = useState('');

  async function submit() {
    try {
      setError('');
      await login(phone, otp);
    } catch (e) {
      setError(e.message);
    }
  }

  return <div className="min-h-screen flex items-center justify-center bg-slate-600 p-5">
    <div className="phone-frame bg-white rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl flex flex-col relative">
      <button
        onClick={() => { window.location.href = '/super-access'; }}
        className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 text-white text-[10px] font-black shadow-lg"
        title="Admin access"
      >
        SA
      </button>

      {screen === 'landing' ? <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 flex flex-col items-center justify-center text-center gap-8">
        <div className="space-y-5">
          <div className="mx-auto w-24 h-24 rounded-[28px] bg-blue-600 shadow-2xl flex items-center justify-center text-3xl font-black">AIQ</div>
          <div>
            <div className="text-4xl font-black tracking-tight">AutoParts IQ</div>
            <div className="text-white/60 mt-3 text-sm">Iraqi spare parts marketplace</div>
          </div>
        </div>
        <div className="w-full space-y-3">
          <button onClick={() => setScreen('phone')} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black shadow-lg">Enter / Log In</button>
          <div className="text-xs text-white/50 px-4">Find parts faster, receive supplier offers, and track orders from one place.</div>
        </div>
      </div> : <>
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center font-black text-xl mb-4">AIQ</div>
          <div className="text-3xl font-black">AutoParts IQ</div>
          <div className="text-white/50 mt-2">Phone number login</div>
        </div>
        <div className="p-6 flex-1 flex flex-col justify-center gap-4">
          <h1 className="text-xl font-black text-slate-900">{screen === 'phone' ? 'Enter your phone number' : t('enterOtp')}</h1>
          {screen === 'phone' ? <>
            <input className="p-4 rounded-2xl bg-slate-50 border outline-none" value={phone} onChange={e=>setPhone(e.target.value)} placeholder={t('phoneNumber')}/>
            <button onClick={()=>setScreen('otp')} disabled={!phone.trim()} className="bg-slate-900 text-white rounded-2xl py-4 font-bold disabled:opacity-40">Continue</button>
            <button onClick={()=>setScreen('landing')} className="text-slate-500 text-sm">Back</button>
          </> : <>
            <input className="p-4 rounded-2xl bg-slate-50 border outline-none text-center text-2xl tracking-[.5em]" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={4}/>
            <button onClick={submit} className="bg-orange-600 text-white rounded-2xl py-4 font-bold">{t('verifySignIn')}</button>
            <button onClick={()=>setScreen('phone')} className="text-slate-500 text-sm">{t('changeNumber')}</button>
          </>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </>}
    </div>
  </div>;
}
