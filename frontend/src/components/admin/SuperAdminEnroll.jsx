import React, { useState } from 'react';
import { api } from '../../lib/api';

export default function SuperAdminEnroll({ token }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', username: '', accessCode: '', role: 'ADMIN', adminPermission: 'FULL_ADMIN' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api('/auth/super-admin/enroll', { method: 'POST', token, body: form });
      setMessage(`${form.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} enrolled successfully.`);
      setForm({ name: '', phone: '', email: '', username: '', accessCode: '', role: 'ADMIN', adminPermission: 'FULL_ADMIN' });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
      <h2 className="font-black text-slate-900">Enroll Admin User</h2>
      <select className="w-full p-3 rounded-xl border" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, adminPermission: e.target.value === 'SUPER_ADMIN' ? 'FULL_ADMIN' : form.adminPermission })}>
        <option value="ADMIN">Admin</option>
        <option value="SUPER_ADMIN">Super Admin</option>
      </select>
      {form.role === 'ADMIN' && <select className="w-full p-3 rounded-xl border" value={form.adminPermission} onChange={e => setForm({ ...form, adminPermission: e.target.value })}>
        <option value="FULL_ADMIN">Full Admin: dashboard, suppliers, orders, audit</option>
        <option value="ORDERS_ONLY">Orders Only: order management only</option>
      </select>}
      <input className="w-full p-3 rounded-xl border" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input className="w-full p-3 rounded-xl border" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      <input className="w-full p-3 rounded-xl border" placeholder="Email optional" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <input className="w-full p-3 rounded-xl border" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
      <input className="w-full p-3 rounded-xl border" type="password" placeholder="Access code" value={form.accessCode} onChange={e => setForm({ ...form, accessCode: e.target.value })} />
      {message && <div className="text-xs text-green-700 bg-green-50 rounded-xl p-2">{message}</div>}
      {error && <div className="text-xs text-red-700 bg-red-50 rounded-xl p-2">{error}</div>}
      <button onClick={submit} disabled={saving || !form.name || !form.phone || !form.username || !form.accessCode} className="w-full py-3 rounded-2xl bg-purple-700 text-white font-black disabled:opacity-40">
        {saving ? 'Saving...' : 'Enroll User'}
      </button>
    </div>
  );
}
