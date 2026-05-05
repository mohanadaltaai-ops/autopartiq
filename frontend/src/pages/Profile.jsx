import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const roleLabel =
    user?.role === 'CUSTOMER' ? t('roleCustomer') :
    user?.role === 'SUPPLIER' ? t('roleSupplier') :
    user?.role === 'SUPER_ADMIN' ? t('roleSuperAdmin') :
    t('roleAdmin');

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase">{t('profile')}</div>
        <div className="text-xl font-black text-slate-900">{user?.name || t('profile')}</div>
        <div className="text-sm text-slate-500">{roleLabel}</div>

        <div className="grid grid-cols-1 gap-2 pt-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-400 font-bold">{t('phone')}</div>
            <div className="font-bold text-slate-800">{user?.phone || '-'}</div>
          </div>

          {user?.email && (
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400 font-bold">{t('email')}</div>
              <div className="font-bold text-slate-800">{user.email}</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase">{t('settings')}</div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
          <div>
            <div className="font-bold text-slate-900">{t('language')}</div>
            <div className="text-xs text-slate-500">{language === 'ar' ? t('arabic') : t('english')}</div>
          </div>
          <button onClick={toggleLanguage} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
          <div>
            <div className="font-bold text-slate-900">{t('mode')}</div>
            <div className="text-xs text-slate-500">{theme === 'dark' ? t('dark') : t('light')}</div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold"
          >
            {theme === 'dark' ? t('light') : t('dark')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border p-5 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase">{t('support')}</div>
        <div className="text-sm text-slate-600 font-bold">AutoParts IQ</div>

        <div className="grid grid-cols-1 gap-2 text-sm">
          <a
            href="https://wa.me/7733664151"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-slate-50 p-3 block"
          >
            <div className="text-xs text-slate-400 font-bold">{language === 'ar' ? '????? / ??????' : 'Support / WhatsApp'}</div>
            <div className="font-bold text-slate-800 dir-ltr text-left">07733664151</div>
          </a>

          <a
            href="mailto:support@autopartiq.com"
            className="rounded-2xl bg-slate-50 p-3 block"
          >
            <div className="text-xs text-slate-400 font-bold">{language === 'ar' ? '?????? ?????????? ?????' : 'Support Email'}</div>
            <div className="font-bold text-slate-800 break-all dir-ltr text-left">support@autopartiq.com</div>
          </a>
        </div>
      </div>

      <button onClick={logout} className="w-full py-4 rounded-2xl bg-red-600 text-white font-black">
        {t('logout')}
      </button>
    </div>
  );
}
