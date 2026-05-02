import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Customer from './pages/Customer';
import Supplier from './pages/Supplier';
import Admin from './pages/Admin';

function AppInner() {
  const { user, loading } = useAuth();
  const { direction } = useLanguage();
  const [tab, setTab] = useState('home');
  if (loading) return <div className="min-h-screen bg-slate-600 text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <div dir={direction}><Login /></div>;
  return <div dir={direction}><Layout tab={tab} setTab={setTab}>{user.role === 'CUSTOMER' ? <Customer tab={tab} /> : user.role === 'SUPPLIER' ? <Supplier tab={tab} /> : <Admin tab={tab} />}</Layout></div>;
}

export default function App() {
  return <LanguageProvider><AuthProvider><AppInner /></AuthProvider></LanguageProvider>;
}
