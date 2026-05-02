import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-5 shadow">
        <div className="text-sm opacity-70">Profile</div>
        <div className="text-xl font-black">{user?.name}</div>
        <div className="text-xs opacity-70 mt-1">{user?.role}</div>
      </div>

      <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
        <h2 className="font-black text-slate-900">Settings</h2>
        <button onClick={toggleLanguage} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold">
          Language: {language === 'ar' ? 'Arabic' : 'English'}
        </button>
        <button onClick={() => setDarkMode(value => !value)} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold">
          Mode: {darkMode ? 'Dark' : 'Light'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-2">
        <h2 className="font-black text-slate-900">Support</h2>
        <div className="text-sm text-slate-600">Email: support@autopartsiq.com</div>
        <div className="text-sm text-slate-600">Phone: 07800000000</div>
      </div>

      <button onClick={logout} className="w-full py-4 rounded-2xl bg-red-600 text-white font-black">Log out</button>
    </div>
  );
}
