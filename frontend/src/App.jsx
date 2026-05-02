import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Customer from './pages/Customer';
import Supplier from './pages/Supplier';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import SuperAdminAccess from './components/auth/SuperAdminAccess';

function AppInner() {
  const { user, loading } = useAuth();
  const { direction } = useLanguage();
  const [tab, setTab] = useState('home');
  const path = window.location.pathname;

  useEffect(() => {
    setTab('home');
  }, [user?.id, user?.role]);

  if (loading) return <div className="min-h-screen bg-slate-600 text-white flex items-center justify-center">Loading...</div>;
  if (!user && path === '/super-access') return <div dir={direction} className="min-h-screen flex items-center justify-center bg-slate-600 p-5"><div className="phone-frame bg-white rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl flex flex-col p-6 justify-center gap-4"><SuperAdminAccess onBack={() => { window.location.href = '/'; }} /></div></div>;
  if (!user) return <div dir={direction}><Login /></div>;
  const page = tab === 'profile' ? <Profile /> : user.role === 'CUSTOMER' ? <Customer tab={tab} /> : user.role === 'SUPPLIER' ? <Supplier tab={tab} /> : <Admin tab={tab} />;
  return <div dir={direction}><Layout tab={tab} setTab={setTab}>{page}</Layout></div>;
}

export default function App() {
  return <LanguageProvider><AuthProvider><AppInner /></AuthProvider></LanguageProvider>;
}
