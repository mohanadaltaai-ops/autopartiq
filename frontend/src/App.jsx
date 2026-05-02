import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Customer from './pages/Customer';
import Supplier from './pages/Supplier';
import Admin from './pages/Admin';

function AppInner() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('home');
  if (loading) return <div className="min-h-screen bg-slate-600 text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <Login />;
  return <Layout tab={tab} setTab={setTab}>{user.role === 'CUSTOMER' ? <Customer tab={tab} /> : user.role === 'SUPPLIER' ? <Supplier tab={tab} /> : <Admin tab={tab} />}</Layout>;
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
