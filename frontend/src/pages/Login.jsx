import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('07799999999');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('1234');
  const [error, setError] = useState('');

  async function submit() {
    try { await login(phone, otp); } catch (e) { setError(e.message); }
  }

  return <div className="min-h-screen flex items-center justify-center bg-slate-600 p-5">
    <div className="phone-frame bg-white rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl flex flex-col">
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white p-10 text-center">
        <div className="text-3xl font-black">{t('appName')}</div>
        <div className="text-white/50 mt-2">{t('iraqiPartsMarket')}</div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center gap-4">
        <h1 className="text-xl font-black text-slate-900">{step===1 ? t('welcomeBack') : t('enterOtp')}</h1>
        {step===1 ? <>
          <input className="p-4 rounded-2xl bg-slate-50 border outline-none" value={phone} onChange={e=>setPhone(e.target.value)} placeholder={t('phoneNumber')}/>
          <button onClick={()=>setStep(2)} className="bg-slate-900 text-white rounded-2xl py-4 font-bold">{t('sendCode')}</button>
        </> : <>
          <input className="p-4 rounded-2xl bg-slate-50 border outline-none text-center text-2xl tracking-[.5em]" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={4}/>
          <button onClick={submit} className="bg-orange-600 text-white rounded-2xl py-4 font-bold">{t('verifySignIn')}</button>
          <button onClick={()=>setStep(1)} className="text-slate-500 text-sm">{t('changeNumber')}</button>
        </>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="text-xs text-slate-400 space-y-1 pt-6"><p>{t('demoLoginNumbers')}</p><p>Customer: 07799999999</p><p>Supplier: 07701234567</p><p>Admin: 07711111111</p><p>Super Admin: 07700000000</p></div>
      </div>
    </div>
  </div>;
}
