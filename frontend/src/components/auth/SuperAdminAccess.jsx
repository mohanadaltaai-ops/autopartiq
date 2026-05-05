import React, { useState } from 'react';
import { api } from '../../lib/api';
import logo from '../../assets/logo.png';

export default function SuperAdminAccess({ onBack }) {
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const result = await api('/auth/super-admin/login', { method: 'POST', body: { identifier, password: secret } });
      localStorage.setItem('token', result.token);
      window.location.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="logo-surface mx-auto w-28 h-28 rounded-3xl bg-white flex items-center justify-center p-2 shadow-lg">
        <img src={logo} alt="AutoParts IQ Logo" className="w-full h-full object-contain scale-95" />
      </div>
      <h1 className="text-xl font-black text-slate-900">Super Admin Access</h1>
      <input className="p-4 rounded-2xl bg-slate-50 border outline-none" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Username, email, or phone" />
      <input className="p-4 rounded-2xl bg-slate-50 border outline-none" value={secret} onChange={e => setSecret(e.target.value)} type="password" placeholder="Password" />
      <button onClick={submit} disabled={!identifier || !secret || loading} className="bg-purple-700 text-white rounded-2xl py-4 font-bold disabled:opacity-40">{loading ? 'Signing in...' : 'Sign in'}</button>
      <button onClick={onBack} className="text-slate-500 text-sm">Back to phone login</button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </>
  );
}
